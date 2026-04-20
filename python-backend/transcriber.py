import gc
import json
import os
from datetime import timedelta
from pathlib import Path


def _obter_batch_size(device: str) -> int:
    if device != "cuda":
        return 4
    import torch

    vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    if vram_gb >= 10:
        return 16
    if vram_gb >= 6:
        return 8
    return 4


def _format_srt_time(seconds: float) -> str:
    td = timedelta(seconds=seconds)
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def _salvar_resultados(result: dict, audio_path: str, output_dir: str) -> dict:
    """Salva resultado em 3 formatos: .txt, .srt, .json"""
    stem = Path(audio_path).stem
    os.makedirs(output_dir, exist_ok=True)

    segments = result.get("segments", [])

    # TXT
    txt_path = os.path.join(output_dir, f"{stem}.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        for seg in segments:
            speaker = seg.get("speaker", "")
            prefix = f"[{speaker}] " if speaker else ""
            f.write(f"{prefix}{seg.get('text', '').strip()}\n")

    # SRT
    srt_path = os.path.join(output_dir, f"{stem}.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        for i, seg in enumerate(segments, 1):
            start = _format_srt_time(seg.get("start", 0))
            end = _format_srt_time(seg.get("end", 0))
            speaker = seg.get("speaker", "")
            prefix = f"[{speaker}] " if speaker else ""
            text = seg.get("text", "").strip()
            f.write(f"{i}\n{start} --> {end}\n{prefix}{text}\n\n")

    # JSON
    json_path = os.path.join(output_dir, f"{stem}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "segments": segments,
                "language": result.get("language"),
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    return {
        "txt": os.path.abspath(txt_path),
        "srt": os.path.abspath(srt_path),
        "json": os.path.abspath(json_path),
    }


def executar_pipeline(
    audio_path: str,
    model_name: str,
    language: str,
    diarize: bool,
    hf_token: str | None,
    output_dir: str,
    on_progress,
):
    """
    Pipeline WhisperX completo com limpeza progressiva de VRAM.
    on_progress(stage, message) é chamado em cada etapa.
    """
    import torch
    import whisperx

    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"
    batch_size = _obter_batch_size(device)

    lang = None if language == "auto" else language

    # Etapa 1: Carregar modelo (10%)
    on_progress("modelo", "Carregando modelo...")
    model = whisperx.load_model(
        model_name, device, compute_type=compute_type, language=lang
    )

    try:
        # Etapa 2: Carregar áudio (25%)
        on_progress("audio", "Decodificando áudio...")
        audio = whisperx.load_audio(audio_path)

        # Etapa 3: Transcrever (50%)
        on_progress("transcricao", f"Transcrevendo (batch_size={batch_size})...")
        result = model.transcribe(audio, batch_size=batch_size)
    finally:
        # Liberar modelo Whisper ANTES de carregar alinhamento
        del model
        gc.collect()
        if device == "cuda":
            torch.cuda.empty_cache()

    # Etapa 4: Alinhamento (70%)
    on_progress("alinhamento", "Alinhando timestamps...")
    align_model, align_metadata = whisperx.load_align_model(
        language_code=result["language"], device=device
    )
    try:
        result = whisperx.align(
            result["segments"], align_model, align_metadata, audio, device
        )
    finally:
        del align_model
        gc.collect()
        if device == "cuda":
            torch.cuda.empty_cache()

    # Etapa 5: Diarização (90%) — opcional
    if diarize and hf_token:
        on_progress("diarizacao", "Identificando falantes...")
        from whisperx.diarize import DiarizationPipeline
        diarize_model = DiarizationPipeline(
            token=hf_token, device=device
        )
        try:
            diarize_segments = diarize_model(audio_path)
            result = whisperx.assign_word_speakers(diarize_segments, result)
        finally:
            del diarize_model
            gc.collect()
            if device == "cuda":
                torch.cuda.empty_cache()
    else:
        on_progress("diarizacao", "Diarização desativada, pulando...")

    # Etapa 6: Salvar (100%)
    on_progress("salvando", "Gerando arquivos de saída...")
    files = _salvar_resultados(result, audio_path, output_dir)

    return {
        "segments": result["segments"],
        "language": result.get("language"),
        "files": files,
    }

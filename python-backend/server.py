import os
import warnings
import logging

# Supressão de warnings ANTES de importar torch/whisperx
os.environ["ORT_LOG_LEVEL"] = "3"
os.environ["ONNXRUNTIME_LOG_SEVERITY_LEVEL"] = "3"
warnings.filterwarnings("ignore", category=UserWarning, module="pyannote")
warnings.filterwarnings("ignore", category=UserWarning, module="torchcodec")
warnings.filterwarnings("ignore", category=UserWarning, module="torch")
warnings.filterwarnings("ignore", message=".*TensorFloat-32.*")
logging.getLogger("lightning.pytorch").setLevel(logging.ERROR)
logging.getLogger("whisperx").setLevel(logging.WARNING)

import argparse
import asyncio
import json
import subprocess
import sys
import uuid
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from gpu_utils import get_gpu_info
from model_manager import list_models, download_model, delete_model
from transcriber import executar_pipeline

load_dotenv()

app = FastAPI(title="TecJustiça Transcribe Backend", version="1.0.0")

# Estado de transcrições em andamento
transcription_tasks: dict[str, dict] = {}
executor = ThreadPoolExecutor(max_workers=1)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "hf_token_configured": bool(os.getenv("HF_TOKEN")),
    }


class TokenUpdate(BaseModel):
    token: str


@app.post("/config/token")
async def update_token(data: TokenUpdate):
    os.environ["HF_TOKEN"] = data.token.strip()
    return {"ok": True}


@app.get("/gpu-info")
async def gpu_info():
    return get_gpu_info()


@app.get("/diagnostics")
async def diagnostics():
    checks = []
    gpu = get_gpu_info()

    # 1. Python
    checks.append({
        "name": "Python",
        "ok": True,
        "detail": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
    })

    # 2. Driver NVIDIA
    checks.append({
        "name": "Driver NVIDIA",
        "ok": gpu["driver_version"] is not None,
        "detail": gpu["driver_version"] or "Não encontrado",
    })

    # 3. CUDA
    checks.append({
        "name": "CUDA",
        "ok": gpu["cuda_available"],
        "detail": gpu["cuda_version"] or "Não disponível",
    })

    # 4. GPU/VRAM
    if gpu["gpu_name"] and gpu["vram_mb"]:
        vram_gb = round(gpu["vram_mb"] / 1024, 1)
        detail = f"{gpu['gpu_name']} ({vram_gb} GB)"
        if vram_gb < 6:
            detail += " — VRAM baixa, modelos grandes podem falhar"
        checks.append({"name": "GPU/VRAM", "ok": True, "detail": detail})
    else:
        checks.append({"name": "GPU/VRAM", "ok": False, "detail": "Nenhuma GPU NVIDIA detectada"})

    # 5. ffmpeg
    checks.append({
        "name": "ffmpeg",
        "ok": gpu["ffmpeg_available"],
        "detail": _get_ffmpeg_version() if gpu["ffmpeg_available"] else "Não encontrado",
    })

    # 6. Token HuggingFace
    hf_token = os.getenv("HF_TOKEN", "").strip()
    has_token = bool(hf_token) and hf_token != "hf_seu_token_aqui"
    hf_detail = "Não configurado"
    hf_ok = False
    if has_token:
        try:
            import urllib.request, urllib.error
            req = urllib.request.Request(
                "https://huggingface.co/api/whoami-v2",
                headers={"Authorization": f"Bearer {hf_token}"},
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                hf_ok = resp.status == 200
                hf_detail = "Válido" if hf_ok else "Inválido"
        except urllib.error.HTTPError as e:
            if e.code == 401:
                hf_detail = "Token inválido ou revogado"
            else:
                hf_detail = f"Erro ao validar (HTTP {e.code})"
        except Exception:
            hf_detail = "Configurado (não foi possível validar — sem internet?)"
            hf_ok = True  # Assume ok se não conseguiu verificar
    checks.append({
        "name": "Token HuggingFace",
        "ok": hf_ok,
        "detail": hf_detail,
    })

    return checks


@app.get("/models")
async def get_models():
    return list_models()


@app.get("/models/download")
async def download_model_sse(model: str):
    async def event_stream():
        try:
            yield f"data: {json.dumps({'event': 'progress', 'percent': 0, 'message': f'Iniciando download de {model}...'})}\n\n"

            download_model(model)

            yield f"data: {json.dumps({'event': 'complete', 'percent': 100, 'message': 'Download concluído!'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.delete("/models/{model_name}")
async def remove_model(model_name: str):
    try:
        deleted = delete_model(model_name)
        return {"deleted": deleted, "model": model_name}
    except ValueError as e:
        return {"error": str(e)}


class TranscribeRequest(BaseModel):
    audio_path: str
    model: str = "large-v2"
    language: str = "auto"
    diarize: bool = False
    output_dir: str = "./transcricoes"


@app.post("/transcribe")
async def transcribe(req: TranscribeRequest):
    task_id = str(uuid.uuid4())
    hf_token = os.getenv("HF_TOKEN", "")
    if hf_token == "hf_seu_token_aqui":
        hf_token = ""

    transcription_tasks[task_id] = {
        "status": "running",
        "stage": "iniciando",
        "message": "Preparando transcrição...",
        "percent": 0,
        "result": None,
        "error": None,
    }

    def run():
        def on_progress(stage, message):
            stage_percents = {
                "modelo": 10,
                "audio": 25,
                "transcricao": 50,
                "alinhamento": 70,
                "diarizacao": 90,
                "salvando": 95,
            }
            transcription_tasks[task_id]["stage"] = stage
            transcription_tasks[task_id]["message"] = message
            transcription_tasks[task_id]["percent"] = stage_percents.get(stage, 0)

        try:
            result = executar_pipeline(
                audio_path=req.audio_path,
                model_name=req.model,
                language=req.language,
                diarize=req.diarize,
                hf_token=hf_token or None,
                output_dir=req.output_dir,
                on_progress=on_progress,
            )
            transcription_tasks[task_id]["status"] = "complete"
            transcription_tasks[task_id]["percent"] = 100
            transcription_tasks[task_id]["stage"] = "complete"
            transcription_tasks[task_id]["message"] = "Transcrição concluída!"
            transcription_tasks[task_id]["result"] = result
        except Exception as e:
            transcription_tasks[task_id]["status"] = "error"
            transcription_tasks[task_id]["error"] = str(e)
            transcription_tasks[task_id]["message"] = f"Erro: {e}"

    executor.submit(run)
    return {"task_id": task_id}


@app.get("/transcribe/progress")
async def transcribe_progress(task_id: str):
    async def event_stream():
        while True:
            task = transcription_tasks.get(task_id)
            if not task:
                yield f"data: {json.dumps({'event': 'error', 'message': 'Task não encontrada'})}\n\n"
                return

            yield f"data: {json.dumps({'event': task['stage'], 'percent': task['percent'], 'message': task['message'], 'result': task.get('result')})}\n\n"

            if task["status"] in ("complete", "error"):
                return

            await asyncio.sleep(0.5)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _get_ffmpeg_version() -> str:
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"], capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            first_line = result.stdout.split("\n")[0]
            # "ffmpeg version 6.1.1 ..." -> "6.1.1"
            parts = first_line.split()
            if len(parts) >= 3:
                return parts[2]
        return "Instalado"
    except Exception:
        return "Erro ao verificar"


if __name__ == "__main__":
    import uvicorn

    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    uvicorn.run(app, host="127.0.0.1", port=args.port)

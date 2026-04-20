import shutil
from pathlib import Path

# Catálogo de modelos WhisperX (faster-whisper)
MODEL_CATALOG = {
    "tiny": {
        "repo": "Systran/faster-whisper-tiny",
        "size": "~150 MB",
        "vram": "~1 GB",
    },
    "small": {
        "repo": "Systran/faster-whisper-small",
        "size": "~500 MB",
        "vram": "~2 GB",
    },
    "medium": {
        "repo": "Systran/faster-whisper-medium",
        "size": "~1.5 GB",
        "vram": "~5 GB",
    },
    "large-v2": {
        "repo": "Systran/faster-whisper-large-v2",
        "size": "~3.1 GB",
        "vram": "~10 GB",
    },
}

# Cache do HuggingFace
HF_CACHE_DIR = Path.home() / ".cache" / "huggingface" / "hub"


def _get_model_cache_path(repo: str) -> Path:
    """Retorna o caminho do cache para um repo HuggingFace."""
    # HF cache: models--Org--Name
    safe_name = f"models--{repo.replace('/', '--')}"
    return HF_CACHE_DIR / safe_name


def is_model_downloaded(model_name: str) -> bool:
    """Verifica se um modelo já foi baixado."""
    if model_name not in MODEL_CATALOG:
        return False
    repo = MODEL_CATALOG[model_name]["repo"]
    cache_path = _get_model_cache_path(repo)
    # Verifica se o diretório de snapshots existe e não está vazio
    snapshots = cache_path / "snapshots"
    return snapshots.exists() and any(snapshots.iterdir())


def list_models() -> list[dict]:
    """Lista todos os modelos com status de download."""
    models = []
    for name, info in MODEL_CATALOG.items():
        models.append({
            "name": name,
            "repo": info["repo"],
            "size": info["size"],
            "vram": info["vram"],
            "downloaded": is_model_downloaded(name),
        })
    return models


def download_model(model_name: str, on_progress=None):
    """
    Baixa um modelo via huggingface_hub.
    on_progress(percent, message) é chamado durante o download.
    """
    if model_name not in MODEL_CATALOG:
        raise ValueError(f"Modelo desconhecido: {model_name}")

    repo = MODEL_CATALOG[model_name]["repo"]

    from huggingface_hub import snapshot_download

    if on_progress:
        on_progress(0, f"Iniciando download de {model_name}...")

    snapshot_download(
        repo_id=repo,
        local_dir=None,  # Usa cache padrão
    )

    if on_progress:
        on_progress(100, "Download concluído!")


def delete_model(model_name: str) -> bool:
    """Remove um modelo do cache."""
    if model_name not in MODEL_CATALOG:
        raise ValueError(f"Modelo desconhecido: {model_name}")

    repo = MODEL_CATALOG[model_name]["repo"]
    cache_path = _get_model_cache_path(repo)

    if cache_path.exists():
        shutil.rmtree(cache_path)
        return True
    return False

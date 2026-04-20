import subprocess


def get_gpu_info() -> dict:
    info = {
        "cuda_available": False,
        "gpu_name": None,
        "vram_mb": None,
        "cuda_version": None,
        "driver_version": None,
        "ffmpeg_available": False,
    }

    try:
        import torch

        info["cuda_available"] = torch.cuda.is_available()
        if info["cuda_available"]:
            info["gpu_name"] = torch.cuda.get_device_name(0)
            info["vram_mb"] = (
                torch.cuda.get_device_properties(0).total_memory // (1024 * 1024)
            )
            info["cuda_version"] = torch.version.cuda
    except Exception:
        pass

    # Driver version via nvidia-smi
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=driver_version", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0:
            info["driver_version"] = result.stdout.strip()
    except Exception:
        pass

    # ffmpeg
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"], capture_output=True, text=True, timeout=5
        )
        info["ffmpeg_available"] = result.returncode == 0
    except Exception:
        pass

    return info

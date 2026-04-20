# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec file for TecJustiça Transcribe backend

import sys
import os

block_cipher = None

a = Analysis(
    ['server.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'whisperx',
        'faster_whisper',
        'ctranslate2',
        'pyannote.audio',
        'pyannote.audio.pipelines',
        'pyannote.core',
        'pyannote.pipeline',
        'torch',
        'torchaudio',
        'torchvision',
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'fastapi',
        'pydantic',
        'dotenv',
        'huggingface_hub',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

# Incluir CUDA runtime libs do torch
import torch
torch_path = os.path.dirname(torch.__file__)
torch_lib = os.path.join(torch_path, 'lib')
if os.path.exists(torch_lib):
    for f in os.listdir(torch_lib):
        full = os.path.join(torch_lib, f)
        if os.path.isfile(full) and (f.endswith('.so') or f.endswith('.dll')):
            a.binaries.append((os.path.join('torch', 'lib', f), full, 'BINARY'))

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='server',
)

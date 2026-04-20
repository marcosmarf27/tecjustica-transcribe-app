#!/bin/bash
# Build do backend Python com PyInstaller (Linux)
set -e

echo "=== TecJustiça Transcribe — Build Backend (Linux) ==="

cd python-backend

# Verificar venv
if [ ! -d "venv" ]; then
    echo "[1/3] Criando venv..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install pyinstaller
else
    source venv/bin/activate
fi

# Build com PyInstaller
echo "[2/3] Executando PyInstaller..."
pyinstaller --noconfirm server.spec

# Verificar output
echo "[3/3] Verificando..."
if [ -f "dist/server/server" ]; then
    echo "Build concluído com sucesso!"
    echo "Binário: python-backend/dist/server/server"
    du -sh dist/server/
else
    echo "ERRO: Binário não encontrado."
    exit 1
fi

@echo off
REM Build do backend Python com PyInstaller (Windows)
echo === TecJustica Transcribe — Build Backend (Windows) ===

cd python-backend

REM Verificar venv
if not exist "venv" (
    echo [1/3] Criando venv...
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    pip install pyinstaller
) else (
    call venv\Scripts\activate
)

REM Build com PyInstaller
echo [2/3] Executando PyInstaller...
pyinstaller --noconfirm server.spec

REM Verificar output
echo [3/3] Verificando...
if exist "dist\server\server.exe" (
    echo Build concluido com sucesso!
    echo Binario: python-backend\dist\server\server.exe
) else (
    echo ERRO: Binario nao encontrado.
    exit /b 1
)

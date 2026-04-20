#!/usr/bin/env bash
#
# Instalador one-liner do TecJustiça Transcribe para Linux.
#
# Uso:
#   curl -fsSL https://raw.githubusercontent.com/marcosmarf27/tecjustica-transcribe-desktop/main/install.sh | bash
#

set -euo pipefail

REPO="marcosmarf27/tecjustica-transcribe-desktop"
APP_NAME="TecJustiça Transcribe"
BIN_NAME="tecjustica-transcribe"
INSTALL_DIR="${HOME}/.local/bin"
DESKTOP_DIR="${HOME}/.local/share/applications"
ICON_DIR="${HOME}/.local/share/icons"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
NC='\033[0m'

step() {
    printf "  ${CYAN}->${NC} %s\n" "$1"
}

err() {
    printf "  ${RED}ERRO:${NC} %s\n" "$1"
}

# Banner
echo ""
printf "  ${CYAN}╔══════════════════════════════════════════╗${NC}\n"
printf "  ${CYAN}║       TecJustiça Transcribe              ║${NC}\n"
printf "  ${CYAN}║       Instalador Linux                   ║${NC}\n"
printf "  ${CYAN}╚══════════════════════════════════════════╝${NC}\n"
echo ""

# 1. Verificar arquitetura
ARCH=$(uname -m)
if [ "$ARCH" != "x86_64" ]; then
    err "Este aplicativo requer Linux x86_64 (detectado: $ARCH)."
    exit 1
fi
step "Linux x86_64 detectado"

# 2. Verificar ferramenta de download
if command -v curl &>/dev/null; then
    DOWNLOADER="curl"
elif command -v wget &>/dev/null; then
    DOWNLOADER="wget"
else
    err "Necessário curl ou wget. Instale com: sudo apt install curl"
    exit 1
fi
step "Usando $DOWNLOADER para downloads"

# Funções auxiliares para download
fetch_url() {
    local url="$1"
    if [ "$DOWNLOADER" = "curl" ]; then
        curl -fsSL "$url"
    else
        wget -qO- "$url"
    fi
}

download_file() {
    local url="$1"
    local dest="$2"
    if [ "$DOWNLOADER" = "curl" ]; then
        curl -fL --progress-bar "$url" -o "$dest"
    else
        wget --show-progress -q "$url" -O "$dest"
    fi
}

# 3. Buscar última release via GitHub API
step "Buscando última versão..."

API_URL="https://api.github.com/repos/$REPO/releases/latest"
RELEASE_JSON=$(fetch_url "$API_URL") || {
    err "Não foi possível acessar o GitHub. Verifique sua conexão."
    printf "    ${GRAY}URL: %s${NC}\n" "$API_URL"
    exit 1
}

# Extrair versão (sem dependência de jq)
VERSION=$(echo "$RELEASE_JSON" | grep '"tag_name"' | head -1 | sed 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
if [ -z "$VERSION" ]; then
    err "Não foi possível determinar a versão mais recente."
    exit 1
fi
step "Versão encontrada: $VERSION"

# 4. Encontrar o .AppImage na release
DOWNLOAD_URL=$(echo "$RELEASE_JSON" | grep '"browser_download_url"' | grep -i 'appimage"' | head -1 | sed 's/.*"browser_download_url"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

if [ -z "$DOWNLOAD_URL" ]; then
    err "Nenhum .AppImage encontrado na release $VERSION."
    printf "    ${GRAY}Verifique: https://github.com/$REPO/releases/tag/$VERSION${NC}\n"
    exit 1
fi

FILE_NAME=$(basename "$DOWNLOAD_URL")
step "Arquivo: $FILE_NAME"

# 5. Criar diretório de instalação
mkdir -p "$INSTALL_DIR"

INSTALL_PATH="$INSTALL_DIR/$BIN_NAME"
TMP_FILE=$(mktemp /tmp/tecjustica-XXXXXX.AppImage)

# Limpar arquivo temporário em caso de erro
cleanup() {
    rm -f "$TMP_FILE"
}
trap cleanup EXIT

# 6. Baixar AppImage
step "Baixando AppImage..."
printf "    ${GRAY}URL: %s${NC}\n" "$DOWNLOAD_URL"

download_file "$DOWNLOAD_URL" "$TMP_FILE" || {
    err "Falha no download."
    exit 1
}

# Verificar se o arquivo não está vazio
FILE_SIZE=$(stat -c%s "$TMP_FILE" 2>/dev/null || stat -f%z "$TMP_FILE" 2>/dev/null)
if [ "$FILE_SIZE" -lt 1000000 ]; then
    err "Download parece incompleto ($FILE_SIZE bytes)."
    exit 1
fi

SIZE_MB=$(echo "scale=1; $FILE_SIZE / 1048576" | bc 2>/dev/null || echo "$((FILE_SIZE / 1048576))")
step "Download concluído (${SIZE_MB} MB)"

# 7. Instalar AppImage
mv "$TMP_FILE" "$INSTALL_PATH"
chmod +x "$INSTALL_PATH"
step "Instalado em: $INSTALL_PATH"

# 8. Criar .desktop entry
mkdir -p "$DESKTOP_DIR"

# Extrair ícone do AppImage (tentativa)
ICON_PATH=""
if [ -f "$INSTALL_PATH" ]; then
    mkdir -p "$ICON_DIR"
    ICON_PATH="$ICON_DIR/$BIN_NAME.png"
    # Extrair em diretório temporário para não poluir o CWD do usuário
    EXTRACT_DIR=$(mktemp -d /tmp/tecjustica-extract-XXXXXX)
    if (cd "$EXTRACT_DIR" && "$INSTALL_PATH" --appimage-extract "*.png" &>/dev/null); then
        EXTRACTED=$(find "$EXTRACT_DIR/squashfs-root" -name "icon.png" -o -name "*.png" 2>/dev/null | head -1)
        if [ -n "$EXTRACTED" ]; then
            cp "$EXTRACTED" "$ICON_PATH"
        fi
    fi
    rm -rf "$EXTRACT_DIR"
fi

# Se não conseguiu extrair ícone, usar nome genérico
if [ ! -f "$ICON_PATH" ]; then
    ICON_PATH="$BIN_NAME"
fi

cat > "$DESKTOP_DIR/$BIN_NAME.desktop" << DESKTOP
[Desktop Entry]
Type=Application
Name=$APP_NAME
Comment=Transcrição automática de audiências judiciais com WhisperX
Exec=$INSTALL_PATH
Icon=$ICON_PATH
Terminal=false
Categories=AudioVideo;Audio;Utility;
Keywords=transcrição;whisper;áudio;vídeo;
StartupNotify=true
DESKTOP

chmod +x "$DESKTOP_DIR/$BIN_NAME.desktop"

# Atualizar cache de desktop entries
if command -v update-desktop-database &>/dev/null; then
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi

step "Atalho criado no menu de aplicativos"

# 9. Verificar se ~/.local/bin está no PATH
if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
    printf "\n"
    printf "  ${YELLOW}AVISO: %s não está no seu PATH.${NC}\n" "$INSTALL_DIR"
    printf "  ${YELLOW}Adicione ao seu ~/.bashrc ou ~/.zshrc:${NC}\n"
    printf "    ${GRAY}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}\n"
fi

# 10. Mensagem final
echo ""
printf "  ${GREEN}✓ %s %s instalado com sucesso!${NC}\n" "$APP_NAME" "$VERSION"
echo ""
printf "    ${GRAY}Executável: %s${NC}\n" "$INSTALL_PATH"
printf "    ${GRAY}Ou busque '%s' no menu de aplicativos.${NC}\n" "$APP_NAME"
echo ""
printf "    ${YELLOW}No primeiro uso, o app fará o setup automático${NC}\n"
printf "    ${YELLOW}(download de Python, PyTorch e WhisperX ~3 GB).${NC}\n"
echo ""
printf "    ${GRAY}Para desinstalar: rm %s %s${NC}\n" "$INSTALL_PATH" "$DESKTOP_DIR/$BIN_NAME.desktop"
echo ""

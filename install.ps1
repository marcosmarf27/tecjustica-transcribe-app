<#
.SYNOPSIS
    Instalador one-liner do TecJustiça Transcribe para Windows.

.DESCRIPTION
    Baixa e instala a versão mais recente do TecJustiça Transcribe
    diretamente do GitHub Releases.

.EXAMPLE
    irm https://raw.githubusercontent.com/marcosmarf27/tecjustica-transcribe-app/main/install.ps1 | iex
#>

$ErrorActionPreference = "Stop"

$repo = "marcosmarf27/tecjustica-transcribe-app"
$appName = "TecJustiça Transcribe"

function Write-Step {
    param([string]$Message)
    Write-Host "  -> " -ForegroundColor Cyan -NoNewline
    Write-Host $Message
}

function Write-Err {
    param([string]$Message)
    Write-Host "  ERRO: " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

# Banner
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║       TecJustiça Transcribe              ║" -ForegroundColor Cyan
Write-Host "  ║       Instalador Windows                 ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar arquitetura
$arch = [System.Environment]::Is64BitOperatingSystem
if (-not $arch) {
    Write-Err "Este aplicativo requer Windows 64-bit."
    exit 1
}
Write-Step "Windows x64 detectado"

# 2. Buscar última release via GitHub API
Write-Step "Buscando última versão..."

$apiUrl = "https://api.github.com/repos/$repo/releases/latest"
$headers = @{ "User-Agent" = "TecJustica-Installer" }

try {
    $release = Invoke-RestMethod -Uri $apiUrl -Headers $headers -TimeoutSec 30
} catch {
    Write-Err "Não foi possível acessar o GitHub. Verifique sua conexão."
    Write-Host "    URL: $apiUrl" -ForegroundColor DarkGray
    Write-Host "    Erro: $($_.Exception.Message)" -ForegroundColor DarkGray
    exit 1
}

$version = $release.tag_name
Write-Step "Versão encontrada: $version"

# 3. Encontrar o .exe na release
$asset = $release.assets | Where-Object { $_.name -like "*.exe" -and $_.name -notlike "*.blockmap" } | Select-Object -First 1

if (-not $asset) {
    Write-Err "Nenhum instalador .exe encontrado na release $version."
    Write-Host "    Assets disponíveis:" -ForegroundColor DarkGray
    $release.assets | ForEach-Object { Write-Host "      - $($_.name)" -ForegroundColor DarkGray }
    exit 1
}

$downloadUrl = $asset.browser_download_url
$fileName = $asset.name
$fileSize = [math]::Round($asset.size / 1MB, 1)
Write-Step "Arquivo: $fileName ($fileSize MB)"

# 4. Baixar o instalador
$tmpDir = $env:TEMP
$tmpFile = Join-Path $tmpDir "tecjustica-setup.exe"

Write-Step "Baixando instalador..."
Write-Host "    URL: $downloadUrl" -ForegroundColor DarkGray

$maxRetries = 2
$downloaded = $false

$savedProgress = $ProgressPreference
try {
    $ProgressPreference = 'SilentlyContinue'
    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            Invoke-WebRequest -Uri $downloadUrl -OutFile $tmpFile -Headers $headers -TimeoutSec 300
            $downloaded = $true
            break
        } catch {
            if ($i -lt $maxRetries) {
                Write-Host "    Tentativa $i falhou, tentando novamente..." -ForegroundColor Yellow
            } else {
                Write-Err "Falha no download após $maxRetries tentativas."
                Write-Host "    Erro: $($_.Exception.Message)" -ForegroundColor DarkGray
                exit 1
            }
        }
    }
} finally {
    $ProgressPreference = $savedProgress
}

# Verificar se o arquivo foi baixado
$downloadedSize = (Get-Item $tmpFile).Length
$expectedSize = $asset.size
if ($downloadedSize -ne $expectedSize) {
    Write-Err "Download incompleto ($downloadedSize bytes de $expectedSize bytes esperados)."
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
    exit 1
}

Write-Step "Download concluído ($([math]::Round($downloadedSize / 1MB, 1)) MB)"

# 5. Executar instalador (NSIS silent install)
Write-Step "Executando instalador..."

try {
    $process = Start-Process -FilePath $tmpFile -ArgumentList "/S" -Wait -PassThru
    if ($process.ExitCode -ne 0) {
        Write-Err "O instalador retornou código de erro: $($process.ExitCode)"
        Remove-Item $tmpFile -ErrorAction SilentlyContinue
        exit 1
    }
} catch {
    Write-Err "Falha ao executar o instalador."
    Write-Host "    Erro: $($_.Exception.Message)" -ForegroundColor DarkGray
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
    exit 1
}

# 6. Limpar arquivo temporário
Remove-Item $tmpFile -ErrorAction SilentlyContinue

# 7. Verificar instalação
$installDir = Join-Path $env:LOCALAPPDATA $appName
$exePath = Join-Path $installDir "$appName.exe"

if (Test-Path $exePath) {
    Write-Host ""
    Write-Host "  ✓ $appName $version instalado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "    Local: $installDir" -ForegroundColor DarkGray
    Write-Host "    O app deve aparecer no Menu Iniciar." -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    No primeiro uso, o app fará o setup automático" -ForegroundColor Yellow
    Write-Host "    (download de Python, PyTorch e WhisperX ~3 GB)." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "  ✓ Instalador executado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "    Verifique o $appName no Menu Iniciar." -ForegroundColor DarkGray
    Write-Host "    Se não aparecer, tente executar o instalador manualmente:" -ForegroundColor DarkGray
    Write-Host "    $downloadUrl" -ForegroundColor DarkGray
}

Write-Host ""

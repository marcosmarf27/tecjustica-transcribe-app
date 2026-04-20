# TecJustiça Transcribe

## O que é
App desktop para transcrição automática de audiências judiciais usando WhisperX. Interface Electron com backend Python (FastAPI). Suporte a GPU NVIDIA para performance, funciona offline.
**Parceria TecJustiça × Projurista** — branding conjunto na sidebar e exportações DOCX.

## Arquitetura
- **Main Process** (`main.js`): gerencia janelas, spawna backend Python, IPC handlers, SQLite, auto-restart
- **Renderer Process** (`renderer/` + `index.html`): frontend modularizado — interface VS Code-like com 4 páginas
- **Preload** (`preload.js`): ponte segura via `contextBridge` entre Main e Renderer
- **Styles** (`styles.css`): tema escuro VS Code refinado, fonte JetBrains Mono, variáveis CSS
- **Backend Python** (`python-backend/`): FastAPI com WhisperX, detecção GPU, gerenciamento de modelos

## Estrutura do Frontend (renderer/)
```
renderer/
  main.js           — ponto de entrada, init, backend status, status bar
  state.js           — pub/sub reativo: get/set/on/off
  navigation.js      — sidebar clicks, navigateTo(), toggle sidebar
  transcription.js   — formulário, POST /transcribe, SSE progress, ETA
  history.js         — lista histórico, empty state, CRUD via IPC/SQLite
  results.js         — segmentos, exportação, busca com highlight, edição inline
  player.js          — audio/video player sincronizado com segmentos
  models.js          — grid modelos, download/delete SSE
  settings.js        — form config, save/load
  diagnostics.js     — tabela diagnóstico, refresh
  toast.js           — notificações toast com ações
  dragdrop.js        — drag & drop de arquivos de mídia
  utils.js           — formatTime, debounce, helpers
```

## Estrutura do Backend Python
- `server.py` — FastAPI, endpoints REST, SSE para progresso
- `gpu_utils.py` — detecção de GPU, CUDA, VRAM, ffmpeg
- `model_manager.py` — catálogo de modelos, download/delete via huggingface_hub
- `transcriber.py` — pipeline WhisperX com limpeza progressiva de VRAM
- `requirements.txt` — dependências Python (whisperx, fastapi, uvicorn, torch)

## Páginas
1. **Transcrição** — 3 sub-views: histórico (lista com SQLite), formulário (nova transcrição), resultado (player + segmentos editáveis)
2. **Modelos** — download/delete de modelos WhisperX (tiny, small, medium, large-v2)
3. **Configurações** — token HuggingFace, pasta de saída, device, batch_size, sidebar_collapsed
4. **Diagnóstico** — verificação de Python, NVIDIA, CUDA, GPU/VRAM, ffmpeg, token HF

## Comunicação
- **Electron ↔ Renderer**: IPC via `window.api.*()` (preload)
  - Canais originais: `get-backend-url`, `get-backend-port`, `select-audio-file`, `save-export-file`, `select-directory`, `get-config`, `save-config`, `get-app-version`, `open-file`, `window-minimize`, `window-maximize`, `window-close`, `check-setup`, `run-setup`, `start-backend-after-setup`
  - Canais SQLite: `db-save-transcription`, `db-get-transcriptions`, `db-get-transcription`, `db-delete-transcription`, `db-update-segments`, `db-search-transcriptions`
  - Canais extras: `re-export`, `getFilePath` (via `webUtils.getPathForFile`)
  - Evento: `backend-status` (starting/ready/error), `setup-status`
- **Renderer ↔ Backend**: HTTP REST + SSE
  - `GET /health`, `GET /gpu-info`, `GET /diagnostics`
  - `GET /models`, `GET /models/download` (SSE), `DELETE /models/{name}`
  - `POST /transcribe`, `GET /transcribe/progress` (SSE)

## Persistência
- Config em `app.getPath('userData')/config.json`
- Histórico de transcrições em `app.getPath('userData')/transcriptions.json` (JSON puro, sem dependência nativa)
- Logs do backend em `app.getPath('userData')/logs/backend.log`
- Linux: `~/.config/tecjustica-transcribe/`
- Windows: `%APPDATA%/tecjustica-transcribe/`

### Schema transcriptions.json
Array de objetos com campos: `id`, `filename`, `filepath`, `model`, `language`, `diarize`, `duration_seconds`, `status`, `error_message`, `segments_json`, `files_json`, `created_at`, `completed_at`, `edited`

## Pipeline WhisperX (limpeza progressiva de VRAM)
1. Carregar modelo → 2. Decodificar áudio → 3. Transcrever → **del model + gc + empty_cache** → 4. Alinhar timestamps → **del align_model + gc + empty_cache** → 5. Diarização (opcional) → **del diarize_model + gc + empty_cache** → 6. Salvar (.txt, .srt, .json)

## Funcionalidades UI/UX
- **Sidebar colapsável**: expandida (200px) com ícones + labels, colapsada (48px) só ícones. Estado persiste no config.
- **Histórico de transcrições**: lista com cards, badges de status, busca, delete. Empty state com CTA. Persistido em SQLite.
- **Drag & drop**: arrastar arquivo de mídia sobre a página abre formulário com arquivo pré-selecionado.
- **Progresso detalhado**: pipeline visual com 6 etapas, %, ETA. Continua rodando ao navegar (background processing).
- **Indicadores**: dot pulsante na sidebar + progresso na status bar quando transcrevendo em background.
- **Toast notifications**: slide-in no canto inferior direito com ação "Ver resultado" ao completar.
- **Busca na transcrição**: highlight amarelo, contador, navegação prev/next, Ctrl+F.
- **Edição inline**: double-click em segmento ativa contenteditable. Ctrl+Enter salva, Escape cancela. Re-export atualiza .txt/.srt.
- **Variáveis CSS**: `--radius-sm/md/lg`, `--shadow-sm/md`, `--transition-fast/normal` para consistência visual.
- **Branding parceria**: sidebar exibe logo Projurista (44px, hover glow) + "TecJustiça" + "Transcribe" + "Parceria Projurista". Na sidebar colapsada, só a logo (32px). DOCX export inclui "Parceria TecJustiça × Projurista" no cabeçalho.

## Segurança
- `nodeIntegration: false` + `contextIsolation: true`
- CSP: `default-src 'self'; connect-src http://localhost:* http://127.0.0.1:*; media-src file: blob:`
- **IMPORTANTE**: CSP deve incluir tanto `localhost` quanto `127.0.0.1` — Chromium trata como hostnames diferentes
- Token HuggingFace é opcional e fornecido pelo usuário em Configurações. Sem token, a diarização fica desabilitada mas a transcrição funciona. Tipo "Read" obrigatório (Fine-grained não funciona)
- **HuggingFace API**: usar `/api/whoami-v2` para validar tokens (endpoint `/api/whoami` está deprecado e retorna 401)

## Scripts
- `npm start` — roda o app em modo dev (requer backend Python rodando)
- `npm run dist:linux` — gera `.AppImage` para Linux
- `npm run dist:win` — gera `.exe` para Windows
- `./build_backend.sh` — build do backend Python com PyInstaller (Linux)
- `build_backend.bat` — build do backend Python com PyInstaller (Windows)

## Build / Distribuição
- **Electron**: electron-builder, config no `package.json` bloco `"build"`
- **Python**: PyInstaller via `server.spec`, output em `python-backend/dist/server/`
- **AppId**: `com.tecjustica.transcribe`
- **ProductName**: `TecJustiça Transcribe`
- **extraResources**: inclui binário PyInstaller no instalador
- **Após build Windows**: copiar `.exe` para `/mnt/c/Users/marco/Downloads/`
- **Caminho do .exe**: `dist/TecJustiça Transcribe Setup 1.0.0.exe`
- **Assets de branding**: `assets/icon.png` (ícone app) + `assets/projurista.jpeg` (logo parceiro) — ambos incluídos no build
- **ffmpeg bundled**: `resources/bin/{win,linux}/` é populado automaticamente antes do `dist:*` via hooks `predist:win`/`predist:linux` que rodam `node scripts/download-ffmpeg.js`. Os binários são copiados para `resources/bin/` no instalador e o `main.js` injeta esse caminho no `PATH` do backend Python. A pasta `resources/bin/` está no `.gitignore`

## Repositórios e Distribuição
- **Repo de desenvolvimento** (PRIVADO): `marcosmarf27/tecjustica-transcribe-desktop` — código-fonte, NÃO pode ter releases públicos
- **Repo de distribuição** (PÚBLICO): `marcosmarf27/tecjustica-transcribe-desktop-releases` — publica instaladores via GitHub Releases
- **IMPORTANTE**: NUNCA criar releases no repo privado de desenvolvimento. Os instaladores (.exe, .AppImage) devem ser publicados APENAS no repo público de distribuição
- **Landing page**: `transcricao-web/` deployada na Vercel em `https://transcricao-web.vercel.app` — página `/download` deve apontar para o repo público de distribuição

## Compatibilidade e Versões
- **Python**: 3.10-3.13 (3.14+ incompatível — whisperx não tem wheels). Auto-instalação de 3.11 via winget no Windows.
- **PyTorch**: 2.8.0+cu126 (CUDA 12.6) — compatível com WhisperX 3.8.2
- **CUDA**: 12.6 (requer driver NVIDIA >= 560). Driver 591.44 testado OK
- **WhisperX**: 3.8.2 (pede `torch~=2.8.0`, funciona com 2.8.0+cu126)
- **Electron**: 41.x
- **Node.js**: compatível com Electron 41

## Pré-requisitos no Windows (usuário final)
1. **Python 3.10-3.13** — instalado automaticamente via winget se necessário (ou instalar de python.org com "Add to PATH" marcado)
2. **GPU NVIDIA** (recomendado) — driver 560+ para CUDA 12.6
3. **ffmpeg** — empacotado no instalador (`resources/bin/win/ffmpeg.exe`), nenhuma ação manual. Fallback via `winget install Gyan.FFmpeg` se o binário bundled estiver ausente/corrompido
4. **Internet** — necessário no primeiro uso para setup (download ~3 GB de PyTorch + WhisperX)

## Pré-requisitos no Linux (usuário final)
1. **Python 3.10+** — `sudo apt install python3 python3-venv`
2. **GPU NVIDIA** (recomendado) — driver 560+ com CUDA toolkit
3. **ffmpeg** — empacotado no AppImage (`resources/bin/linux/ffmpeg`), nenhuma ação manual

## Dependências de ambiente para build (dev)
Para gerar instaladores a partir do Linux/WSL:
- **wine** + **wine32:i386** — necessário para gerar `.exe` do Windows
  ```bash
  sudo dpkg --add-architecture i386
  sudo apt-get update
  sudo apt-get install -y wine wine32:i386
  ```
- **Python 3.10+** com venv para o backend
- **PyInstaller** para empacotar o backend
- **electron-builder** — já instalado como devDependency

## Setup automático (primeiro uso)
O app detecta se o venv existe. Se não:
1. Encontra Python compatível (3.10-3.13) via `findSystemPython` — ignora redirect da MS Store no Windows
2. **Se não achou + Windows + winget**: auto-instala Python 3.11 via `winget install Python.Python.3.11`, depois busca em caminhos conhecidos (`findPythonAfterInstall`)
3. **Se não achou + Windows - winget**: erro com instruções manuais (python.org)
4. **Se não achou + Linux**: erro com instruções `sudo apt install`
5. Verifica ffmpeg — `checkFfmpeg()` reconhece primeiro o binário bundled em `resources/bin/`. Se ausente E Windows E winget: fallback `winget install Gyan.FFmpeg` (non-fatal)
6. Cria venv em `userData/python-env/`
7. Instala dependências com `--extra-index-url https://download.pytorch.org/whl/cu126` (PyTorch CUDA)
8. Marca `setup-complete`
9. Inicia backend via IPC `start-backend-after-setup`

## Lições aprendidas (bugs resolvidos)
- **CSP `localhost` vs `127.0.0.1`**: Chromium no Electron trata como hostnames diferentes. CSP deve incluir ambos
- **Race condition IPC**: `backend-status: ready` pode ser enviado antes do renderer carregar. Solução: `did-finish-load` + polling ativo no renderer
- **PyTorch CPU vs CUDA**: `pip install torch` do PyPI instala CPU-only. Precisa de `--extra-index-url` ou `--index-url` do PyTorch wheel index
- **Python 3.13 + CUDA**: cu121 não tem wheels para Python 3.13. Usar cu126
- **MS Store Python redirect**: No Windows, `python` pode redirecionar para MS Store. Detectar via `where` e filtrar `WindowsApps`
- **`location.reload()` após setup**: Não re-dispara `startBackend()` no main process. Usar IPC dedicado
- **HuggingFace `/api/whoami` deprecado**: Endpoint retorna 401 para tokens válidos. Migrar para `/api/whoami-v2`
- **Token HF com whitespace**: Copy-paste pode incluir espaços/newlines. Aplicar `.trim()` em toda a cadeia (settings save, main.js startup, POST /config/token, backend receive, backend diagnostics)

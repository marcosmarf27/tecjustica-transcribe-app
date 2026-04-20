# Plano de Implementação: TecJustiça Transcribe

## Visão Geral

Transformar o app Electron de Todo List num app de transcrição de audiências judiciais. Backend Python (FastAPI) como child process do Electron, frontend vanilla JS com tema VS Code. Pipeline WhisperX com limpeza progressiva de VRAM. Instaladores para Windows (.exe) e Linux (.AppImage) com Python e CUDA embutidos.

---

## Fase 1: Backend Python — Foundation

Criar o servidor FastAPI com health check, detecção de GPU e supressão de warnings. Validar que o backend roda standalone antes de integrar com Electron.

### Tarefas

- [x] Criar diretório `python-backend/`
- [x] Criar `python-backend/requirements.txt` com dependências
- [x] Criar `python-backend/gpu_utils.py` — detecção de GPU, CUDA, VRAM, ffmpeg
- [x] Criar `python-backend/server.py` — FastAPI com CORS, health check, gpu-info
- [x] Criar `python-backend/.env.example` com placeholder do HF_TOKEN
- [ ] Testar backend standalone: health check e gpu-info via curl

### Detalhes Técnicos

**`requirements.txt`**:
```
whisperx @ git+https://github.com/m-bain/whisperX.git
fastapi>=0.115.0
uvicorn[standard]>=0.34.0
torch>=2.0.0
python-dotenv>=1.0.0
```

**`gpu_utils.py`** — função `get_gpu_info()`:
```python
def get_gpu_info() -> dict:
    info = {"cuda_available": False, "gpu_name": None, "vram_mb": None,
            "cuda_version": None, "driver_version": None, "ffmpeg_available": False}
    try:
        import torch
        info["cuda_available"] = torch.cuda.is_available()
        if info["cuda_available"]:
            info["gpu_name"] = torch.cuda.get_device_name(0)
            info["vram_mb"] = torch.cuda.get_device_properties(0).total_memory // (1024 * 1024)
            info["cuda_version"] = torch.version.cuda
    except Exception:
        pass
    # driver via nvidia-smi
    try:
        result = subprocess.run(["nvidia-smi", "--query-gpu=driver_version", "--format=csv,noheader"],
                                capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            info["driver_version"] = result.stdout.strip()
    except Exception:
        pass
    # ffmpeg
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=5)
        info["ffmpeg_available"] = result.returncode == 0
    except Exception:
        pass
    return info
```

**`server.py`** — supressão de warnings (ANTES de importar torch/whisperx):
```python
import os, warnings, logging
os.environ["ORT_LOG_LEVEL"] = "3"
os.environ["ONNXRUNTIME_LOG_SEVERITY_LEVEL"] = "3"
warnings.filterwarnings("ignore", category=UserWarning, module="pyannote")
warnings.filterwarnings("ignore", category=UserWarning, module="torchcodec")
warnings.filterwarnings("ignore", category=UserWarning, module="torch")
warnings.filterwarnings("ignore", message=".*TensorFloat-32.*")
logging.getLogger("lightning.pytorch").setLevel(logging.ERROR)
logging.getLogger("whisperx").setLevel(logging.WARNING)
```

**Endpoints**:
- `GET /health` → `{"status": "ok", "version": "1.0.0", "hf_token_configured": bool}`
- `GET /gpu-info` → resultado do `get_gpu_info()`

**Porta via CLI**: `python server.py --port 8000` (argparse)

**Verificação**:
```bash
cd python-backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python server.py --port 8000
curl http://localhost:8000/health
curl http://localhost:8000/gpu-info
```

---

## Fase 2: Electron Shell — Rewrite Completo

Apagar código do Todo List. Electron spawna o backend Python, mostra splash enquanto aguarda, exibe layout VS Code-like com 4 páginas navegáveis.

### Tarefas

- [x] Atualizar `package.json` — metadata, appId, productName, build config
- [x] Reescrever `main.js` — spawn Python, porta livre, health polling, IPC handlers [complexo]
  - [x] Função `findFreePort()` com `net.createServer`
  - [x] Spawn condicional: dev (`python server.py`) vs prod (binário PyInstaller)
  - [x] Health polling a cada 500ms, timeout 30s
  - [x] Matar processo Python em `will-quit` e `before-quit`
  - [x] Capturar stdout/stderr do Python para log
  - [x] IPC: `get-backend-url`, `select-audio-file`, `save-export-file`, `get-config`, `save-config`, `get-app-version`, `open-file`
- [x] Reescrever `preload.js` — nova API `window.api`
- [x] Reescrever `index.html` — layout VS Code-like com CSP atualizado
- [x] Reescrever `styles.css` — tema escuro VS Code com todos componentes [complexo]
- [x] Reescrever `renderer.js` — navegação por páginas, status bar, fetch de health/gpu-info
- [x] Criar `.env` com HF_TOKEN (não commitado)
- [x] Atualizar `.gitignore` com novos excludes

### Detalhes Técnicos

**`package.json`**:
```json
{
  "name": "tecjustica-transcribe",
  "version": "1.0.0",
  "description": "Transcrição de audiências judiciais com WhisperX",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build:python": "cd python-backend && pyinstaller server.spec",
    "predist": "npm run build:python",
    "dist": "electron-builder",
    "dist:linux": "electron-builder --linux",
    "dist:win": "electron-builder --win"
  },
  "build": {
    "appId": "com.tecjustica.transcribe",
    "productName": "TecJustiça Transcribe",
    "extraResources": [{
      "from": "python-backend/dist/server",
      "to": "python-backend",
      "filter": ["**/*"]
    }],
    "files": ["main.js", "preload.js", "renderer.js", "index.html", "styles.css"],
    "linux": {"target": ["AppImage"], "category": "AudioVideo"},
    "win": {"target": ["nsis"]}
  }
}
```

**`main.js`** — porta livre:
```javascript
function findFreePort() {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}
```

**`main.js`** — spawn condicional:
```javascript
const isDev = !app.isPackaged;
if (isDev) {
  pythonProcess = spawn('python', ['server.py', '--port', String(port)], {
    cwd: path.join(__dirname, 'python-backend'),
    env: { ...process.env }
  });
} else {
  const binary = path.join(process.resourcesPath, 'python-backend',
    process.platform === 'win32' ? 'server.exe' : 'server');
  pythonProcess = spawn(binary, ['--port', String(port)]);
}
```

**`main.js`** — config em `userData/config.json`:
```javascript
const configPath = path.join(app.getPath('userData'), 'config.json');

ipcMain.handle('get-config', () => {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch { return {}; }
});

ipcMain.handle('save-config', (_, config) => {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
});
```

**`preload.js`**:
```javascript
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
  saveExportFile: (name, filters) => ipcRenderer.invoke('save-export-file', name, filters),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  openFile: (path) => ipcRenderer.invoke('open-file', path),
  onBackendStatus: (cb) => ipcRenderer.on('backend-status', (_, data) => cb(data))
});
```

**CSP no `index.html`**:
```
default-src 'self'; style-src 'self' 'unsafe-inline'; connect-src http://localhost:*; media-src file: blob:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
```

**Variáveis CSS (tema VS Code)**:
```css
:root {
  --bg: #1e1e1e;
  --sidebar: #252526;
  --activitybar: #333333;
  --titlebar: #323233;
  --statusbar: #007acc;
  --border: #3c3c3c;
  --text: #cccccc;
  --text-dim: #858585;
  --accent: #0e639c;
  --success: #4ec9b0;
  --error: #f44747;
  --warning: #cca700;
}
```

**`.gitignore`** adições:
```
.env
dist/
node_modules/
python-backend/venv/
python-backend/__pycache__/
python-backend/dist/
python-backend/build/
*.pyc
```

---

## Fase 3: Diagnóstico do Sistema (Página 4)

Página que verifica todos os pré-requisitos do sistema em uma tabela com status visual.

### Tarefas

- [x] Adicionar endpoint `GET /diagnostics` no `server.py`
- [x] Implementar página de diagnóstico no `renderer.js`
- [x] Estilizar tabela de verificações com ícones ✅/❌

### Detalhes Técnicos

**`GET /diagnostics`** — retorna array de 6 verificações:
```json
[
  {"name": "Python", "ok": true, "detail": "3.12.0"},
  {"name": "Driver NVIDIA", "ok": true, "detail": "550.0"},
  {"name": "CUDA", "ok": true, "detail": "12.1"},
  {"name": "GPU/VRAM", "ok": true, "detail": "RTX 3060 (12.0 GB)"},
  {"name": "ffmpeg", "ok": true, "detail": "6.1.1"},
  {"name": "Token HuggingFace", "ok": false, "detail": "Não configurado"}
]
```

Verificação de VRAM mínima: ≥ 6 GB para `ok: true`. Abaixo disso, `ok: true` mas com aviso no `detail`.

---

## Fase 4: Gerenciamento de Modelos (Página 2)

Listar, baixar e deletar modelos WhisperX. Download com progresso em tempo real via SSE.

### Tarefas

- [x] Criar `python-backend/model_manager.py` — catálogo, download, delete [complexo]
  - [x] Catálogo de modelos com repos HuggingFace
  - [x] Verificar modelos baixados no cache `~/.cache/huggingface/hub/`
  - [x] Download via `huggingface_hub.snapshot_download()`
  - [x] Delete via `shutil.rmtree()`
- [x] Adicionar endpoints no `server.py`: GET /models, GET /models/download (SSE), DELETE /models/{name}
- [x] Implementar página de modelos no `renderer.js` — cards com status, download, delete
- [x] Implementar SSE no renderer para progresso de download (EventSource)

### Detalhes Técnicos

**Catálogo de modelos**:
| Nome | Repo HuggingFace | Tamanho | VRAM recomendada |
|------|-----------------|---------|------------------|
| tiny | `Systran/faster-whisper-tiny` | ~150 MB | ~1 GB |
| small | `Systran/faster-whisper-small` | ~500 MB | ~2 GB |
| medium | `Systran/faster-whisper-medium` | ~1.5 GB | ~5 GB |
| large-v2 | `Systran/faster-whisper-large-v2` | ~3.1 GB | ~10 GB |

**Cache path**: `~/.cache/huggingface/hub/models--Systran--faster-whisper-{name}/`

**SSE endpoint** `GET /models/download?model=large-v2`:
```python
from fastapi.responses import StreamingResponse

@app.get("/models/download")
async def download_model(model: str):
    async def event_stream():
        # huggingface_hub.snapshot_download com callback
        yield f"data: {json.dumps({'event': 'progress', 'percent': 0})}\n\n"
        # ... download ...
        yield f"data: {json.dumps({'event': 'complete'})}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

**SSE no renderer**:
```javascript
const evtSource = new EventSource(`${backendUrl}/models/download?model=${name}`);
evtSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.event === 'progress') updateProgressBar(data.percent);
  if (data.event === 'complete') { evtSource.close(); refreshModels(); }
  if (data.event === 'error') { evtSource.close(); showError(data.message); }
};
```

**Modelos de diarização** (implícitos — baixados automaticamente pelo pyannote):
- `pyannote/speaker-diarization-3.1` — requer aceitar termos no HuggingFace
- `pyannote/segmentation-3.0`
- Ficam em `~/.cache/huggingface/hub/`

---

## Fase 5: Transcrição — Core Feature (Página 1)

Pipeline WhisperX completo com 6 etapas, progresso SSE, limpeza progressiva de VRAM e player de mídia sincronizado com transcrição clicável.

### Tarefas

- [x] Criar `python-backend/transcriber.py` — pipeline WhisperX com limpeza progressiva de VRAM [complexo]
  - [x] 6 etapas com callback de progresso
  - [x] Limpeza progressiva: `del modelo` + `gc.collect()` + `torch.cuda.empty_cache()` após cada etapa
  - [x] `try/finally` em cada etapa para garantir limpeza mesmo em erro
  - [x] Auto batch_size baseado na VRAM
  - [x] Compute type: GPU → float16, CPU → int8
  - [x] Geração de 3 formatos de saída: .txt, .srt, .json
- [x] Adicionar endpoints no `server.py`: POST /transcribe, GET /transcribe/progress (SSE)
- [x] Implementar UI de transcrição no `renderer.js` [complexo]
  - [x] Seleção de arquivo, modelo, idioma
  - [x] Checkbox diarização (desabilitada sem HF token)
  - [x] Barra de progresso com 6 etapas visuais
  - [x] Área de resultado com timestamps e falantes
- [x] Implementar player de mídia sincronizado [complexo]
  - [x] `<video>` para vídeos, `<audio>` para áudio puro
  - [x] Transcrição clicável: segmento → `player.currentTime = segment.start`
  - [x] Highlight do segmento ativo via `timeupdate` (throttled 0.5s)

### Detalhes Técnicos

**Pipeline com limpeza progressiva de VRAM** (padrão recomendado do WhisperX):
```python
import gc
import torch

def executar_pipeline(audio_path, model_name, language, diarize, hf_token, output_dir, on_progress):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"
    batch_size = _obter_batch_size(device)

    # Etapa 1: Carregar modelo (10%)
    on_progress("modelo", "Carregando modelo...")
    model = whisperx.load_model(model_name, device, compute_type=compute_type, language=language)

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
        diarize_model = whisperx.DiarizationPipeline(use_auth_token=hf_token, device=device)
        try:
            diarize_segments = diarize_model(audio_path)
            result = whisperx.assign_word_speakers(diarize_segments, result)
        finally:
            del diarize_model
            gc.collect()
            if device == "cuda":
                torch.cuda.empty_cache()

    # Etapa 6: Salvar (100%)
    on_progress("salvando", "Gerando arquivos de saída...")
    files = _salvar_resultados(result, audio_path, output_dir)

    return {"segments": result["segments"], "language": result.get("language"), "files": files}
```

**Auto batch_size**:
```python
def _obter_batch_size(device: str) -> int:
    if device != "cuda":
        return 4
    vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    if vram_gb >= 10: return 16
    if vram_gb >= 6: return 8
    return 4
```

**Formatos de saída**:
- `.txt`: `[SPEAKER_00] Texto do segmento aqui.`
- `.srt`: `1\n00:00:00,500 --> 00:00:03,200\n[SPEAKER_00] Texto aqui.\n`
- `.json`: `{"segments": [{"start": 0.5, "end": 3.2, "text": "...", "speaker": "SPEAKER_00", "words": [...]}]}`

**POST /transcribe**:
```json
// Request
{"audio_path": "/path/to/audio.mp4", "model": "large-v2", "language": "auto", "diarize": true, "output_dir": "./transcricoes"}
// Response imediata
{"task_id": "uuid-xxx"}
```

**GET /transcribe/progress?task_id=xxx** (SSE):
```
data: {"stage": "modelo", "percent": 10, "message": "Carregando modelo..."}
data: {"stage": "transcricao", "percent": 50, "message": "Transcrevendo (batch_size=16)..."}
data: {"stage": "complete", "percent": 100, "result": {"segments": [...], "files": {...}}}
```

Background thread com `ThreadPoolExecutor(max_workers=1)` — apenas 1 transcrição por vez.

**Player de mídia — extensões de vídeo vs áudio**:
```javascript
const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];
const ext = filePath.split('.').pop().toLowerCase();
const isVideo = videoExtensions.includes('.' + ext);
// Criar <video> ou <audio> conforme o tipo
```

**Sincronização transcrição → player**:
```javascript
// Clicar num segmento
segmentEl.addEventListener('click', () => {
  player.currentTime = segment.start;
  player.play();
});

// Highlight do segmento ativo (throttled 0.5s)
let lastUpdate = 0;
player.addEventListener('timeupdate', () => {
  const now = Date.now();
  if (now - lastUpdate < 500) return;
  lastUpdate = now;
  const currentTime = player.currentTime;
  // Encontrar segmento ativo e aplicar classe .active
});
```

---

## Fase 6: Configurações (Página 3)

Página para configurar token HuggingFace, pasta de saída, device e batch_size. Persistência em `userData/config.json`.

### Tarefas

- [x] Implementar página de configurações no `renderer.js`
- [x] Campo token HF (password com toggle visibilidade)
- [x] Seletor de pasta de saída (diálogo nativo)
- [x] Dropdown device: Auto / CUDA / CPU
- [x] Input batch_size: 0 (auto) ou 1-32
- [x] Links para obter token e aceitar termos do pyannote no HuggingFace

### Detalhes Técnicos

**Estrutura do config.json** (`userData/config.json`):
```json
{
  "hf_token": "hf_...",
  "output_dir": "./transcricoes",
  "device": "auto",
  "batch_size": 0
}
```

**Paths no Windows vs Linux**:
- Windows: `%APPDATA%/tecjustica-transcribe/config.json` (Electron `app.getPath('userData')`)
- Linux: `~/.config/tecjustica-transcribe/config.json`

**IPC para selecionar pasta** (adicionar em `main.js`):
```javascript
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});
```

---

## Fase 7: Exportação

Botões de exportação após transcrição. Backend já gera os arquivos na Fase 5 — esta fase é apenas UI.

### Tarefas

- [x] Adicionar botões de exportação na área de resultado: Abrir TXT, Abrir SRT, Abrir JSON, Copiar texto
- [x] Implementar IPC `open-file` no `main.js` via `shell.openPath()`
- [x] Implementar "Salvar como..." com `saveExportFile` para copiar arquivo para outro local
- [x] Implementar "Copiar texto" via `navigator.clipboard.writeText()`

### Detalhes Técnicos

**IPC `open-file`** em `main.js`:
```javascript
const { shell } = require('electron');
ipcMain.handle('open-file', (_, filePath) => shell.openPath(filePath));
```

**IPC `save-export-file`** em `main.js`:
```javascript
ipcMain.handle('save-export-file', async (_, defaultName, filters) => {
  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: filters // ex: [{name: 'Texto', extensions: ['txt']}]
  });
  return result.canceled ? null : result.filePath;
});
```

---

## Fase 8: Build e Empacotamento

Gerar instaladores .AppImage (Linux) e .exe (Windows) com Python, CUDA e ffmpeg embutidos.

### Tarefas

- [x] Criar `python-backend/server.spec` — config PyInstaller [complexo]
  - [x] Hidden imports: whisperx, faster_whisper, ctranslate2, pyannote.audio, torch, torchaudio
  - [x] Incluir CUDA runtime libs do torch
  - [ ] Incluir ffmpeg binário estático
- [x] Criar scripts de build: `build_backend.sh` (Linux), `build_backend.bat` (Windows)
- [x] Configurar `extraResources` no `package.json` para incluir binário PyInstaller
- [ ] Testar build Linux: `npm run build:python && npm run dist:linux`
- [ ] Testar build Windows: `npm run dist:win`

### Detalhes Técnicos

**PyInstaller** — output em diretório (não single-file):
```bash
pyinstaller --noconfirm \
  --name server \
  --hidden-import=whisperx \
  --hidden-import=faster_whisper \
  --hidden-import=ctranslate2 \
  --hidden-import=pyannote.audio \
  --collect-all torch \
  --collect-all torchaudio \
  server.py
```

**Resolução de caminho** em `main.js`:
```javascript
const isDev = !app.isPackaged;
if (isDev) {
  spawn('python', ['server.py', '--port', port], {cwd: 'python-backend/'});
} else {
  const binary = path.join(process.resourcesPath, 'python-backend',
    process.platform === 'win32' ? 'server.exe' : 'server');
  spawn(binary, ['--port', port]);
}
```

**ffmpeg no Windows**: baixar build estático de https://www.gyan.dev/ffmpeg/builds/ e incluir no pacote PyInstaller.

**Tamanho estimado do instalador**: ~3-4 GB comprimido (PyTorch+CUDA = ~2.5 GB, whisperx+deps = ~500 MB, ffmpeg = ~80 MB, Electron = ~200 MB).

---

## Fase 9: Polish e Error Handling

UX robusta com tratamento de erros, auto-restart do backend e splash screen.

### Tarefas

- [x] Implementar splash screen durante startup do backend
- [x] Auto-restart do backend em caso de crash (max 3 tentativas)
- [x] Banner warning permanente quando rodando em CPU
- [x] Desabilitar transcrição quando não há modelos baixados
- [x] Desabilitar diarização quando HF_TOKEN não configurado
- [x] Validar extensão de arquivo antes de enviar ao backend
- [ ] Tratamento de OOM: mensagem amigável sugerindo modelo menor ou batch_size menor
- [x] Log de stdout/stderr do Python em `userData/logs/backend.log`
- [x] Atualizar `CLAUDE.md` com documentação do novo projeto

### Detalhes Técnicos

**Auto-restart**:
```javascript
let restartCount = 0;
const MAX_RESTARTS = 3;

pythonProcess.on('exit', (code) => {
  if (code !== 0 && restartCount < MAX_RESTARTS) {
    restartCount++;
    startBackend(); // re-spawn
  } else if (code !== 0) {
    dialog.showErrorBox('Erro Fatal', 'O backend falhou ao iniciar após 3 tentativas.');
  }
});
```

**Logs** em `userData/logs/backend.log`:
```javascript
const logPath = path.join(app.getPath('userData'), 'logs', 'backend.log');
fs.mkdirSync(path.dirname(logPath), { recursive: true });
const logStream = fs.createWriteStream(logPath, { flags: 'a' });
pythonProcess.stdout.pipe(logStream);
pythonProcess.stderr.pipe(logStream);
```

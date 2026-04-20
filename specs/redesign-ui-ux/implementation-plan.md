# Plano de Implementacao: Redesign UI/UX do TecJustica Transcribe

## Visao Geral

Redesign completo da interface do app Electron em 10 fases. Cada fase produz um resultado testavel. A arquitetura permanece vanilla (HTML/CSS/JS), mas o renderer.js monolitico sera modularizado em ~12 modulos ES. SQLite via `better-sqlite3` para persistencia do historico.

**Arquivos criticos atuais:**
- `main.js` (~400 linhas) — main process, IPC, backend management
- `preload.js` (22 linhas) — bridge IPC
- `renderer.js` (766 linhas) — toda logica frontend
- `index.html` (268 linhas) — HTML completo
- `styles.css` (718 linhas) — tema VS Code dark

---

## Fase 1: SQLite + novos IPC handlers

Adicionar persistencia de historico de transcricoes com SQLite no main process.

### Tarefas

- [x] Instalar `better-sqlite3` e `@electron/rebuild` [complexo]
  - [x] `npm install better-sqlite3`
  - [x] `npm install --save-dev @electron/rebuild`
  - [x] Adicionar script `"postinstall": "electron-rebuild -f -w better-sqlite3"` ao package.json
  - [x] Executar rebuild e verificar que compila sem erro
- [x] Criar logica SQLite no `main.js`
  - [x] Importar `better-sqlite3`
  - [x] Criar/abrir `transcriptions.db` em `app.getPath('userData')`
  - [x] Executar CREATE TABLE IF NOT EXISTS na inicializacao
- [x] Criar IPC handlers CRUD no `main.js`
  - [x] `db-save-transcription` — INSERT OR REPLACE
  - [x] `db-get-transcriptions` — SELECT * ORDER BY created_at DESC
  - [x] `db-get-transcription` — SELECT por id
  - [x] `db-delete-transcription` — DELETE por id
  - [x] `db-update-segments` — UPDATE segments_json e marcar edited=1
  - [x] `db-search-transcriptions` — SELECT com LIKE no filename
- [x] Criar IPC handler `re-export` no `main.js`
  - [x] Ler segments_json do banco
  - [x] Gerar .txt (concatenar textos com newlines)
  - [x] Gerar .srt (indice, timestamps HH:MM:SS,mmm, texto)
  - [x] Sobrescrever arquivos, atualizar files_json no banco
- [x] Expor novos metodos no `preload.js`
  - [x] `saveTranscription(data)`, `getTranscriptions()`, `getTranscription(id)`
  - [x] `deleteTranscription(id)`, `updateSegments(id, segments)`
  - [x] `searchTranscriptions(query)`, `reExport(id)`
  - [x] `getFilePath(file)` via `webUtils.getPathForFile()`

### Detalhes Tecnicos

**Schema SQLite:**
```sql
CREATE TABLE IF NOT EXISTS transcriptions (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  model TEXT NOT NULL,
  language TEXT NOT NULL,
  diarize INTEGER DEFAULT 0,
  duration_seconds REAL,
  status TEXT NOT NULL DEFAULT 'running',
  error_message TEXT,
  segments_json TEXT,
  files_json TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  edited INTEGER DEFAULT 0
);
```

**Preload — novos metodos:**
```javascript
const { webUtils } = require('electron');

// Dentro do contextBridge.exposeInMainWorld:
saveTranscription: (data) => ipcRenderer.invoke('db-save-transcription', data),
getTranscriptions: () => ipcRenderer.invoke('db-get-transcriptions'),
getTranscription: (id) => ipcRenderer.invoke('db-get-transcription', id),
deleteTranscription: (id) => ipcRenderer.invoke('db-delete-transcription', id),
updateSegments: (id, segments) => ipcRenderer.invoke('db-update-segments', id, segments),
searchTranscriptions: (query) => ipcRenderer.invoke('db-search-transcriptions', query),
reExport: (id) => ipcRenderer.invoke('re-export', id),
getFilePath: (file) => webUtils.getPathForFile(file),
```

**Formatacao SRT em JS (para re-export):**
```javascript
function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

function generateSrt(segments) {
  return segments.map((seg, i) =>
    `${i+1}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${seg.text.trim()}\n`
  ).join('\n');
}

function generateTxt(segments) {
  return segments.map(seg => seg.text.trim()).join('\n');
}
```

**Geracao de UUID no main process:**
```javascript
const crypto = require('crypto');
const id = crypto.randomUUID();
```

**package.json — mudancas:**
```json
"dependencies": {
  "better-sqlite3": "^11.0.0"
},
"devDependencies": {
  "electron": "^41.0.3",
  "electron-builder": "^26.8.1",
  "@electron/rebuild": "^3.7.0"
},
"scripts": {
  "start": "electron .",
  "postinstall": "electron-rebuild -f -w better-sqlite3",
  ...
}
```

**Verificacao:** No DevTools do Electron, executar `await window.api.getTranscriptions()` deve retornar `[]`. Salvar e buscar deve funcionar. Reiniciar app, dados persistem.

---

## Fase 2: Modularizacao do renderer

Dividir renderer.js monolitico em modulos ES sem alterar funcionalidade.

### Tarefas

- [x] Criar diretorio `renderer/`
- [x] Criar `renderer/state.js` — pub/sub minimo [complexo]
  - [x] Propriedades: `backendUrl`, `currentPage`, `currentTranscription`, `isTranscribing`, `sidebarCollapsed`
  - [x] Metodos: `set(key, value)`, `get(key)`, `on(key, callback)`, `off(key, callback)`
- [x] Criar `renderer/utils.js` — helpers compartilhados
- [x] Migrar logica de navegacao para `renderer/navigation.js`
- [x] Migrar logica de modelos para `renderer/models.js`
- [x] Migrar logica de configuracoes para `renderer/settings.js`
- [x] Migrar logica de diagnostico para `renderer/diagnostics.js`
- [x] Migrar logica de transcricao + progresso para `renderer/transcription.js`
- [x] Migrar logica de resultado + exportacao para `renderer/results.js`
- [x] Migrar logica do player para `renderer/player.js`
- [x] Criar `renderer/toast.js` — sistema de notificacoes (vazio por ora)
- [x] Criar `renderer/dragdrop.js` — logica drag & drop (vazio por ora)
- [x] Criar `renderer/history.js` — lista de historico (vazio por ora)
- [x] Criar `renderer/main.js` — ponto de entrada, init, backend status, status bar
- [x] Atualizar `index.html`: trocar `<script src="renderer.js">` por `<script type="module" src="renderer/main.js">`
- [x] Atualizar `package.json` build.files: adicionar `"renderer/**"`

### Detalhes Tecnicos

**Estrutura de modulos:**
```
renderer/
  main.js           — ponto de entrada, init, backend status, status bar
  state.js           — pub/sub: get/set/on/off
  navigation.js      — sidebar clicks, navigateTo(), page switching
  transcription.js   — formulario, POST /transcribe, SSE progress
  history.js         — lista historico, empty state, CRUD via IPC
  results.js         — segmentos, exportacao, busca, edicao
  player.js          — audio/video player sincronizado
  models.js          — grid modelos, download/delete SSE
  settings.js        — form config, save/load
  diagnostics.js     — tabela diagnostico, refresh
  toast.js           — notificacoes toast/snackbar
  dragdrop.js        — drag & drop de arquivos
  utils.js           — formatTime, debounce, helpers
```

**state.js — mini pub/sub:**
```javascript
const state = {};
const listeners = {};

export function get(key) { return state[key]; }

export function set(key, value) {
  state[key] = value;
  (listeners[key] || []).forEach(cb => cb(value));
}

export function on(key, callback) {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);
}

export function off(key, callback) {
  if (!listeners[key]) return;
  listeners[key] = listeners[key].filter(cb => cb !== callback);
}
```

**index.html — script tag:**
```html
<script type="module" src="renderer/main.js"></script>
```

**package.json build.files:**
```json
"files": [
  "main.js",
  "preload.js",
  "renderer/**",
  "index.html",
  "styles.css"
]
```

**CSP:** `<script type="module">` com `src` local funciona com `default-src 'self'` sem `unsafe-eval`.

**Verificacao:** Todas as 4 paginas funcionam identicamente. Setup flow, splash, backend connection OK. Nenhuma regressao.

---

## Fase 3: Sidebar colapsavel

Transformar activity bar fixa de 48px em sidebar colapsavel com dois modos.

### Tarefas

- [x] Adicionar `<span class="sidebar-label">` com texto em cada botao da sidebar no `index.html`
- [x] Adicionar botao toggle no rodape da sidebar com icone chevron
- [x] CSS: sidebar expandida (200px) com flex-direction row nos botoes
- [x] CSS: sidebar colapsada (48px) com labels ocultos (opacity 0, width 0)
- [x] CSS: `transition: width 0.2s ease` na sidebar + transicao nos labels
- [x] CSS: chevron rotaciona 180deg quando colapsado
- [x] JS (`navigation.js`): ler `sidebar_collapsed` do config na init
- [x] JS: toggle alterna classe `.collapsed`, salva no config

### Detalhes Tecnicos

**HTML — sidebar com labels:**
```html
<div id="activity-bar">
  <button class="activity-btn active" data-page="transcription" title="Transcricao">
    <svg><!-- icone microfone existente --></svg>
    <span class="sidebar-label">Transcricao</span>
  </button>
  <button class="activity-btn" data-page="models" title="Modelos">
    <svg><!-- icone cubo existente --></svg>
    <span class="sidebar-label">Modelos</span>
  </button>
  <button class="activity-btn" data-page="settings" title="Configuracoes">
    <svg><!-- icone engrenagem existente --></svg>
    <span class="sidebar-label">Configuracoes</span>
  </button>
  <button class="activity-btn" data-page="diagnostics" title="Diagnostico">
    <svg><!-- icone monitor existente --></svg>
    <span class="sidebar-label">Diagnostico</span>
  </button>
  <div class="sidebar-spacer"></div>
  <button id="sidebar-toggle" class="sidebar-toggle-btn" title="Recolher barra lateral">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  </button>
</div>
```

**CSS — sidebar colapsavel:**
```css
#activity-bar {
  width: 200px;
  min-width: 200px;
  transition: width 0.2s ease, min-width 0.2s ease;
  display: flex;
  flex-direction: column;
}

#activity-bar.collapsed {
  width: 48px;
  min-width: 48px;
}

.activity-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  justify-content: flex-start;
  width: 100%;
  height: auto;
}

.sidebar-label {
  white-space: nowrap;
  overflow: hidden;
  opacity: 1;
  transition: opacity 0.15s ease;
  font-size: 13px;
}

#activity-bar.collapsed .sidebar-label {
  opacity: 0;
  width: 0;
  margin: 0;
  padding: 0;
}

#activity-bar.collapsed .activity-btn {
  justify-content: center;
  padding: 10px 0;
}

.sidebar-spacer {
  flex: 1;
}

.sidebar-toggle-btn svg {
  transition: transform 0.2s ease;
}

#activity-bar.collapsed .sidebar-toggle-btn svg {
  transform: rotate(180deg);
}
```

**Config — novo campo:**
```json
{
  "hf_token": "...",
  "output_dir": "...",
  "sidebar_collapsed": false
}
```

**Verificacao:** Click no toggle anima sidebar. Labels aparecem/somem. Reiniciar app manteve estado.

---

## Fase 4: Tela inicial com historico de transcricoes [complexo]

Reestruturar pagina de Transcricao com 3 sub-views: historico, formulario, resultado.

### Tarefas

- [x] Reestruturar HTML de `#page-transcription` em 3 sub-views [complexo]
  - [x] `#view-history` — header com titulo + botao + lista/empty state
  - [x] `#view-form` — botao voltar + controles atuais (select file, model, language, diarize, transcribe) + warnings + progresso
  - [x] `#view-result` — botao voltar + player + segmentos + exportacao
- [x] Implementar `history.js` [complexo]
  - [x] `loadHistory()` — busca do SQLite, renderiza cards
  - [x] Renderizar empty state quando lista vazia
  - [x] Click em item: carrega transcricao, popula resultado, mostra view-result
  - [x] Botao delete: confirma e remove do banco
  - [x] Atualizar lista quando transcricao completa (via state.on)
- [x] Atualizar `transcription.js` para salvar no SQLite
  - [x] Ao iniciar: salvar com `status: 'running'`
  - [x] Ao completar: atualizar `status: 'complete'`, `segments_json`, `files_json`
  - [x] Ao errar: atualizar `status: 'error'`, `error_message`
- [x] Implementar navegacao entre sub-views
  - [x] "Nova transcricao" → view-form
  - [x] "Voltar" → view-history
  - [x] Conclusao → view-history (novo item no topo)
  - [x] Click em item do historico → view-result
- [x] CSS para historico: cards, badges de status, empty state, botao back

### Detalhes Tecnicos

**HTML — sub-views:**
```html
<div id="page-transcription" class="page">
  <!-- Sub-view 1: Historico -->
  <div id="view-history">
    <div class="view-header">
      <h2>Transcricoes</h2>
      <button id="btn-new-transcription" class="btn-primary">+ Nova transcricao</button>
    </div>
    <div id="history-empty" class="empty-state hidden">
      <svg width="64" height="64"><!-- icone microfone grande --></svg>
      <h3>Nenhuma transcricao ainda</h3>
      <p>Selecione um arquivo de audio ou video para comecar</p>
      <button class="btn-primary empty-state-btn">Criar primeira transcricao</button>
      <p class="empty-hint">ou arraste um arquivo para ca</p>
    </div>
    <div id="history-list" class="history-list hidden"></div>
  </div>

  <!-- Sub-view 2: Formulario -->
  <div id="view-form" class="hidden">
    <button id="btn-back-to-history" class="btn-back">
      <svg width="16" height="16"><!-- seta esquerda --></svg>
      Voltar ao historico
    </button>
    <!-- warnings + controles + progresso (movidos do HTML atual) -->
  </div>

  <!-- Sub-view 3: Resultado -->
  <div id="view-result" class="hidden">
    <button id="btn-back-from-result" class="btn-back">
      <svg width="16" height="16"><!-- seta esquerda --></svg>
      Voltar ao historico
    </button>
    <!-- player + resultado + busca (movidos do HTML atual) -->
  </div>
</div>
```

**Item do historico:**
```html
<div class="history-item" data-id="{uuid}">
  <div class="history-item-icon">
    <svg><!-- icone audio ou video baseado na extensao --></svg>
  </div>
  <div class="history-item-info">
    <span class="history-item-filename">audiencia_2024.mp4</span>
    <span class="history-item-meta">large-v2 · Portugues · 45:12 · 15/03/2026</span>
  </div>
  <div class="history-item-status">
    <span class="status-badge status-complete">Concluida</span>
  </div>
  <button class="history-item-delete" title="Excluir">
    <svg><!-- icone lixeira --></svg>
  </button>
</div>
```

**Status badges:**
```css
.status-complete { color: var(--success); background: rgba(78, 201, 176, 0.1); }
.status-error { color: var(--error); background: rgba(244, 71, 71, 0.1); }
.status-running { color: #569cd6; background: rgba(86, 156, 214, 0.1); animation: pulse 1.5s infinite; }
```

**Verificacao:** App abre com empty state. "Nova transcricao" abre formulario. Transcrever salva no historico. Click no item mostra resultado. Reiniciar app, historico persiste.

---

## Fase 5: Drag & drop

Arrastar arquivo de audio/video para a pagina abre formulario com arquivo pre-selecionado.

### Tarefas

- [x] Adicionar overlay de drop no HTML (`#drop-overlay`)
- [x] Implementar `dragdrop.js` com listeners em `#page-transcription`
- [x] Validar extensao do arquivo (mp3, wav, m4a, flac, ogg, mp4, mkv, avi, mov, webm)
- [x] Usar `window.api.getFilePath(file)` para obter path real (contextIsolation)
- [x] Drop valido: popular selectedFilePath, navegar para view-form
- [x] CSS: overlay com border dashed animada e fundo semi-transparente

### Detalhes Tecnicos

**HTML:**
```html
<div id="drop-overlay" class="drop-overlay hidden">
  <div class="drop-overlay-content">
    <svg width="48" height="48"><!-- icone upload --></svg>
    <p>Solte o arquivo aqui para transcrever</p>
  </div>
</div>
```

**dragdrop.js — logica principal:**
```javascript
const VALID_EXTENSIONS = ['.mp3','.wav','.m4a','.flac','.ogg','.mp4','.mkv','.avi','.mov','.webm'];

export function initDragDrop(onFileDrop) {
  const page = document.getElementById('page-transcription');
  const overlay = document.getElementById('drop-overlay');
  let dragCounter = 0;

  page.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    overlay.classList.remove('hidden');
  });

  page.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) overlay.classList.add('hidden');
  });

  page.addEventListener('dragover', (e) => e.preventDefault());

  page.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    overlay.classList.add('hidden');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!VALID_EXTENSIONS.includes(ext)) return;
    const filePath = window.api.getFilePath(file);
    onFileDrop(filePath, file.name);
  });
}
```

**CSS:**
```css
.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(14, 99, 156, 0.15);
  border: 2px dashed var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: border-pulse 1.5s ease infinite;
}
```

**`#page-transcription`** precisa de `position: relative` para o overlay absoluto funcionar.

**Verificacao:** Arrastar .mp4 sobre a pagina mostra overlay. Soltar abre formulario com arquivo. Arrastar .txt nao faz nada.

---

## Fase 6: Progresso completo + background processing [complexo]

Feedback detalhado com ETA + transcricao continua ao navegar.

### Tarefas

- [x] Adicionar estado de transcricao ao `state.js` [complexo]
  - [x] `isTranscribing`, `currentTaskId`, `transcriptionProgress`
  - [x] `transcriptionStartedAt` para calculo de ETA
- [x] Desacoplar SSE listener do DOM em `transcription.js`
  - [x] SSE roda no modulo, nao depende da pagina estar visivel
  - [x] Atualiza state.js a cada evento
- [x] Calcular ETA: `elapsed / (percent/100) - elapsed`
- [x] Reestruturar HTML do progresso com info extra (etapa X/Y, %, ETA, descricao)
- [x] Indicador na sidebar (`navigation.js`)
  - [x] Quando `isTranscribing`: dot pulsante azul no icone de Transcricao
  - [x] Reage via `state.on('isTranscribing', ...)`
- [x] Indicador na status bar
  - [x] Quando transcrevendo: "Transcrevendo: 47% - Etapa 3/6"
  - [x] Click navega para pagina de transcricao
- [x] Implementar `toast.js`
  - [x] Container fixo no canto inferior direito
  - [x] Toast: mensagem + botao acao + auto-dismiss 8s
  - [x] Slide-in animation
  - [x] Ao completar transcricao: "Transcricao concluida: {filename}" + "Ver resultado"

### Detalhes Tecnicos

**HTML — progresso melhorado:**
```html
<div class="progress-enhanced">
  <div class="progress-stages">
    <div class="stage" data-stage="modelo">Modelo</div>
    <div class="stage" data-stage="audio">Audio</div>
    <div class="stage" data-stage="transcricao">Transcricao</div>
    <div class="stage" data-stage="alinhamento">Alinhamento</div>
    <div class="stage" data-stage="diarizacao">Diarizacao</div>
    <div class="stage" data-stage="salvando">Salvando</div>
  </div>
  <div class="progress-info">
    <span class="progress-step">Etapa 3/6</span>
    <span class="progress-percent">47%</span>
    <span class="progress-eta">~2 min restantes</span>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" style="width: 47%"></div>
  </div>
  <p class="progress-description">Processando segmentos de audio...</p>
</div>
```

**Calculo de ETA:**
```javascript
function calculateEta(startedAt, percent) {
  if (percent <= 0) return null;
  const elapsed = (Date.now() - startedAt) / 1000;
  const total = elapsed / (percent / 100);
  const remaining = total - elapsed;
  if (remaining < 60) return `~${Math.ceil(remaining)}s restantes`;
  return `~${Math.ceil(remaining / 60)} min restantes`;
}
```

**Dot pulsante na sidebar:**
```css
.activity-btn[data-page="transcription"].transcribing::after {
  content: '';
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #569cd6;
  animation: pulse 1.5s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}
```

**Toast HTML:**
```html
<div id="toast-container"></div>
```

**toast.js:**
```javascript
export function showToast(message, action = null, duration = 8000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast toast-enter';
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    ${action ? `<button class="toast-action">${action.label}</button>` : ''}
    <button class="toast-close">&times;</button>
  `;
  // event listeners para action e close
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-exit'), duration);
  setTimeout(() => toast.remove(), duration + 300);
}
```

**Verificacao:** Iniciar transcricao, navegar para Modelos. Sidebar mostra dot, status bar mostra %. Ao completar: toast aparece. "Ver resultado" abre o resultado.

---

## Fase 7: Busca na transcricao

Campo de busca nos resultados com highlight e navegacao.

### Tarefas

- [x] Adicionar search bar no HTML do view-result (acima dos segmentos)
- [x] Implementar busca com debounce 300ms em `results.js`
- [x] Highlight: inserir `<mark>` no DOM sem alterar dados
- [x] Contador "3/12" com posicao atual / total
- [x] Botoes prev/next com `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- [x] Atalho Ctrl+F para focar no campo de busca
- [x] Botao limpar: remove highlights, reseta contador

### Detalhes Tecnicos

**HTML:**
```html
<div class="search-bar">
  <svg width="16" height="16"><!-- icone lupa --></svg>
  <input type="text" id="search-input" class="text-input" placeholder="Buscar na transcricao...">
  <span id="search-count" class="search-count">0/0</span>
  <button id="search-prev" class="btn-icon" title="Anterior (Shift+Enter)">
    <svg width="12" height="12"><!-- chevron up --></svg>
  </button>
  <button id="search-next" class="btn-icon" title="Proximo (Enter)">
    <svg width="12" height="12"><!-- chevron down --></svg>
  </button>
  <button id="search-clear" class="btn-icon" title="Limpar (Esc)">
    <svg width="12" height="12"><!-- X --></svg>
  </button>
</div>
```

**Logica de busca:**
```javascript
function highlightMatches(query) {
  const segments = document.querySelectorAll('.segment-text');
  let matches = [];
  segments.forEach(seg => {
    const original = seg.dataset.originalText || seg.textContent;
    seg.dataset.originalText = original;
    if (!query) { seg.textContent = original; return; }
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    seg.innerHTML = original.replace(regex, '<mark class="search-highlight">$1</mark>');
    seg.querySelectorAll('mark').forEach(m => matches.push(m));
  });
  return matches;
}
```

**CSS:**
```css
.search-highlight { background: rgba(204, 167, 0, 0.3); border-radius: 2px; }
.search-highlight-active { background: rgba(204, 167, 0, 0.6); outline: 1px solid var(--warning); }
.search-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--sidebar); border: 1px solid var(--border); border-radius: var(--radius-md); }
.search-count { color: var(--text-dim); font-size: 12px; min-width: 40px; text-align: center; }
```

**Verificacao:** Digitar texto destaca ocorrencias. Contador funciona. Enter/Shift+Enter navega. Ctrl+F foca. Esc limpa.

---

## Fase 8: Edicao inline de segmentos

Double-click em segmento permite editar. Salva no SQLite, permite re-exportar.

### Tarefas

- [x] Double-click em `.segment-text` ativa `contenteditable="true"` em `results.js`
- [x] Blur ou Ctrl+Enter salva alteracao
- [x] Escape cancela edicao (restaura texto original)
- [x] Atualizar `transcriptionSegments[i].text` em memoria
- [x] Chamar `window.api.updateSegments(id, segments)` para persistir
- [x] Indicador visual: asterisco (*) ao lado do timestamp de segmento editado
- [x] Botao "Re-exportar" (visivel quando `edited === true`)
- [x] Click "Re-exportar" chama `window.api.reExport(id)` e mostra feedback

### Detalhes Tecnicos

**Ativacao da edicao:**
```javascript
segment.addEventListener('dblclick', () => {
  const textEl = segment.querySelector('.segment-text');
  textEl.dataset.backup = textEl.textContent;
  textEl.contentEditable = 'true';
  textEl.focus();
  // selecionar todo o texto
  const range = document.createRange();
  range.selectNodeContents(textEl);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
});
```

**Salvar edicao:**
```javascript
textEl.addEventListener('blur', () => {
  textEl.contentEditable = 'false';
  if (textEl.textContent !== textEl.dataset.backup) {
    segments[index].text = textEl.textContent;
    window.api.updateSegments(transcriptionId, segments);
    segment.classList.add('segment-edited');
    showReExportButton();
  }
});

textEl.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    textEl.textContent = textEl.dataset.backup;
    textEl.contentEditable = 'false';
  }
  if (e.key === 'Enter' && e.ctrlKey) {
    textEl.blur(); // triggers save via blur handler
  }
});
```

**CSS:**
```css
.segment-text[contenteditable="true"] {
  outline: 1px solid var(--accent);
  background: rgba(14, 99, 156, 0.1);
  padding: 2px 4px;
  border-radius: 2px;
  cursor: text;
}
.segment-edited .segment-time::after {
  content: ' *';
  color: var(--warning);
  font-size: 11px;
}
```

**Verificacao:** Double-click em segmento: borda azul, texto editavel. Blur salva, asterisco aparece. Escape cancela. Re-exportar gera novos arquivos.

---

## Fase 9: Refinamento visual

Polir o tema sem mudar identidade. Melhor espacamento, sombras, animacoes.

### Tarefas

- [x] Adicionar novas variaveis CSS (radius, shadow, transition)
- [x] Refinar cards: sombra sutil, hover com translateY(-1px), border-radius 8px
- [x] Refinar botoes: mais padding (8px 20px), sombra sutil
- [x] Page transitions: fade-in 0.15s ao trocar de pagina
- [x] Progress stages: scale bounce sutil ao ativar
- [x] Melhor espacamento geral: mais gap entre secoes
- [x] Refinar scrollbar (manter estilo fino)

### Detalhes Tecnicos

**Novas variaveis CSS:**
```css
:root {
  /* existentes mantidas */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 2px 6px rgba(0,0,0,0.3);
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
}
```

**Page transition:**
```css
.page {
  display: none;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.page.active {
  display: block;
  opacity: 1;
}
```

**Cards refinados:**
```css
.model-card, .history-item {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.model-card:hover, .history-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

**Botoes refinados:**
```css
.btn-primary {
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  transition: background var(--transition-fast), box-shadow var(--transition-fast);
}
```

**Verificacao:** Comparacao visual antes/depois. App mais polido mantendo identidade VS Code.

---

## Fase 10: Build + documentacao

Garantir build funciona com novas dependencias e atualizar docs.

### Tarefas

- [x] Atualizar `package.json` build.files para incluir `renderer/**`
- [x] Verificar que `better-sqlite3` compila para linux e win targets
- [x] Testar `npm run dist:linux` — build AppImage
- [x] Atualizar CLAUDE.md com nova estrutura, IPC channels, schema SQLite
- [x] Adicionar `*.db` ao `.gitignore`

### Detalhes Tecnicos

**package.json build.files atualizado:**
```json
"files": [
  "main.js",
  "preload.js",
  "renderer/**",
  "index.html",
  "styles.css"
]
```

**CLAUDE.md — secoes a atualizar:**
- Estrutura do frontend: `renderer/` com lista de modulos
- Novos IPC channels: `db-*`, `re-export`, `getFilePath`
- Schema SQLite: tabela `transcriptions`
- Novas funcionalidades: sidebar colapsavel, historico, drag & drop, busca, edicao inline

**Verificacao final — fluxo completo:**
1. `npm start` → app abre com empty state
2. Drag & drop arquivo → formulario abre
3. Transcrever → progresso completo com ETA
4. Navegar para Modelos → dot pulsante na sidebar, progresso na status bar
5. Toast "Concluida" → click "Ver resultado"
6. Busca no resultado → highlight + navegacao
7. Edicao inline → asterisco + re-exportar
8. Voltar ao historico → item listado
9. Reiniciar app → historico persiste
10. Toggle sidebar → colapsa/expande, estado persiste

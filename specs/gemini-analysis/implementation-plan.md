# Plano de Implementação: Análise de Transcrições com Gemini API

## Visão Geral

Adicionar análise inteligente de transcrições via Gemini API ao TecJustiça Transcribe. Inclui: campo de API key nas configurações, chamada ao Gemini com structured outputs no main process, persistência em `analyses.json`, módulo de UI para análise com tópicos clicáveis integrados ao player, e bug fix no re-export de JSON.

---

## Fase 1: Bug Fix — Re-export sem JSON

Corrigir o handler `re-export` que gera apenas `.txt` e `.srt` mas ignora `.json`.

### Tarefas

- [x] Adicionar geração de `.json` no handler `re-export` em `main.js`
- [x] Incluir path do JSON no objeto `newFiles` retornado

### Detalhes Técnicos

**Arquivo:** `main.js` linhas 373-397

Adicionar após a geração de SRT (linha 390):
```js
const jsonPath = path.join(basePath, `${baseName}.json`);
fs.writeFileSync(jsonPath, JSON.stringify(segments, null, 2), 'utf8');
const newFiles = { txt: txtPath, srt: srtPath, json: jsonPath };
```

O formato JSON segue o mesmo padrão do backend Python (`transcriber.py:save_result`): array de segmentos com `start`, `end`, `text`, `speaker`.

---

## Fase 2: Configurações — Gemini API Key

Adicionar campo de API key do Gemini nas configurações do app.

### Tarefas

- [x] Adicionar bloco HTML do campo Gemini API Key em `index.html` (seção `page-settings`)
- [x] Adicionar load/save do campo `gemini_api_key` em `renderer/settings.js`
- [x] Adicionar listener de toggle mostrar/ocultar da key em `renderer/settings.js`

### Detalhes Técnicos

**`index.html`** — Inserir novo `setting-group` após o bloco de Batch Size (~linha 428), antes do botão Salvar:

```html
<!-- Gemini API Key -->
<div class="setting-group bento-setting-group">
  <label for="setting-gemini-api-key" class="bento-setting-label">Google Gemini API Key</label>
  <div class="input-with-toggle" style="position:relative;">
    <input type="password" id="setting-gemini-api-key" class="text-input bento-setting-input" placeholder="AIza...">
    <button id="btn-toggle-gemini-key" class="btn-icon" title="Mostrar/ocultar key" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); border:none;">
      <span class="material-symbols-outlined" style="font-size:18px">visibility</span>
    </button>
  </div>
  <p class="setting-help bento-setting-help">
    Obtenha gratuitamente em <a id="link-gemini-key" href="#" class="setting-link">aistudio.google.com/apikey</a>.
    Necessário para análise de transcrições com IA. Requer conexão com internet.
  </p>
</div>
```

**`renderer/settings.js`** — Em `loadSettings()` adicionar:
```js
const geminiEl = document.getElementById('setting-gemini-api-key');
if (geminiEl) geminiEl.value = config.gemini_api_key || '';
```

No save handler, adicionar ao objeto config:
```js
gemini_api_key: document.getElementById('setting-gemini-api-key')?.value || '',
```

Em `initSettings()`, adicionar toggle listener (mesmo padrão do HF token):
```js
document.getElementById('btn-toggle-gemini-key')?.addEventListener('click', () => {
  const input = document.getElementById('setting-gemini-api-key');
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
});
```

E adicionar link externo:
```js
// No array de links existente, adicionar:
'link-gemini-key': 'https://aistudio.google.com/apikey',
```

**Persistência:** Salvo automaticamente em `config.json` como `gemini_api_key` (nenhuma alteração necessária em `main.js` — config.json aceita qualquer chave).

---

## Fase 3: IPC e Persistência — Análises

Criar handlers IPC para chamada ao Gemini e CRUD de análises, com persistência em `analyses.json`.

### Tarefas

- [x] Criar funções `loadAnalyses()` / `saveAnalyses()` em `main.js` [complexo]
- [x] Criar IPC handler `gemini-analyze` para chamada à API Gemini [complexo]
  - [x] Montar prompt com segmentos formatados (timestamps + speaker + texto)
  - [x] Chamar API REST Gemini com structured outputs (JSON Schema)
  - [x] Salvar resultado em `analyses.json`
- [x] Criar IPC handler `db-get-analyses` para listar análises de uma transcrição
- [x] Criar IPC handler `db-delete-analysis` para excluir análise
- [x] Expor 3 novos métodos em `preload.js`

### Detalhes Técnicos

**Persistência `analyses.json`** — Arquivo: `main.js`

```js
const analysesPath = path.join(app.getPath('userData'), 'analyses.json');

function loadAnalyses() {
  try { return JSON.parse(fs.readFileSync(analysesPath, 'utf8')); }
  catch { return []; }
}

function saveAnalyses(data) {
  fs.writeFileSync(analysesPath, JSON.stringify(data, null, 2));
}
```

Schema de cada registro:
```json
{
  "id": "uuid",
  "transcription_id": "uuid-da-transcricao",
  "prompt": "texto do prompt usado",
  "result": {
    "overall_summary": "Resumo geral...",
    "topics": [
      {
        "title": "Título do tópico",
        "summary": "Resumo do tópico",
        "start_time": 45.2,
        "end_time": 120.8,
        "segment_indices": [3, 4, 5, 6, 7]
      }
    ]
  },
  "model": "gemini-2.5-flash",
  "created_at": "2026-03-20T12:30:00.000Z"
}
```

**IPC `gemini-analyze`** — Recebe `{ transcriptionId, prompt }`:

```js
ipcMain.handle('gemini-analyze', async (_, { transcriptionId, prompt }) => {
  const config = loadConfig();
  const apiKey = config.gemini_api_key;
  if (!apiKey) throw new Error('Gemini API Key não configurada');

  // Buscar transcrição
  const transcription = loadTranscriptions().find(t => t.id === transcriptionId);
  if (!transcription?.segments_json) throw new Error('Transcrição não encontrada');

  const segments = JSON.parse(transcription.segments_json);

  // Formatar segmentos para o prompt
  const segmentsText = segments.map((seg, i) => {
    const start = formatTimestamp(seg.start);
    const end = formatTimestamp(seg.end);
    const speaker = seg.speaker ? `[${seg.speaker}]` : '';
    return `[${i}] [${start} - ${end}] ${speaker} ${seg.text}`;
  }).join('\n');

  const fullPrompt = `${prompt}\n\nTRANSCRIÇÃO:\n${segmentsText}`;

  // Chamar API Gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: {
          type: 'object',
          properties: {
            overall_summary: { type: 'string' },
            topics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  summary: { type: 'string' },
                  start_time: { type: 'number' },
                  end_time: { type: 'number' },
                  segment_indices: { type: 'array', items: { type: 'integer' } }
                },
                required: ['title', 'summary', 'start_time', 'end_time']
              }
            }
          },
          required: ['overall_summary', 'topics']
        }
      }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erro na API Gemini: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!resultText) throw new Error('Resposta vazia do Gemini');

  const result = JSON.parse(resultText);

  // Salvar análise
  const analysis = {
    id: crypto.randomUUID(),
    transcription_id: transcriptionId,
    prompt,
    result,
    model: 'gemini-2.5-flash',
    created_at: new Date().toISOString()
  };

  const analyses = loadAnalyses();
  analyses.push(analysis);
  saveAnalyses(analyses);

  return analysis;
});
```

Função auxiliar de timestamp (se não existir):
```js
function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
```

**IPC `db-get-analyses`:**
```js
ipcMain.handle('db-get-analyses', (_, transcriptionId) => {
  return loadAnalyses()
    .filter(a => a.transcription_id === transcriptionId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
});
```

**IPC `db-delete-analysis`:**
```js
ipcMain.handle('db-delete-analysis', (_, id) => {
  const analyses = loadAnalyses().filter(a => a.id !== id);
  saveAnalyses(analyses);
  return true;
});
```

**`preload.js`** — Adicionar ao objeto `api`:
```js
analyzeTranscription: (data) => ipcRenderer.invoke('gemini-analyze', data),
getAnalyses: (transcriptionId) => ipcRenderer.invoke('db-get-analyses', transcriptionId),
deleteAnalysis: (id) => ipcRenderer.invoke('db-delete-analysis', id),
```

---

## Fase 4: Interface — Módulo de Análise

Criar módulo `renderer/analysis.js` e integrar ao HTML e módulos existentes.

### Tarefas

- [x] Adicionar botão "Analisar com IA" na toolbar do resultado em `index.html`
- [x] Adicionar painel de análise e modal de nova análise em `index.html`
- [x] Criar módulo `renderer/analysis.js` [complexo]
  - [x] `initAnalysis()` — event handlers e state listeners
  - [x] `showAnalysisPanel(transcriptionId)` — carrega e renderiza análises
  - [x] `openAnalysisModal()` — mostra modal com textarea de prompt
  - [x] `runAnalysis()` — chama IPC, loading, renderiza resultado
  - [x] `renderAnalysisList()` — lista de cards com prompt, data, ações
  - [x] `renderAnalysisDetail()` — resumo geral + cards de tópicos clicáveis
  - [x] `onTopicClick(startTime)` — seek no player + play
- [x] Importar e inicializar `analysis.js` em `renderer/main.js`

### Detalhes Técnicos

**`index.html`** — Botão na toolbar (dentro de `export-buttons`, após `btn-re-export` ~linha 333):
```html
<button id="btn-analyze-ai" class="bento-toolbar-btn btn-ai-analyze" title="Analisar com IA">
  <span class="material-symbols-outlined text-sm">psychology</span>
  Analisar com IA
</button>
```

**`index.html`** — Painel de análise (dentro de `view-result`, após `transcribe-result` ~linha 352):
```html
<!-- Painel de Análise IA -->
<div id="analysis-panel" class="analysis-panel hidden">
  <div class="analysis-header bento-flex-between">
    <h3 style="margin:0; display:flex; align-items:center; gap:8px;">
      <span class="material-symbols-outlined" style="color:var(--primary)">psychology</span>
      Análises com IA
    </h3>
    <button id="btn-new-analysis" class="btn-secondary btn-sm">
      <span class="material-symbols-outlined text-sm">add</span>
      Nova Análise
    </button>
  </div>
  <div id="analysis-list"></div>
  <div id="analysis-empty" class="hidden" style="text-align:center; padding:24px; opacity:0.5;">
    <p>Nenhuma análise ainda. Clique em "Nova Análise" para começar.</p>
  </div>
</div>

<!-- Modal de nova análise -->
<div id="analysis-modal" class="modal-overlay hidden">
  <div class="modal-content glass-panel">
    <div class="modal-header">
      <h3 style="margin:0; display:flex; align-items:center; gap:8px;">
        <span class="material-symbols-outlined" style="color:var(--primary)">psychology</span>
        Nova Análise com IA
      </h3>
      <button id="btn-close-analysis-modal" class="btn-icon">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <p class="modal-hint" style="color:var(--on-surface-variant); font-size:13px; margin:8px 0 16px;">
      <span class="material-symbols-outlined text-sm" style="vertical-align:middle">wifi</span>
      Requer internet. Modelo: Gemini 2.5 Flash (1M tokens)
    </p>
    <textarea id="analysis-prompt" rows="8" class="text-input analysis-prompt-textarea" placeholder="Descreva o que deseja analisar..."></textarea>
    <div class="modal-actions" style="display:flex; gap:8px; justify-content:flex-end; margin-top:16px;">
      <button id="btn-cancel-analysis" class="btn-secondary">Cancelar</button>
      <button id="btn-run-analysis" class="btn-primary">
        <span class="material-symbols-outlined text-sm">play_arrow</span>
        Gerar Análise
      </button>
    </div>
    <div id="analysis-loading" class="hidden" style="text-align:center; padding:24px;">
      <div class="splash-spinner"></div>
      <p style="margin-top:12px; color:var(--on-surface-variant);">Analisando transcrição com Gemini...</p>
    </div>
    <div id="analysis-error" class="hidden" style="padding:12px; background:var(--error-container); color:var(--on-error-container); border-radius:var(--radius-md); margin-top:12px;"></div>
  </div>
</div>
```

**`renderer/analysis.js`** — Novo módulo:

Prompt padrão:
```
Analise a transcrição abaixo e identifique os principais tópicos discutidos.
Para cada tópico, forneça:
- Um título claro e descritivo
- Um breve resumo do que foi discutido
- O tempo de início (start_time) e fim (end_time) em segundos
- Os índices dos segmentos relacionados (segment_indices)

Também forneça um resumo geral (overall_summary) de toda a transcrição.
```

Click em tópico:
```js
function onTopicClick(startTime) {
  const player = document.getElementById('media-element');
  if (player) {
    player.currentTime = startTime;
    player.play();
  }
}
```

**`renderer/main.js`** — Adicionar import e init:
```js
import { initAnalysis } from './analysis.js';
// ... na sequência de init, após initResults():
initAnalysis();
```

**Integração com resultado** — Quando `showTranscriptionResult()` é chamado (em `results.js`), disparar carregamento de análises via estado:
```js
state.set('currentTranscriptionId', transcriptionId);
```
O módulo `analysis.js` escuta esse estado e carrega análises automaticamente.

---

## Fase 5: Estilos CSS

Adicionar estilos para modal, cards de análise, tópicos e estados.

### Tarefas

- [x] Estilo do modal overlay e conteúdo
- [x] Estilo da textarea de prompt
- [x] Estilo dos cards de análise (lista)
- [x] Estilo dos cards de tópico (clicáveis, com badge de timestamp)
- [x] Estilo do botão "Analisar com IA" (destaque visual)
- [x] Estilo do painel de análise
- [x] Estilo do loading state
- [x] Estilo de aviso (sem API key)

### Detalhes Técnicos

**`styles.css`** — Adicionar:

```css
/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
  border-radius: var(--radius-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Textarea de prompt */
.analysis-prompt-textarea {
  width: 100%;
  resize: vertical;
  min-height: 120px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
}

/* Painel de análise */
.analysis-panel {
  margin-top: 16px;
  padding: 16px;
  border-radius: var(--radius-lg);
  background: var(--surface-container);
}

.analysis-header {
  margin-bottom: 16px;
}

/* Card de análise (lista) */
.analysis-card {
  background: var(--surface-container-high);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid var(--outline-variant);
  transition: var(--transition-fast);
}

.analysis-card:hover {
  border-color: var(--primary);
}

.analysis-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.analysis-card-prompt {
  font-size: 13px;
  color: var(--on-surface-variant);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.analysis-card-date {
  font-size: 11px;
  color: var(--on-surface-variant);
  opacity: 0.7;
}

/* Resumo geral */
.analysis-summary {
  padding: 12px 16px;
  background: var(--surface-container-low);
  border-radius: var(--radius-md);
  margin: 12px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--on-surface);
}

/* Card de tópico */
.topic-card {
  padding: 12px 16px;
  background: var(--surface-container-high);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition-fast);
}

.topic-card:hover {
  border-color: var(--primary);
  background: var(--surface-container-highest);
}

.topic-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.topic-summary {
  font-size: 13px;
  color: var(--on-surface-variant);
  line-height: 1.4;
  margin-bottom: 8px;
}

.topic-timestamp {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-family: var(--font-mono);
  background: var(--primary);
  color: var(--on-primary);
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

/* Botão Analisar com IA (destaque) */
.btn-ai-analyze {
  background: linear-gradient(135deg, var(--primary), var(--tertiary, var(--primary)));
  color: var(--on-primary);
  border: none;
}

.btn-ai-analyze:hover {
  filter: brightness(1.1);
}

/* Botão pequeno */
.btn-sm {
  font-size: 12px;
  padding: 4px 12px;
}
```

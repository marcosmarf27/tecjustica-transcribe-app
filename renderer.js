// === Estado da aplicação ===
let backendUrl = null;
let currentPage = 'transcription';

// === Controles da janela ===
document.getElementById('btn-minimize')?.addEventListener('click', () => window.api.minimizeWindow());
document.getElementById('btn-maximize')?.addEventListener('click', () => window.api.maximizeWindow());
document.getElementById('btn-close')?.addEventListener('click', () => window.api.closeWindow());

// === Navegação ===
const activityButtons = document.querySelectorAll('.activity-btn');
const pages = document.querySelectorAll('.page');
const splash = document.getElementById('splash');

function navigateTo(pageName) {
  currentPage = pageName;

  // Atualizar botões
  activityButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });

  // Atualizar páginas
  pages.forEach((page) => {
    page.classList.remove('active');
  });

  const target = document.getElementById(`page-${pageName}`);
  if (target) {
    target.classList.add('active');
  }

  // Carregar dados da página ao navegar
  if (pageName === 'diagnostics' && backendUrl) {
    loadDiagnostics();
  }
  if (pageName === 'models' && backendUrl) {
    loadModels();
  }
  if (pageName === 'transcription' && backendUrl) {
    loadDownloadedModels();
  }
  if (pageName === 'settings') {
    loadSettings();
  }
}

activityButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    navigateTo(btn.dataset.page);
  });
});

// === Status Bar ===
const statusGpu = document.getElementById('status-gpu');
const statusVram = document.getElementById('status-vram');
const statusCuda = document.getElementById('status-cuda');
const statusBackend = document.getElementById('status-backend');
const statusVersion = document.getElementById('status-version');

async function updateStatusBar() {
  // Versão do app
  try {
    const version = await window.api.getAppVersion();
    statusVersion.textContent = `v${version}`;
  } catch {
    statusVersion.textContent = 'v--';
  }

  // GPU info
  if (!backendUrl) return;

  try {
    const response = await fetch(`${backendUrl}/gpu-info`);
    const info = await response.json();

    statusGpu.textContent = info.gpu_name ? `GPU: ${info.gpu_name}` : 'GPU: Nenhuma';
    statusVram.textContent = info.vram_mb ? `VRAM: ${Math.round(info.vram_mb / 1024 * 10) / 10} GB` : 'VRAM: --';
    statusCuda.textContent = info.cuda_version ? `CUDA: ${info.cuda_version}` : 'CUDA: N/A';

    // Banner CPU warning
    const cpuWarning = document.getElementById('cpu-warning');
    if (cpuWarning) {
      cpuWarning.classList.toggle('hidden', info.cuda_available);
    }
  } catch {
    statusGpu.textContent = 'GPU: Erro';
    statusVram.textContent = 'VRAM: --';
    statusCuda.textContent = 'CUDA: --';
  }
}

// === Backend Status ===
window.api.onBackendStatus(async (data) => {
  if (data.status === 'starting') {
    statusBackend.textContent = 'Backend: Iniciando...';
  } else if (data.status === 'ready') {
    statusBackend.textContent = 'Backend: Online';
    backendUrl = await window.api.getBackendUrl();

    // Esconder splash e mostrar página inicial
    splash.classList.remove('active');
    navigateTo(currentPage);

    // Atualizar status bar com info da GPU
    await updateStatusBar();

    // Carregar modelos disponíveis para transcrição
    await loadDownloadedModels();
  } else if (data.status === 'error') {
    statusBackend.textContent = 'Backend: Erro';
    splash.querySelector('.splash-text').textContent = `Erro: ${data.message}`;
  }
});

// === Diagnóstico ===
async function loadDiagnostics() {
  if (!backendUrl) return;

  const container = document.getElementById('diagnostics-table');
  if (!container) return;

  container.innerHTML = '<p class="loading-text">Verificando sistema...</p>';

  try {
    const response = await fetch(`${backendUrl}/diagnostics`);
    const checks = await response.json();

    let html = `
      <table class="diag-table">
        <thead>
          <tr>
            <th>Verificação</th>
            <th>Status</th>
            <th>Detalhe</th>
          </tr>
        </thead>
        <tbody>
    `;

    checks.forEach((check) => {
      const icon = check.ok ? '<span class="diag-ok">OK</span>' : '<span class="diag-fail">FALHA</span>';
      html += `
        <tr>
          <td>${check.name}</td>
          <td>${icon}</td>
          <td>${check.detail}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';

    const allOk = checks.every((c) => c.ok);
    if (allOk) {
      html += '<p class="diag-summary diag-summary-ok">Todos os requisitos atendidos.</p>';
    } else {
      html += '<p class="diag-summary diag-summary-warn">Alguns requisitos não foram atendidos. Verifique os itens acima.</p>';
    }

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p class="diag-error">Erro ao carregar diagnóstico. Backend offline?</p>';
  }
}

// === Modelos ===
async function loadModels() {
  if (!backendUrl) return;

  const grid = document.getElementById('models-grid');
  if (!grid) return;

  grid.innerHTML = '<p class="loading-text">Carregando modelos...</p>';

  try {
    const response = await fetch(`${backendUrl}/models`);
    const models = await response.json();

    grid.innerHTML = '';
    models.forEach((model) => {
      const card = document.createElement('div');
      card.className = 'model-card' + (model.downloaded ? ' model-installed' : '');
      card.innerHTML = `
        <div class="model-header">
          <span class="model-name">${model.name}</span>
          <span class="model-status ${model.downloaded ? 'model-downloaded' : 'model-not-downloaded'}">
            ${model.downloaded ? 'Instalado' : 'Disponível'}
          </span>
        </div>
        <div class="model-details">
          <span>Tamanho: ${model.size}</span>
          <span>VRAM: ${model.vram}</span>
        </div>
        <div class="model-actions">
          ${model.downloaded
            ? `<button class="btn-secondary btn-delete-model" data-model="${model.name}">
                <span class="material-symbols-outlined text-sm">delete</span>
                Excluir
               </button>`
            : `<button class="btn-primary btn-download-model" data-model="${model.name}">
                <span class="material-symbols-outlined text-sm">download</span>
                Download (${model.size})
               </button>`
          }
        </div>
        <div class="model-progress hidden" data-model-progress="${model.name}">
          <div class="progress-bar"><div class="progress-fill"></div></div>
          <span class="progress-text">0%</span>
        </div>
      `;
      grid.appendChild(card);
    });

    // Event listeners para botões
    grid.querySelectorAll('.btn-download-model').forEach((btn) => {
      btn.addEventListener('click', () => downloadModel(btn.dataset.model));
    });
    grid.querySelectorAll('.btn-delete-model').forEach((btn) => {
      btn.addEventListener('click', () => deleteModel(btn.dataset.model));
    });
  } catch {
    grid.innerHTML = '<p class="diag-error">Erro ao carregar modelos.</p>';
  }
}

function downloadModel(name) {
  const progressEl = document.querySelector(`[data-model-progress="${name}"]`);
  if (progressEl) {
    progressEl.classList.remove('hidden');
  }

  const evtSource = new EventSource(`${backendUrl}/models/download?model=${name}`);
  evtSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.event === 'progress' && progressEl) {
      const fill = progressEl.querySelector('.progress-fill');
      const text = progressEl.querySelector('.progress-text');
      if (fill) fill.style.width = `${data.percent}%`;
      if (text) text.textContent = data.message || `${data.percent}%`;
    }
    if (data.event === 'complete') {
      evtSource.close();
      loadModels();
    }
    if (data.event === 'error') {
      evtSource.close();
      if (progressEl) {
        const text = progressEl.querySelector('.progress-text');
        if (text) text.textContent = `Erro: ${data.message}`;
      }
    }
  };
  evtSource.onerror = () => {
    evtSource.close();
    loadModels();
  };
}

async function deleteModel(name) {
  try {
    await fetch(`${backendUrl}/models/${name}`, { method: 'DELETE' });
    loadModels();
  } catch {
    // Silenciar erro
  }
}

// === Transcrição ===
let selectedFilePath = null;
let transcriptionSegments = [];
let exportFiles = {}; // {txt: path, srt: path, json: path}

const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

async function loadDownloadedModels() {
  if (!backendUrl) return;
  try {
    const response = await fetch(`${backendUrl}/models`);
    const models = await response.json();
    const select = document.getElementById('select-model');
    if (!select) return;
    select.innerHTML = '';
    const downloaded = models.filter((m) => m.downloaded);
    const noModelsWarning = document.getElementById('no-models-warning');
    const container = document.getElementById('model-buttons-container');
    const hiddenSelect = document.getElementById('select-model');
    
    if (downloaded.length === 0) {
      if (container) {
        container.innerHTML = '<p class="text-sm text-on-surface-variant">Nenhum modelo baixado</p>';
      } else if (select) {
        select.innerHTML = '<option value="">Nenhum modelo baixado</option>';
      }
      if (hiddenSelect) hiddenSelect.value = '';
      if (noModelsWarning) noModelsWarning.classList.remove('hidden');
    } else {
      if (container) {
        container.innerHTML = '';
        downloaded.forEach((m) => {
          const btn = document.createElement('button');
          btn.className = 'bento-model-btn';
          
          let nameLabel = m.name.toUpperCase();
          if (m.name.toLowerCase().includes('medium')) nameLabel += ' (Equilibrado)';
          else if (m.name.toLowerCase().includes('tiny')) nameLabel += ' (Veloz)';
          else if (m.name.toLowerCase().includes('large')) nameLabel += ' (Preciso)';
          
          btn.textContent = nameLabel;
          
          btn.addEventListener('click', () => {
             document.querySelectorAll('.bento-model-btn').forEach(b => b.classList.remove('active'));
             btn.classList.add('active');
             if (hiddenSelect) {
               hiddenSelect.value = m.name;
               // O value foi mudado via script, não dispara 'change' automático
               hiddenSelect.dispatchEvent(new Event('change'));
             }
             updateTranscribeButton();
          });
          container.appendChild(btn);
        });
        
        // Auto-select the first one if possible
        if (hiddenSelect && !hiddenSelect.value && downloaded.length > 0) {
           const firstBtn = container.querySelector('.bento-model-btn');
           if (firstBtn) firstBtn.click();
        }
      } else if (select) {
        // Fallback para select se estiver em outra página
        downloaded.forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m.name;
          opt.textContent = `${m.name} (${m.size})`;
          select.appendChild(opt);
        });
      }
      if (noModelsWarning) noModelsWarning.classList.add('hidden');
    }
    updateTranscribeButton();

    // Desabilitar diarização se não há HF token
    try {
      const healthRes = await fetch(`${backendUrl}/health`);
      const healthData = await healthRes.json();
      const diarizeCheckbox = document.getElementById('check-diarize');
      if (diarizeCheckbox) {
        diarizeCheckbox.disabled = !healthData.hf_token_configured;
        if (!healthData.hf_token_configured) {
          diarizeCheckbox.checked = false;
          diarizeCheckbox.parentElement.title = 'Configure o token HuggingFace nas Configurações';
        } else {
          diarizeCheckbox.parentElement.title = '';
        }
      }
    } catch {
      // Silenciar
    }
  } catch {
    // Silenciar
  }
}

function updateTranscribeButton() {
  const btn = document.getElementById('btn-transcribe');
  const select = document.getElementById('select-model');
  if (btn) {
    btn.disabled = !selectedFilePath || !select?.value;
  }
}

document.getElementById('btn-select-file')?.addEventListener('click', async () => {
  const filePath = await window.api.selectAudioFile();
  if (filePath) {
    selectedFilePath = filePath;
    const fileName = filePath.split(/[/\\]/).pop();
    document.getElementById('selected-file').textContent = fileName;
    updateTranscribeButton();
  }
});

document.getElementById('select-model')?.addEventListener('change', updateTranscribeButton);

const validAudioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.mp4', '.mkv', '.avi', '.mov', '.webm'];

document.getElementById('btn-transcribe')?.addEventListener('click', async () => {
  if (!selectedFilePath || !backendUrl) return;

  // Validar extensão
  const ext = '.' + selectedFilePath.split('.').pop().toLowerCase();
  if (!validAudioExtensions.includes(ext)) {
    const text = document.getElementById('transcribe-progress-text');
    const progressEl = document.getElementById('transcribe-progress');
    progressEl?.classList.remove('hidden');
    if (text) text.textContent = `Formato não suportado: ${ext}. Use: ${validAudioExtensions.join(', ')}`;
    return;
  }

  const model = document.getElementById('select-model')?.value;
  const language = document.getElementById('select-language')?.value || 'auto';
  const diarize = document.getElementById('check-diarize')?.checked || false;

  // Obter config para output_dir
  const config = await window.api.getConfig();
  const outputDir = config.output_dir || './transcricoes';

  // Mostrar progresso
  const progressEl = document.getElementById('transcribe-progress');
  const resultEl = document.getElementById('transcribe-result');
  const mediaEl = document.getElementById('media-player');
  progressEl?.classList.remove('hidden');
  resultEl?.classList.add('hidden');
  mediaEl?.classList.add('hidden');

  // Reset stages
  document.querySelectorAll('.progress-stages .stage').forEach((s) => {
    s.classList.remove('stage-active', 'stage-done');
  });

  // Desabilitar botão
  const btn = document.getElementById('btn-transcribe');
  if (btn) btn.disabled = true;

  try {
    const response = await fetch(`${backendUrl}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_path: selectedFilePath,
        model,
        language,
        diarize,
        output_dir: outputDir,
      }),
    });
    const { task_id } = await response.json();

    // Monitorar progresso via SSE
    const evtSource = new EventSource(`${backendUrl}/transcribe/progress?task_id=${task_id}`);
    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data);

      // Atualizar barra de progresso
      const fill = document.getElementById('transcribe-progress-fill');
      const text = document.getElementById('transcribe-progress-text');
      if (fill) fill.style.width = `${data.percent}%`;
      if (text) text.textContent = data.message;

      // Atualizar stages visuais
      updateStageVisuals(data.event);

      if (data.event === 'complete' && data.result) {
        evtSource.close();
        progressEl?.classList.add('hidden');
        showTranscriptionResult(data.result);
        if (btn) btn.disabled = false;
      }
      if (data.event === 'error') {
        evtSource.close();
        if (text) text.textContent = `Erro: ${data.message}`;
        if (btn) btn.disabled = false;
      }
    };
    evtSource.onerror = () => {
      evtSource.close();
      if (btn) btn.disabled = false;
    };
  } catch (err) {
    const text = document.getElementById('transcribe-progress-text');
    if (text) text.textContent = `Erro ao iniciar transcrição: ${err.message}`;
    if (btn) btn.disabled = false;
  }
});

const stageOrder = ['modelo', 'audio', 'transcricao', 'alinhamento', 'diarizacao', 'salvando'];

function updateStageVisuals(currentStage) {
  const idx = stageOrder.indexOf(currentStage);
  document.querySelectorAll('.progress-stages .stage').forEach((el) => {
    const stageIdx = stageOrder.indexOf(el.dataset.stage);
    el.classList.remove('stage-active', 'stage-done');
    if (stageIdx < idx) {
      el.classList.add('stage-done');
    } else if (stageIdx === idx) {
      el.classList.add('stage-active');
    }
  });
}

function showTranscriptionResult(result) {
  transcriptionSegments = result.segments || [];
  exportFiles = result.files || {};

  // Mostrar player de mídia
  const mediaEl = document.getElementById('media-player');
  const playerContainer = document.getElementById('player-container');
  if (mediaEl && playerContainer && selectedFilePath) {
    const ext = '.' + selectedFilePath.split('.').pop().toLowerCase();
    const isVideo = videoExtensions.includes(ext);

    playerContainer.innerHTML = '';
    const player = document.createElement(isVideo ? 'video' : 'audio');
    player.id = 'media-element';
    player.controls = true;
    player.src = `file://${selectedFilePath}`;
    if (isVideo) {
      player.style.width = '100%';
      player.style.maxHeight = '300px';
    }
    playerContainer.appendChild(player);
    mediaEl.classList.remove('hidden');

    // Sincronização: highlight do segmento ativo
    let lastUpdate = 0;
    player.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - lastUpdate < 500) return;
      lastUpdate = now;
      highlightActiveSegment(player.currentTime);
    });
  }

  // Mostrar segmentos
  const resultEl = document.getElementById('transcribe-result');
  const segmentsEl = document.getElementById('transcribe-segments');
  if (resultEl && segmentsEl) {
    segmentsEl.innerHTML = '';
    transcriptionSegments.forEach((seg, i) => {
      const div = document.createElement('div');
      div.className = 'segment';
      div.dataset.index = i;

      const time = formatTime(seg.start);
      const speaker = seg.speaker ? `[${seg.speaker}] ` : '';

      div.innerHTML = `
        <span class="segment-time">${time}</span>
        <span class="segment-speaker">${speaker}</span>
        <span class="segment-text">${seg.text?.trim() || ''}</span>
      `;

      // Clicar num segmento posiciona o player
      div.addEventListener('click', () => {
        const player = document.getElementById('media-element');
        if (player) {
          player.currentTime = seg.start;
          player.play();
        }
      });

      segmentsEl.appendChild(div);
    });
    resultEl.classList.remove('hidden');
  }
}

function highlightActiveSegment(currentTime) {
  const segments = document.querySelectorAll('.segment');
  segments.forEach((el, i) => {
    const seg = transcriptionSegments[i];
    if (seg && currentTime >= seg.start && currentTime <= seg.end) {
      el.classList.add('segment-active');
    } else {
      el.classList.remove('segment-active');
    }
  });
}

function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// === Exportação ===
document.getElementById('btn-open-txt')?.addEventListener('click', () => {
  if (exportFiles.txt) window.api.openFile(exportFiles.txt);
});

document.getElementById('btn-open-srt')?.addEventListener('click', () => {
  if (exportFiles.srt) window.api.openFile(exportFiles.srt);
});

document.getElementById('btn-open-json')?.addEventListener('click', () => {
  if (exportFiles.json) window.api.openFile(exportFiles.json);
});

document.getElementById('btn-copy-text')?.addEventListener('click', async () => {
  const text = transcriptionSegments
    .map((seg) => {
      const speaker = seg.speaker ? `[${seg.speaker}] ` : '';
      return `${speaker}${seg.text?.trim() || ''}`;
    })
    .join('\n');
  await navigator.clipboard.writeText(text);

  const btn = document.getElementById('btn-copy-text');
  if (btn) {
    const original = btn.textContent;
    btn.textContent = 'Copiado!';
    setTimeout(() => { btn.textContent = original; }, 1500);
  }
});

document.getElementById('btn-save-as')?.addEventListener('click', async () => {
  if (!exportFiles.txt) return;
  const fileName = exportFiles.txt.split(/[/\\]/).pop();
  const savePath = await window.api.saveExportFile(fileName, [
    { name: 'Texto', extensions: ['txt'] },
    { name: 'Legendas SRT', extensions: ['srt'] },
    { name: 'JSON', extensions: ['json'] },
  ]);
  if (savePath) {
    // Copiar o arquivo correspondente
    const ext = savePath.split('.').pop().toLowerCase();
    const source = exportFiles[ext] || exportFiles.txt;
    // Abrir o arquivo no editor padrão após salvar
    window.api.openFile(source);
  }
});

// === Configurações ===
async function loadSettings() {
  const config = await window.api.getConfig();

  const tokenEl = document.getElementById('setting-hf-token');
  const outputEl = document.getElementById('setting-output-dir');
  const deviceEl = document.getElementById('setting-device');
  const batchEl = document.getElementById('setting-batch-size');

  if (tokenEl) tokenEl.value = config.hf_token || '';
  if (outputEl) outputEl.value = config.output_dir || './transcricoes';
  if (deviceEl) deviceEl.value = config.device || 'auto';
  if (batchEl) batchEl.value = config.batch_size || 0;
}

document.getElementById('btn-toggle-token')?.addEventListener('click', () => {
  const input = document.getElementById('setting-hf-token');
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
});

document.getElementById('btn-select-output-dir')?.addEventListener('click', async () => {
  const dir = await window.api.selectDirectory();
  if (dir) {
    document.getElementById('setting-output-dir').value = dir;
  }
});

// Links externos (abrir no navegador do sistema)
['link-hf-token', 'link-pyannote-diar', 'link-pyannote-seg'].forEach((id) => {
  document.getElementById(id)?.addEventListener('click', (e) => {
    e.preventDefault();
    const urls = {
      'link-hf-token': 'https://huggingface.co/settings/tokens',
      'link-pyannote-diar': 'https://huggingface.co/pyannote/speaker-diarization-3.1',
      'link-pyannote-seg': 'https://huggingface.co/pyannote/segmentation-3.0',
    };
    const url = urls[id];
    if (url) window.api.openFile(url);
  });
});

document.getElementById('btn-save-settings')?.addEventListener('click', async () => {
  const config = {
    hf_token: document.getElementById('setting-hf-token')?.value || '',
    output_dir: document.getElementById('setting-output-dir')?.value || './transcricoes',
    device: document.getElementById('setting-device')?.value || 'auto',
    batch_size: parseInt(document.getElementById('setting-batch-size')?.value || '0', 10),
  };
  await window.api.saveConfig(config);

  const msg = document.getElementById('settings-saved-msg');
  if (msg) {
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 2000);
  }
});

// === Event Listeners (páginas) ===
document.getElementById('btn-refresh-diag')?.addEventListener('click', loadDiagnostics);

// === Setup (primeiro uso) ===
window.api.onSetupStatus((data) => {
  const fill = document.getElementById('setup-progress-fill');
  const text = document.getElementById('setup-progress-text');
  const progressEl = document.getElementById('setup-progress');
  const errorEl = document.getElementById('setup-error');
  const errorText = document.getElementById('setup-error-text');

  if (data.stage === 'error') {
    errorEl?.classList.remove('hidden');
    if (errorText) errorText.textContent = data.message;
    progressEl?.classList.add('hidden');
    const btn = document.getElementById('btn-start-setup');
    if (btn) { btn.disabled = false; btn.textContent = 'Tentar novamente'; }
  } else if (data.stage === 'done') {
    // Setup concluído — iniciar backend diretamente (sem reload)
    if (fill) fill.style.width = '100%';
    if (text) text.textContent = 'Concluído! Iniciando backend...';
    setTimeout(async () => {
      // Esconder setup, mostrar splash
      document.getElementById('page-setup')?.classList.remove('active');
      splash.classList.add('active');
      statusBackend.textContent = 'Backend: Iniciando...';

      // Pedir ao main process para iniciar o backend
      const result = await window.api.startBackendAfterSetup();
      if (!result.ok) {
        statusBackend.textContent = 'Backend: Erro';
        splash.querySelector('.splash-text').textContent = `Erro ao iniciar backend: ${result.message}`;
      }
      // O evento 'backend-status' vai cuidar do resto quando o backend ficar ready
    }, 1500);
  } else if (data.stage === 'needed') {
    // Mostrar tela de setup
    pages.forEach((p) => p.classList.remove('active'));
    splash.classList.remove('active');
    document.getElementById('page-setup')?.classList.add('active');
  } else {
    progressEl?.classList.remove('hidden');
    errorEl?.classList.add('hidden');
    if (fill) fill.style.width = `${data.percent}%`;
    if (text) text.textContent = data.message;
  }
});

document.getElementById('btn-start-setup')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-start-setup');
  if (btn) { btn.disabled = true; btn.textContent = 'Configurando...'; }
  document.getElementById('setup-progress')?.classList.remove('hidden');
  const success = await window.api.runSetup();
  if (success) {
    // O onSetupStatus vai cuidar do resto
  }
});

// === Polling do backend ===
function pollBackendReady() {
  const interval = setInterval(async () => {
    try {
      const port = await window.api.getBackendPort();
      if (!port) return; // backend ainda não iniciou

      const url = `http://127.0.0.1:${port}`;
      const res = await fetch(`${url}/health`);
      if (res.ok) {
        clearInterval(interval);
        backendUrl = url;
        statusBackend.textContent = 'Backend: Online';
        splash.classList.remove('active');
        navigateTo(currentPage);
        await updateStatusBar();
        await loadDownloadedModels();
      }
    } catch {
      // Backend ainda não está pronto
    }
  }, 1000);

  // Timeout após 60s
  setTimeout(() => {
    clearInterval(interval);
    if (!backendUrl) {
      statusBackend.textContent = 'Backend: Erro';
      splash.querySelector('.splash-text').textContent = 'Backend não respondeu. Reinicie o app.';
    }
  }, 60000);
}

// === Inicialização ===
async function init() {
  const setup = await window.api.checkSetup();

  if (!setup.complete) {
    // Mostrar tela de setup
    pages.forEach((p) => p.classList.remove('active'));
    splash.classList.remove('active');
    const setupPage = document.getElementById('page-setup');
    if (setupPage) setupPage.classList.add('active');

    // Verificar Python
    const pythonStatus = document.getElementById('setup-python-status');
    const icon = pythonStatus?.querySelector('.setup-check-icon');
    const text = pythonStatus?.querySelector('.setup-check-text');
    const btn = document.getElementById('btn-start-setup');

    if (setup.pythonFound) {
      if (icon) icon.textContent = '✓';
      if (text) text.textContent = 'Python 3.10+ encontrado';
      if (btn) btn.disabled = false;
    } else {
      if (icon) icon.textContent = '✗';
      const isWin = navigator.platform.toLowerCase().includes('win');
      const installHint = isWin
        ? 'Baixe em python.org e marque "Add to PATH" na instalação'
        : 'Instale: sudo apt install python3 python3-venv';
      if (text) { text.textContent = `Python 3.10+ não encontrado. ${installHint}`; text.style.color = 'var(--error)'; }
      if (btn) btn.disabled = true;
    }
  } else {
    // Setup já feito — mostrar splash enquanto backend inicia
    splash.classList.add('active');
    pages.forEach((page) => page.classList.remove('active'));
    statusBackend.textContent = 'Backend: Aguardando...';

    // Polling ativo: esperar o backend ficar pronto
    pollBackendReady();
  }
}

init();

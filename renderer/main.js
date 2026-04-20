import * as state from './state.js';
import { navigateTo, initNavigation } from './navigation.js';
import { initDiagnostics } from './diagnostics.js';
import { initModels } from './models.js';
import { initSettings } from './settings.js';
import { initTranscription, loadDownloadedModels } from './transcription.js';
import { initResults } from './results.js';
import { initHistory, openTranscriptionById } from './history.js';
import { initDashboard } from './dashboard.js';
import { initDragDrop } from './dragdrop.js';
import { showToast } from './toast.js';
import { initAnalysis } from './analysis.js';
import { initChat } from './chat.js';

// === Controles da janela ===
document.getElementById('btn-minimize')?.addEventListener('click', () => window.api.minimizeWindow());
document.getElementById('btn-maximize')?.addEventListener('click', () => window.api.maximizeWindow());
document.getElementById('btn-close')?.addEventListener('click', () => window.api.closeWindow());

// === DOM refs ===
const splash = document.getElementById('splash');
const pages = document.querySelectorAll('.page');
const statusGpu = document.getElementById('status-gpu');
const statusVram = document.getElementById('status-vram');
const statusCuda = document.getElementById('status-cuda');
const statusBackend = document.getElementById('status-backend');
const statusVersion = document.getElementById('status-version');

// === Status Bar ===
async function updateStatusBar() {
  try {
    const version = await window.api.getAppVersion();
    statusVersion.textContent = `v${version}`;
  } catch {
    statusVersion.textContent = 'v--';
  }

  const backendUrl = state.get('backendUrl');
  if (!backendUrl) return;

  try {
    const response = await fetch(`${backendUrl}/gpu-info`);
    const info = await response.json();

    statusGpu.textContent = info.gpu_name ? `GPU: ${info.gpu_name}` : 'GPU: Nenhuma';
    statusVram.textContent = info.vram_mb ? `VRAM: ${Math.round(info.vram_mb / 1024 * 10) / 10} GB` : 'VRAM: --';
    statusCuda.textContent = info.cuda_version ? `CUDA: ${info.cuda_version}` : 'CUDA: N/A';

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

// === Backend ready handler ===
async function onBackendReady(url) {
  state.set('backendUrl', url);
  statusBackend.textContent = 'Backend: Online';

  splash.classList.remove('active');
  navigateTo(state.get('currentPage') || 'transcription');

  await updateStatusBar();
  await loadDownloadedModels();
}

// === Backend Status (IPC) ===
window.api.onBackendStatus(async (data) => {
  if (data.status === 'starting') {
    statusBackend.textContent = 'Backend: Iniciando...';
  } else if (data.status === 'ready') {
    const url = await window.api.getBackendUrl();
    await onBackendReady(url);
  } else if (data.status === 'error') {
    statusBackend.textContent = 'Backend: Erro';
    splash.querySelector('.splash-text').textContent = `Erro: ${data.message}`;
  }
});

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
    if (fill) fill.style.width = '100%';
    if (text) text.textContent = 'Concluido! Iniciando backend...';
    setTimeout(async () => {
      document.getElementById('page-setup')?.classList.remove('active');
      splash.classList.add('active');
      statusBackend.textContent = 'Backend: Iniciando...';

      const result = await window.api.startBackendAfterSetup();
      if (!result.ok) {
        statusBackend.textContent = 'Backend: Erro';
        splash.querySelector('.splash-text').textContent = `Erro ao iniciar backend: ${result.message}`;
      }
    }, 1500);
  } else if (data.stage === 'needed') {
    pages.forEach((p) => p.classList.remove('active'));
    splash.classList.remove('active');
    document.getElementById('page-setup')?.classList.add('active');
  } else {
    progressEl?.classList.remove('hidden');
    errorEl?.classList.add('hidden');
    if (fill) fill.style.width = `${data.percent}%`;
    if (text) text.textContent = data.message;

    // Atualizar indicadores visuais durante install-python/install-ffmpeg
    if (data.stage === 'install-python') {
      const pyIcon = document.querySelector('#setup-python-status .setup-check-icon');
      const pyText = document.querySelector('#setup-python-status .setup-check-text');
      if (pyIcon) { pyIcon.textContent = '\u23F3'; pyIcon.style.color = 'var(--primary)'; }
      if (pyText) pyText.textContent = data.message;
    } else if (data.stage === 'install-ffmpeg') {
      const ffIcon = document.querySelector('#setup-ffmpeg-status .setup-check-icon');
      const ffText = document.querySelector('#setup-ffmpeg-status .setup-check-text');
      if (ffIcon) { ffIcon.textContent = '\u23F3'; ffIcon.style.color = 'var(--primary)'; }
      if (ffText) ffText.textContent = data.message;
    }
  }
});

document.getElementById('btn-start-setup')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-start-setup');
  if (btn) { btn.disabled = true; btn.textContent = 'Configurando...'; }
  document.getElementById('setup-progress')?.classList.remove('hidden');
  await window.api.runSetup();
});

// === Polling do backend ===
function pollBackendReady() {
  const interval = setInterval(async () => {
    try {
      const port = await window.api.getBackendPort();
      if (!port) return;

      const url = `http://127.0.0.1:${port}`;
      const res = await fetch(`${url}/health`);
      if (res.ok) {
        clearInterval(interval);
        await onBackendReady(url);
      }
    } catch {
      // Backend ainda nao esta pronto
    }
  }, 1000);

  setTimeout(() => {
    clearInterval(interval);
    if (!state.get('backendUrl')) {
      statusBackend.textContent = 'Backend: Erro';
      splash.querySelector('.splash-text').textContent = 'Backend nao respondeu. Reinicie o app.';
    }
  }, 60000);
}

// === Inicializacao ===
async function init() {
  await startApp();
}

async function startApp() {
  state.set('currentPage', 'transcription');

  // Inicializar modulos
  await initNavigation();
  initDiagnostics();
  initModels();
  initSettings();
  initTranscription();
  initResults();
  initHistory();
  initDashboard();
  initDragDrop();
  initAnalysis();
  initChat();

  // Status bar: progresso de transcricao
  state.on('transcriptionProgress', (progress) => {
    const el = document.getElementById('status-transcription');
    if (!el) return;
    if (!progress) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    const parts = [`Transcrevendo: ${progress.percent}%`];
    if (progress.step) parts.push(`Etapa ${progress.step}/${progress.totalSteps}`);
    el.textContent = parts.join(' - ');
  });

  // Click na status bar navega para transcricao
  document.getElementById('status-transcription')?.addEventListener('click', () => {
    navigateTo('transcription');
  });

  // Toast quando transcricao completa
  state.on('transcriptionComplete', (data) => {
    if (!data || !data.filename) return;
    showToast(`Transcricao concluida: ${data.filename}`, {
      label: 'Ver resultado',
      onClick: () => {
        navigateTo('transcription');
        openTranscriptionById(data.id);
      },
    });
  });

  const setup = await window.api.checkSetup();

  if (!setup.complete) {
    pages.forEach((p) => p.classList.remove('active'));
    splash.classList.remove('active');
    const setupPage = document.getElementById('page-setup');
    if (setupPage) setupPage.classList.add('active');

    // --- Status Python ---
    const pythonStatus = document.getElementById('setup-python-status');
    const pyIcon = pythonStatus?.querySelector('.setup-check-icon');
    const pyText = pythonStatus?.querySelector('.setup-check-text');
    const btn = document.getElementById('btn-start-setup');

    if (setup.pythonFound) {
      // Python compatível encontrado
      if (pyIcon) pyIcon.textContent = '\u2713';
      if (pyIcon) pyIcon.style.color = 'var(--success, #4caf50)';
      if (pyText) pyText.textContent = `Python ${setup.pythonVersion || '3.10+'} encontrado`;
      if (btn) btn.disabled = false;
    } else if (setup.pythonIncompatible && setup.wingetAvailable) {
      // Python incompatível + winget disponível → auto-install
      if (pyIcon) pyIcon.textContent = '\u26A0';
      if (pyIcon) pyIcon.style.color = 'var(--warning, #ff9800)';
      if (pyText) pyText.textContent = `Python ${setup.pythonVersion} incompatível (requer 3.10-3.13). Python 3.11 será instalado automaticamente via winget.`;
      if (pyText) pyText.style.color = 'var(--warning, #ff9800)';
      if (btn) btn.disabled = false;
    } else if (setup.pythonIncompatible && !setup.wingetAvailable) {
      // Python incompatível + sem winget → instruções manuais
      if (pyIcon) pyIcon.textContent = '\u2717';
      if (pyIcon) pyIcon.style.color = 'var(--error)';
      if (pyText) {
        pyText.textContent = `Python ${setup.pythonVersion} incompatível (requer 3.10-3.13). Instale Python 3.11 de python.org e reinicie o app.`;
        pyText.style.color = 'var(--error)';
      }
      if (btn) btn.disabled = true;
    } else if (!setup.pythonFound && setup.wingetAvailable) {
      // Sem Python + winget disponível → auto-install
      if (pyIcon) pyIcon.textContent = '\u2139';
      if (pyIcon) pyIcon.style.color = 'var(--primary)';
      if (pyText) pyText.textContent = 'Python não encontrado. Será instalado automaticamente via winget.';
      if (btn) btn.disabled = false;
    } else {
      // Sem Python + sem winget → instruções manuais
      if (pyIcon) pyIcon.textContent = '\u2717';
      if (pyIcon) pyIcon.style.color = 'var(--error)';
      const installHint = setup.isWindows
        ? 'Baixe Python 3.11 em python.org e marque "Add to PATH" na instalação.'
        : 'Instale: sudo apt install python3 python3-venv';
      if (pyText) { pyText.textContent = `Python 3.10-3.13 não encontrado. ${installHint}`; pyText.style.color = 'var(--error)'; }
      if (btn) btn.disabled = true;
    }

    // --- Status ffmpeg ---
    const ffmpegStatus = document.getElementById('setup-ffmpeg-status');
    const ffIcon = ffmpegStatus?.querySelector('.setup-check-icon');
    const ffText = ffmpegStatus?.querySelector('.setup-check-text');

    if (setup.ffmpegFound) {
      if (ffIcon) ffIcon.textContent = '\u2713';
      if (ffIcon) ffIcon.style.color = 'var(--success, #4caf50)';
      if (ffText) ffText.textContent = 'ffmpeg encontrado';
    } else if (setup.isWindows && setup.wingetAvailable) {
      if (ffIcon) ffIcon.textContent = '\u2139';
      if (ffIcon) ffIcon.style.color = 'var(--primary)';
      if (ffText) ffText.textContent = 'ffmpeg não encontrado. Será instalado automaticamente via winget.';
    } else {
      if (ffIcon) ffIcon.textContent = '\u26A0';
      if (ffIcon) ffIcon.style.color = 'var(--warning, #ff9800)';
      const ffHint = setup.isWindows
        ? 'Instale ffmpeg e adicione ao PATH do sistema.'
        : 'Instale: sudo apt install ffmpeg';
      if (ffText) { ffText.textContent = `ffmpeg não encontrado. ${ffHint}`; ffText.style.color = 'var(--warning, #ff9800)'; }
    }
  } else {
    splash.classList.add('active');
    pages.forEach((page) => page.classList.remove('active'));
    statusBackend.textContent = 'Backend: Aguardando...';

    pollBackendReady();
  }
}

init();

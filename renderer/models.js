import * as state from './state.js';

export async function loadModels() {
  const backendUrl = state.get('backendUrl');
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

    // Event listeners para botoes
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
  const backendUrl = state.get('backendUrl');
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
  const backendUrl = state.get('backendUrl');
  try {
    await fetch(`${backendUrl}/models/${name}`, { method: 'DELETE' });
    loadModels();
  } catch {
    // Silenciar erro
  }
}

export function initModels() {
  state.on('currentPage', (page) => {
    if (page === 'models' && state.get('backendUrl')) {
      loadModels();
    }
  });
}

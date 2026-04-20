import * as state from './state.js';

const activityButtons = document.querySelectorAll('.activity-btn');
const pages = document.querySelectorAll('.page');
const activityBar = document.getElementById('activity-bar');
const sidebarToggle = document.getElementById('sidebar-toggle');

export function navigateTo(pageName) {
  state.set('currentPage', pageName);

  // Atualizar botoes
  activityButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });

  // Atualizar paginas
  pages.forEach((page) => {
    page.classList.remove('active');
  });

  const target = document.getElementById(`page-${pageName}`);
  if (target) {
    target.classList.add('active');
  }
}

function setSidebarCollapsed(collapsed) {
  state.set('sidebarCollapsed', collapsed);
  activityBar.classList.toggle('collapsed', collapsed);
  sidebarToggle.title = collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral';
}

export async function initNavigation() {
  // Navegacao entre paginas
  activityButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.page);
    });
  });

  // Sidebar toggle
  const config = await window.api.getConfig();
  setSidebarCollapsed(config.sidebar_collapsed || false);

  sidebarToggle.addEventListener('click', async () => {
    const collapsed = !state.get('sidebarCollapsed');
    setSidebarCollapsed(collapsed);
    const currentConfig = await window.api.getConfig();
    currentConfig.sidebar_collapsed = collapsed;
    await window.api.saveConfig(currentConfig);
  });

  // Indicador de transcricao ativa na sidebar
  state.on('isTranscribing', (active) => {
    const transcriptionBtn = document.querySelector('.activity-btn[data-page="transcription"]');
    if (transcriptionBtn) {
      transcriptionBtn.classList.toggle('transcribing', !!active);
    }
  });
}

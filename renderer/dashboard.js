import * as state from './state.js';
import { openTranscriptionById } from './history.js';

const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

function getFileIcon(filename) {
  const ext = '.' + (filename || '').split('.').pop().toLowerCase();
  if (videoExtensions.includes(ext)) {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>`;
  }
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>`;
}

function getStatusBadge(status) {
  const map = {
    complete: { label: 'Conclu\u00edda', cls: 'status-complete' },
    error: { label: 'Erro', cls: 'status-error' },
    running: { label: 'Em progresso', cls: 'status-running' },
  };
  const info = map[status] || map.running;
  return `<span class="status-badge ${info.cls}">${info.label}</span>`;
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d`;
  return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function computeStats(transcriptions) {
  const completed = transcriptions.filter(t => t.status === 'complete');
  const total = completed.length;

  const totalHours = completed.reduce((acc, t) => acc + (t.duration_seconds || 0), 0) / 3600;

  // Modelo favorito
  const modelCounts = {};
  completed.forEach(t => {
    if (t.model) {
      modelCounts[t.model] = (modelCounts[t.model] || 0) + 1;
    }
  });
  const favoriteModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Transcrições da semana
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyCount = completed.filter(t => new Date(t.created_at).getTime() > weekAgo).length;

  const lastTranscription = transcriptions[0] || null;
  const recent = transcriptions.slice(0, 5);

  return { total, totalHours, favoriteModel, weeklyCount, lastTranscription, recent };
}

function renderRecentItem(item) {
  const meta = [
    item.model,
    item.duration_seconds ? formatDuration(item.duration_seconds) : null,
    timeAgo(item.created_at),
  ].filter(Boolean).join(' \u00b7 ');

  const div = document.createElement('div');
  div.className = 'history-item';
  div.innerHTML = `
    <div class="history-item-icon">${getFileIcon(item.filename)}</div>
    <div class="history-item-info">
      <span class="history-item-filename">${item.filename || 'Sem nome'}</span>
      <span class="history-item-meta">${meta}</span>
    </div>
    <div class="history-item-status">${getStatusBadge(item.status)}</div>
    <button class="history-item-delete" title="Excluir transcrição">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    </button>
  `;

  if (item.status === 'complete') {
    div.addEventListener('click', (e) => {
      if (e.target.closest('.history-item-delete')) return;
      openTranscriptionById(item.id);
    });
  }

  div.querySelector('.history-item-delete').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm(`Excluir transcrição "${item.filename || 'Sem nome'}"?`)) return;
    await window.api.deleteTranscription(item.id);
    refreshDashboard();
  });

  return div;
}

export async function refreshDashboard() {
  const transcriptions = await window.api.getTranscriptions();
  const stats = computeStats(transcriptions);

  // Stats
  const totalEl = document.getElementById('dash-total-count');
  if (totalEl) totalEl.textContent = stats.total;

  const hoursEl = document.getElementById('dash-total-hours');
  if (hoursEl) {
    hoursEl.textContent = stats.totalHours < 0.1 && stats.totalHours > 0
      ? `${Math.round(stats.totalHours * 60)}min`
      : `${Math.round(stats.totalHours * 10) / 10}h`;
  }

  const modelEl = document.getElementById('dash-favorite-model');
  if (modelEl) modelEl.textContent = stats.favoriteModel || '--';

  const weeklyBadge = document.getElementById('dash-weekly-badge');
  if (weeklyBadge) {
    if (stats.weeklyCount > 0) {
      weeklyBadge.textContent = `+${stats.weeklyCount} esta semana`;
      weeklyBadge.classList.remove('hidden');
    } else {
      weeklyBadge.classList.add('hidden');
    }
  }

  // Última transcrição
  const lastEl = document.getElementById('dash-last-transcription');
  if (lastEl) {
    if (stats.lastTranscription) {
      const t = stats.lastTranscription;
      lastEl.innerHTML = `
        <span class="dashboard-last-filename">${t.filename || 'Sem nome'}</span>
        <span class="dashboard-last-time">${timeAgo(t.created_at)}</span>
      `;
      lastEl.style.cursor = t.status === 'complete' ? 'pointer' : 'default';
      lastEl.onclick = t.status === 'complete' ? () => openTranscriptionById(t.id) : null;
    } else {
      lastEl.innerHTML = '<span class="dashboard-last-empty">--</span>';
      lastEl.style.cursor = 'default';
      lastEl.onclick = null;
    }
  }

  // Lista recente
  const listEl = document.getElementById('dash-recent-list');
  const emptyEl = document.getElementById('dash-recent-empty');
  if (listEl) {
    // Limpar itens anteriores (exceto o empty state)
    listEl.querySelectorAll('.history-item').forEach(el => el.remove());

    if (stats.recent.length > 0) {
      if (emptyEl) emptyEl.classList.add('hidden');
      stats.recent.forEach(item => {
        listEl.appendChild(renderRecentItem(item));
      });
    } else {
      if (emptyEl) emptyEl.classList.remove('hidden');
    }
  }
}

function reAnimate() {
  const grid = document.getElementById('dashboard-grid');
  if (!grid) return;
  grid.classList.remove('dashboard-animate');
  void grid.offsetHeight;
  grid.classList.add('dashboard-animate');
}

export function initDashboard() {
  // Re-animar ao voltar para o dashboard
  state.on('dashboardVisible', () => {
    reAnimate();
    refreshDashboard();
  });

  // Atualizar quando transcrição completa
  state.on('transcriptionComplete', () => {
    refreshDashboard();
  });

  // Carga inicial
  refreshDashboard();
}

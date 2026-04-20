import * as state from './state.js';
import { formatTime } from './utils.js';
import { navigateTo } from './navigation.js';
import { seekTo } from './player.js';

const DEFAULT_PROMPT = `Analise a transcrição abaixo e identifique os principais tópicos discutidos.
Para cada tópico, forneça:
- Um título claro e descritivo
- Um breve resumo do que foi discutido
- O tempo de início (start_time) e fim (end_time) em segundos
- Os índices dos segmentos relacionados (segment_indices)

Também forneça um resumo geral (overall_summary) de toda a transcrição.`;

let currentAnalyses = [];
let selectedAnalysisId = null;
let drawerOpen = false;
let loadingContent = false;

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// === Drawer open/close ===

function openDrawer() {
  const drawer = document.getElementById('analysis-drawer');
  const btn = document.getElementById('btn-analyze-ai');
  if (drawer) {
    drawer.classList.add('open');
    drawerOpen = true;
  }
  if (btn) btn.classList.add('active');
}

function closeDrawer() {
  const drawer = document.getElementById('analysis-drawer');
  const btn = document.getElementById('btn-analyze-ai');
  if (drawer) {
    drawer.classList.remove('open');
    drawerOpen = false;
  }
  if (btn) btn.classList.remove('active');
}

// === Section visibility ===

function showSection(sectionId) {
  const sections = ['drawer-no-key', 'drawer-prompt-area', 'analysis-loading', 'drawer-analyses', 'drawer-detail'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', id !== sectionId);
  });
}

function showSections(...sectionIds) {
  const all = ['drawer-no-key', 'drawer-prompt-area', 'analysis-loading', 'drawer-analyses', 'drawer-detail'];
  all.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !sectionIds.includes(id));
  });
}

// === Badge ===

function updateBadge(count) {
  const badge = document.getElementById('btn-ai-badge');
  const label = document.getElementById('btn-ai-label');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
  if (label) {
    label.textContent = count > 0 ? `IA · ${count}` : 'Analisar com IA';
  }
}

async function refreshBadge() {
  const transcriptionId = state.get('currentTranscription');
  if (!transcriptionId) {
    updateBadge(0);
    return;
  }
  try {
    const analyses = await window.api.getAnalyses(transcriptionId);
    updateBadge(analyses.length);
  } catch {
    updateBadge(0);
  }
}

// === Init ===

export function initAnalysis() {
  // Toolbar button → toggle drawer
  document.getElementById('btn-analyze-ai')?.addEventListener('click', async () => {
    if (drawerOpen) {
      closeDrawer();
      return;
    }
    openDrawer();
    await loadDrawerContent();
  });

  // Close drawer
  document.getElementById('btn-close-drawer')?.addEventListener('click', closeDrawer);

  // Go to settings (no API key)
  document.getElementById('btn-goto-settings-key')?.addEventListener('click', () => {
    closeDrawer();
    navigateTo('settings');
  });

  // Link to get Gemini key
  document.getElementById('link-get-gemini-key')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.api.openFile('https://aistudio.google.com/apikey');
  });

  // Run analysis
  document.getElementById('btn-run-analysis')?.addEventListener('click', runAnalysis);

  // New analysis
  document.getElementById('btn-new-analysis')?.addEventListener('click', () => {
    selectedAnalysisId = null;
    showPromptArea();
  });

  // Back to list
  document.getElementById('btn-back-to-list')?.addEventListener('click', () => {
    selectedAnalysisId = null;
    showSections('drawer-prompt-area', 'drawer-analyses');
    renderAnalysisList();
    // Collapse prompt when there are analyses
    if (currentAnalyses.length > 0) {
      const promptArea = document.getElementById('drawer-prompt-area');
      if (promptArea) promptArea.classList.add('collapsed');
    }
  });

  // Close drawer on transcription change + refresh badge
  state.on('currentTranscription', () => {
    closeDrawer();
    selectedAnalysisId = null;
    currentAnalyses = [];
    refreshBadge();
  });

  // Close drawer on page navigation (Settings, Models, etc.)
  state.on('currentPage', () => {
    closeDrawer();
  });

  // Escape to close (but not when typing in textarea/input)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawerOpen) {
      const tag = e.target.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      closeDrawer();
    }
  });
}

// === Content loading ===

async function loadDrawerContent() {
  if (loadingContent) return;
  loadingContent = true;

  try {
    const config = await window.api.getConfig();
    if (!drawerOpen) return; // closed while loading

    if (!config.gemini_api_key) {
      showSection('drawer-no-key');
      return;
    }

    const transcriptionId = state.get('currentTranscription');
    if (!transcriptionId) {
      showSection('drawer-no-key');
      return;
    }

    try {
      currentAnalyses = await window.api.getAnalyses(transcriptionId);
    } catch {
      currentAnalyses = [];
    }

    if (!drawerOpen) return; // closed while loading

    if (currentAnalyses.length === 0) {
      showPromptArea();
    } else {
      showSections('drawer-prompt-area', 'drawer-analyses');
      renderAnalysisList();
      const promptArea = document.getElementById('drawer-prompt-area');
      if (promptArea) promptArea.classList.add('collapsed');
    }
  } finally {
    loadingContent = false;
  }
}

function showPromptArea() {
  const promptEl = document.getElementById('analysis-prompt');
  if (promptEl && !promptEl.value.trim()) {
    promptEl.value = DEFAULT_PROMPT;
  }
  const errorEl = document.getElementById('analysis-error');
  if (errorEl) errorEl.classList.add('hidden');

  if (currentAnalyses.length > 0) {
    showSections('drawer-prompt-area', 'drawer-analyses');
  } else {
    showSection('drawer-prompt-area');
  }
  const promptArea = document.getElementById('drawer-prompt-area');
  if (promptArea) promptArea.classList.remove('collapsed');
}

// === Run analysis ===

async function runAnalysis() {
  const transcriptionId = state.get('currentTranscription');
  if (!transcriptionId) return;

  const promptEl = document.getElementById('analysis-prompt');
  const errorEl = document.getElementById('analysis-error');
  const btnRun = document.getElementById('btn-run-analysis');

  const prompt = promptEl?.value?.trim();
  if (!prompt) return;

  // Show loading
  showSection('analysis-loading');
  if (btnRun) btnRun.disabled = true;
  if (errorEl) errorEl.classList.add('hidden');

  try {
    const analysis = await window.api.analyzeTranscription({ transcriptionId, prompt });

    // Reload analyses and show detail
    currentAnalyses = await window.api.getAnalyses(transcriptionId);
    selectedAnalysisId = analysis.id;
    showSections('drawer-detail', 'drawer-analyses');
    renderAnalysisDetail(analysis);
    renderAnalysisList();
    updateBadge(currentAnalyses.length);
  } catch (err) {
    console.error('[analysis] Error:', err);
    // Show prompt area again with error
    showPromptArea();
    if (errorEl) {
      errorEl.textContent = err.message || 'Erro ao analisar transcrição';
      errorEl.classList.remove('hidden');
    }
  } finally {
    if (btnRun) btnRun.disabled = false;
  }
}

// === Render list ===

function renderAnalysisList() {
  const container = document.getElementById('analysis-list');
  if (!container) return;

  container.innerHTML = currentAnalyses.map(analysis => {
    const date = new Date(analysis.created_at);
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const topicCount = analysis.result?.topics?.length || 0;
    const isSelected = analysis.id === selectedAnalysisId;

    return `
      <div class="drawer-analysis-item ${isSelected ? 'active' : ''}" data-id="${analysis.id}">
        <div class="drawer-item-top">
          <span class="drawer-item-topics">${topicCount} tópico${topicCount !== 1 ? 's' : ''}</span>
          <span class="drawer-item-date">${dateStr} ${timeStr}</span>
        </div>
        <div class="drawer-item-model">${analysis.model}</div>
        <div class="drawer-item-actions">
          <button class="drawer-item-btn btn-view-analysis" data-id="${analysis.id}" title="Ver detalhes">
            <span class="material-symbols-outlined" style="font-size:16px">visibility</span>
          </button>
          <button class="drawer-item-btn btn-delete-analysis" data-id="${analysis.id}" title="Excluir">
            <span class="material-symbols-outlined" style="font-size:16px">delete</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // View
  container.querySelectorAll('.btn-view-analysis').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      selectedAnalysisId = id;
      const analysis = currentAnalyses.find(a => a.id === id);
      if (analysis) {
        showSections('drawer-detail', 'drawer-analyses');
        renderAnalysisDetail(analysis);
        renderAnalysisList(); // update active state
      }
    });
  });

  // Delete
  container.querySelectorAll('.btn-delete-analysis').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      try {
        await window.api.deleteAnalysis(id);
        currentAnalyses = currentAnalyses.filter(a => a.id !== id);
        if (selectedAnalysisId === id) selectedAnalysisId = null;
        updateBadge(currentAnalyses.length);
        if (currentAnalyses.length === 0) {
          showPromptArea();
        } else {
          renderAnalysisList();
        }
      } catch (err) {
        console.error('[analysis] Delete error:', err);
      }
    });
  });

  // Click on item row
  container.querySelectorAll('.drawer-analysis-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      selectedAnalysisId = id;
      const analysis = currentAnalyses.find(a => a.id === id);
      if (analysis) {
        showSections('drawer-detail', 'drawer-analyses');
        renderAnalysisDetail(analysis);
        renderAnalysisList();
      }
    });
  });
}

// === Render detail ===

function renderAnalysisDetail(analysis) {
  const container = document.getElementById('analysis-detail-content');
  if (!container) return;

  const { result } = analysis;
  let html = '';

  // Overall summary
  if (result.overall_summary) {
    html += `
      <div class="drawer-summary">
        <div class="drawer-summary-label">Resumo Geral</div>
        <p class="drawer-summary-text">${escapeHtml(result.overall_summary)}</p>
      </div>
    `;
  }

  // Topics
  if (result.topics && result.topics.length > 0) {
    html += `<div class="drawer-topics-label">Tópicos (${result.topics.length})</div>`;
    html += result.topics.map((topic, i) => {
      const startFormatted = formatTime(topic.start_time);
      const endFormatted = formatTime(topic.end_time);

      return `
        <div class="drawer-topic" data-start="${topic.start_time}">
          <div class="drawer-topic-header">
            <span class="drawer-topic-number">${i + 1}</span>
            <span class="drawer-topic-title">${escapeHtml(topic.title)}</span>
          </div>
          <p class="drawer-topic-summary">${escapeHtml(topic.summary)}</p>
          <button class="drawer-topic-seek" data-start="${topic.start_time}">
            <span class="material-symbols-outlined" style="font-size:14px">play_arrow</span>
            ${startFormatted} — ${endFormatted}
          </button>
        </div>
      `;
    }).join('');
  }

  container.innerHTML = html;

  // Topic seek clicks
  container.querySelectorAll('.drawer-topic-seek').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      seekTo(btn.dataset.start);
    });
  });
}

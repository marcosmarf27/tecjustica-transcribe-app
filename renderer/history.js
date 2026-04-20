import * as state from './state.js';
import { showTranscriptionResult } from './results.js';
import { createPlayer } from './player.js';

// === Navegacao entre sub-views ===

export function showView(viewName) {
  const views = ['view-history', 'view-form', 'view-result'];
  views.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('hidden', id !== `view-${viewName}`);
    }
  });
}

// === Abrir transcricao por ID ===

export async function openTranscriptionById(id) {
  const data = await window.api.getTranscription(id);
  if (!data || data.status !== 'complete') return;

  const segments = data.segments_json ? JSON.parse(data.segments_json) : [];
  const files = data.files_json ? JSON.parse(data.files_json) : {};
  const speakerMap = data.speaker_map_json ? JSON.parse(data.speaker_map_json) : {};

  showTranscriptionResult({ segments, files, speakerMap }, data.filepath);

  if (data.filepath) {
    createPlayer(data.filepath);
  }

  state.set('currentTranscription', data.id);
  state.set('currentTranscriptionData', data);
  showView('result');
}

// === Inicializacao ===

export function initHistory() {
  // Botao "Nova transcricao"
  document.getElementById('btn-new-transcription')?.addEventListener('click', () => {
    showView('form');
  });

  // Botao empty state
  document.getElementById('btn-empty-new')?.addEventListener('click', () => {
    showView('form');
  });

  // Botao "Voltar ao historico" do formulario
  document.getElementById('btn-back-to-history')?.addEventListener('click', () => {
    showView('history');
    state.set('dashboardVisible', Date.now());
  });

  // Botao "Voltar ao historico" do resultado
  document.getElementById('btn-back-from-result')?.addEventListener('click', () => {
    // Parar player
    const player = document.getElementById('media-element');
    if (player) { player.pause(); }
    showView('history');
    state.set('dashboardVisible', Date.now());
  });

  // Auto-navegar para historico quando transcricao completa
  state.on('transcriptionComplete', () => {
    const viewForm = document.getElementById('view-form');
    if (viewForm && !viewForm.classList.contains('hidden')) {
      showView('history');
      state.set('dashboardVisible', Date.now());
    }
  });
}

import { formatTime, debounce } from './utils.js';
import { createPlayer, setSegments, getSegments, seekTo } from './player.js';
import * as state from './state.js';
import { showToast } from './toast.js';

let exportFiles = {};
let searchMatches = [];
let searchCurrentIndex = -1;
let currentSegments = [];
let speakerMap = {};
let activeSpeakerFilter = null;

const SPEAKER_COLORS = [
  '#5eb4ff',  // azul
  '#ff6b9d',  // rosa
  '#4ecdc4',  // teal
  '#ffe66d',  // amarelo
  '#a78bfa',  // roxo
  '#fb923c',  // laranja
];

function getSpeakerColor(speakerId, uniqueSpeakers) {
  const idx = uniqueSpeakers.indexOf(speakerId);
  return SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
}

export function getExportFiles() {
  return exportFiles;
}

function getUniqueSpeakers(segments) {
  const speakers = new Set();
  segments.forEach(seg => {
    if (seg.speaker) speakers.add(seg.speaker);
  });
  return [...speakers].sort();
}

function getSpeakerLabel(speakerId) {
  return speakerMap[speakerId] || speakerId;
}

// === Speaker Filter Bar ===

function buildSpeakerFilterBar(segments) {
  const filterBar = document.getElementById('speaker-filter-bar');
  if (!filterBar) return;

  const uniqueSpeakers = getUniqueSpeakers(segments);

  // Esconder se não tem diarização (0 ou 1 speaker)
  if (uniqueSpeakers.length <= 1) {
    filterBar.classList.add('hidden');
    return;
  }

  filterBar.classList.remove('hidden');
  filterBar.innerHTML = '';

  // Contar segmentos por speaker
  const counts = {};
  uniqueSpeakers.forEach(s => { counts[s] = 0; });
  segments.forEach(seg => {
    if (seg.speaker && counts[seg.speaker] !== undefined) counts[seg.speaker]++;
  });

  // Botão "Todos"
  const allBtn = document.createElement('button');
  allBtn.className = 'speaker-filter-btn' + (activeSpeakerFilter === null ? ' active' : '');
  allBtn.textContent = `Todos (${segments.length})`;
  allBtn.addEventListener('click', () => {
    activeSpeakerFilter = null;
    applyFilter();
    updateFilterButtons();
  });
  filterBar.appendChild(allBtn);

  // Botões por speaker
  uniqueSpeakers.forEach(speakerId => {
    const btn = document.createElement('button');
    const label = getSpeakerLabel(speakerId);
    const color = getSpeakerColor(speakerId, uniqueSpeakers);
    btn.className = 'speaker-filter-btn' + (activeSpeakerFilter === speakerId ? ' active' : '');
    btn.textContent = `${label} (${counts[speakerId]})`;
    btn.style.color = color;
    btn.style.borderColor = activeSpeakerFilter === speakerId ? color : '';
    btn.dataset.speakerId = speakerId;
    btn.addEventListener('click', () => {
      activeSpeakerFilter = activeSpeakerFilter === speakerId ? null : speakerId;
      applyFilter();
      updateFilterButtons();
    });
    filterBar.appendChild(btn);
  });
}

function updateFilterButtons() {
  const filterBar = document.getElementById('speaker-filter-bar');
  if (!filterBar) return;
  const uniqueSpeakers = getUniqueSpeakers(currentSegments);
  filterBar.querySelectorAll('.speaker-filter-btn').forEach(btn => {
    const sid = btn.dataset.speakerId;
    if (!sid) {
      // Botão "Todos"
      btn.classList.toggle('active', activeSpeakerFilter === null);
    } else {
      btn.classList.toggle('active', activeSpeakerFilter === sid);
      const color = getSpeakerColor(sid, uniqueSpeakers);
      btn.style.borderColor = activeSpeakerFilter === sid ? color : '';
      btn.textContent = `${getSpeakerLabel(sid)} (${currentSegments.filter(s => s.speaker === sid).length})`;
    }
  });
}

function applyFilter() {
  const segmentEls = document.querySelectorAll('#transcribe-segments .segment');
  segmentEls.forEach(el => {
    const idx = parseInt(el.dataset.index, 10);
    const seg = currentSegments[idx];
    if (!seg) return;
    if (activeSpeakerFilter === null) {
      el.classList.remove('hidden');
    } else {
      el.classList.toggle('hidden', seg.speaker !== activeSpeakerFilter);
    }
  });
}

// === Speaker Badge Editing ===

function startSpeakerEdit(badgeEl, speakerId) {
  const uniqueSpeakers = getUniqueSpeakers(currentSegments);
  const currentLabel = speakerMap[speakerId] || '';
  const color = getSpeakerColor(speakerId, uniqueSpeakers);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'speaker-edit-input';
  input.value = currentLabel;
  input.placeholder = speakerId;
  input.style.borderColor = color;

  badgeEl.textContent = '';
  badgeEl.appendChild(input);
  input.focus();
  input.select();

  const finishEdit = async () => {
    const newLabel = input.value.trim();
    if (newLabel && newLabel !== speakerId) {
      speakerMap[speakerId] = newLabel;
    } else if (!newLabel) {
      delete speakerMap[speakerId];
    }

    // Persistir
    const transcriptionId = state.get('currentTranscription');
    if (transcriptionId) {
      await window.api.updateSpeakerMap(transcriptionId, speakerMap);
    }

    // Re-renderizar todos os badges do mesmo speaker
    updateAllSpeakerBadges(speakerId);
    // Atualizar barra de filtro
    buildSpeakerFilterBar(currentSegments);
    // Mostrar re-export
    showReExportButton();
  };

  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      // Remover listener ANTES de mexer no DOM (textContent causa blur)
      input.removeEventListener('blur', finishEdit);
      // Cancelar — restaurar badge sem salvar
      const label = getSpeakerLabel(speakerId);
      badgeEl.textContent = label;
      badgeEl.style.color = color;
      badgeEl.style.backgroundColor = color + '20';
    }
  });
}

function updateAllSpeakerBadges(speakerId) {
  const uniqueSpeakers = getUniqueSpeakers(currentSegments);
  const color = getSpeakerColor(speakerId, uniqueSpeakers);
  const label = getSpeakerLabel(speakerId);

  document.querySelectorAll(`.segment-speaker[data-speaker="${speakerId}"]`).forEach(badge => {
    badge.textContent = label;
    badge.style.color = color;
    badge.style.backgroundColor = color + '20';
  });
}

// === Main render ===

export function showTranscriptionResult(result, filePath) {
  const segments = result.segments || [];
  exportFiles = result.files || {};
  currentSegments = segments;
  speakerMap = result.speakerMap || {};
  activeSpeakerFilter = null;
  console.log('[results] exportFiles:', exportFiles);

  setSegments(segments);
  clearSearch();
  hideReExportButton();

  // Mostrar player de midia
  if (filePath) {
    createPlayer(filePath);
  }

  const uniqueSpeakers = getUniqueSpeakers(segments);

  // Mostrar segmentos
  const segmentsEl = document.getElementById('transcribe-segments');
  if (segmentsEl) {
    segmentsEl.innerHTML = '';
    segments.forEach((seg, i) => {
      const div = document.createElement('div');
      div.className = 'segment';
      div.dataset.index = i;
      if (seg._edited) div.classList.add('segment-edited');

      const time = formatTime(seg.start);

      // Timestamp
      const timeSpan = document.createElement('span');
      timeSpan.className = 'segment-time';
      timeSpan.textContent = time;
      div.appendChild(timeSpan);

      // Speaker badge
      const speakerSpan = document.createElement('span');
      if (seg.speaker) {
        const color = getSpeakerColor(seg.speaker, uniqueSpeakers);
        const label = getSpeakerLabel(seg.speaker);
        speakerSpan.className = 'segment-speaker';
        speakerSpan.textContent = label;
        speakerSpan.dataset.speaker = seg.speaker;
        speakerSpan.style.color = color;
        speakerSpan.style.backgroundColor = color + '20';
        speakerSpan.title = 'Clique para rotular este falante';

        // Click para editar label
        speakerSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          // Não editar se já tem input dentro
          if (speakerSpan.querySelector('input')) return;
          startSpeakerEdit(speakerSpan, seg.speaker);
        });
      } else {
        speakerSpan.className = 'segment-speaker';
      }
      div.appendChild(speakerSpan);

      // Text
      const textSpan = document.createElement('span');
      textSpan.className = 'segment-text';
      textSpan.textContent = seg.text?.trim() || '';
      div.appendChild(textSpan);

      // Clicar num segmento posiciona o player
      div.addEventListener('click', () => {
        seekTo(seg.start);
      });

      // Double-click para editar texto
      textSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (textSpan.contentEditable === 'true') return;
        textSpan.dataset.backup = textSpan.textContent;
        textSpan.contentEditable = 'true';
        textSpan.focus();
        const range = document.createRange();
        range.selectNodeContents(textSpan);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      });

      textSpan.addEventListener('blur', async () => {
        if (textSpan.contentEditable !== 'true') return;
        textSpan.contentEditable = 'false';
        const newText = textSpan.textContent;
        if (newText !== textSpan.dataset.backup) {
          currentSegments[i].text = newText;
          currentSegments[i]._edited = true;
          div.classList.add('segment-edited');
          textSpan.dataset.originalText = newText;
          const transcriptionId = state.get('currentTranscription');
          if (transcriptionId) {
            await window.api.updateSegments(transcriptionId, currentSegments);
          }
          showReExportButton();
        }
      });

      textSpan.addEventListener('keydown', (e) => {
        if (textSpan.contentEditable !== 'true') return;
        if (e.key === 'Escape') {
          e.stopPropagation();
          textSpan.textContent = textSpan.dataset.backup;
          textSpan.contentEditable = 'false';
        }
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          textSpan.blur();
        }
      });

      segmentsEl.appendChild(div);
    });
  }

  // Construir barra de filtro de speakers
  buildSpeakerFilterBar(segments);

  // Verificar se tem segmentos editados
  if (segments.some(s => s._edited)) {
    showReExportButton();
  }
}

function showReExportButton() {
  const btn = document.getElementById('btn-re-export');
  if (btn) btn.classList.remove('hidden');
}

function hideReExportButton() {
  const btn = document.getElementById('btn-re-export');
  if (btn) btn.classList.add('hidden');
}

// === Search ===

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatches(query) {
  const segments = document.querySelectorAll('.segment-text');
  searchMatches = [];
  searchCurrentIndex = -1;

  segments.forEach(seg => {
    const original = seg.dataset.originalText || seg.textContent;
    seg.dataset.originalText = original;

    if (!query) {
      seg.textContent = original;
      return;
    }

    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    seg.innerHTML = original.replace(regex, '<mark class="search-highlight">$1</mark>');
    seg.querySelectorAll('mark').forEach(m => searchMatches.push(m));
  });

  updateSearchCount();

  if (searchMatches.length > 0) {
    navigateMatch(0);
  }
}

function navigateMatch(direction) {
  if (searchMatches.length === 0) return;

  // Remove active do anterior
  if (searchCurrentIndex >= 0 && searchCurrentIndex < searchMatches.length) {
    searchMatches[searchCurrentIndex].classList.remove('search-highlight-active');
  }

  if (typeof direction === 'number' && direction === 0) {
    searchCurrentIndex = 0;
  } else if (direction === 'next') {
    searchCurrentIndex = (searchCurrentIndex + 1) % searchMatches.length;
  } else if (direction === 'prev') {
    searchCurrentIndex = (searchCurrentIndex - 1 + searchMatches.length) % searchMatches.length;
  }

  searchMatches[searchCurrentIndex].classList.add('search-highlight-active');
  searchMatches[searchCurrentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  updateSearchCount();
}

function updateSearchCount() {
  const countEl = document.getElementById('search-count');
  if (!countEl) return;

  if (searchMatches.length === 0) {
    const input = document.getElementById('search-input');
    if (input && input.value.trim()) {
      countEl.textContent = '0/0';
      countEl.classList.remove('hidden');
    } else {
      countEl.classList.add('hidden');
    }
    return;
  }

  countEl.textContent = `${searchCurrentIndex + 1}/${searchMatches.length}`;
  countEl.classList.remove('hidden');
}

function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';

  const segments = document.querySelectorAll('.segment-text');
  segments.forEach(seg => {
    if (seg.dataset.originalText) {
      seg.textContent = seg.dataset.originalText;
    }
  });

  searchMatches = [];
  searchCurrentIndex = -1;

  const countEl = document.getElementById('search-count');
  if (countEl) countEl.classList.add('hidden');
}

export function initResults() {
  const openExportFile = async (type) => {
    const filePath = exportFiles[type];
    if (!filePath) {
      console.warn(`[results] No ${type} file path in exportFiles:`, exportFiles);
      showToast(`Arquivo ${type.toUpperCase()} não disponível`);
      return;
    }
    const result = await window.api.openFile(filePath);
    if (result) {
      console.error(`[results] Failed to open ${type} file "${filePath}":`, result);
      showToast(`Não foi possível abrir o arquivo: ${result}`);
    }
  };

  document.getElementById('btn-open-txt')?.addEventListener('click', () => openExportFile('txt'));
  document.getElementById('btn-open-srt')?.addEventListener('click', () => openExportFile('srt'));
  document.getElementById('btn-open-json')?.addEventListener('click', () => openExportFile('json'));

  document.getElementById('btn-copy-text')?.addEventListener('click', async () => {
    const segments = getSegments();
    const text = segments
      .map((seg) => {
        const label = seg.speaker ? (speakerMap[seg.speaker] || seg.speaker) : '';
        const prefix = label ? `[${label}] ` : '';
        return `${prefix}${seg.text?.trim() || ''}`;
      })
      .join('\n');
    await navigator.clipboard.writeText(text);

    const btn = document.getElementById('btn-copy-text');
    if (btn) {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Copiado!';
      setTimeout(() => { btn.innerHTML = originalHTML; }, 1500);
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
      const ext = savePath.split('.').pop().toLowerCase();
      const source = exportFiles[ext] || exportFiles.txt;
      window.api.openFile(source);
    }
  });

  // === Re-export listener ===
  document.getElementById('btn-re-export')?.addEventListener('click', async () => {
    const transcriptionId = state.get('currentTranscription');
    if (!transcriptionId) return;
    const btn = document.getElementById('btn-re-export');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined text-sm">hourglass_empty</span> Exportando...';
    btn.disabled = true;
    try {
      await window.api.reExport(transcriptionId);
      btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Exportado!';
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }, 1500);
    } catch {
      btn.innerHTML = '<span class="material-symbols-outlined text-sm">error</span> Erro';
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }, 2000);
    }
  });

  // === Export DOCX listener ===
  document.getElementById('btn-export-docx')?.addEventListener('click', async () => {
    const transcriptionId = state.get('currentTranscription');
    if (!transcriptionId) return;
    const btn = document.getElementById('btn-export-docx');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined text-sm">hourglass_empty</span> Gerando...';
    btn.disabled = true;
    try {
      const result = await window.api.exportDocx(transcriptionId);
      if (result?.ok) {
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Pronto!';
        showToast('Relatório DOCX gerado com sucesso', { label: 'Abrir arquivo', onClick: () => window.api.openFile(result.filePath) });
      } else {
        console.error('[export-docx] Failed:', result?.message);
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">error</span> Erro';
        showToast(`Erro ao gerar DOCX: ${result?.message || 'desconhecido'}`);
      }
      setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 2000);
    } catch (err) {
      console.error('[export-docx] Exception:', err);
      btn.innerHTML = '<span class="material-symbols-outlined text-sm">error</span> Erro';
      showToast(`Erro ao gerar DOCX: ${err.message || 'desconhecido'}`);
      setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 2000);
    }
  });

  // === Search listeners ===
  const searchInput = document.getElementById('search-input');
  const debouncedSearch = debounce((query) => highlightMatches(query), 300);

  searchInput?.addEventListener('input', (e) => {
    debouncedSearch(e.target.value.trim());
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      navigateMatch('next');
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      navigateMatch('prev');
    } else if (e.key === 'Escape') {
      clearSearch();
      searchInput.blur();
    }
  });

  document.getElementById('search-next')?.addEventListener('click', () => navigateMatch('next'));
  document.getElementById('search-prev')?.addEventListener('click', () => navigateMatch('prev'));
  document.getElementById('search-clear')?.addEventListener('click', () => clearSearch());

  // Ctrl+F para focar na busca
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      const viewResult = document.getElementById('view-result');
      if (viewResult && !viewResult.classList.contains('hidden')) {
        e.preventDefault();
        searchInput?.focus();
      }
    }
  });
}

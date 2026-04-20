import * as state from './state.js';
import { formatTime } from './utils.js';

// === State ===
let chatOpen = false;
let chatExpanded = false;
let conversations = [];
let activeConversationId = null;
let messages = [];
let isStreaming = false;
let streamBuffer = '';
let partialCitation = '';

const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

// === DOM refs ===
function $(id) { return document.getElementById(id); }

// === Visibility ===

function shouldShowBubble() {
  const page = state.get('currentPage');
  const viewResult = $('view-result');
  const transcriptionId = state.get('currentTranscription');
  return page === 'transcription'
    && viewResult && !viewResult.classList.contains('hidden')
    && !!transcriptionId;
}

function updateBubbleVisibility() {
  const bubble = $('chat-bubble');
  if (!bubble) return;
  bubble.classList.toggle('visible', shouldShowBubble());
  // Se bolha some e chat tá aberto, fechar
  if (!shouldShowBubble() && chatOpen) {
    closeChat();
  }
}

// === Open / Close ===

function openChat() {
  const modal = $('chat-modal');
  if (!modal) return;
  chatOpen = true;
  modal.classList.add('open');
  $('chat-bubble')?.classList.add('chat-bubble-hidden');
  loadConversations();
  // Focus no input
  setTimeout(() => $('chat-input')?.focus(), 200);
}

function closeChat() {
  const modal = $('chat-modal');
  if (!modal) return;
  chatOpen = false;
  chatExpanded = false;
  modal.classList.remove('open', 'expanded');
  $('chat-bubble')?.classList.remove('chat-bubble-hidden');
  updateExpandIcon();
}

function toggleExpand() {
  const modal = $('chat-modal');
  if (!modal) return;
  chatExpanded = !chatExpanded;
  modal.classList.toggle('expanded', chatExpanded);
  updateExpandIcon();
}

function updateExpandIcon() {
  const btn = $('chat-expand-btn');
  if (!btn) return;
  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon) icon.textContent = chatExpanded ? 'close_fullscreen' : 'open_in_full';
  btn.title = chatExpanded ? 'Reduzir' : 'Expandir';
}

// === Conversations ===

async function loadConversations() {
  const transcriptionId = state.get('currentTranscription');
  if (!transcriptionId) return;
  try {
    conversations = await window.api.chatGetConversations(transcriptionId);
  } catch {
    conversations = [];
  }
  renderConversationDropdown();
  if (conversations.length > 0 && !activeConversationId) {
    selectConversation(conversations[0].id);
  } else if (activeConversationId) {
    selectConversation(activeConversationId);
  } else {
    messages = [];
    renderMessages();
    showEmptyState();
  }
}

function renderConversationDropdown() {
  const select = $('chat-conversation-select');
  if (!select) return;
  select.innerHTML = '';
  if (conversations.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Nova conversa';
    select.appendChild(opt);
    return;
  }
  conversations.forEach((conv) => {
    const opt = document.createElement('option');
    opt.value = conv.id;
    opt.textContent = conv.title || 'Conversa sem título';
    select.appendChild(opt);
  });
  if (activeConversationId) {
    select.value = activeConversationId;
  }
}

function selectConversation(id) {
  activeConversationId = id;
  const conv = conversations.find(c => c.id === id);
  if (conv) {
    messages = [...(conv.messages || [])];
  } else {
    messages = [];
  }
  renderConversationDropdown();
  const select = $('chat-conversation-select');
  if (select) select.value = id || '';
  renderMessages();
  scrollToBottom();
  hideEmptyState();
}

function startNewConversation() {
  activeConversationId = null;
  messages = [];
  renderMessages();
  showEmptyState();
  $('chat-input')?.focus();
}

async function deleteCurrentConversation() {
  if (!activeConversationId) return;
  try {
    await window.api.chatDeleteConversation(activeConversationId);
    conversations = conversations.filter(c => c.id !== activeConversationId);
    activeConversationId = null;
    if (conversations.length > 0) {
      selectConversation(conversations[0].id);
    } else {
      messages = [];
      renderMessages();
      showEmptyState();
    }
    renderConversationDropdown();
  } catch (err) {
    console.error('[chat] Delete error:', err);
  }
}

// === Empty state ===

function showEmptyState() {
  const empty = $('chat-empty-state');
  const msgArea = $('chat-messages');
  if (empty) empty.classList.remove('hidden');
  if (msgArea) msgArea.classList.add('has-empty');
}

function hideEmptyState() {
  const empty = $('chat-empty-state');
  const msgArea = $('chat-messages');
  if (empty) empty.classList.add('hidden');
  if (msgArea) msgArea.classList.remove('has-empty');
}

// === Messages rendering ===

function renderMessages() {
  const container = $('chat-messages');
  if (!container) return;
  // Remove all message elements (keep empty state)
  container.querySelectorAll('.chat-msg').forEach(el => el.remove());

  messages.forEach(msg => {
    const el = createMessageElement(msg.role, msg.content);
    container.appendChild(el);
  });
  scrollToBottom();
}

function createMessageElement(role, content) {
  const div = document.createElement('div');
  div.className = `chat-msg chat-msg-${role}`;

  if (role === 'user') {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble-msg';
    bubble.textContent = content;
    div.appendChild(bubble);
  } else {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble-msg';
    bubble.innerHTML = parseCitations(content);
    div.appendChild(bubble);
    // Activate clip players
    setTimeout(() => activateClipPlayers(bubble), 50);
  }
  return div;
}

function scrollToBottom() {
  const container = $('chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// === Citation parsing ===
// Format: «HH:MM:SS-HH:MM:SS|Falante|"texto"»

function parseCitations(text) {
  if (!text) return '';
  // Escape HTML first
  let html = escapeHtml(text);
  // Replace citation markers with clip cards
  const citationRegex = /«(\d{2}:\d{2}:\d{2})-(\d{2}:\d{2}:\d{2})\|([^|]+)\|&quot;([^»]*?)&quot;»/g;
  html = html.replace(citationRegex, (_, startTs, endTs, speaker, excerpt) => {
    const startSec = timestampToSeconds(startTs);
    const endSec = timestampToSeconds(endTs);
    const duration = endSec - startSec;
    return buildClipCardHtml(startTs, endTs, startSec, endSec, speaker, unescapeHtml(excerpt), duration);
  });
  // Convert newlines to <br>
  html = html.replace(/\n/g, '<br>');
  return html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function unescapeHtml(str) {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

function timestampToSeconds(ts) {
  const parts = ts.split(':').map(Number);
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function buildClipCardHtml(startTs, endTs, startSec, endSec, speaker, excerpt, duration) {
  const clipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const durationFormatted = formatTime(duration);
  const truncatedExcerpt = excerpt.length > 80 ? excerpt.substring(0, 80) + '...' : excerpt;

  return `<div class="chat-clip-card" data-clip-id="${clipId}" data-start="${startSec}" data-end="${endSec}">
    <div class="clip-header">
      <button class="clip-play-btn" data-clip-id="${clipId}" title="Reproduzir trecho">
        <span class="material-symbols-outlined" style="font-size:18px">play_arrow</span>
      </button>
      <span class="clip-speaker">${escapeHtml(speaker)}</span>
      <span class="clip-range">${startTs} — ${endTs}</span>
    </div>
    <div class="clip-progress-container" data-clip-id="${clipId}">
      <div class="clip-progress-bar"><div class="clip-progress-fill" data-clip-id="${clipId}"></div></div>
      <span class="clip-time" data-clip-id="${clipId}">0:00/${durationFormatted}</span>
    </div>
    <div class="clip-excerpt">"${escapeHtml(truncatedExcerpt)}"</div>
    <div class="clip-media-container" data-clip-id="${clipId}"></div>
  </div>`;
}

// === Clip player logic ===

const activeClips = {};

function activateClipPlayers(container) {
  container.querySelectorAll('.clip-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const clipId = btn.dataset.clipId;
      toggleClipPlayback(clipId);
    });
  });
}

function toggleClipPlayback(clipId) {
  const card = document.querySelector(`.chat-clip-card[data-clip-id="${clipId}"]`);
  if (!card) return;

  const startSec = parseFloat(card.dataset.start);
  const endSec = parseFloat(card.dataset.end);

  // Se já tem um player ativo pra esse clip
  if (activeClips[clipId]) {
    const player = activeClips[clipId];
    if (player.paused) {
      player.play().catch(() => {});
      updatePlayBtn(clipId, true);
    } else {
      player.pause();
      updatePlayBtn(clipId, false);
    }
    return;
  }

  // Pausar todos os outros clips
  Object.keys(activeClips).forEach(id => {
    if (id !== clipId && activeClips[id]) {
      activeClips[id].pause();
      updatePlayBtn(id, false);
    }
  });

  // Criar media element
  const transcription = getCurrentTranscriptionData();
  if (!transcription?.filepath) return;

  const mediaContainer = card.querySelector('.clip-media-container');
  if (!mediaContainer) return;

  const ext = '.' + transcription.filepath.split('.').pop().toLowerCase();
  const isVideo = videoExtensions.includes(ext);

  const player = document.createElement(isVideo ? 'video' : 'audio');
  player.preload = 'auto';
  const filePath = transcription.filepath;
  player.src = filePath.startsWith('/')
    ? `file://${filePath}`
    : `file:///${filePath.replace(/\\/g, '/')}`;

  if (isVideo) {
    mediaContainer.appendChild(player);
    mediaContainer.style.display = 'block';
  }

  activeClips[clipId] = player;

  // When metadata loaded, seek to start
  player.addEventListener('loadedmetadata', () => {
    player.currentTime = Math.min(startSec, player.duration - 0.5);
    player.play().catch(() => {});
    updatePlayBtn(clipId, true);
  });

  // Time update for progress and auto-stop
  player.addEventListener('timeupdate', () => {
    if (player.currentTime >= endSec) {
      player.pause();
      player.currentTime = startSec;
      updatePlayBtn(clipId, false);
      updateClipProgress(clipId, 0, endSec - startSec);
      return;
    }
    const elapsed = player.currentTime - startSec;
    const duration = endSec - startSec;
    updateClipProgress(clipId, elapsed, duration);
  });

  player.addEventListener('ended', () => {
    updatePlayBtn(clipId, false);
  });

  // Start loading
  player.load();
}

function updatePlayBtn(clipId, playing) {
  const btn = document.querySelector(`.clip-play-btn[data-clip-id="${clipId}"]`);
  if (!btn) return;
  btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">${playing ? 'pause' : 'play_arrow'}</span>`;
}

function updateClipProgress(clipId, elapsed, duration) {
  const fill = document.querySelector(`.clip-progress-fill[data-clip-id="${clipId}"]`);
  const timeEl = document.querySelector(`.clip-time[data-clip-id="${clipId}"]`);
  if (fill) {
    const pct = duration > 0 ? (elapsed / duration) * 100 : 0;
    fill.style.width = `${pct}%`;
  }
  if (timeEl) {
    timeEl.textContent = `${formatTime(Math.max(0, elapsed))}/${formatTime(duration)}`;
  }
}

function getCurrentTranscriptionData() {
  // Tenta pegar do state, se não tem busca pelo ID
  return state.get('currentTranscriptionData') || null;
}

// === Streaming ===

function addTypingIndicator() {
  const container = $('chat-messages');
  if (!container) return;
  // Remove existing
  container.querySelector('.chat-typing')?.remove();

  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg-assistant chat-typing';
  div.innerHTML = `<div class="chat-bubble-msg">
    <div class="typing-dots"><span></span><span></span><span></span></div>
  </div>`;
  container.appendChild(div);
  scrollToBottom();
}

function removeTypingIndicator() {
  $('chat-messages')?.querySelector('.chat-typing')?.remove();
}

function startStreamingMessage() {
  removeTypingIndicator();
  const container = $('chat-messages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg-assistant chat-streaming-msg';
  div.innerHTML = '<div class="chat-bubble-msg"></div>';
  container.appendChild(div);
  scrollToBottom();
}

function appendStreamChunk(text) {
  streamBuffer += text;
  const msgEl = $('chat-messages')?.querySelector('.chat-streaming-msg .chat-bubble-msg');
  if (!msgEl) return;

  // Check for partial citation at the end
  const lastOpen = streamBuffer.lastIndexOf('«');
  const lastClose = streamBuffer.lastIndexOf('»');

  let displayText;
  if (lastOpen > lastClose) {
    // Partial citation in progress — show text up to the «
    displayText = streamBuffer.substring(0, lastOpen);
    partialCitation = streamBuffer.substring(lastOpen);
  } else {
    displayText = streamBuffer;
    partialCitation = '';
  }

  msgEl.innerHTML = parseCitations(displayText);
  activateClipPlayers(msgEl);
  scrollToBottom();
}

function finalizeStreamingMessage() {
  // Process any remaining partial citation
  const msgEl = $('chat-messages')?.querySelector('.chat-streaming-msg .chat-bubble-msg');
  if (msgEl) {
    msgEl.innerHTML = parseCitations(streamBuffer);
    activateClipPlayers(msgEl);
  }

  // Remove streaming class
  const streamingMsg = $('chat-messages')?.querySelector('.chat-streaming-msg');
  if (streamingMsg) {
    streamingMsg.classList.remove('chat-streaming-msg');
  }

  // Save to messages
  const assistantContent = streamBuffer;
  messages.push({
    role: 'assistant',
    content: assistantContent,
    timestamp: new Date().toISOString()
  });

  streamBuffer = '';
  partialCitation = '';
  isStreaming = false;
  updateInputState();
  scrollToBottom();
}

// === Send message ===

async function sendMessage() {
  const input = $('chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text || isStreaming) return;

  const transcriptionId = state.get('currentTranscription');
  if (!transcriptionId) return;

  hideEmptyState();

  // Add user message to DOM
  messages.push({
    role: 'user',
    content: text,
    timestamp: new Date().toISOString()
  });

  const container = $('chat-messages');
  if (container) {
    const el = createMessageElement('user', text);
    container.appendChild(el);
  }

  input.value = '';
  isStreaming = true;
  streamBuffer = '';
  partialCitation = '';
  updateInputState();
  scrollToBottom();

  // Typing indicator
  addTypingIndicator();

  // Send via IPC
  try {
    await window.api.chatSendMessage({
      transcriptionId,
      conversationId: activeConversationId,
      message: text,
      history: messages.slice(0, -1) // history without the message just added
    });
  } catch (err) {
    removeTypingIndicator();
    isStreaming = false;
    updateInputState();
    // Show error message
    const errDiv = createMessageElement('assistant', `Erro: ${err.message || 'Falha ao enviar mensagem'}`);
    container?.appendChild(errDiv);
    scrollToBottom();
  }
}

function updateInputState() {
  const btn = $('chat-send-btn');
  const input = $('chat-input');
  if (btn) btn.disabled = isStreaming;
  if (input) input.disabled = isStreaming;
}

// === IPC listeners ===

function setupStreamListeners() {
  window.api.onChatStreamChunk((data) => {
    if (!isStreaming) {
      // First chunk — remove typing, start streaming message
      isStreaming = true;
      startStreamingMessage();
    }
    // Remove typing if still present (first chunk)
    removeTypingIndicator();
    if (!$('chat-messages')?.querySelector('.chat-streaming-msg')) {
      startStreamingMessage();
    }
    appendStreamChunk(data.text);
  });

  window.api.onChatStreamDone(async (data) => {
    removeTypingIndicator();
    finalizeStreamingMessage();

    // Save conversation
    if (data.conversationId) {
      activeConversationId = data.conversationId;
    }
    // Reload conversations to get updated list
    const transcriptionId = state.get('currentTranscription');
    if (transcriptionId) {
      try {
        conversations = await window.api.chatGetConversations(transcriptionId);
        renderConversationDropdown();
        const select = $('chat-conversation-select');
        if (select) select.value = activeConversationId || '';
      } catch { /* ignore */ }
    }
  });

  window.api.onChatStreamError((data) => {
    removeTypingIndicator();
    isStreaming = false;
    streamBuffer = '';
    updateInputState();

    const container = $('chat-messages');
    if (container) {
      const errDiv = createMessageElement('assistant', `Erro: ${data.error || 'Erro desconhecido'}`);
      container.appendChild(errDiv);
      scrollToBottom();
    }
  });
}

// === Init ===

export function initChat() {
  // Bubble click
  $('chat-bubble')?.addEventListener('click', () => {
    if (chatOpen) closeChat();
    else openChat();
  });

  // Close button
  $('chat-close-btn')?.addEventListener('click', closeChat);

  // Expand button
  $('chat-expand-btn')?.addEventListener('click', toggleExpand);

  // Send button
  $('chat-send-btn')?.addEventListener('click', sendMessage);

  // Enter to send
  $('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // New conversation
  $('chat-new-btn')?.addEventListener('click', startNewConversation);

  // Delete conversation
  $('chat-delete-btn')?.addEventListener('click', deleteCurrentConversation);

  // Conversation select
  $('chat-conversation-select')?.addEventListener('change', (e) => {
    const id = e.target.value;
    if (id) selectConversation(id);
  });

  // Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatOpen) {
      const tag = e.target.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      closeChat();
    }
  });

  // React to state changes
  state.on('currentPage', updateBubbleVisibility);
  state.on('currentTranscription', () => {
    activeConversationId = null;
    messages = [];
    conversations = [];
    // Clean up active clips
    Object.keys(activeClips).forEach(id => {
      activeClips[id]?.pause();
      delete activeClips[id];
    });
    updateBubbleVisibility();
  });

  // When view-result becomes visible, show bubble
  const observer = new MutationObserver(() => updateBubbleVisibility());
  const viewResult = $('view-result');
  if (viewResult) {
    observer.observe(viewResult, { attributes: true, attributeFilter: ['class'] });
  }

  // Setup IPC stream listeners
  setupStreamListeners();
}

const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm'];

let transcriptionSegments = [];

export function setSegments(segments) {
  transcriptionSegments = segments;
}

export function getSegments() {
  return transcriptionSegments;
}

export function createPlayer(filePath) {
  const mediaEl = document.getElementById('media-player');
  const playerContainer = document.getElementById('player-container');
  if (!mediaEl || !playerContainer || !filePath) return;

  const ext = '.' + filePath.split('.').pop().toLowerCase();
  const isVideo = videoExtensions.includes(ext);

  playerContainer.innerHTML = '';
  const player = document.createElement(isVideo ? 'video' : 'audio');
  player.id = 'media-element';
  player.controls = true;
  // Windows: file:///C:/path, Linux: file:///home/path
  player.src = filePath.startsWith('/')
    ? `file://${filePath}`
    : `file:///${filePath.replace(/\\/g, '/')}`;
  player.preload = 'auto';
  if (isVideo) {
    player.style.width = '100%';
    player.style.maxHeight = '300px';
  }
  playerContainer.appendChild(player);
  mediaEl.classList.remove('hidden');

  // Sincronizacao: highlight do segmento ativo
  let lastUpdate = 0;
  player.addEventListener('timeupdate', () => {
    const now = Date.now();
    if (now - lastUpdate < 500) return;
    lastUpdate = now;
    highlightActiveSegment(player.currentTime);
  });
}

let lastActiveIndex = -1;

export function seekTo(seconds) {
  const player = document.getElementById('media-element');
  if (!player) return;

  const time = parseFloat(seconds);
  if (isNaN(time) || time < 0) return;

  // Se metadata ainda não carregou, esperar
  if (player.readyState < 1) {
    player.addEventListener('loadedmetadata', () => seekTo(seconds), { once: true });
    return;
  }

  // Clampar ao range válido do vídeo
  const target = player.duration ? Math.min(time, player.duration - 0.5) : time;

  player.addEventListener('seeked', () => {
    player.play().catch(() => {});
  }, { once: true });

  player.currentTime = target;
}

export function highlightActiveSegment(currentTime) {
  const segments = document.querySelectorAll('.segment');
  let activeIndex = -1;
  segments.forEach((el, i) => {
    const seg = transcriptionSegments[i];
    if (seg && currentTime >= seg.start && currentTime <= seg.end) {
      el.classList.add('segment-active');
      activeIndex = i;
    } else {
      el.classList.remove('segment-active');
    }
  });

  // Auto-scroll quando muda de segmento ativo
  if (activeIndex >= 0 && activeIndex !== lastActiveIndex) {
    lastActiveIndex = activeIndex;
    const activeEl = segments[activeIndex];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

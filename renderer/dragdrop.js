import { setSelectedFilePath } from './transcription.js';
import { showView } from './history.js';

const VALID_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.mp4', '.mkv', '.avi', '.mov', '.webm'];

export function initDragDrop() {
  const page = document.getElementById('page-transcription');
  const overlay = document.getElementById('drop-overlay');
  if (!page || !overlay) return;

  let dragCounter = 0;

  page.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    overlay.classList.remove('hidden');
  });

  page.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      overlay.classList.add('hidden');
    }
  });

  page.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  page.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    overlay.classList.add('hidden');

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!VALID_EXTENSIONS.includes(ext)) return;

    const filePath = window.api.getFilePath(file);
    if (filePath) {
      setSelectedFilePath(filePath);
      showView('form');
    }
  });
}

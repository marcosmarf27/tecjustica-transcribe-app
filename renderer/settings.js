import * as state from './state.js';

export async function loadSettings() {
  const config = await window.api.getConfig();

  const tokenEl = document.getElementById('setting-hf-token');
  const outputEl = document.getElementById('setting-output-dir');
  const deviceEl = document.getElementById('setting-device');
  const batchEl = document.getElementById('setting-batch-size');

  if (tokenEl) tokenEl.value = config.hf_token || '';
  if (outputEl) outputEl.value = config.output_dir || './transcricoes';
  if (deviceEl) deviceEl.value = config.device || 'auto';
  if (batchEl) batchEl.value = config.batch_size || 0;

  const geminiEl = document.getElementById('setting-gemini-api-key');
  if (geminiEl) geminiEl.value = config.gemini_api_key || '';
}

export function initSettings() {
  document.getElementById('btn-toggle-token')?.addEventListener('click', () => {
    const input = document.getElementById('setting-hf-token');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  });

  document.getElementById('btn-toggle-gemini-key')?.addEventListener('click', () => {
    const input = document.getElementById('setting-gemini-api-key');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btn-select-output-dir')?.addEventListener('click', async () => {
    const dir = await window.api.selectDirectory();
    if (dir) {
      document.getElementById('setting-output-dir').value = dir;
    }
  });

  // Links externos (abrir no navegador do sistema)
  ['link-hf-token', 'link-pyannote-diar', 'link-pyannote-seg', 'link-gemini-key'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault();
      const urls = {
        'link-hf-token': 'https://huggingface.co/settings/tokens',
        'link-pyannote-diar': 'https://huggingface.co/pyannote/speaker-diarization-3.1',
        'link-pyannote-seg': 'https://huggingface.co/pyannote/segmentation-3.0',
        'link-gemini-key': 'https://aistudio.google.com/apikey',
      };
      const url = urls[id];
      if (url) window.api.openFile(url);
    });
  });

  document.getElementById('btn-save-settings')?.addEventListener('click', async () => {
    const existing = await window.api.getConfig();
    const config = {
      ...existing,
      hf_token: document.getElementById('setting-hf-token')?.value?.trim() || '',
      output_dir: document.getElementById('setting-output-dir')?.value || './transcricoes',
      device: document.getElementById('setting-device')?.value || 'auto',
      batch_size: parseInt(document.getElementById('setting-batch-size')?.value || '0', 10),
      gemini_api_key: document.getElementById('setting-gemini-api-key')?.value || '',
    };
    await window.api.saveConfig(config);

    const msg = document.getElementById('settings-saved-msg');
    if (msg) {
      msg.classList.remove('hidden');
      setTimeout(() => msg.classList.add('hidden'), 2000);
    }
  });

  state.on('currentPage', (page) => {
    if (page === 'settings') {
      loadSettings();
    }
  });
}

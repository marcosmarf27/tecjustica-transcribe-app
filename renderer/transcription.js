import * as state from './state.js';

let selectedFilePath = null;

const validAudioExtensions = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.mp4', '.mkv', '.avi', '.mov', '.webm'];

const stageOrder = ['modelo', 'audio', 'transcricao', 'alinhamento', 'diarizacao', 'salvando'];

function calculateEta(startedAt, percent) {
  if (!startedAt || percent <= 0) return null;
  const elapsed = (Date.now() - startedAt) / 1000;
  const total = elapsed / (percent / 100);
  const remaining = total - elapsed;
  if (remaining < 60) return `~${Math.ceil(remaining)}s restantes`;
  return `~${Math.ceil(remaining / 60)} min restantes`;
}

export function getSelectedFilePath() {
  return selectedFilePath;
}

export function setSelectedFilePath(filePath) {
  selectedFilePath = filePath;
  const fileName = filePath.split(/[/\\]/).pop();
  document.getElementById('selected-file').textContent = fileName;
  updateTranscribeButton();
}

export async function loadDownloadedModels() {
  const backendUrl = state.get('backendUrl');
  if (!backendUrl) return;
  try {
    const response = await fetch(`${backendUrl}/models`);
    const models = await response.json();
    const hiddenInput = document.getElementById('select-model');
    const container = document.getElementById('model-buttons-container');
    const noModelsWarning = document.getElementById('no-models-warning');

    const downloaded = models.filter((m) => m.downloaded);

    if (downloaded.length === 0) {
      if (hiddenInput) hiddenInput.value = '';
      if (container) container.innerHTML = '<p class="text-sm" style="color:var(--on-surface-variant)">Nenhum modelo baixado. Vá em Modelos para baixar.</p>';
      if (noModelsWarning) noModelsWarning.classList.remove('hidden');
    } else {
      if (noModelsWarning) noModelsWarning.classList.add('hidden');

      if (container) {
        container.innerHTML = '';
        downloaded.forEach((m, i) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'bento-model-btn';
          btn.dataset.model = m.name;
          btn.textContent = `${m.name}`;

          btn.addEventListener('click', () => {
            // Remover .active de todos
            container.querySelectorAll('.bento-model-btn').forEach(b => b.classList.remove('active'));
            // Ativar este
            btn.classList.add('active');
            // Setar valor no hidden input
            if (hiddenInput) {
              hiddenInput.value = m.name;
              hiddenInput.dispatchEvent(new Event('change'));
            }
          });

          container.appendChild(btn);

          // Auto-selecionar o primeiro modelo
          if (i === 0) {
            btn.classList.add('active');
            if (hiddenInput) hiddenInput.value = m.name;
          }
        });
      }
    }
    updateTranscribeButton();

    // Desabilitar diarização se não há HF token
    try {
      const healthRes = await fetch(`${backendUrl}/health`);
      const healthData = await healthRes.json();
      const diarizeCheckbox = document.getElementById('check-diarize');
      if (diarizeCheckbox) {
        diarizeCheckbox.disabled = !healthData.hf_token_configured;
        if (!healthData.hf_token_configured) {
          diarizeCheckbox.checked = false;
          diarizeCheckbox.parentElement.title = 'Configure o token HuggingFace nas Configurações';
        } else {
          diarizeCheckbox.parentElement.title = '';
        }
      }
    } catch {
      // Silenciar
    }
  } catch {
    // Silenciar
  }
}

function updateTranscribeButton() {
  const btn = document.getElementById('btn-transcribe');
  const select = document.getElementById('select-model');
  if (btn) {
    btn.disabled = !selectedFilePath || !select?.value || !!state.get('isTranscribing');
  }
}

function updateStageVisuals(currentStage) {
  const idx = stageOrder.indexOf(currentStage);
  document.querySelectorAll('.progress-stages .stage').forEach((el) => {
    const stageIdx = stageOrder.indexOf(el.dataset.stage);
    el.classList.remove('stage-active', 'stage-done');
    if (stageIdx < idx) {
      el.classList.add('stage-done');
    } else if (stageIdx === idx) {
      el.classList.add('stage-active');
    }
  });
}

function clearProgressState() {
  state.set('isTranscribing', false);
  state.set('transcriptionProgress', null);
  state.set('currentTaskId', null);
  state.set('transcriptionStartedAt', null);
}

export function initTranscription() {
  document.getElementById('btn-select-file')?.addEventListener('click', async () => {
    const filePath = await window.api.selectAudioFile();
    if (filePath) {
      setSelectedFilePath(filePath);
    }
  });

  document.getElementById('select-model')?.addEventListener('change', updateTranscribeButton);

  document.getElementById('btn-transcribe')?.addEventListener('click', async () => {
    const backendUrl = state.get('backendUrl');
    if (!selectedFilePath || !backendUrl) return;

    // Validar extensao
    const ext = '.' + selectedFilePath.split('.').pop().toLowerCase();
    if (!validAudioExtensions.includes(ext)) {
      const text = document.getElementById('transcribe-progress-text');
      const progressEl = document.getElementById('transcribe-progress');
      progressEl?.classList.remove('hidden');
      if (text) text.textContent = `Formato nao suportado: ${ext}. Use: ${validAudioExtensions.join(', ')}`;
      return;
    }

    const model = document.getElementById('select-model')?.value;
    const language = document.getElementById('select-language')?.value || 'auto';
    const diarize = document.getElementById('check-diarize')?.checked || false;
    const filename = selectedFilePath.split(/[/\\]/).pop();

    // Obter config para output_dir
    const config = await window.api.getConfig();
    const outputDir = config.output_dir || './transcricoes';

    // Gerar ID e salvar no SQLite com status 'running'
    const transcriptionId = crypto.randomUUID();
    const now = new Date().toISOString();
    await window.api.saveTranscription({
      id: transcriptionId,
      filename,
      filepath: selectedFilePath,
      model: model || '',
      language,
      diarize: diarize ? 1 : 0,
      status: 'running',
      created_at: now,
    });

    state.set('currentTranscription', transcriptionId);
    state.set('isTranscribing', true);
    state.set('transcriptionStartedAt', Date.now());

    // Mostrar progresso
    const progressEl = document.getElementById('transcribe-progress');
    progressEl?.classList.remove('hidden');

    // Reset stages
    document.querySelectorAll('.progress-stages .stage').forEach((s) => {
      s.classList.remove('stage-active', 'stage-done');
    });

    // Reset progress info
    const stepEl = document.getElementById('progress-step');
    const percentEl = document.getElementById('progress-percent');
    const etaEl = document.getElementById('progress-eta');
    if (stepEl) stepEl.textContent = '';
    if (percentEl) percentEl.textContent = '0%';
    if (etaEl) etaEl.textContent = '';

    // Desabilitar botao
    const btn = document.getElementById('btn-transcribe');
    if (btn) btn.disabled = true;

    try {
      const response = await fetch(`${backendUrl}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_path: selectedFilePath,
          model,
          language,
          diarize,
          output_dir: outputDir,
        }),
      });
      const { task_id } = await response.json();
      state.set('currentTaskId', task_id);

      // Monitorar progresso via SSE
      const evtSource = new EventSource(`${backendUrl}/transcribe/progress?task_id=${task_id}`);
      evtSource.onmessage = async (e) => {
        const data = JSON.parse(e.data);

        // Calcular step e ETA
        const stageIdx = stageOrder.indexOf(data.event);
        const step = stageIdx >= 0 ? stageIdx + 1 : null;
        const eta = calculateEta(state.get('transcriptionStartedAt'), data.percent);

        // Atualizar state para outros modulos (sidebar, status bar)
        state.set('transcriptionProgress', {
          percent: data.percent,
          message: data.message,
          event: data.event,
          step,
          totalSteps: stageOrder.length,
          eta,
        });

        // Atualizar barra de progresso
        const fill = document.getElementById('transcribe-progress-fill');
        const text = document.getElementById('transcribe-progress-text');
        if (fill) fill.style.width = `${data.percent}%`;
        if (text) text.textContent = data.message;

        // Atualizar info de progresso
        if (stepEl && step) stepEl.textContent = `Etapa ${step}/${stageOrder.length}`;
        if (percentEl) percentEl.textContent = `${data.percent}%`;
        if (etaEl) etaEl.textContent = eta || '';

        // Atualizar stages visuais
        updateStageVisuals(data.event);

        if (data.event === 'complete' && data.result) {
          evtSource.close();
          progressEl?.classList.add('hidden');

          const segments = data.result.segments || [];
          const files = data.result.files || {};

          // Calcular duracao
          let durationSeconds = null;
          if (segments.length > 0) {
            durationSeconds = segments[segments.length - 1].end;
          }

          // Atualizar no SQLite
          await window.api.saveTranscription({
            id: transcriptionId,
            filename,
            filepath: selectedFilePath,
            model: model || '',
            language,
            diarize: diarize ? 1 : 0,
            duration_seconds: durationSeconds,
            status: 'complete',
            segments_json: segments,
            files_json: files,
            created_at: now,
            completed_at: new Date().toISOString(),
          });

          clearProgressState();
          state.set('currentTranscriptionData', {
            id: transcriptionId, filename, filepath: selectedFilePath,
            segments_json: JSON.stringify(segments), duration_seconds: durationSeconds,
          });
          state.set('transcriptionComplete', { id: transcriptionId, filename });

          if (btn) btn.disabled = false;

          // Reset formulario
          selectedFilePath = null;
          document.getElementById('selected-file').textContent = 'Nenhum arquivo selecionado';
          updateTranscribeButton();
        }
        if (data.event === 'error') {
          evtSource.close();

          // Atualizar no SQLite
          await window.api.saveTranscription({
            id: transcriptionId,
            filename,
            filepath: selectedFilePath,
            model: model || '',
            language,
            diarize: diarize ? 1 : 0,
            status: 'error',
            error_message: data.message,
            created_at: now,
          });

          clearProgressState();

          const text = document.getElementById('transcribe-progress-text');
          if (text) text.textContent = `Erro: ${data.message}`;
          if (btn) btn.disabled = false;
        }
      };
      evtSource.onerror = () => {
        evtSource.close();
        clearProgressState();
        if (btn) btn.disabled = false;
      };
    } catch (err) {
      // Atualizar no SQLite
      await window.api.saveTranscription({
        id: transcriptionId,
        filename,
        filepath: selectedFilePath,
        model: model || '',
        language,
        diarize: diarize ? 1 : 0,
        status: 'error',
        error_message: err.message,
        created_at: now,
      });

      clearProgressState();

      const text = document.getElementById('transcribe-progress-text');
      if (text) text.textContent = `Erro ao iniciar transcricao: ${err.message}`;
      if (btn) btn.disabled = false;
    }
  });

  state.on('currentPage', (page) => {
    if (page === 'transcription' && state.get('backendUrl')) {
      loadDownloadedModels();
    }
  });
}

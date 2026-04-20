import * as state from './state.js';

const IMPACT_MAP = {
  'Python': 'Critico — o backend nao funciona sem Python. Nenhuma funcionalidade disponivel.',
  'Driver NVIDIA': 'A transcricao usara apenas a CPU, ficando significativamente mais lenta.',
  'CUDA': 'Mesmo com GPU NVIDIA, sem CUDA o processamento sera feito pela CPU (muito mais lento).',
  'GPU/VRAM': 'Sem GPU dedicada, a transcricao roda na CPU. Com pouca VRAM, modelos maiores (medium, large) podem falhar.',
  'ffmpeg': 'Critico — sem ffmpeg nao e possivel processar arquivos de audio/video. A transcricao nao funcionara.',
  'Token HuggingFace': 'A diarizacao (identificacao de falantes) nao funcionara. Transcricao basica continua funcionando.',
};

export async function loadDiagnostics() {
  const backendUrl = state.get('backendUrl');
  if (!backendUrl) return;

  const container = document.getElementById('diagnostics-table');
  if (!container) return;

  container.innerHTML = '<p class="loading-text">Verificando sistema...</p>';

  try {
    const response = await fetch(`${backendUrl}/diagnostics`);
    const checks = await response.json();

    let html = `
      <table class="diag-table">
        <thead>
          <tr>
            <th>Verificacao</th>
            <th>Status</th>
            <th>Detalhe</th>
            <th>Impacto</th>
          </tr>
        </thead>
        <tbody>
    `;

    checks.forEach((check) => {
      const icon = check.ok ? '<span class="diag-ok">OK</span>' : '<span class="diag-fail">FALHA</span>';
      const impact = !check.ok && IMPACT_MAP[check.name]
        ? `<span class="diag-impact">${IMPACT_MAP[check.name]}</span>`
        : '';
      html += `
        <tr>
          <td>${check.name}</td>
          <td>${icon}</td>
          <td>${check.detail}</td>
          <td>${impact}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';

    const allOk = checks.every((c) => c.ok);
    if (allOk) {
      html += '<p class="diag-summary diag-summary-ok">Todos os requisitos atendidos.</p>';
    } else {
      html += '<p class="diag-summary diag-summary-warn">Alguns requisitos nao foram atendidos. Verifique os itens acima.</p>';
    }

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p class="diag-error">Erro ao carregar diagnostico. Backend offline?</p>';
  }
}

export function initDiagnostics() {
  document.getElementById('btn-refresh-diag')?.addEventListener('click', loadDiagnostics);

  state.on('currentPage', (page) => {
    if (page === 'diagnostics' && state.get('backendUrl')) {
      loadDiagnostics();
    }
  });
}

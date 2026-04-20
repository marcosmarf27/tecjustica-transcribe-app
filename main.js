const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const crypto = require('crypto');
const { spawn, execSync } = require('child_process');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, WidthType, BorderStyle } = require('docx');

let mainWindow = null;
let pythonProcess = null;
let backendPort = null;
let restartCount = 0;
const MAX_RESTARTS = 3;
let intentionalKill = false;

// --- Paths ---

const venvDir = path.join(app.getPath('userData'), 'python-env');
const venvPython = process.platform === 'win32'
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');
const backendDir = app.isPackaged
  ? path.join(process.resourcesPath, 'python-backend')
  : path.join(__dirname, 'python-backend');

// --- ffmpeg bundled ---
function getBundledBinDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'bin');
  }
  const platformDir = process.platform === 'win32' ? 'win' : 'linux';
  return path.join(__dirname, 'resources', 'bin', platformDir);
}

function getBundledFfmpegPath() {
  const exe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const p = path.join(getBundledBinDir(), exe);
  return fs.existsSync(p) ? p : null;
}

// --- Setup: detectar Python e criar venv ---

function findSystemPython() {
  const candidates = process.platform === 'win32'
    ? ['python', 'python3', 'py -3']
    : ['python3', 'python'];

  for (const cmd of candidates) {
    try {
      // No Windows, verificar se o executável realmente existe (não é o redirect da MS Store)
      if (process.platform === 'win32' && !cmd.startsWith('py')) {
        try {
          const where = execSync(`where ${cmd} 2>nul`, { encoding: 'utf8' }).trim();
          // O redirect da MS Store fica em WindowsApps
          if (where.includes('WindowsApps')) continue;
        } catch {
          continue; // comando não encontrado
        }
      }

      const version = execSync(`${cmd} --version 2>&1`, { encoding: 'utf8', timeout: 5000 }).trim();
      const match = version.match(/Python (\d+)\.(\d+)/);
      const minor = match ? parseInt(match[2]) : 0;
      if (match && parseInt(match[1]) === 3 && minor >= 10 && minor <= 13) {
        return cmd;
      }
    } catch {
      // Não encontrado
    }
  }
  return null;
}

// Detecta qualquer Python no sistema (sem filtro de versão compatível)
function checkPythonCompatibility() {
  const candidates = process.platform === 'win32'
    ? ['python', 'python3', 'py -3']
    : ['python3', 'python'];

  for (const cmd of candidates) {
    try {
      if (process.platform === 'win32' && !cmd.startsWith('py')) {
        try {
          const where = execSync(`where ${cmd} 2>nul`, { encoding: 'utf8' }).trim();
          if (where.includes('WindowsApps')) continue;
        } catch {
          continue;
        }
      }

      const version = execSync(`${cmd} --version 2>&1`, { encoding: 'utf8', timeout: 5000 }).trim();
      const match = version.match(/Python (\d+)\.(\d+)\.?(\d*)/);
      if (match) {
        const major = parseInt(match[1]);
        const minor = parseInt(match[2]);
        const patch = match[3] ? parseInt(match[3]) : 0;
        const versionStr = `${major}.${minor}${match[3] ? '.' + patch : ''}`;
        const compatible = major === 3 && minor >= 10 && minor <= 13;
        return { found: true, compatible, version: versionStr, cmd };
      }
    } catch {
      // Não encontrado
    }
  }
  return { found: false, compatible: false, version: null, cmd: null };
}

// Verifica se winget está disponível
function checkWingetAvailable() {
  if (process.platform !== 'win32') return false;
  try {
    execSync('winget --version 2>nul', { encoding: 'utf8', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// Verifica se ffmpeg está disponível (preferindo o bundled no instalador)
function checkFfmpeg() {
  if (getBundledFfmpegPath()) return true;
  try {
    execSync(`ffmpeg -version${process.platform === 'win32' ? ' 2>nul' : ' 2>/dev/null'}`, { encoding: 'utf8', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// Instala Python 3.11 via winget (Windows only)
function installPythonWindows() {
  return new Promise((resolve, reject) => {
    sendSetupStatus('install-python', 'Instalando Python 3.11 via winget...', 3);

    const logDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const logStream = fs.createWriteStream(path.join(logDir, 'setup.log'), { flags: 'a' });
    logStream.write(`\n--- Python install via winget: ${new Date().toISOString()} ---\n`);

    const proc = spawn('winget', [
      'install', '--id', 'Python.Python.3.11',
      '--source', 'winget',
      '--accept-source-agreements', '--accept-package-agreements',
      '--silent'
    ], { shell: true });

    proc.stdout.on('data', (data) => {
      const text = data.toString().trim();
      logStream.write(`[stdout] ${text}\n`);
      if (text) sendSetupStatus('install-python', `Instalando Python 3.11... ${text.substring(0, 80)}`, 5);
    });

    proc.stderr.on('data', (data) => {
      logStream.write(`[stderr] ${data.toString()}\n`);
    });

    proc.on('close', (code) => {
      logStream.write(`[exit] code=${code}\n`);
      logStream.end();
      if (code === 0) {
        sendSetupStatus('install-python', 'Python 3.11 instalado com sucesso!', 8);
        resolve(true);
      } else {
        reject(new Error(`winget install Python falhou (exit code ${code}). Veja logs em: ${logDir}/setup.log`));
      }
    });

    proc.on('error', (err) => {
      logStream.write(`[error] ${err.message}\n`);
      logStream.end();
      reject(new Error(`Erro ao executar winget: ${err.message}`));
    });
  });
}

// Instala ffmpeg via winget (Windows only, non-fatal)
function installFfmpegWindows() {
  return new Promise((resolve) => {
    sendSetupStatus('install-ffmpeg', 'Instalando ffmpeg via winget...', 9);

    const logDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const logStream = fs.createWriteStream(path.join(logDir, 'setup.log'), { flags: 'a' });
    logStream.write(`\n--- ffmpeg install via winget: ${new Date().toISOString()} ---\n`);

    const proc = spawn('winget', [
      'install', '--id', 'Gyan.FFmpeg',
      '--source', 'winget',
      '--accept-source-agreements', '--accept-package-agreements',
      '--silent'
    ], { shell: true });

    proc.stdout.on('data', (data) => {
      const text = data.toString().trim();
      logStream.write(`[stdout] ${text}\n`);
      if (text) sendSetupStatus('install-ffmpeg', `Instalando ffmpeg... ${text.substring(0, 80)}`, 9);
    });

    proc.stderr.on('data', (data) => {
      logStream.write(`[stderr] ${data.toString()}\n`);
    });

    proc.on('close', (code) => {
      logStream.write(`[exit] code=${code}\n`);
      logStream.end();
      if (code === 0) {
        sendSetupStatus('install-ffmpeg', 'ffmpeg instalado com sucesso!', 10);
      } else {
        sendSetupStatus('install-ffmpeg', 'Aviso: falha ao instalar ffmpeg. Instale manualmente se necessário.', 10);
      }
      resolve(code === 0); // Non-fatal: resolve sempre
    });

    proc.on('error', (err) => {
      logStream.write(`[error] ${err.message}\n`);
      logStream.end();
      sendSetupStatus('install-ffmpeg', 'Aviso: falha ao instalar ffmpeg. Instale manualmente se necessário.', 10);
      resolve(false);
    });
  });
}

// Procura Python 3.11 em caminhos conhecidos após instalação via winget
// (PATH não atualiza no processo corrente)
function findPythonAfterInstall() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const knownPaths = [
    path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe'),
    'C:\\Program Files\\Python311\\python.exe',
    'C:\\Python311\\python.exe',
    path.join(localAppData, 'Programs', 'Python', 'Python311', 'python3.exe'),
  ];

  for (const p of knownPaths) {
    try {
      if (fs.existsSync(p)) {
        const version = execSync(`"${p}" --version 2>&1`, { encoding: 'utf8', timeout: 5000 }).trim();
        if (version.includes('Python 3.11')) return p;
      }
    } catch {
      // Tentar próximo
    }
  }

  // Tentar ler PATH atualizado do registro do Windows
  try {
    const regPath = execSync('reg query "HKCU\\Environment" /v PATH 2>nul', { encoding: 'utf8', timeout: 5000 });
    const match = regPath.match(/PATH\s+REG_(?:EXPAND_)?SZ\s+(.+)/i);
    if (match) {
      const newPaths = match[1].trim().split(';');
      for (const dir of newPaths) {
        const pythonExe = path.join(dir, 'python.exe');
        try {
          if (fs.existsSync(pythonExe)) {
            const version = execSync(`"${pythonExe}" --version 2>&1`, { encoding: 'utf8', timeout: 5000 }).trim();
            const m = version.match(/Python 3\.(\d+)/);
            if (m && parseInt(m[1]) >= 10 && parseInt(m[1]) <= 13) return pythonExe;
          }
        } catch { /* next */ }
      }
    }
  } catch { /* registro não acessível */ }

  return null;
}

function isSetupComplete() {
  return fs.existsSync(venvPython) && fs.existsSync(path.join(venvDir, 'setup-complete'));
}

function sendSetupStatus(stage, message, percent) {
  if (mainWindow) {
    mainWindow.webContents.send('setup-status', { stage, message, percent });
  }
}

async function runSetup() {
  let pythonCmd = findSystemPython();

  // Se não encontrou Python compatível, tentar auto-instalar no Windows
  if (!pythonCmd) {
    const isWindows = process.platform === 'win32';

    if (isWindows && checkWingetAvailable()) {
      const pyInfo = checkPythonCompatibility();
      const reason = pyInfo.found
        ? `Python ${pyInfo.version} encontrado mas é incompatível (requer 3.10-3.13).`
        : 'Python não encontrado no sistema.';
      sendSetupStatus('install-python', `${reason} Instalando Python 3.11 via winget...`, 3);

      try {
        await installPythonWindows();
        pythonCmd = findPythonAfterInstall();
        if (!pythonCmd) {
          sendSetupStatus('error', 'Python 3.11 foi instalado mas não foi encontrado nos caminhos conhecidos. Reinicie o app para que o PATH seja atualizado.', 0);
          return false;
        }
      } catch (err) {
        sendSetupStatus('error', `Falha ao instalar Python: ${err.message}`, 0);
        return false;
      }
    } else if (isWindows) {
      const pyInfo = checkPythonCompatibility();
      const reason = pyInfo.found
        ? `Python ${pyInfo.version} é incompatível (requer 3.10-3.13).`
        : 'Python não encontrado.';
      sendSetupStatus('error', `${reason} winget não disponível para instalação automática. Instale Python 3.11 manualmente de python.org e reinicie o app.`, 0);
      return false;
    } else {
      // Linux/Mac
      sendSetupStatus('error', 'Python 3.10-3.13 não encontrado. Instale com: sudo apt install python3 python3-venv (e reinicie o app)', 0);
      return false;
    }
  }

  // Verificar e instalar ffmpeg se necessário (Windows only, non-fatal)
  if (!checkFfmpeg() && process.platform === 'win32' && checkWingetAvailable()) {
    await installFfmpegWindows();
  }

  try {
    // Etapa 1: Criar venv
    sendSetupStatus('venv', 'Criando ambiente Python...', 10);
    execSync(`"${pythonCmd}" -m venv "${venvDir}"`, { encoding: 'utf8' });

    // Etapa 2: Atualizar pip
    sendSetupStatus('pip', 'Atualizando pip...', 15);
    execSync(`"${venvPython}" -m pip install --upgrade pip`, { encoding: 'utf8', timeout: 60000 });

    // Etapa 3: Instalar dependências (a parte pesada)
    sendSetupStatus('deps', 'Instalando dependências (PyTorch, WhisperX)...\nIsso pode levar 10-30 minutos na primeira vez.', 20);

    const reqFile = path.join(backendDir, 'requirements.txt');
    // Usar índice CUDA do PyTorch para instalar torch com suporte a GPU
    const pipArgs = ['-m', 'pip', 'install',
      '--extra-index-url', 'https://download.pytorch.org/whl/cu126',
      '-r', reqFile,
    ];
    const pipProcess = spawn(venvPython, pipArgs, {
      env: { ...process.env },
    });

    // Log do pip
    const logDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const logStream = fs.createWriteStream(path.join(logDir, 'setup.log'), { flags: 'a' });
    pipProcess.stdout.pipe(logStream);
    pipProcess.stderr.pipe(logStream);

    // Monitorar progresso pelo output
    let lastLine = '';
    pipProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      if (lines.length > 0) lastLine = lines[lines.length - 1].trim();
      // Estimar progresso pelo que está sendo baixado/instalado
      if (lastLine.includes('Downloading')) {
        sendSetupStatus('deps', `Baixando: ${lastLine.substring(0, 80)}...`, 30);
      } else if (lastLine.includes('Installing')) {
        sendSetupStatus('deps', 'Instalando pacotes...', 80);
      }
    });

    pipProcess.stderr.on('data', (data) => {
      const text = data.toString().trim();
      if (text) {
        sendSetupStatus('deps', `${text.substring(0, 100)}`, 30);
      }
    });

    await new Promise((resolve, reject) => {
      pipProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`pip install falhou (exit code ${code}). Veja logs em: ${logDir}/setup.log`));
      });
    });

    // Marcar setup como completo
    sendSetupStatus('done', 'Setup concluído!', 100);
    fs.writeFileSync(path.join(venvDir, 'setup-complete'), new Date().toISOString());
    return true;
  } catch (err) {
    sendSetupStatus('error', `Erro no setup: ${err.message}`, 0);
    return false;
  }
}

// --- Porta livre ---

function findFreePort() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

// --- Backend Python ---

async function startBackend() {
  backendPort = await findFreePort();

  // Token HF vem da config do usuário (Configurações > HuggingFace Token).
  // Opcional — sem token, a diarização fica desabilitada mas a transcrição funciona.
  const config = loadConfig();
  const hfToken = (config.hf_token || '').trim();

  // Prepend o diretório do ffmpeg bundled no PATH para que o backend Python
  // (e o WhisperX, que invoca ffmpeg como subprocess) encontre o binário.
  const binDir = getBundledBinDir();
  const PATH_SEP = process.platform === 'win32' ? ';' : ':';
  const newPath = fs.existsSync(binDir)
    ? binDir + PATH_SEP + (process.env.PATH || '')
    : (process.env.PATH || '');

  // Sempre usar o Python do venv + scripts do backend
  pythonProcess = spawn(venvPython, ['server.py', '--port', String(backendPort)], {
    cwd: backendDir,
    env: { ...process.env, PATH: newPath, HF_TOKEN: hfToken },
  });

  // Log stdout/stderr
  const logDir = path.join(app.getPath('userData'), 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logStream = fs.createWriteStream(path.join(logDir, 'backend.log'), { flags: 'a' });

  pythonProcess.stdout.pipe(logStream);
  pythonProcess.stderr.pipe(logStream);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[python] ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[python] ${data.toString().trim()}`);
  });

  // Auto-restart em caso de crash
  pythonProcess.on('exit', (code) => {
    if (intentionalKill) return;
    if (code !== 0 && restartCount < MAX_RESTARTS) {
      restartCount++;
      console.log(`[python] Backend crashou (code ${code}), tentativa ${restartCount}/${MAX_RESTARTS}...`);
      startBackend().catch((err) => {
        console.error('Falha ao reiniciar backend:', err.message);
      });
    } else if (code !== 0) {
      dialog.showErrorBox(
        'Erro Fatal',
        'O backend falhou ao iniciar após 3 tentativas.\nVerifique os logs em: ' +
          path.join(app.getPath('userData'), 'logs', 'backend.log')
      );
    }
  });

  // Health polling
  await waitForBackend();
}

function waitForBackend() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeout = 30000;
    const interval = 500;

    const check = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:${backendPort}/health`);
        if (response.ok) {
          if (mainWindow) {
            mainWindow.webContents.send('backend-status', { status: 'ready', port: backendPort });
          }
          resolve();
          return;
        }
      } catch {
        // Backend não está pronto ainda
      }

      if (Date.now() - startTime > timeout) {
        if (mainWindow) {
          mainWindow.webContents.send('backend-status', { status: 'error', message: 'Backend timeout' });
        }
        reject(new Error('Backend startup timeout'));
        return;
      }

      if (mainWindow) {
        mainWindow.webContents.send('backend-status', { status: 'starting' });
      }
      setTimeout(check, interval);
    };

    check();
  });
}

function killBackend() {
  if (pythonProcess) {
    intentionalKill = true;
    pythonProcess.kill();
    pythonProcess = null;
  }
}

// --- Config ---

const configPath = path.join(app.getPath('userData'), 'config.json');
console.log('[config] configPath:', configPath);

function loadConfig() {
  try {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('[config] loadConfig OK, keys:', Object.keys(data).join(', '));
    return data;
  } catch {
    // JSON corrompido — tentar restaurar do backup
    const bakPath = configPath + '.bak';
    try {
      if (fs.existsSync(bakPath)) {
        console.warn('[config] config.json corrompido, restaurando do backup');
        const backup = JSON.parse(fs.readFileSync(bakPath, 'utf8'));
        fs.writeFileSync(configPath, JSON.stringify(backup, null, 2));
        return backup;
      }
    } catch {
      console.error('[config] Backup tambem corrompido');
    }
    console.log('[config] loadConfig: arquivo nao encontrado ou vazio, retornando {}');
    return {};
  }
}

function saveConfig(config) {
  console.log('[config] saveConfig, keys:', Object.keys(config).join(', '));
  // Salvar backup antes de sobrescrever
  if (fs.existsSync(configPath)) {
    try {
      fs.copyFileSync(configPath, configPath + '.bak');
    } catch {
      // Falha no backup nao deve impedir a escrita
    }
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('[config] saveConfig OK, arquivo salvo em:', configPath);
}

// --- Transcriptions JSON store ---

const dbPath = path.join(app.getPath('userData'), 'transcriptions.json');

function loadTranscriptions() {
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch {
    return [];
  }
}

function saveTranscriptions(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// --- Conversations JSON store ---

const conversationsPath = path.join(app.getPath('userData'), 'conversations.json');

function loadConversations() {
  try { return JSON.parse(fs.readFileSync(conversationsPath, 'utf8')); }
  catch { return []; }
}

function saveConversationsData(data) {
  fs.writeFileSync(conversationsPath, JSON.stringify(data, null, 2));
}

// --- Analyses JSON store ---

const analysesPath = path.join(app.getPath('userData'), 'analyses.json');

function loadAnalyses() {
  try { return JSON.parse(fs.readFileSync(analysesPath, 'utf8')); }
  catch { return []; }
}

function saveAnalyses(data) {
  fs.writeFileSync(analysesPath, JSON.stringify(data, null, 2));
}

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function initDatabase() {
  // Criar arquivo vazio se não existir
  if (!fs.existsSync(dbPath)) {
    saveTranscriptions([]);
  }
}

// --- SRT/TXT helpers ---

function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function generateSrt(segments, speakerMap = {}) {
  return segments.map((seg, i) => {
    const label = seg.speaker ? (speakerMap[seg.speaker] || seg.speaker) : '';
    const prefix = label ? `[${label}] ` : '';
    return `${i + 1}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${prefix}${seg.text.trim()}\n`;
  }).join('\n');
}

function generateTxt(segments, speakerMap = {}) {
  return segments.map(seg => {
    const label = seg.speaker ? (speakerMap[seg.speaker] || seg.speaker) : '';
    const prefix = label ? `[${label}] ` : '';
    return `${prefix}${seg.text.trim()}`;
  }).join('\n');
}

// --- DOCX Report Generator ---

async function generateDocx({ transcription, segments, speakerMap, analyses, conversations }) {
  const children = [];

  const GRAY = '888888';
  const DARK = '222222';
  const ACCENT = '4A90D9';

  const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
  const tableBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

  // === CAPA ===
  children.push(
    new Paragraph({ spacing: { after: 600 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Relatório de Transcrição', bold: true, size: 48, color: DARK })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'TecJustiça Transcribe', size: 28, color: ACCENT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Parceria TecJustiça × Projurista', size: 18, color: GRAY, italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: `Gerado em ${new Date().toLocaleString('pt-BR')}`, size: 22, color: GRAY })],
    }),
  );

  // === METADADOS ===
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'Metadados' })] }),
  );

  const duration = transcription.duration_seconds
    ? formatTimestamp(transcription.duration_seconds)
    : '—';

  const metaRows = [
    ['Arquivo', transcription.filename || '—'],
    ['Duração', duration],
    ['Modelo', transcription.model || '—'],
    ['Idioma', transcription.language || '—'],
    ['Diarização', transcription.diarize ? 'Sim' : 'Não'],
    ['Criado em', transcription.created_at ? new Date(transcription.created_at).toLocaleString('pt-BR') : '—'],
    ['Concluído em', transcription.completed_at ? new Date(transcription.completed_at).toLocaleString('pt-BR') : '—'],
    ['Editado', transcription.edited ? 'Sim' : 'Não'],
  ];

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: metaRows.map(([label, value]) => new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20 })] })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: tableBorders,
          children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })],
        }),
      ],
    })),
  }));

  // === PARTICIPANTES (condicional) ===
  const uniqueSpeakers = [...new Set(segments.filter(s => s.speaker).map(s => s.speaker))].sort();
  if (uniqueSpeakers.length > 1) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'Participantes' })] }),
    );

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: 'ID', bold: true, size: 20 })] })] }),
            new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: 'Nome', bold: true, size: 20 })] })] }),
          ],
        }),
        ...uniqueSpeakers.map(spk => new TableRow({
          children: [
            new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: spk, size: 20 })] })] }),
            new TableCell({ borders: tableBorders, children: [new Paragraph({ children: [new TextRun({ text: speakerMap[spk] || spk, size: 20 })] })] }),
          ],
        })),
      ],
    }));
  }

  // === TRANSCRIÇÃO COMPLETA ===
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'Transcrição Completa' })] }),
  );

  for (const seg of segments) {
    const time = formatTimestamp(seg.start);
    const label = seg.speaker ? (speakerMap[seg.speaker] || seg.speaker) : '';
    const runs = [
      new TextRun({ text: `[${time}] `, color: GRAY, size: 20 }),
    ];
    if (label) {
      runs.push(new TextRun({ text: `[${label}] `, bold: true, size: 20 }));
    }
    runs.push(new TextRun({ text: (seg.text || '').trim(), size: 20 }));
    children.push(new Paragraph({ spacing: { after: 80 }, children: runs }));
  }

  // === ANÁLISES IA (condicional) ===
  if (analyses && analyses.length > 0) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'Análises IA' })] }),
    );

    for (const analysis of analyses) {
      let result = analysis.result || {};
      if (typeof result === 'string') { try { result = JSON.parse(result); } catch { result = {}; } }
      const date = analysis.created_at ? new Date(analysis.created_at).toLocaleString('pt-BR') : '';

      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
          children: [
            new TextRun({ text: `Análise — ${date}`, bold: true }),
          ],
        }),
      );

      if (analysis.prompt) {
        children.push(new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: 'Prompt: ', bold: true, size: 20, color: GRAY }),
            new TextRun({ text: analysis.prompt, size: 20, italics: true, color: GRAY }),
          ],
        }));
      }

      if (result.overall_summary) {
        children.push(new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: result.overall_summary, size: 20 })],
        }));
      }

      if (result.topics && result.topics.length > 0) {
        for (const topic of result.topics) {
          const timeRange = (topic.start_time != null && topic.end_time != null)
            ? ` [${formatTimestamp(topic.start_time)} – ${formatTimestamp(topic.end_time)}]`
            : '';
          children.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: topic.title }),
                new TextRun({ text: timeRange, color: GRAY, size: 20 }),
              ],
            }),
            new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun({ text: topic.summary || '', size: 20 })],
            }),
          );
        }
      }
    }
  }

  // === CONVERSAS (condicional) ===
  if (conversations && conversations.length > 0) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'Conversas com IA' })] }),
    );

    for (const conv of conversations) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
          children: [new TextRun({ text: conv.title || 'Conversa' })],
        }),
      );

      for (const msg of (conv.messages || [])) {
        const isUser = msg.role === 'user';
        children.push(new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: isUser ? 'Usuário: ' : 'Assistente: ', bold: true, size: 20, color: isUser ? ACCENT : '2EAD4B' }),
            new TextRun({ text: msg.content || '', size: 20 }),
          ],
        }));
      }
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return await Packer.toBuffer(doc);
}

// --- IPC Handlers: JSON CRUD ---

ipcMain.handle('db-save-transcription', (_, data) => {
  const all = loadTranscriptions();
  const id = data.id || crypto.randomUUID();
  const idx = all.findIndex((t) => t.id === id);
  const record = {
    id,
    filename: data.filename,
    filepath: data.filepath,
    model: data.model,
    language: data.language,
    diarize: data.diarize ? 1 : 0,
    duration_seconds: data.duration_seconds || null,
    status: data.status || 'running',
    error_message: data.error_message || null,
    segments_json: data.segments_json ? JSON.stringify(data.segments_json) : null,
    files_json: data.files_json ? JSON.stringify(data.files_json) : null,
    speaker_map_json: data.speaker_map_json ? JSON.stringify(data.speaker_map_json) : (idx >= 0 && all[idx].speaker_map_json) || null,
    created_at: data.created_at || new Date().toISOString(),
    completed_at: data.completed_at || null,
    edited: data.edited ? 1 : 0,
  };
  if (idx >= 0) all[idx] = record;
  else all.push(record);
  saveTranscriptions(all);
  return id;
});

ipcMain.handle('db-get-transcriptions', () => {
  const all = loadTranscriptions();
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
});

ipcMain.handle('db-get-transcription', (_, id) => {
  return loadTranscriptions().find((t) => t.id === id) || null;
});

ipcMain.handle('db-delete-transcription', (_, id) => {
  const all = loadTranscriptions().filter((t) => t.id !== id);
  saveTranscriptions(all);
  // Cascade: deletar análises e conversas vinculadas
  const analyses = loadAnalyses().filter(a => a.transcription_id !== id);
  saveAnalyses(analyses);
  const convs = loadConversations().filter(c => c.transcription_id !== id);
  saveConversationsData(convs);
  return true;
});

ipcMain.handle('db-update-segments', (_, id, segments) => {
  const all = loadTranscriptions();
  const item = all.find((t) => t.id === id);
  if (item) {
    item.segments_json = JSON.stringify(segments);
    item.edited = 1;
    saveTranscriptions(all);
  }
  return true;
});

ipcMain.handle('db-update-speaker-map', (_, id, speakerMap) => {
  const all = loadTranscriptions();
  const item = all.find(t => t.id === id);
  if (item) {
    item.speaker_map_json = JSON.stringify(speakerMap);
    saveTranscriptions(all);
  }
  return true;
});

ipcMain.handle('db-search-transcriptions', (_, query) => {
  const q = query.toLowerCase();
  return loadTranscriptions()
    .filter((t) => t.filename.toLowerCase().includes(q))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
});

ipcMain.handle('re-export', (_, id) => {
  const all = loadTranscriptions();
  const row = all.find((t) => t.id === id);
  if (!row || !row.segments_json) return { ok: false, message: 'Transcrição não encontrada ou sem segmentos' };

  const segments = JSON.parse(row.segments_json);
  const files = row.files_json ? JSON.parse(row.files_json) : {};
  const speakerMap = row.speaker_map_json ? JSON.parse(row.speaker_map_json) : {};

  const basePath = files.txt || files.srt
    ? path.dirname(files.txt || files.srt)
    : path.dirname(row.filepath);
  const baseName = path.basename(row.filename, path.extname(row.filename));

  const txtPath = path.join(basePath, `${baseName}.txt`);
  const srtPath = path.join(basePath, `${baseName}.srt`);

  fs.writeFileSync(txtPath, generateTxt(segments, speakerMap), 'utf8');
  fs.writeFileSync(srtPath, generateSrt(segments, speakerMap), 'utf8');
  const jsonPath = path.join(basePath, `${baseName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(segments, null, 2), 'utf8');

  const newFiles = { txt: txtPath, srt: srtPath, json: jsonPath };
  row.files_json = JSON.stringify(newFiles);
  saveTranscriptions(all);

  return { ok: true, files: newFiles };
});

ipcMain.handle('export-docx', async (_, transcriptionId) => {
  try {
    const all = loadTranscriptions();
    const row = all.find(t => t.id === transcriptionId);
    if (!row || !row.segments_json) return { ok: false, message: 'Transcrição não encontrada' };

    const segments = JSON.parse(row.segments_json);
    const speakerMap = row.speaker_map_json ? JSON.parse(row.speaker_map_json) : {};
    const files = row.files_json ? JSON.parse(row.files_json) : {};

    const analyses = loadAnalyses().filter(a => a.transcription_id === transcriptionId);
    const conversations = loadConversations().filter(c => c.transcription_id === transcriptionId);

    const buffer = await generateDocx({ transcription: row, segments, speakerMap, analyses, conversations });

    const basePath = files.txt || files.srt
      ? path.dirname(files.txt || files.srt)
      : path.dirname(row.filepath);
    const baseName = path.basename(row.filename, path.extname(row.filename));
    const docxPath = path.join(basePath, `${baseName}_relatorio.docx`);

    fs.writeFileSync(docxPath, buffer);
    return { ok: true, filePath: docxPath };
  } catch (err) {
    console.error('[export-docx] Error:', err);
    return { ok: false, message: err.message };
  }
});

// --- Gemini Analysis ---

ipcMain.handle('gemini-analyze', async (_, { transcriptionId, prompt }) => {
  const config = loadConfig();
  const apiKey = config.gemini_api_key;
  if (!apiKey) throw new Error('Gemini API Key não configurada');

  const transcription = loadTranscriptions().find(t => t.id === transcriptionId);
  if (!transcription?.segments_json) throw new Error('Transcrição não encontrada');

  const segments = JSON.parse(transcription.segments_json);

  const segmentsText = segments.map((seg, i) => {
    const start = formatTimestamp(seg.start);
    const end = formatTimestamp(seg.end);
    const speaker = seg.speaker ? `[${seg.speaker}]` : '';
    return `[${i}] [${start} - ${end}] ${speaker} ${seg.text || ''}`;
  }).join('\n');

  const lastSeg = segments[segments.length - 1];
  const maxTime = Math.round(transcription.duration_seconds || lastSeg?.end || 0);

  const systemInstruction = [
    'Você é um assistente que analisa transcrições de audiências judiciais.',
    'REGRAS OBRIGATÓRIAS para timestamps:',
    `- A duração total do áudio/vídeo é ${formatTimestamp(maxTime)} (${maxTime} segundos).`,
    `- Os valores de start_time e end_time DEVEM estar entre 0 e ${maxTime}.`,
    '- Use EXATAMENTE os timestamps que aparecem nos segmentos da transcrição. Não invente valores.',
    '- Nunca extrapole timestamps além do último segmento.',
  ].join('\n');

  const fullPrompt = `${prompt}\n\nTRANSCRIÇÃO:\n${segmentsText}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
          response_schema: {
            type: 'object',
            properties: {
              overall_summary: { type: 'string' },
              topics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    summary: { type: 'string' },
                    start_time: { type: 'number' },
                    end_time: { type: 'number' },
                    segment_indices: { type: 'array', items: { type: 'integer' } }
                  },
                  required: ['title', 'summary', 'start_time', 'end_time']
                }
              }
            },
            required: ['overall_summary', 'topics']
          }
        }
      })
    });
  } catch (fetchErr) {
    clearTimeout(timeout);
    if (fetchErr.name === 'AbortError') throw new Error('Timeout: a API Gemini não respondeu em 2 minutos');
    throw new Error(`Erro de conexão com a API Gemini: ${fetchErr.message}`);
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erro na API Gemini: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!resultText) throw new Error('Resposta vazia do Gemini');

  let result;
  try {
    result = JSON.parse(resultText);
  } catch {
    throw new Error('Resposta do Gemini não é JSON válido');
  }

  const analysis = {
    id: crypto.randomUUID(),
    transcription_id: transcriptionId,
    prompt,
    result,
    model: 'gemini-2.5-flash',
    created_at: new Date().toISOString()
  };

  const analyses = loadAnalyses();
  analyses.push(analysis);
  saveAnalyses(analyses);

  return analysis;
});

ipcMain.handle('db-get-analyses', (_, transcriptionId) => {
  return loadAnalyses()
    .filter(a => a.transcription_id === transcriptionId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
});

ipcMain.handle('db-delete-analysis', (_, id) => {
  const analyses = loadAnalyses().filter(a => a.id !== id);
  saveAnalyses(analyses);
  return true;
});

// --- Chat IPC Handlers ---

ipcMain.handle('chat-get-conversations', (_, transcriptionId) => {
  return loadConversations()
    .filter(c => c.transcription_id === transcriptionId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
});

ipcMain.handle('chat-delete-conversation', (_, id) => {
  const all = loadConversations().filter(c => c.id !== id);
  saveConversationsData(all);
  return true;
});

ipcMain.handle('chat-send-message', async (_, { transcriptionId, conversationId, message, history }) => {
  const config = loadConfig();
  const apiKey = config.gemini_api_key;
  if (!apiKey) {
    if (mainWindow) {
      mainWindow.webContents.send('chat-stream-error', { error: 'Gemini API Key não configurada. Vá em Configurações para adicionar.' });
    }
    return;
  }

  const transcription = loadTranscriptions().find(t => t.id === transcriptionId);
  if (!transcription?.segments_json) {
    if (mainWindow) {
      mainWindow.webContents.send('chat-stream-error', { error: 'Transcrição não encontrada ou sem segmentos.' });
    }
    return;
  }

  const segments = JSON.parse(transcription.segments_json);
  const speakerMap = transcription.speaker_map_json ? JSON.parse(transcription.speaker_map_json) : {};

  // Sempre HH:MM:SS com zero-padding para consistência com o regex de citação
  const formatHHMMSS = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const segmentsText = segments.map((seg, i) => {
    const start = formatHHMMSS(seg.start);
    const end = formatHHMMSS(seg.end);
    const speakerLabel = seg.speaker ? (speakerMap[seg.speaker] || seg.speaker) : '';
    const speakerTag = speakerLabel ? `[${speakerLabel}]` : '';
    return `[${i}] [${start} - ${end}] ${speakerTag} ${seg.text || ''}`;
  }).join('\n');

  const lastSeg = segments[segments.length - 1];
  const maxTime = Math.round(transcription.duration_seconds || lastSeg?.end || 0);

  const systemInstruction = [
    'Você é um assistente especializado em analisar transcrições de audiências judiciais.',
    'Responda com base APENAS na transcrição fornecida abaixo.',
    '',
    'REGRAS DE CITAÇÃO:',
    'Quando citar trechos específicos, use EXATAMENTE este formato:',
    '«HH:MM:SS-HH:MM:SS|Falante|"trecho citado"»',
    '',
    'Exemplo: «00:02:15-00:02:32|Juiz|"A prova documental será analisada na próxima sessão"»',
    '',
    'REGRAS OBRIGATÓRIAS PARA TIMESTAMPS:',
    `- A duração total do áudio/vídeo é EXATAMENTE ${formatHHMMSS(maxTime)} (${maxTime} segundos).`,
    `- Todos os timestamps nas citações DEVEM estar entre 00:00:00 e ${formatHHMMSS(maxTime)}.`,
    '- NUNCA gere timestamps que ultrapassem a duração do vídeo. Se o vídeo tem 16 minutos, NÃO cite 00:18:00 ou 00:20:00.',
    '- Use EXATAMENTE os timestamps que aparecem nos segmentos da transcrição. Não invente valores.',
    '- Nunca extrapole timestamps além do último segmento.',
    '- Na dúvida, use o timestamp do segmento mais próximo ao trecho que você quer citar.',
    '',
    'REGRAS DE FORMATO:',
    '- Timestamps devem ter formato HH:MM:SS com zero-padding (ex: 00:02:15, não 0:2:15)',
    '- Inclua o nome do falante conforme aparece nos segmentos',
    '- Cite o texto relevante entre aspas',
    '- Sempre que possível, referencie o trecho exato da transcrição',
    '',
    'TRANSCRIÇÃO:',
    segmentsText,
  ].join('\n');

  // Build conversation history for the API
  const contents = [];
  if (history && history.length > 0) {
    history.forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });
  }
  contents.push({ role: 'user', parts: [{ text: message }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      if (mainWindow) {
        mainWindow.webContents.send('chat-stream-error', {
          error: `Erro na API Gemini: ${response.status} - ${errText.substring(0, 200)}`
        });
      }
      return;
    }

    // Stream SSE response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let sseBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && mainWindow) {
              fullText += text;
              mainWindow.webContents.send('chat-stream-chunk', { text });
            }
          } catch {
            // Skip invalid JSON chunks
          }
        }
      }
    }

    // Process any remaining buffer
    if (sseBuffer.startsWith('data: ')) {
      const jsonStr = sseBuffer.slice(6).trim();
      if (jsonStr) {
        try {
          const data = JSON.parse(jsonStr);
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && mainWindow) {
            fullText += text;
            mainWindow.webContents.send('chat-stream-chunk', { text });
          }
        } catch { /* ignore */ }
      }
    }

    // Save conversation
    const allConversations = loadConversations();
    let convId = conversationId;

    if (convId) {
      // Update existing
      const conv = allConversations.find(c => c.id === convId);
      if (conv) {
        conv.messages.push(
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: fullText, timestamp: new Date().toISOString() }
        );
        conv.updated_at = new Date().toISOString();
      }
    } else {
      // Create new
      convId = crypto.randomUUID();
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
      allConversations.push({
        id: convId,
        transcription_id: transcriptionId,
        title,
        messages: [
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: fullText, timestamp: new Date().toISOString() }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    saveConversationsData(allConversations);

    if (mainWindow) {
      mainWindow.webContents.send('chat-stream-done', { conversationId: convId });
    }
  } catch (err) {
    clearTimeout(timeout);
    if (mainWindow) {
      const errorMsg = err.name === 'AbortError'
        ? 'Timeout: a API Gemini não respondeu em 3 minutos'
        : `Erro de conexão: ${err.message}`;
      mainWindow.webContents.send('chat-stream-error', { error: errorMsg });
    }
  }
});

// --- IPC Handlers ---

ipcMain.handle('get-backend-url', () => {
  return `http://127.0.0.1:${backendPort}`;
});

ipcMain.handle('check-setup', () => {
  const pyCompat = checkPythonCompatibility();
  const compatible = !!findSystemPython();
  const isWindows = process.platform === 'win32';
  return {
    complete: isSetupComplete(),
    pythonFound: compatible,
    pythonVersion: pyCompat.version,
    pythonIncompatible: pyCompat.found && !pyCompat.compatible,
    ffmpegFound: checkFfmpeg(),
    isWindows,
    wingetAvailable: isWindows ? checkWingetAvailable() : false,
  };
});

ipcMain.handle('get-backend-port', () => {
  return backendPort;
});

ipcMain.handle('run-setup', async () => {
  return await runSetup();
});

ipcMain.handle('start-backend-after-setup', async () => {
  if (!isSetupComplete()) return { ok: false, message: 'Setup não completado' };
  try {
    await startBackend();
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err.message };
  }
});

ipcMain.handle('select-audio-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Selecionar arquivo de áudio/vídeo',
    filters: [
      {
        name: 'Mídia',
        extensions: ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'mp4', 'mkv', 'avi', 'mov', 'webm'],
      },
    ],
    properties: ['openFile'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('save-export-file', async (_, defaultName, filters) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters,
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('get-config', () => loadConfig());

ipcMain.handle('save-config', async (_, config) => {
  const oldConfig = loadConfig();
  saveConfig(config);

  // Se o token HF mudou e o backend está rodando, atualizar em runtime
  if (config.hf_token !== oldConfig.hf_token && backendPort) {
    try {
      await fetch(`http://127.0.0.1:${backendPort}/config/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: (config.hf_token || '').trim() }),
      });
    } catch (err) {
      console.error('[save-config] Falha ao atualizar token no backend:', err.message);
    }
  }
});

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('open-file', async (_, filePath) => {
  if (!filePath) return 'No file path provided';

  // Se for URL (links externos), abrir no navegador
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    shell.openExternal(filePath);
    return '';
  }

  // Resolver caminhos relativos (ex: ./transcricoes/...) em relação ao CWD do app
  let resolved = filePath;
  if (!path.isAbsolute(filePath)) {
    // Tentar resolver a partir do diretório do app (onde está o package.json)
    const appDir = app.isPackaged ? path.dirname(app.getPath('exe')) : __dirname;
    resolved = path.resolve(appDir, filePath);
  }

  if (!fs.existsSync(resolved)) {
    console.error(`[open-file] File not found: "${resolved}" (original: "${filePath}")`);
    return `File not found: ${filePath}`;
  }
  const result = await shell.openPath(resolved);
  if (result) {
    console.error(`[open-file] shell.openPath failed for "${resolved}": ${result}`);
    shell.showItemInFolder(resolved);
  }
  return result;
});

ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window-close', () => mainWindow?.close());

// --- Janela principal ---

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- Ciclo de vida ---

app.whenReady().then(async () => {
  initDatabase();
  createWindow();

  // Esperar o renderer carregar antes de enviar eventos IPC
  await new Promise((resolve) => {
    mainWindow.webContents.on('did-finish-load', resolve);
  });

  if (isSetupComplete()) {
    try {
      await startBackend();
    } catch (err) {
      console.error('Falha ao iniciar backend:', err.message);
    }
  } else {
    // Primeiro uso — renderer vai mostrar tela de setup
    if (mainWindow) {
      mainWindow.webContents.send('setup-status', { stage: 'needed', message: 'Setup necessário', percent: 0 });
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  killBackend();
});

app.on('will-quit', () => {
  killBackend();
});

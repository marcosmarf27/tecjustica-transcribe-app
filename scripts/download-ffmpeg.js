#!/usr/bin/env node
/**
 * Baixa binários estáticos do ffmpeg/ffprobe e popula resources/bin/{win,linux}/.
 * Idempotente: pula download se os binários já existirem e responderem a -version.
 *
 * Uso:
 *   node scripts/download-ffmpeg.js            # baixa para a plataforma do host
 *   node scripts/download-ffmpeg.js win        # força Windows
 *   node scripts/download-ffmpeg.js linux      # força Linux
 *   node scripts/download-ffmpeg.js all        # ambos
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BIN_ROOT = path.join(ROOT, 'resources', 'bin');

const SOURCES = {
  win: {
    url: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
    archive: 'ffmpeg-win.zip',
    binaries: ['ffmpeg.exe', 'ffprobe.exe'],
  },
  linux: {
    url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
    archive: 'ffmpeg-linux.tar.xz',
    binaries: ['ffmpeg', 'ffprobe'],
  },
};

function log(msg) { console.log(`[download-ffmpeg] ${msg}`); }
function err(msg) { console.error(`[download-ffmpeg] ERRO: ${msg}`); }

function targetDir(platform) { return path.join(BIN_ROOT, platform); }

function alreadyInstalled(platform) {
  const dir = targetDir(platform);
  const expected = SOURCES[platform].binaries;
  return expected.every((b) => {
    const p = path.join(dir, b);
    if (!fs.existsSync(p)) return false;
    const st = fs.statSync(p);
    return st.size > 1024 * 1024;
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    log(`Baixando ${url}`);
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { 'User-Agent': 'tecjustica-transcribe-build' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return resolve(download(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} para ${url}`));
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let received = 0;
      let lastPct = -1;
      res.on('data', (chunk) => {
        received += chunk.length;
        if (total) {
          const pct = Math.floor((received / total) * 100);
          if (pct !== lastPct && pct % 10 === 0) {
            log(`  ${pct}% (${(received / 1024 / 1024).toFixed(1)} MB)`);
            lastPct = pct;
          }
        }
      });
      res.pipe(file);
      file.on('finish', () => file.close(() => {
        log(`Download concluído: ${(received / 1024 / 1024).toFixed(1)} MB`);
        resolve();
      }));
    });
    req.on('error', (e) => {
      file.close();
      try { fs.unlinkSync(dest); } catch {}
      reject(e);
    });
  });
}

function which(cmd) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim().split(/\r?\n/)[0] : null;
}

function ensureTool(cmd, hint) {
  if (!which(cmd)) {
    throw new Error(`Ferramenta '${cmd}' não encontrada no PATH. ${hint}`);
  }
}

function extractWin(archivePath, destDir) {
  ensureTool('unzip', 'Instale com: sudo apt install unzip');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ffmpeg-extract-'));
  try {
    log(`Extraindo zip em ${tmp}`);
    execSync(`unzip -q "${archivePath}" -d "${tmp}"`, { stdio: 'inherit' });
    // gyan.dev: ffmpeg-<version>-essentials_build/bin/{ffmpeg,ffprobe}.exe
    const entries = fs.readdirSync(tmp);
    const root = entries.map((e) => path.join(tmp, e)).find((p) => fs.statSync(p).isDirectory());
    if (!root) throw new Error('Nao achei diretorio raiz dentro do zip');
    const binDir = path.join(root, 'bin');
    fs.mkdirSync(destDir, { recursive: true });
    for (const b of SOURCES.win.binaries) {
      const src = path.join(binDir, b);
      if (!fs.existsSync(src)) throw new Error(`Binario ausente no zip: ${b}`);
      const dst = path.join(destDir, b);
      fs.copyFileSync(src, dst);
      log(`  -> ${path.relative(ROOT, dst)} (${(fs.statSync(dst).size / 1024 / 1024).toFixed(1)} MB)`);
    }
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
}

function extractLinux(archivePath, destDir) {
  ensureTool('tar', 'Instale com: sudo apt install tar');
  ensureTool('xz', 'Instale com: sudo apt install xz-utils');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ffmpeg-extract-'));
  try {
    log(`Extraindo tar.xz em ${tmp}`);
    execSync(`tar -xJf "${archivePath}" -C "${tmp}"`, { stdio: 'inherit' });
    // johnvansickle: ffmpeg-<version>-amd64-static/{ffmpeg,ffprobe}
    const entries = fs.readdirSync(tmp);
    const root = entries.map((e) => path.join(tmp, e)).find((p) => fs.statSync(p).isDirectory());
    if (!root) throw new Error('Nao achei diretorio raiz dentro do tarball');
    fs.mkdirSync(destDir, { recursive: true });
    for (const b of SOURCES.linux.binaries) {
      const src = path.join(root, b);
      if (!fs.existsSync(src)) throw new Error(`Binario ausente no tar: ${b}`);
      const dst = path.join(destDir, b);
      fs.copyFileSync(src, dst);
      fs.chmodSync(dst, 0o755);
      log(`  -> ${path.relative(ROOT, dst)} (${(fs.statSync(dst).size / 1024 / 1024).toFixed(1)} MB)`);
    }
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
}

function smokeTest(platform) {
  if (platform === 'linux' && process.platform === 'linux') {
    const ffmpeg = path.join(targetDir('linux'), 'ffmpeg');
    const r = spawnSync(ffmpeg, ['-version'], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`ffmpeg -version falhou: ${r.stderr || r.stdout}`);
    const firstLine = (r.stdout.split('\n')[0] || '').trim();
    log(`Smoke test OK: ${firstLine}`);
  } else {
    log(`Smoke test pulado (plataforma host = ${process.platform}, alvo = ${platform})`);
  }
}

async function process_(platform) {
  if (!SOURCES[platform]) throw new Error(`Plataforma desconhecida: ${platform}`);
  const dir = targetDir(platform);
  if (alreadyInstalled(platform)) {
    log(`[${platform}] já instalado em ${path.relative(ROOT, dir)} — pulando`);
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
  const tmpArchive = path.join(os.tmpdir(), SOURCES[platform].archive);
  if (fs.existsSync(tmpArchive)) {
    log(`Reusando archive em ${tmpArchive}`);
  } else {
    await download(SOURCES[platform].url, tmpArchive);
  }
  if (platform === 'win') extractWin(tmpArchive, dir);
  else extractLinux(tmpArchive, dir);
  smokeTest(platform);
}

async function main() {
  const arg = (process.argv[2] || '').toLowerCase();
  let targets;
  if (arg === 'all') targets = ['win', 'linux'];
  else if (arg === 'win' || arg === 'linux') targets = [arg];
  else if (!arg) targets = [process.platform === 'win32' ? 'win' : 'linux'];
  else { err(`Argumento invalido: ${arg}`); process.exit(2); }

  for (const t of targets) {
    try {
      await process_(t);
    } catch (e) {
      err(`Falha em ${t}: ${e.message}`);
      process.exit(1);
    }
  }
  log('Concluido.');
}

main();

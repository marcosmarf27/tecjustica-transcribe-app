# Build & Deploy — TecJustiça Transcribe

Guia passo a passo para compilar o instalador Windows (.exe) a partir do WSL e copiar para o Windows.

---

## Pre-requisitos (uma vez só)

```bash
# No WSL, instalar wine para cross-compilation Windows
sudo dpkg --add-architecture i386
sudo apt-get update
sudo apt-get install -y wine wine32:i386

# Instalar dependências Node.js do projeto
cd ~/projetos/electron-app
npm install
```

---

## Passo a passo completo

### 1. Fazer suas alterações

Edite os arquivos que precisar (`index.html`, `styles.css`, `renderer/*.js`, `main.js`, etc.).

> **Regra de ouro**: não modifique os IDs dos elementos HTML — o JavaScript depende deles.

---

### 2. Testar localmente (opcional, mas recomendado)

```bash
cd ~/projetos/electron-app
npx electron .
```

- O app abre no WSL (requer display X11/WSLg)
- Teste as funcionalidades que alterou
- `Ctrl+Shift+I` abre o DevTools para ver erros no Console
- Feche o app quando terminar

---

### 3. Compilar o instalador Windows (.exe)

```bash
cd ~/projetos/electron-app
npm run dist:win
```

- Demora ~1-2 minutos
- Gera o arquivo em: `dist/TecJustiça Transcribe Setup 1.0.0.exe`
- Se der erro de wine, verifique se wine está instalado (passo pre-requisitos)

---

### 4. Copiar para o Windows

```bash
cp "dist/TecJustiça Transcribe Setup 1.0.0.exe" /mnt/c/Users/marco/Downloads/
```

> **Nota**: `/mnt/c/` é o disco `C:\` do Windows visto pelo WSL.
> Ajuste o caminho se seu usuário Windows for diferente de `marco`.

---

### 5. Instalar no Windows

1. **Desinstalar a versão anterior** (se existir):
   - `Win+I` → Apps → Procure "TecJustiça" → Desinstalar
   - Ou: Painel de Controle → Programas e Recursos → Desinstalar
2. **Rodar o instalador**: duplo clique em `TecJustiça Transcribe Setup 1.0.0.exe` na pasta Downloads
3. Seguir o assistente de instalação

---

### 6. Testar no Windows

1. Abra o app pelo atalho no Desktop ou Menu Iniciar
2. Na primeira execução, o setup automático instala o Python + dependências (~10-30 min)
3. Após o backend iniciar, teste suas alterações

---

## Comandos resumidos (copiar e colar)

```bash
# Tudo de uma vez: compilar + copiar
cd ~/projetos/electron-app && npm run dist:win && cp "dist/TecJustiça Transcribe Setup 1.0.0.exe" /mnt/c/Users/marco/Downloads/
```

---

## Git: commit e push (quando quiser salvar)

```bash
cd ~/projetos/electron-app

# Ver o que mudou
git status
git diff

# Adicionar arquivos modificados (liste os que alterou)
git add index.html styles.css renderer/results.js main.js

# Commit com mensagem descritiva
git commit -m "descrição do que mudou"

# Enviar para o GitHub
git push origin main
```

---

## Como pegar logs para debug

### Logs do Frontend (DevTools)

1. Com o app aberto no Windows, pressione **`Ctrl+Shift+I`**
2. Vá na aba **Console**
3. Reproduza o problema (ex: clique no botão que não funciona)
4. Clique direito no Console → **Save as...** para salvar os logs
5. Ou selecione tudo (`Ctrl+A`) e copie (`Ctrl+C`)

### Logs do Backend Python

Os logs ficam em:
```
%APPDATA%\tecjustica-transcribe\logs\backend.log
```

Para abrir direto:
```
notepad %APPDATA%\tecjustica-transcribe\logs\backend.log
```

### Logs do Main Process (Electron)

Para ver logs do processo principal, abra o app pelo terminal:
```cmd
"C:\Users\marco\AppData\Local\Programs\tecjustica-transcribe\TecJustiça Transcribe.exe"
```

Os `console.log` e `console.error` do `main.js` aparecem nesse terminal.

---

## Estrutura de arquivos relevantes

```
electron-app/
├── index.html          ← HTML principal (layout, estrutura)
├── styles.css          ← CSS completo (visual, cores, espaçamentos)
├── main.js             ← Processo principal Electron (IPC, backend, janela)
├── preload.js          ← Ponte segura entre main e renderer
├── renderer/           ← JavaScript do frontend (modular)
│   ├── main.js         ← Inicialização, status, navegação
│   ├── transcription.js← Formulário, POST /transcribe, progresso
│   ├── history.js      ← Lista de transcrições, CRUD
│   ├── results.js      ← Exibição de resultado, busca, edição, export
│   ├── player.js       ← Player de áudio/vídeo sincronizado
│   ├── models.js       ← Download/delete de modelos WhisperX
│   ├── settings.js     ← Configurações
│   └── ...
├── python-backend/     ← Backend Python (FastAPI + WhisperX)
├── dist/               ← Arquivos compilados (gerados pelo build)
└── package.json        ← Config do projeto + config do electron-builder
```

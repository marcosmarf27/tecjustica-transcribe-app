# Requisitos: TecJustiça Transcribe

## Descrição

App desktop para transcrição automática de audiências judiciais usando WhisperX. Interface gráfica em Electron com backend Python (FastAPI). O usuário seleciona um arquivo de áudio/vídeo, escolhe o modelo e recebe a transcrição com timestamps e identificação de falantes. Funciona offline, localmente, com suporte a GPU NVIDIA para performance.

## Critérios de Aceitação

### Infraestrutura
- [ ] Backend Python (FastAPI) inicia automaticamente como child process do Electron
- [ ] Porta do backend é alocada dinamicamente (sem conflito)
- [ ] Health check com polling garante que a UI só aparece após backend estar pronto
- [ ] Backend é encerrado automaticamente ao fechar o app
- [ ] Funciona no Windows e Linux (sem Mac)

### Detecção de Sistema (Página Diagnóstico)
- [ ] Detecta versão do Python
- [ ] Detecta driver NVIDIA (`nvidia-smi`)
- [ ] Detecta CUDA disponível (`torch.cuda.is_available()`)
- [ ] Detecta GPU e VRAM (`torch.cuda.get_device_name`, `get_device_properties`)
- [ ] Detecta ffmpeg instalado
- [ ] Verifica se token HuggingFace está configurado
- [ ] Exibe tabela com status ✅/❌ de cada verificação
- [ ] Fallback para CPU com aviso visual quando GPU não disponível

### Gerenciamento de Modelos (Página Modelos)
- [ ] Lista modelos disponíveis: tiny, small, medium, large-v2
- [ ] Indica quais modelos já foram baixados
- [ ] Download sob demanda com barra de progresso em tempo real (SSE)
- [ ] Informa tamanho e VRAM recomendada de cada modelo
- [ ] Permite excluir modelos baixados

### Transcrição (Página Principal)
- [ ] Seleção de arquivo via diálogo nativo do OS
- [ ] Formatos suportados: .mp3, .wav, .m4a, .flac, .ogg, .mp4, .mkv, .avi, .mov, .webm
- [ ] Seleção de idioma: auto-detect, pt, en, es, fr, de
- [ ] Seleção de modelo (apenas modelos já baixados)
- [ ] Checkbox para ativar/desativar diarização
- [ ] Barra de progresso com 6 etapas visuais (modelo → áudio → transcrição → alinhamento → diarização → salvando)
- [ ] Resultado com timestamps por segmento e identificação de falantes
- [ ] Player de mídia (vídeo/áudio) sincronizado com transcrição clicável
- [ ] Clicar num segmento posiciona o player naquele ponto
- [ ] Segmento ativo é destacado durante reprodução

### Diarização
- [ ] Identifica automaticamente falantes (Speaker 1, Speaker 2, etc.)
- [ ] Requer token HuggingFace configurado
- [ ] Desabilitada visualmente quando token não está presente
- [ ] Usa pyannote.audio com modelo speaker-diarization-3.1

### Exportação
- [ ] Exportar TXT (texto com labels de falantes)
- [ ] Exportar SRT (legendas com timestamps)
- [ ] Exportar JSON (dados completos: segments, words, speakers)
- [ ] Copiar texto para clipboard
- [ ] Abrir arquivo gerado no editor padrão do OS

### Configurações (Página Configurações)
- [ ] Campo para token HuggingFace (tipo password com toggle)
- [ ] Pasta de saída customizável
- [ ] Seleção de device: auto/cuda/cpu
- [ ] Batch size: auto (0) ou valor fixo 1-32
- [ ] Configuração persiste em `userData/config.json`

### Interface
- [ ] Tema escuro inspirado no VS Code
- [ ] Layout: title bar + activity bar lateral + conteúdo + status bar
- [ ] Status bar exibe: GPU detectada, VRAM, CUDA, versão do app
- [ ] 4 páginas acessíveis pela activity bar: Transcrição, Modelos, Configurações, Diagnóstico
- [ ] Fonte JetBrains Mono

### Build/Distribuição
- [ ] Python embutido via PyInstaller (usuário não precisa instalar Python)
- [ ] CUDA embutido no instalador
- [ ] ffmpeg empacotado junto
- [ ] Instalador .AppImage para Linux
- [ ] Instalador .exe (NSIS) para Windows
- [ ] Token HF via variável de ambiente (.env, não commitado)

## Dependências

### Python
- whisperx (git+https://github.com/m-bain/whisperX.git)
- fastapi >= 0.115.0
- uvicorn[standard] >= 0.34.0
- torch >= 2.0.0 (com CUDA)
- python-dotenv >= 1.0.0
- huggingface_hub (transitiva via whisperx)
- pyannote.audio (transitiva via whisperx)
- faster_whisper / ctranslate2 (transitivas via whisperx)

### Node.js
- electron >= 41.0.3
- electron-builder >= 26.8.1

### Sistema
- ffmpeg (binário — empacotado no instalador)
- Driver NVIDIA (instalado pelo usuário)
- CUDA runtime (empacotado via PyTorch wheel)

## Features Relacionadas

- Player de mídia sincronizado com transcrição (inspirado no projeto existente TecJustiça Transcribe em NiceGUI)
- Auto batch_size baseado na VRAM detectada
- Supressão de warnings do PyTorch/ONNX/pyannote

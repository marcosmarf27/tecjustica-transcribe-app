# PRD — WhisperX Desktop App

## Visão Geral

App desktop para transcrição de áudio usando WhisperX, com interface gráfica em Electron e backend Python com FastAPI. O usuário seleciona um arquivo de áudio, escolhe o modelo e recebe a transcrição com timestamps e identificação de falantes.

---

## Problema

Ferramentas de transcrição de áudio atuais são:
- **Online** (dependem de internet, privacidade questionável)
- **CLI apenas** (WhisperX roda via terminal, inacessível para não-técnicos)
- **Pagas** (Otter.ai, Descript, etc.)

**Solução:** App desktop gratuito, offline, com interface amigável, que roda localmente usando GPU para performance.

---

## Público-Alvo

- Jornalistas que precisam transcrever entrevistas
- Pesquisadores que transcrevem gravações de campo
- Estudantes que querem transcrever aulas
- Profissionais que precisam de atas de reuniões
- Qualquer pessoa que queira transcrever áudio localmente com privacidade

---

## Stack Técnica

| Camada | Tecnologia | Motivo |
|--------|------------|--------|
| Frontend (UI) | Electron + HTML/CSS/JS | App desktop multiplataforma |
| Backend (IA) | Python + FastAPI | WhisperX só existe em Python |
| Transcrição | WhisperX (Whisper + wav2vec2) | 70x mais rápido, timestamps por palavra |
| Diarização | pyannote-audio | Identificação de falantes |
| Aceleração | CUDA (GPU NVIDIA) | Performance em tempo real |
| Distribuição | electron-builder + PyInstaller | Instalador único |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    ELECTRON APP                          │
│                                                          │
│  ┌──────────────────┐       ┌────────────────────────┐   │
│  │  RENDERER         │       │  MAIN PROCESS          │   │
│  │  (interface)      │       │  (main.js)             │   │
│  │                   │       │                        │   │
│  │  • Selecionar     │──IPC──│  • Recebe arquivo      │   │
│  │    arquivo áudio  │       │  • Spawna Python       │   │
│  │  • Escolher       │       │  • Envia para FastAPI  │   │
│  │    modelo         │       │  • Retorna resultado   │   │
│  │  • Ver progresso  │       │                        │   │
│  │  • Ver transcrição│       └──────────┬─────────────┘   │
│  └───────────────────┘                  │                  │
│                                         │ HTTP localhost   │
│                              ┌──────────▼─────────────┐   │
│                              │  PYTHON BACKEND         │   │
│                              │  (FastAPI + WhisperX)   │   │
│                              │                         │   │
│                              │  • Baixar modelos       │   │
│                              │  • Transcrever áudio    │   │
│                              │  • Diarização           │   │
│                              │  • Retornar JSON        │   │
│                              └─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Comunicação:** Electron → HTTP requests → FastAPI (localhost:8000) → WhisperX → resposta JSON

---

## Funcionalidades

### F1: Gerenciamento de Modelos
- Listar modelos disponíveis: tiny, base, small, medium, large-v2, large-v3
- Indicador visual de quais já foram baixados
- Download sob demanda com barra de progresso
- Informação de tamanho de cada modelo antes do download

| Modelo | Tamanho | VRAM | Qualidade |
|--------|---------|------|-----------|
| tiny | ~75MB | ~1GB | Básica |
| base | ~140MB | ~1GB | Boa |
| small | ~460MB | ~2GB | Muito boa |
| medium | ~1.5GB | ~5GB | Excelente |
| large-v2 | ~3GB | ~10GB | Máxima |
| large-v3 | ~3GB | ~10GB | Máxima (mais recente) |

### F2: Transcrição de Áudio
- Selecionar arquivo via diálogo nativo do SO
- Formatos suportados: .mp3, .wav, .m4a, .flac, .ogg, .mp4 (extrai áudio)
- Seleção de idioma (pt, en, es, fr, de, ou auto-detect)
- Barra de progresso durante transcrição
- Resultado com timestamps por segmento

### F3: Diarização (Identificação de Falantes)
- Checkbox para ativar/desativar
- Identifica automaticamente quantas pessoas falam
- Rotula trechos por falante (Speaker 1, Speaker 2, etc.)
- Requer token HuggingFace (pyannote exige aceitação de licença)

### F4: Exportação
- **TXT** — texto limpo, sem timestamps
- **SRT** — formato de legenda com timestamps (compatível com players de vídeo)
- **Copiar para clipboard** — copia o texto da transcrição

### F5: Informações do Sistema
- Exibir GPU detectada e VRAM disponível
- Indicar se CUDA está disponível
- Fallback para CPU se não houver GPU (com aviso de que será mais lento)

---

## Interface (Wireframe)

```
┌──────────────────────────────────────────────────┐
│  WhisperX Transcriber                        ─ □ ✕│
├──────────────────────────────────────────────────┤
│                                                    │
│  Modelo: [large-v3        ▼]  [✓ Baixado]         │
│                                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │    Arraste um arquivo de áudio aqui         │   │
│  │    ou clique para selecionar                │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  Idioma: [Português ▼]  ☑ Identificar falantes    │
│                                                    │
│  [        Transcrever        ]                     │
│                                                    │
│  ─────────────────────────────────────────────     │
│                                                    │
│  [00:00:01] Speaker 1:                             │
│  Olá, bem-vindos à reunião de hoje.                │
│                                                    │
│  [00:00:05] Speaker 2:                             │
│  Obrigado. Vamos começar pela pauta principal.     │
│                                                    │
│  [00:00:12] Speaker 1:                             │
│  Certo, o primeiro item é sobre o novo projeto...  │
│                                                    │
│  ─────────────────────────────────────────────     │
│                                                    │
│  [Exportar TXT]  [Exportar SRT]  [Copiar]         │
│                                                    │
│  GPU: NVIDIA RTX 3060 (12GB) | CUDA 12.1 | ✓      │
└──────────────────────────────────────────────────┘
```

---

## API Backend (FastAPI)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check do servidor |
| GET | `/gpu-info` | Info da GPU (modelo, VRAM, CUDA) |
| GET | `/models` | Lista modelos com status de download |
| POST | `/models/download` | Baixa modelo (SSE com progresso) |
| POST | `/transcribe` | Transcreve arquivo de áudio |
| GET | `/transcribe/progress` | Progresso da transcrição (SSE) |

### Exemplo de resposta `/transcribe`:
```json
{
  "segments": [
    {
      "start": 0.5,
      "end": 3.2,
      "text": "Olá, bem-vindos à reunião de hoje.",
      "speaker": "Speaker 1",
      "words": [
        {"word": "Olá", "start": 0.5, "end": 0.8},
        {"word": "bem-vindos", "start": 0.9, "end": 1.4},
        {"word": "à", "start": 1.5, "end": 1.6},
        {"word": "reunião", "start": 1.7, "end": 2.3},
        {"word": "de", "start": 2.4, "end": 2.5},
        {"word": "hoje", "start": 2.6, "end": 3.2}
      ]
    }
  ],
  "language": "pt",
  "model": "large-v3",
  "duration": 125.4,
  "processing_time": 8.2
}
```

---

## Estrutura de Pastas

```
whisperx-app/
├── package.json
├── main.js                → Main Process (spawn Python, IPC, diálogos nativos)
├── preload.js             → Ponte segura (contextBridge)
├── renderer.js            → Lógica da interface
├── index.html             → Layout
├── styles.css             → Tema escuro
├── python-backend/
│   ├── requirements.txt   → whisperx, fastapi, uvicorn
│   ├── server.py          → Servidor FastAPI
│   └── transcriber.py     → Wrapper WhisperX (transcrição + diarização)
└── dist/                  → Saída do electron-builder (gerada pelo build)
```

---

## Fases de Desenvolvimento

| Fase | O que | Entregável |
|------|-------|------------|
| 1 | Setup do projeto | Electron base rodando (tela vazia) |
| 2 | Backend Python | FastAPI + WhisperX funcionando standalone |
| 3 | Interface Electron | UI completa com todas as telas |
| 4 | Integração | Electron spawna Python, comunicação funcionando |
| 5 | Distribuição | Instalador .AppImage/.exe com Python embutido |

---

## Pré-requisitos do Ambiente

### Para desenvolvimento:
- Node.js 18+
- Python 3.10+
- CUDA Toolkit 11.8+ (para GPU)
- Git

### Para build de distribuição:
- PyInstaller (`pip install pyinstaller`)
- electron-builder (`npm install --save-dev electron-builder`)
- wine + wine32 (para gerar .exe a partir do Linux)

### Dependências Python:
```
whisperx
fastapi
uvicorn[standard]
torch (com CUDA)
```

---

## Riscos e Limitações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Tamanho do instalador (~2-3GB) | UX de download ruim | Modelos baixados sob demanda |
| CUDA não disponível | Transcrição muito lenta | Fallback CPU com aviso ao usuário |
| pyannote requer token HuggingFace | Diarização não funciona sem aceitar licença | Tutorial na UI explicando como obter |
| PyInstaller + CUDA = build complexo | Distribuição difícil | Testar builds incrementalmente |
| Formatos de áudio incompatíveis | Erro na transcrição | ffmpeg como dependência (WhisperX já usa) |

---

## Métricas de Sucesso

1. App abre e detecta GPU em < 3 segundos
2. Download de modelo mostra progresso em tempo real
3. Transcrição de 1 minuto de áudio completa em < 10 segundos (GPU)
4. Resultado exibe timestamps e falantes corretamente
5. Exportação SRT/TXT gera arquivo válido
6. Instalador funciona em máquina limpa (sem Python/Node instalado)

# Ações Manuais: TecJustiça Transcribe

Passos que precisam ser executados manualmente por um humano.

## Antes da Implementação

- [ ] **Criar conta no HuggingFace** - Necessário para obter token de acesso (https://huggingface.co/join)
- [ ] **Gerar token HuggingFace** - Criar access token em https://huggingface.co/settings/tokens (tipo: Read)
- [ ] **Aceitar termos do pyannote** - A diarização requer aceitar a licença dos modelos:
  - https://huggingface.co/pyannote/speaker-diarization-3.1 (clicar "Agree and access repository")
  - https://huggingface.co/pyannote/segmentation-3.0 (clicar "Agree and access repository")
- [ ] **Instalar Python 3.10+** - Necessário para desenvolvimento do backend (https://www.python.org/downloads/)
- [ ] **Instalar CUDA Toolkit** - Para desenvolvimento local com GPU (https://developer.nvidia.com/cuda-downloads)

## Durante a Implementação

- [ ] **Configurar .env** - Criar arquivo `.env` na raiz com `HF_TOKEN=hf_seu_token_aqui`
- [ ] **Baixar ffmpeg para Windows** - Para testes de build Windows, baixar binário estático de https://www.gyan.dev/ffmpeg/builds/ (versão "essentials")

## Após a Implementação

- [ ] **Testar em máquina Windows limpa** - Instalar o .exe em um Windows sem Python/Node e verificar que funciona
- [ ] **Testar fallback CPU** - Testar em máquina sem GPU NVIDIA para validar que funciona em CPU
- [ ] **Testar com diferentes GPUs** - Validar auto batch_size com diferentes quantidades de VRAM

---

> Estas ações também estão listadas em contexto no `implementation-plan.md`

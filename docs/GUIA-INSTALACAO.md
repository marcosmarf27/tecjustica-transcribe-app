# Guia de Instalacao — TecJustica Transcribe

**Versao 1.0.0** | Março 2026

---

## Sumário

1. [Sobre o aplicativo](#1-sobre-o-aplicativo)
2. [Requisitos do sistema](#2-requisitos-do-sistema)
3. [Instalação no Windows](#3-instalação-no-windows)
4. [Instalação no Linux](#4-instalação-no-linux)
5. [Ativação da licença](#5-ativação-da-licença)
6. [Primeiro uso — Setup automático](#6-primeiro-uso--setup-automático)
7. [Visão geral do aplicativo](#7-visão-geral-do-aplicativo)
8. [Realizando uma transcrição](#8-realizando-uma-transcrição)
9. [Exportando resultados](#9-exportando-resultados)
10. [Gerenciamento de modelos](#10-gerenciamento-de-modelos)
11. [Configurações](#11-configurações)
12. [Diagnóstico e troubleshooting](#12-diagnóstico-e-troubleshooting)
13. [Desinstalação](#13-desinstalação)
14. [Perguntas frequentes](#14-perguntas-frequentes)

---

## 1. Sobre o aplicativo

O **TecJustiça Transcribe** é um aplicativo desktop para transcrição automática de audiências judiciais. Ele converte arquivos de áudio e vídeo em texto usando inteligência artificial (modelo WhisperX), com suporte a:

- **Transcrição automática** com alta precisão em português e outros idiomas
- **Diarização** — identificação de quem está falando (Juiz, Promotor, Advogado, etc.)
- **Exportação** em múltiplos formatos (TXT, SRT, DOCX)
- **Edição** dos segmentos transcritos diretamente no app
- **Player sincronizado** — clique no texto para ouvir o trecho correspondente

### Privacidade e segurança

O processamento acontece **inteiramente na sua máquina**. Nenhum dado de áudio ou texto é enviado para servidores externos. A internet é necessária apenas na configuração inicial (download de dependências) e para baixar modelos de IA.

### Parceria

Desenvolvido em parceria **TecJustiça × Projurista** — tecnologia a serviço da Justiça.

---

## 2. Requisitos do sistema

### 2.1 Windows

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| **Sistema operacional** | Windows 10 versão 1709+ (64-bit) | Windows 11 |
| **Processador** | Intel Core i5 / AMD Ryzen 5 | Intel Core i7 / AMD Ryzen 7 |
| **Memória RAM** | 8 GB | 16 GB |
| **Espaço em disco** | 4 GB livres | 10 GB livres |
| **Conexão internet** | Necessária no primeiro uso | Banda larga (download de ~3 GB) |
| **GPU NVIDIA (opcional)** | GTX 1060 (4 GB VRAM) | RTX 3060+ (8 GB+ VRAM) |
| **Driver NVIDIA** | Versão 560 ou superior | Última versão disponível |

> **Nota sobre GPU**: A GPU NVIDIA é **recomendada mas não obrigatória**. Sem GPU, o app funciona em modo CPU — apenas mais devagar (aproximadamente 10x).

> **Python e ffmpeg**: O app instala automaticamente essas dependências no primeiro uso. Você **não precisa** instalar manualmente.

### 2.2 Linux

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| **Sistema operacional** | Ubuntu 20.04+ (x86_64) | Ubuntu 22.04+ |
| **Processador** | Intel Core i5 / AMD Ryzen 5 | Intel Core i7 / AMD Ryzen 7 |
| **Memória RAM** | 8 GB | 16 GB |
| **Espaço em disco** | 4 GB livres | 10 GB livres |
| **Python** | 3.10 | 3.11 ou 3.12 |
| **ffmpeg** | Instalado no sistema | Última versão |
| **GPU NVIDIA (opcional)** | GTX 1060 (4 GB VRAM) | RTX 3060+ (8 GB+ VRAM) |
| **Driver NVIDIA** | Versão 560+ com CUDA toolkit | Última versão |

No Linux, é necessário instalar Python e ffmpeg antes de usar o app:

```bash
sudo apt install python3 python3-venv ffmpeg
```

---

## 3. Instalação no Windows

Existem duas formas de instalar:

### 3.1 Instalador (recomendado)

1. Acesse a página de releases do projeto:
   **https://github.com/marcosmarf27/tecjustica-transcribe-app/releases/latest**

2. Baixe o arquivo **`TecJustiça Transcribe Setup X.X.X.exe`** (~96 MB)

3. Execute o instalador. Se o Windows Defender exibir um aviso "Windows protegeu seu PC":
   - Clique em **"Mais informações"**
   - Clique em **"Executar assim mesmo"**
   - Isso acontece porque o instalador não possui assinatura digital (é seguro)

4. O instalador é rápido — apenas extrai os arquivos. Após concluir:
   - O app aparece no **Menu Iniciar**
   - Um atalho é criado na **Área de Trabalho**

5. Abra o **TecJustiça Transcribe** pelo Menu Iniciar

### 3.2 Instalação via linha de comando

Para quem prefere usar o terminal, abra o **PowerShell** e execute:

```powershell
irm https://raw.githubusercontent.com/marcosmarf27/tecjustica-transcribe-app/main/install.ps1 | iex
```

Este comando:
- Detecta a versão mais recente automaticamente
- Baixa o instalador da página de releases
- Executa a instalação silenciosa
- Verifica se a instalação foi bem-sucedida

---

## 4. Instalação no Linux

### 4.1 Pré-requisitos

Antes de instalar o app, instale Python e ffmpeg:

```bash
sudo apt update
sudo apt install python3 python3-venv ffmpeg
```

Verifique a versão do Python (deve ser 3.10 a 3.13):

```bash
python3 --version
```

### 4.2 Instalação via script (recomendado)

Execute no terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/marcosmarf27/tecjustica-transcribe-app/main/install.sh | bash
```

Este comando:
- Baixa o AppImage da última release
- Instala em `~/.local/bin/tecjustica-transcribe`
- Cria atalho no menu de aplicativos
- Extrai o ícone do app

### 4.3 Instalação manual

1. Baixe o arquivo `.AppImage` da [página de releases](https://github.com/marcosmarf27/tecjustica-transcribe-app/releases/latest)
2. Dê permissão de execução:
   ```bash
   chmod +x TecJustica-Transcribe-*.AppImage
   ```
3. Execute:
   ```bash
   ./TecJustica-Transcribe-*.AppImage
   ```

---

## 5. Ativação da licença

Na primeira vez que o app abrir, será exibida a **tela de ativação de licença**.

1. Insira sua **chave de licença** no campo indicado
2. Clique em **Ativar**
3. Aguarde a validação (requer internet)
4. Após ativação, o app libera o acesso completo

> **Adquira sua licença**: Acesse [transcricao-web.vercel.app](https://transcricao-web.vercel.app/#precos) para ver os planos disponíveis.

> **Modo offline**: Após a primeira ativação, o app funciona offline por até 72 horas (assinaturas) ou ilimitado (licença vitalícia). Ao reconectar à internet, a licença é revalidada automaticamente.

---

## 6. Primeiro uso — Setup automático

Após ativar a licença, na primeira execução será exibida a **tela de configuração inicial**. O app configura tudo automaticamente:

### 6.1 O que acontece (Windows)

| Etapa | O que faz | Tempo estimado |
|-------|-----------|----------------|
| 1. Detectar Python | Busca Python 3.10-3.13 no sistema | Instantâneo |
| 2. Instalar Python* | Se não encontrou, instala Python 3.11 via winget | 1-3 minutos |
| 3. Verificar ffmpeg | Busca ffmpeg no sistema | Instantâneo |
| 4. Instalar ffmpeg* | Se não encontrou, instala via winget | 1-2 minutos |
| 5. Criar ambiente | Cria ambiente Python isolado (venv) | 10-30 segundos |
| 6. Instalar dependências | Baixa PyTorch, WhisperX e outras libs (~3 GB) | 10-30 minutos |
| 7. Finalizar | Marca setup como concluído | Instantâneo |

*\* Instalação automática requer winget (presente no Windows 10 1709+ e Windows 11). Se o winget não estiver disponível, o app pedirá para instalar Python manualmente.*

### 6.2 O que acontece (Linux)

O processo é similar, mas Python e ffmpeg devem estar pré-instalados (ver seção 4.1). O app cria o ambiente virtual e instala as dependências automaticamente.

### 6.3 Dicas para o setup

- **Não feche o app** durante o setup — o download de ~3 GB precisa completar
- **Conexão estável** — se a internet cair, feche e reabra o app para retomar
- **Espaço em disco** — garanta pelo menos 4 GB livres
- **Paciência** — a primeira instalação é a mais demorada. Depois, o app abre em segundos

### 6.4 Se o setup falhar

1. Verifique sua conexão com a internet
2. Abra a página de **Diagnóstico** no app para identificar o problema
3. Consulte os logs em:
   - **Windows**: `%APPDATA%\tecjustica-transcribe\logs\setup.log`
   - **Linux**: `~/.config/tecjustica-transcribe/logs/setup.log`
4. Se necessário, delete a pasta do ambiente Python e reabra o app:
   - **Windows**: `%APPDATA%\tecjustica-transcribe\python-env\`
   - **Linux**: `~/.config/tecjustica-transcribe/python-env/`

---

## 7. Visão geral do aplicativo

O app possui uma interface inspirada no Visual Studio Code, com tema escuro, organizada em 4 páginas acessíveis pela sidebar lateral:

### 7.1 Transcrição (página principal)

Três visualizações:
- **Histórico** — lista de transcrições anteriores com busca, status e ações
- **Nova Transcrição** — formulário para selecionar arquivo e configurar opções
- **Resultado** — player de mídia + segmentos transcritos editáveis

### 7.2 Modelos

Gerenciamento dos modelos WhisperX disponíveis:

| Modelo | Tamanho | Precisão | Velocidade |
|--------|---------|----------|------------|
| **tiny** | ~75 MB | Básica | Muito rápido |
| **small** | ~500 MB | Boa | Rápido |
| **medium** | ~1.5 GB | Muito boa | Moderado |
| **large-v2** | ~3 GB | Excelente | Lento |

> Para audiências judiciais, recomendamos o modelo **medium** ou **large-v2** para melhor precisão.

### 7.3 Configurações

- **Token HuggingFace** — necessário para diarização (já vem com token padrão)
- **Pasta de saída** — onde salvar os arquivos exportados
- **Device** — GPU ou CPU
- **Batch size** — tamanho do lote de processamento

### 7.4 Diagnóstico

Verificação completa do ambiente:
- Python (versão e caminho)
- NVIDIA driver, CUDA, GPU e VRAM
- ffmpeg
- Token HuggingFace (validação online)

---

## 8. Realizando uma transcrição

### Passo a passo

1. Abra o app e clique em **Nova Transcrição** (ou no botão "+" no histórico)

2. **Selecione o arquivo** de áudio ou vídeo:
   - Clique no botão de seleção, ou
   - **Arraste e solte** o arquivo sobre a janela do app

3. **Configure as opções**:
   - **Modelo**: escolha o modelo de IA (recomendado: medium ou large-v2)
   - **Idioma**: selecione o idioma do áudio (ou deixe em "auto" para detecção automática)
   - **Diarização**: ative se deseja identificar interlocutores

4. Clique em **Transcrever**

5. **Acompanhe o progresso**:
   - O pipeline mostra 6 etapas visuais
   - Porcentagem e tempo estimado (ETA) são exibidos
   - Você pode navegar pelo app enquanto a transcrição processa em background
   - Um indicador pulsante na sidebar sinaliza que há transcrição em andamento

6. **Notificação**: ao concluir, um toast aparece com a opção "Ver resultado"

### Formatos suportados

| Tipo | Formatos |
|------|----------|
| **Áudio** | MP3, WAV, M4A, OGG, FLAC, WMA, AAC |
| **Vídeo** | MP4, MKV, AVI, MOV, WebM, WMV |

---

## 9. Exportando resultados

Na tela de resultado, clique em **Exportar** e escolha o formato:

### 9.1 TXT — Texto puro

Texto corrido com timestamps, ideal para leitura rápida:

```
[00:00:05 - 00:00:12] Boa tarde, vamos iniciar a audiência.
[00:00:13 - 00:00:18] O senhor pode se identificar, por favor?
```

### 9.2 SRT — Legendas

Formato padrão de legendas, compatível com players de vídeo (VLC, etc.):

```
1
00:00:05,000 --> 00:00:12,000
Boa tarde, vamos iniciar a audiência.

2
00:00:13,000 --> 00:00:18,000
O senhor pode se identificar, por favor?
```

### 9.3 DOCX — Relatório formatado

Documento Word com:
- Cabeçalho da parceria TecJustiça × Projurista
- Metadados do arquivo (nome, duração, modelo usado)
- Transcrição completa com timestamps
- Formatação profissional

---

## 10. Gerenciamento de modelos

### Baixar um modelo

1. Vá para a página **Modelos**
2. Clique em **Download** no modelo desejado
3. Aguarde o download (o progresso é exibido)

### Remover um modelo

1. Vá para a página **Modelos**
2. Clique em **Remover** no modelo que deseja excluir
3. Confirme a exclusão

> **Dica**: Se você só usa um modelo, mantenha apenas ele para economizar espaço em disco.

---

## 11. Configurações

### Token HuggingFace

O app já vem com um token padrão funcional. Se você tem sua própria conta no HuggingFace:

1. Crie uma conta em [huggingface.co](https://huggingface.co) e **verifique seu email**
2. Gere um token em [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - **IMPORTANTE**: Escolha o tipo **"Read"** (acesso de leitura). Tokens do tipo "Fine-grained" **não funcionam** para validação
3. Aceite os termos de uso dos modelos:
   - [pyannote/speaker-diarization-3.1](https://huggingface.co/pyannote/speaker-diarization-3.1)
   - [pyannote/segmentation-3.0](https://huggingface.co/pyannote/segmentation-3.0)
4. Cole o token na página de **Configurações** do app e clique **Salvar Alterações**
5. Vá em **Diagnóstico** para confirmar que o token aparece como "Válido"

### Pasta de saída

Configure onde os arquivos exportados (TXT, SRT, DOCX) serão salvos. O padrão é a mesma pasta do arquivo de mídia original.

---

## 12. Diagnóstico e troubleshooting

### Acessando o diagnóstico

Clique em **Diagnóstico** na sidebar para ver o estado completo do seu sistema.

### Problemas comuns

#### "Python não encontrado"

**Windows:**
- O app tenta instalar automaticamente via winget
- Se o winget não estiver disponível, instale Python 3.11 de [python.org](https://www.python.org/downloads/)
- **Importante**: marque a opção **"Add Python to PATH"** durante a instalação
- Reinicie o app após instalar

**Linux:**
```bash
sudo apt install python3 python3-venv
```

#### "ffmpeg não encontrado"

**Windows:**
- O app tenta instalar automaticamente via winget
- Se falhar, baixe de [ffmpeg.org](https://ffmpeg.org/download.html) e adicione ao PATH

**Linux:**
```bash
sudo apt install ffmpeg
```

#### "Backend não iniciou" ou "Erro de conexão"

1. Verifique a página de Diagnóstico
2. Tente fechar e reabrir o app
3. Se persistir, delete o ambiente Python:
   - **Windows**: Delete a pasta `%APPDATA%\tecjustica-transcribe\python-env\`
   - **Linux**: Delete a pasta `~/.config/tecjustica-transcribe/python-env/`
4. Reabra o app — o setup vai rodar novamente

#### Transcrição lenta

- **Use GPU** se possível (10x mais rápido que CPU)
- Use modelos menores (tiny, small) para testes rápidos
- Feche outros programas que usam a GPU
- Verifique a VRAM disponível na página de Diagnóstico

#### Erro de diarização (identificação de interlocutores)

- Verifique se o token HuggingFace é válido (página de Diagnóstico)
- Aceite os termos do modelo pyannote no site do HuggingFace
- Tente sem diarização para verificar se a transcrição em si funciona

### Logs

Os logs do app ficam em:
- **Windows**: `%APPDATA%\tecjustica-transcribe\logs\`
- **Linux**: `~/.config/tecjustica-transcribe/logs/`

Arquivos de log:
- `backend.log` — logs do backend Python
- `setup.log` — logs da configuração inicial

---

## 13. Desinstalação

### Windows

1. Abra **Configurações > Aplicativos > Aplicativos instalados**
2. Busque por **TecJustiça Transcribe**
3. Clique em **Desinstalar**

Para remover também os dados do app (transcrições, configurações, ambiente Python):
- Delete a pasta `%APPDATA%\tecjustica-transcribe\`

### Linux

```bash
# Remover executável e atalho
rm ~/.local/bin/tecjustica-transcribe
rm ~/.local/share/applications/tecjustica-transcribe.desktop

# Remover dados do app (opcional)
rm -rf ~/.config/tecjustica-transcribe/
```

---

## 14. Perguntas frequentes

**O app precisa de internet para transcrever?**
Não. A internet é necessária apenas na configuração inicial (download de dependências e modelos). Depois, tudo funciona offline.

**Meus dados de áudio são enviados para algum servidor?**
Não. Todo o processamento é local, na sua máquina. Nenhum dado sai do seu computador.

**Qual modelo devo usar?**
Para audiências judiciais, recomendamos o **medium** (bom equilíbrio) ou **large-v2** (máxima precisão). O **tiny** e **small** são úteis para testes rápidos.

**Posso usar sem GPU NVIDIA?**
Sim. O app funciona em modo CPU, porém mais devagar (aproximadamente 10x). Para transcrições frequentes, uma GPU NVIDIA é altamente recomendada.

**Quanto espaço em disco é necessário?**
O instalador tem ~96 MB. Após o setup inicial, as dependências ocupam ~3-4 GB. Cada modelo baixado ocupa de 75 MB (tiny) a 3 GB (large-v2).

**Posso editar a transcrição?**
Sim. Dê double-click em qualquer segmento para editar. Após editar, use "Re-exportar" para gerar novos arquivos com as correções.

**Que idiomas são suportados?**
O WhisperX suporta mais de 90 idiomas. O app está otimizado para português brasileiro, mas funciona com qualquer idioma suportado pelo modelo.

**O instalador dá aviso de segurança no Windows. É normal?**
Sim. Como o instalador não possui assinatura digital, o Windows Defender exibe um aviso. Clique em "Mais informações" e depois "Executar assim mesmo".

---

<p align="center">
  <strong>TecJustiça Transcribe</strong> — Versão 1.0.0<br>
  Parceria TecJustiça × Projurista<br>
  <em>Tecnologia a serviço da Justiça</em>
</p>

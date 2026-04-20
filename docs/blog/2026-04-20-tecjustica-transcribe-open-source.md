# Abri o código do TecJustiça Transcribe. E quero contar por quê.

**Transcrição de audiências com IA, 100% local, gratuita no Windows e com código aberto no GitHub.** É a minha contribuição pra comunidade do Judiciário brasileiro — e o post abaixo explica por que eu escolhi esse caminho em vez de vender.

---

## TL;DR

- **O app**: [TecJustiça Transcribe](https://github.com/marcosmarf27/tecjustica-transcribe-app) — transcreve audiências com WhisperX, identifica interlocutores, exporta em DOCX/SRT/TXT. Tudo **offline**, sem áudio saindo da sua máquina.
- **Preço**: zero. Instalador `.exe` pronto pra Windows no GitHub.
- **Licença**: MIT. Quem sabe programar, faz o que quiser com o código — inclusive portar pra macOS (precisa de um Mac pra gerar o `.app`, como mandam as regras da Apple).
- **Parceria**: produto **TecJustiça**, em parceria com **Projurista**.
- **Demo em vídeo**: [youtu.be/ECCIGjIR1Lo](https://youtu.be/ECCIGjIR1Lo)
- **Próximo projeto open source**: o **Presidio One**, também já no meu GitHub.

---

## Por que eu abri o código

Vou ser direto: eu sou **servidor público do Judiciário**. Não sou uma startup, não tenho time de suporte, não tenho help desk, não tenho ninguém de plantão pra responder ticket de cliente que não conseguiu instalar por causa de um driver da NVIDIA.

Cheguei num ponto em que estava evidente: **se eu cobrasse pelo app, eu não daria conta de dar suporte**. E software jurídico sem suporte é um problema — porque audiência não espera, processo não espera, prazo não espera. A última coisa que um servidor ou um advogado precisa é de uma ferramenta que trava numa quinta-feira às 22h e ninguém pra ajudar.

Cobrar sabendo disso não me pareceu justo. E eu já venho publicando conteúdo gratuito no YouTube e aqui na newsletter explicando como usar IA no dia a dia do Direito, então não fazia sentido mudar de postura agora e começar a colocar paywall numa coisa que, honestamente, pode ajudar muita gente.

Aí veio a decisão: **em vez de vender mal, eu abro o código bem**. Código aberto, instalador gratuito pra Windows, licença MIT. Quem quiser usar, usa. Quem quiser modificar, modifica. Quem quiser portar pra macOS, porta (dá trabalho, mas todo o caminho está lá).

---

## O que o TecJustiça Transcribe faz

É um app desktop (Electron + Python) que roda **totalmente na sua máquina**. Nada de API, nada de key, nada de fila. Você arrasta o vídeo ou o áudio da audiência, clica em transcrever, e ele te devolve:

- Texto com timestamps, palavra por palavra, com o tempo exato de cada frase
- **Diarização** (identificação de quem está falando) — "Speaker 1", "Speaker 2", etc., que você renomeia depois pra Juiz, Advogado, Testemunha
- Exportação pronta em **TXT, SRT (legenda pra vídeo) ou DOCX** com cabeçalho formatado
- **Player sincronizado** — clicou no parágrafo, pulou pro segundo exato do vídeo
- **Edição inline** — achou que o whisper errou uma palavra? Duplo-clique, corrige, Ctrl+Enter
- **Busca com highlight** (Ctrl+F) dentro da transcrição
- **Análise com IA** (opcional, via Google Gemini) — resumo, pontos-chave, pedidos, decisões
- **Chat com a transcrição** — pergunte "o que a testemunha falou sobre X?" e receba a resposta citando o trecho

Por baixo do capô é o [WhisperX](https://github.com/m-bain/whisperX) (estado da arte em reconhecimento de fala open source) com aceleração CUDA se você tiver GPU NVIDIA. Numa GPU decente, 1h de áudio transcreve em **5–10 minutos**. Sem GPU, funciona também — só é mais lento, tipo "deixa rodando enquanto você almoça".

---

## Por que 100% local é um requisito, não um luxo

Todo serviço de transcrição online que existe hoje pede pra você **mandar o áudio pra nuvem deles**. Google, OpenAI, Whisper via API, Assembly, Deepgram — todos processam no servidor deles.

No Judiciário isso é um problema gigante:

1. **Sigilo processual** — processos em segredo de justiça (CNJ Resolução 615/2025) não podem ter dados enviados a terceiros sem base legal e contrato de tratamento. Mandar o áudio de uma audiência de família pra API do OpenAI é, no mínimo, uma dor de cabeça jurídica.
2. **LGPD** — dados pessoais e sensíveis (testemunhas, vítimas, menores) exigem cuidado redobrado com transferência internacional.
3. **Propriedade intelectual e estratégia** — escritórios de advocacia não querem que o teor da audiência do cliente X seja input de treinamento de ninguém.

Quando o app roda **no seu computador**, todo esse problema some. O áudio não trafega. A transcrição não trafega. Nem os modelos — eles ficam cacheados localmente depois do primeiro download. Você pode desconectar da internet depois do setup inicial e o app continua funcionando.

E como o código é aberto, qualquer equipe de TI do Tribunal pode auditar linha por linha e confirmar que o app não liga pra canto nenhum. É o tipo de confiança que só código aberto entrega.

---

## O que está empacotado (e por que isso importa)

Preparar um app que roda IA local no Windows pra usuário não-técnico é chato. Tem PyTorch, CUDA, ffmpeg, Python na versão certa — e historicamente cada uma dessas coisas era "instale manualmente e torça".

Eu gastei um tempo considerável nisso pra que o fluxo seja **só baixar e clicar**:

- **ffmpeg** vem empacotado dentro do instalador (antes era "instale o ffmpeg no PATH"). Agora é zero-fricção.
- **Python** é detectado automaticamente; se não tiver, o app instala via `winget` sozinho.
- **PyTorch com CUDA 12.6** é instalado no primeiro uso via `pip` com o índice correto (o que evita a pegadinha clássica de baixar a versão CPU-only sem querer).
- **Modelos do WhisperX** são baixados sob demanda pela tela de Modelos.

O instalador `.exe` final tem ~148 MB. O primeiro uso baixa uns 3 GB (PyTorch + WhisperX + modelo pequeno). Depois disso, ligou-usou.

---

## Se você usa macOS

O código é totalmente portável — Electron é multiplataforma, Python é multiplataforma, WhisperX roda em Mac. **Mas a Apple exige que o build do `.app` seja feito num Mac físico** (não tem jeito de gerar `.app` a partir do Linux/Windows, e isso é regra da Apple, não limitação do projeto). Eu não tenho Mac pra fazer esse build com qualidade.

Quem tiver Mac e quiser contribuir: clona o repo, roda `npm run dist:mac`, valida e manda PR. Ou mantém um fork só pra Mac — o que preferir. Código tá lá, MIT. [github.com/marcosmarf27/tecjustica-transcribe-app](https://github.com/marcosmarf27/tecjustica-transcribe-app).

---

## A parceria com a Projurista

O projeto tem o carinho e o incentivo da [Projurista](https://projurista.com.br) desde o começo — eles entenderam que tinha mais valor no app existir e ajudar, do que no app ser produto fechado com margem de venda. Por isso o rodapé dos DOCX exportados leva a assinatura "em parceria com Projurista": o crédito é legítimo e merecido.

Mas que fique claro: o produto é **TecJustiça**. A identidade, a direção, a licença e a responsabilidade de manutenção são minhas. A Projurista está lá como parceira — exatamente como deve ser: transparente e na proporção certa.

---

## Não é o primeiro — e não vai ser o último

Esse é o **segundo projeto meu que eu coloco em open source**. O primeiro foi o [**Presidio One**](https://github.com/marcosmarf27/presidio-anon-app) (também no meu GitHub), um app de **anonimização automática** de documentos — útil pra quem precisa compartilhar peças, pareceres ou decisões sem expor dados pessoais, usando o excelente [Microsoft Presidio](https://github.com/microsoft/presidio) por baixo.

A ideia de transformar isso num **movimento** é deliberada. Tem muita ferramenta boa travada atrás de paywall que não faz sentido no contexto público. Se eu consigo abrir e mantenho ao menos funcional, eu abro. O ecossistema TecJustiça vai continuar nessa linha — com um repositório de [plugins e skills jurídicas](https://github.com/marcosmarf27/tecjustica) também aberto no GitHub.

Se você também escreve software e tem algo que faria sentido abrir — abre. A comunidade do Direito no Brasil tem tudo pra ser referência em IA aplicada, e isso acontece mais rápido quando as ferramentas circulam.

---

## Como baixar

**Windows (2 cliques):**

1. Vai em [github.com/marcosmarf27/tecjustica-transcribe-app/releases/latest](https://github.com/marcosmarf27/tecjustica-transcribe-app/releases/latest)
2. Baixa o `.exe`
3. Executa. Pronto.

**Linha de comando (quem prefere):**

```powershell
irm https://raw.githubusercontent.com/marcosmarf27/tecjustica-transcribe-app/main/install.ps1 | iex
```

**Linux (AppImage):**

```bash
curl -fsSL https://raw.githubusercontent.com/marcosmarf27/tecjustica-transcribe-app/main/install.sh | bash
```

---

## O que vem a seguir

Vou gravar um vídeo demonstrando o uso na prática — incluindo o fluxo completo de uma audiência real (fictícia, claro), a diarização, a exportação e a análise com IA. Publico aqui na newsletter assim que estiver pronto.

Enquanto isso, **testa**, **dá feedback**, **abre issue no GitHub** se achar bug. E se te ajudar, me avisa — nem que seja com uma ⭐ lá no repo. Isso tudo me diz se vale a pena continuar nessa linha.

Valeu. ✊

---

*Marcos Fonseca — servidor público, criador do TecJustiça, entusiasta de IA aplicada ao Direito.*
*Se curtiu, assina a newsletter: [tecjustica.substack.com](https://tecjustica.substack.com/)*

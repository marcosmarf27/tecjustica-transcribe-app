# Requisitos: Analise de Transcrições com Gemini API

## Descrição

Integrar a API do Google Gemini ao TecJustiça Transcribe para gerar análises inteligentes das transcrições de audiências judiciais. O usuário fornece uma chave da API Gemini nas configurações, e pode gerar múltiplas análises por transcrição usando prompts customizáveis. Cada tópico identificado na análise referencia trechos do áudio/vídeo, permitindo navegação direta no player.

A chamada ao Gemini é feita no processo principal (Node.js) via `fetch` direto, sem passar pelo backend Python. A API key fica na `config.json` local.

## Critérios de Aceitação

- [ ] Campo de Gemini API Key nas Configurações, com toggle mostrar/ocultar e link para obtenção
- [ ] API key persistida em `config.json` como `gemini_api_key`
- [ ] Botão "Analisar com IA" visível na toolbar do resultado de transcrição
- [ ] Sem API key configurada: botão mostra aviso e redireciona para Configurações
- [ ] Modal de análise com textarea de prompt pré-preenchido (editável pelo usuário)
- [ ] Chamada ao Gemini 2.5 Flash com structured outputs (JSON Schema)
- [ ] Loading state visível durante análise
- [ ] Resultado exibido como card com resumo geral e tópicos
- [ ] Cada tópico tem título, resumo e badge de timestamp clicável
- [ ] Clicar em tópico faz player saltar para o trecho e dar play
- [ ] Suporte a múltiplas análises por transcrição (prompts diferentes)
- [ ] Lista de análises anteriores com data, prompt resumido e botões Visualizar/Excluir
- [ ] Análises persistidas em `analyses.json` (mesmo padrão de `transcriptions.json`)
- [ ] Análises sobrevivem ao fechar/reabrir a transcrição
- [ ] Bug fix: re-export agora gera arquivo JSON além de TXT e SRT

## Dependências

- API key do Google Gemini (gratuita em aistudio.google.com)
- Conexão com internet para chamadas à API
- Transcrição concluída com segmentos disponíveis

## Features Relacionadas

- Player de mídia sincronizado (`renderer/player.js`)
- Resultado de transcrição (`renderer/results.js`)
- Persistência em JSON (`transcriptions.json` como padrão)
- Sistema de configurações (`renderer/settings.js`)

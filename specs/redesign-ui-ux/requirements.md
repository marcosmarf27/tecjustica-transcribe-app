# Requisitos: Redesign UI/UX do TecJustica Transcribe

## Descricao

O app funciona tecnicamente (transcreve, player sincronizado, modelos), mas a experiencia do usuario e deficiente: sidebar so tem icones sem labels, nao existe historico de transcricoes, nao tem botao "Nova transcricao", feedback de progresso e basico, e faltam funcionalidades essenciais como busca no texto, edicao inline e drag & drop.

O objetivo e transformar o app num produto profissional e amigavel, mantendo o tema VS Code dark refinado e a arquitetura vanilla (HTML/CSS/JS sem frameworks).

## Criterios de Aceitacao

### Sidebar
- [ ] Sidebar colapsavel: expandida (200px) com icones + labels, colapsada (48px) so icones
- [ ] Botao toggle no rodape da sidebar para expandir/colapsar
- [ ] Animacao suave de transicao (0.2s)
- [ ] Estado da sidebar persiste entre sessoes (salvo no config.json)

### Historico de Transcricoes
- [ ] Pagina inicial mostra lista de transcricoes anteriores
- [ ] Primeiro uso: empty state amigavel com CTA "Nova transcricao" + hint de drag & drop
- [ ] Cada item mostra: filename, modelo, idioma, duracao, data, badge de status (completa/erro/em progresso)
- [ ] Click num item abre o player + resultado dessa transcricao
- [ ] Botao delete (visivel no hover) para remover transcricao do historico
- [ ] Persistencia via SQLite (banco local em userData)

### Nova Transcricao
- [ ] Botao "+ Nova transcricao" no header da lista
- [ ] Botao "Voltar" para retornar ao historico
- [ ] Ao completar, salva no SQLite e volta pro historico com novo item no topo

### Progresso Completo
- [ ] Pipeline visual com badges de etapas (Modelo, Audio, Transcricao, Alinhamento, Diarizacao, Salvando)
- [ ] Barra de progresso determinada com porcentagem
- [ ] Indicador de etapa atual (ex: "Etapa 3/6")
- [ ] Tempo estimado restante
- [ ] Texto descritivo do que esta acontecendo

### Background Processing
- [ ] Transcricao continua rodando ao navegar para outras paginas
- [ ] Dot pulsante no icone de Transcricao na sidebar quando transcrevendo
- [ ] Progresso resumido na status bar (clicavel)
- [ ] Toast/notificacao quando transcricao termina (com botao "Ver resultado")

### Drag & Drop
- [ ] Arrastar arquivo de audio/video sobre a pagina mostra overlay visual
- [ ] Soltar arquivo valido abre formulario com arquivo pre-selecionado
- [ ] Validacao de extensao (rejeitar arquivos invalidos silenciosamente)

### Busca na Transcricao
- [ ] Campo de busca nos resultados com highlight amarelo nas ocorrencias
- [ ] Contador de resultados (ex: "3/12")
- [ ] Botoes prev/next para navegar entre ocorrencias com scroll suave
- [ ] Atalho Ctrl+F para focar no campo de busca

### Edicao Inline
- [ ] Double-click em segmento ativa edicao (contenteditable)
- [ ] Blur ou Ctrl+Enter salva, Escape cancela
- [ ] Asterisco (*) no timestamp indica segmento editado
- [ ] Edicoes salvas no SQLite (segments_json atualizado)
- [ ] Botao "Re-exportar" gera novos .txt e .srt com texto corrigido

### Refinamento Visual
- [ ] Melhor espacamento e tipografia (mais respiro entre secoes)
- [ ] Cards com sombras sutis e hover elevado
- [ ] Botoes com mais padding e sombra sutil
- [ ] Transicoes suaves ao trocar de pagina (fade-in)
- [ ] Manter identidade VS Code dark + JetBrains Mono

## Dependencias

- `better-sqlite3` — banco SQLite nativo para Node.js (precisa de rebuild para Electron)
- `@electron/rebuild` — recompilacao de modulos nativos para Electron
- `webUtils.getPathForFile()` — API do Electron 41 para drag & drop com contextIsolation

## Features Relacionadas

- Pipeline WhisperX existente (backend Python inalterado)
- Sistema de config JSON existente (expandido com `sidebar_collapsed`)
- IPC bridge existente (expandido com novos canais para SQLite)
- Player de midia sincronizado existente (movido para sub-view de resultado)

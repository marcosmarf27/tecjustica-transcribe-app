# Acoes Manuais: Redesign UI/UX

## Antes da Implementacao

- [ ] **Verificar se `electron-rebuild` funciona no ambiente** - Requer ferramentas de compilacao C++ instaladas (build-essential no Linux, Visual Studio Build Tools no Windows). Se falhar, usar `sql.js` como fallback.

## Durante a Implementacao

Nenhuma acao manual necessaria durante a implementacao.

## Apos a Implementacao

- [ ] **Testar build de distribuicao** - Executar `npm run dist:linux` e/ou `npm run dist:win` para garantir que `better-sqlite3` e incluido corretamente no instalador.
- [ ] **Testar no Windows** - O app e desenvolvido em WSL mas usado no Windows. Verificar que drag & drop, SQLite e paths funcionam corretamente no Windows.

---

> Estas acoes tambem estao listadas em contexto no `implementation-plan.md`

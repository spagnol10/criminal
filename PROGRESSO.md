# 🔪 Criminal — Investigação Multiplayer
## Documento de Progresso

> Última atualização: 14 de maio de 2026 · commit `19c86c6`

---

## 📋 Stack do Projeto

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16.2.6 · React 19 · TypeScript |
| Estilização | Tailwind CSS v4 · Framer Motion · glassmorphism |
| Estado global | Zustand |
| Comunicação | Socket.IO (cliente + servidor) |
| Backend | Node.js + ts-node · Socket.IO server |
| Deploy Frontend | Vercel → `https://criminal-woad.vercel.app` |
| Deploy Backend | Railway → `https://criminal-production.up.railway.app` |
| Repositório | `github.com/spagnol10/criminal` · branch `main` |

---

## ✅ Histórico de Commits

| Commit | Descrição |
|--------|-----------|
| `4ce7bd0` | Initial commit from Create Next App |
| `730d057` | feat: jogo criminalista multiplayer — MVP completo |
| `c9f03b2` | fix: server imports locais para deploy no Railway |
| `3a9ca78` | docs: atualiza env.example com URL do Railway |
| `acf871e` | fix: Procfile — apenas start sem rebuild |
| `61d44c8` | fix: timeout de conexão e transports websocket+polling |
| `883fa54` | feat: UI redesign Neo Noir + fix hydration particles + docs |
| `19c86c6` | feat: sons Web Audio API + sistema de pontuação/histórico local |

---

## ✅ O Que Já Foi Feito

### 🏗️ Infraestrutura
- [x] Projeto Next.js configurado (Tailwind v4, TypeScript, Framer Motion, Zustand)
- [x] Monorepo: frontend `/` + backend `/server/`
- [x] Deploy frontend no **Vercel** com CI/CD automático via push
- [x] Deploy backend no **Railway** com Procfile
- [x] CORS configurado via env var `CORS_ORIGIN`
- [x] `NEXT_PUBLIC_SOCKET_URL` configurado no Vercel

### 🎮 Engine do Jogo
- [x] Papéis: `citizen`, `doctor`, `investigator`, `killer`, `accomplice`
- [x] Distribuição automática por número de jogadores
- [x] Condição de vitória dupla
- [x] Fases com timers automáticos: `WAITING → STARTING → NIGHT → DAY → VOTING → RESULT → NIGHT…`
- [x] Eventos aleatórios noturnos
- [x] Tipos TypeScript compartilhados (frontend + cópia no server)

### 🔌 Servidor Socket.IO
- [x] `room:create` / `room:join` / `room:leave` / `room:kick`
- [x] `game:start` / `game:night_action` / `game:vote`
- [x] `chat:send` (público + privado assassinos)
- [x] Reconexão de jogadores · Estado em memória

### 🎨 UI/UX — Tema Neo Noir
- [x] CSS vars, film grain, glassmorphism, glow, animações
- [x] Google Fonts: Inter + JetBrains Mono
- [x] Componentes: Button, Input, Card, Badge, Avatar, FadeIn, TimerBar, PulseDot
- [x] Componentes de jogo: PhaseBanner, PlayerCard, RoleRevealCard, ChatBox, AliveCounter
- [x] Home: hero typewriter, partículas, avatares, tabs criar/entrar
- [x] Lobby · Jogo (fundo escurece à noite) · Resultado (glow por time)

### 🔊 Sons — Web Audio API (zero deps)
- [x] `lib/utils/sounds.ts` — 10 efeitos sintetizados:
  - playJoin · playGameStart · playNight · playDay
  - playEliminated · playVote · playVictory · playDefeat
  - playTick (timer < 10s) · playMessage
- [x] Integrados no `useSocketEvents` e `usePhaseTimer`

### 📊 Sistema de Pontuação
- [x] `lib/utils/score.ts` — recordMatch, getStats, clearHistory
- [x] Persiste no `localStorage` (últimas 100 partidas)
- [x] Stats: winrate, W/L, sequências, papel favorito
- [x] Página `/stats` com histórico e limpeza de dados
- [x] Registra automaticamente ao fim de cada partida
- [x] Link na Home e botão 📊 no resultado

### 🐛 Bugs Corrigidos
- [x] `//` CSS → parse error PostCSS
- [x] Cache corrompido Turbopack → `rm -rf .next`
- [x] Railway: imports locais copiados para `server/lib/`
- [x] Procfile: double-build removido
- [x] Timeout 8s + `connect_error` handler
- [x] `@import` Google Fonts movido para o topo do CSS
- [x] Hydration mismatch nas partículas → fórmulas determinísticas

---

## 🚀 Como Rodar Localmente

```bash
# Terminal 1 — Frontend
npm run dev                          # http://localhost:3000

# Terminal 2 — Backend
cd server
node_modules/.bin/ts-node --project tsconfig.json src/server.ts
                                     # http://localhost:3001
```

---

## 🗺️ Arquitetura de Arquivos

```
/
├── app/
│   ├── globals.css              # Tema Neo Noir
│   ├── layout.tsx
│   ├── page.tsx                 # Home
│   ├── stats/page.tsx           # ✅ Estatísticas
│   ├── lobby/[code]/page.tsx
│   ├── game/[code]/page.tsx
│   └── result/[code]/page.tsx
├── components/
│   ├── ui/index.tsx             # Button, Card, Badge, Avatar...
│   └── game/index.tsx           # PhaseBanner, PlayerCard...
├── lib/
│   ├── hooks/useSocket.ts
│   ├── socket/client.ts
│   ├── store/gameStore.ts
│   ├── types/game.ts
│   └── utils/
│       ├── gameEngine.ts
│       ├── sounds.ts            # ✅ Sons Web Audio API
│       └── score.ts             # ✅ Pontuação/histórico
└── server/
    ├── src/server.ts
    ├── lib/game.types.ts
    ├── lib/gameEngine.ts
    └── Procfile
```

---

## 🔜 Backlog de Upgrades

### 🔴 Alta Prioridade — Qualidade do Jogo

#### 1. Reconexão Inteligente
- Salvar `roomCode` + `playerId` no `sessionStorage`
- Ao reabrir a aba, detectar partida em andamento e redirecionar
- Servidor manter slot por 60s antes de remover desconectado

#### 2. Lista de Salas Públicas
- Página `/rooms` listando salas abertas com nº de jogadores
- Botão "Entrar em sala aleatória"
- Atualização em tempo real via socket

#### 3. Reveal Cinematográfico de Papel Melhorado
- Tela fullscreen com glitch/flicker por 3s antes de revelar
- Som diferente para assassino vs inocente
- Tremor de tela (`animation: shake`) para killer

#### 4. Timer Visual Circular
- SVG circular no lugar da barra linear
- Pulso vermelho nos últimos 5s
- Vibração háptica no mobile (Vibration API)

---

### 🟡 Média Prioridade — Experiência

#### 5. Tutorial Interativo / Onboarding
- Fluxo na primeira visita (flag no `localStorage`)
- Passo a passo animado por fase
- Tooltips nos papéis

#### 6. Lobby Animado
- Animação de "cartas sendo distribuídas"
- Avatar com bounce enquanto espera
- Countdown ao clicar em Iniciar

#### 7. Modo Espectador
- Eliminados viram espectadores (sem votar/agir)
- Chat separado para espectadores
- Overlay diferenciado

#### 8. Chat Melhorado
- Reações a mensagens (👍 😱 🤔)
- Indicador "digitando…"
- Painel de emojis rápidos

---

### 🟢 Baixa Prioridade — Features Extras

#### 9. PWA / Instalável
- `manifest.json` + service worker
- Notificação push quando for a vez de agir

#### 10. Customização de Sala
- Duração das fases (rápido / normal / longo)
- Habilitar/desabilitar papéis específicos
- Modo "Mafia Clássica" sem papéis especiais

#### 11. Replay de Partida
- Log completo de eventos salvo no resultado
- Timeline "Noite 1: X matou Y, médico salvou W"
- Compartilhável via link

#### 12. Temas Visuais
- Seletor: Neo Noir (atual) / Cyberpunk / Medieval / Espaço
- CSS vars trocados dinamicamente

#### 13. Internacionalização
- `next-intl` para PT-BR / EN / ES

---

### ⚙️ Técnico / DevOps

#### 14. Testes Automatizados
- Unit tests na `gameEngine.ts` com Vitest
- E2E com Playwright: criar sala → jogar → resultado

#### 15. CI/CD Completo
- GitHub Actions: lint + type-check + tests em cada PR

#### 16. Monitoramento
- Sentry (erros frontend/backend)
- Uptime monitor para o Railway

#### 17. Persistência com Redis (Railway)
- Salas sobrevivem a restart do servidor
- Rate limiting por IP
- Histórico de partidas por sessão

---

## 💡 Novos Papéis Sugeridos

| Papel | Time | Habilidade |
|-------|------|-----------|
| 🕵️ Xerife | Inocentes | Bloqueia o voto de um suspeito |
| 🎭 Coringa | Neutro | Vence se for eliminado por votação |
| 💣 Terrorista | Assassinos | Ao morrer, leva um inocente junto |
| �� Vidente | Inocentes | Vê o resultado de uma votação antecipado |
| 🧛 Vampiro | Assassinos | Converte inocentes em vez de matar |
| 🤡 Bobo | Neutro | Vence se convencer todos que é o assassino |

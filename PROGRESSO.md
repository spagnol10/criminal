# 🔪 Criminal — Investigação Multiplayer
## Documento de Progresso

> Última atualização: 14 de maio de 2026

---

## 📋 Visão Geral do Projeto

Jogo multiplayer de investigação criminal no estilo Mafia/Among Us, construído com:

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

## ✅ O Que Foi Feito

### 1. Estrutura Base
- Projeto Next.js já existia; dependências instaladas (`framer-motion`, `socket.io-client`, `zustand`, `socket.io`)
- Configuração de monorepo: frontend na raiz `/`, servidor em `/server/` com `package.json` próprio

### 2. Engine do Jogo (`lib/utils/gameEngine.ts` + `server/lib/gameEngine.ts`)
- Papéis: `citizen`, `doctor`, `investigator`, `killer`, `accomplice`
- Times: `innocents` vs `killers`
- Distribuição automática de papéis conforme número de jogadores
- Condição de vitória: inocentes eliminam todos os assassinos OU assassinos se igualam aos inocentes
- Eventos aleatórios (pistas falsas, etc.)
- Nomes/ícones/times dos papéis exportados como constantes

### 3. Tipos Compartilhados (`lib/types/game.ts` + `server/lib/game.types.ts`)
- `Player`, `Room`, `GamePhase`, `PlayerRole`, `ChatMessage`
- Eventos Socket.IO tipados: `ClientToServerEvents`, `ServerToClientEvents`
- Cópias locais no `server/lib/` para funcionar no deploy Railway isolado

### 4. Servidor Socket.IO (`server/src/server.ts`)
- Eventos implementados:
  - `room:create` — cria sala com código aleatório
  - `room:join` — entra na sala
  - `room:leave` — sai da sala
  - `room:kick` — host expulsa jogador
  - `game:start` — host inicia partida (mínimo 4 jogadores)
  - `game:night_action` — ação noturna (matar/salvar/investigar)
  - `game:vote` — votação diurna
  - `chat:send` — mensagem pública ou privada (assassinos)
- Loop de fases automático com timers: `WAITING → STARTING → NIGHT → DAY → VOTING → RESULT → NIGHT…`
- CORS configurado via `CORS_ORIGIN` env var
- Porta via `PORT` ou `SOCKET_PORT` env var (padrão 3001)

### 5. Cliente Socket (`lib/socket/client.ts`)
- Singleton com `getSocket()` / `connectSocket()` / `disconnectSocket()`
- URL via `NEXT_PUBLIC_SOCKET_URL` (padrão `http://localhost:3001`)
- `transports: ["websocket", "polling"]`
- Timeout de 8s + handler de `connect_error`

### 6. Store Global (`lib/store/gameStore.ts`)
- Zustand store com: `room`, `players`, `myPlayer`, `myRole`, `phase`, `messages`, `nightResult`, `randomEvent`, `winner`
- Ações: `setRoom`, `setMyPlayer`, `updatePlayers`, `setPhase`, `addMessage`, `reset`, etc.

### 7. Hooks (`lib/hooks/useSocket.ts`)
- `useSocketEvents()` — escuta todos os eventos do servidor e atualiza o store
- `usePhaseTimer()` — timer regressivo sincronizado com a fase atual

### 8. Componentes UI (`components/ui/index.tsx`) — tema Neo Noir
- `Button` — variantes: `primary` (vermelho), `danger`, `ghost`, `outline`, `blue`; com Framer Motion
- `Input` — label + error animado
- `Card` — glassmorphism, glow opcional vermelho/azul
- `Badge` — cores: red, green, yellow, gray, blue, purple
- `Avatar` — emoji, tamanhos sm/md/lg/xl, estado `dead`, glow vermelho/azul
- `FadeIn` — wrapper de animação de entrada
- `TimerBar` — barra de progresso animada (red/blue/yellow)
- `PulseDot` — indicador pulsante verde/vermelho/amarelo

### 9. Componentes de Jogo (`components/game/index.tsx`) — tema Neo Noir
- `PhaseBanner` — banner de fase com ícone, cor e timer regressivo
- `PlayerCard` — card de jogador com estado (vivo/morto, selecionado, eu, host)
- `RoleRevealCard` — revelação cinematográfica do papel (animação 3D rotateY)
- `ChatBox` — chat com scroll automático, mensagens tipadas (público/privado/narrador/sistema)
- `NightEventBanner` — banner de evento aleatório noturno
- `AliveCounter` — contagem de jogadores vivos com PulseDot

### 10. Páginas

| Arquivo | Descrição |
|---------|-----------|
| `app/page.tsx` | Home: hero typewriter "QUEM É O ASSASSINO?", partículas, glassmorphism card, tabs criar/entrar, seletor de avatar, slider de jogadores, toggle sala privada |
| `app/lobby/[code]/page.tsx` | Lobby: código da sala, lista de jogadores em tempo real, botão kick (host), regras do jogo, botão iniciar |
| `app/game/[code]/page.tsx` | Jogo: banner de fase, grid de jogadores, ações noturnas, votação, chat (público/privado), revelação de papel |
| `app/result/[code]/page.tsx` | Resultado: anúncio do vencedor, revelação de todos os papéis por time, botão jogar novamente |

### 11. Estilização Global (`app/globals.css`) — Neo Noir
- CSS vars: `--bg-base: #0B0F19`, `--bg-card: #1A2233`, `--red: #EF4444`, `--blue: #3B82F6`, etc.
- Film grain via `body::after` com SVG turbulence
- Scrollbar customizada
- Classes utilitárias: `.glass` (glassmorphism), `.glow-red`, `.glow-blue`, `.glow-purple`
- Animações: `@keyframes pulse-red`, `flicker`, `glitch`
- Google Fonts: Inter + JetBrains Mono

### 12. Layout (`app/layout.tsx`)
- Título: "CRIMINAL — Investigação Multiplayer"
- Sem fontes Geist; usa Inter via CSS

### 13. Deploy

#### Frontend — Vercel
- URL: `https://criminal-woad.vercel.app`
- Env var necessária: `NEXT_PUBLIC_SOCKET_URL=https://criminal-production.up.railway.app`

#### Backend — Railway
- URL: `https://criminal-production.up.railway.app`
- `server/Procfile`: `web: node dist/src/server.js`
- Env vars: `CORS_ORIGIN=https://criminal-woad.vercel.app`, `PORT` (auto Railway)
- Build: `npm run build` (tsc) separado do start

---

## 🐛 Bugs Corrigidos

| Problema | Causa | Solução |
|----------|-------|---------|
| PostCSS parse error em `globals.css` | Comentário `//` em CSS | Removido |
| `Unexpected end of JSON input` ao buildar | Cache corrompido do Turbopack | `rm -rf .next` |
| Railway build fail | Server importava `../../lib/types/game` não disponível no deploy | Copiado para `server/lib/` com imports locais |
| Procfile causava double-build | `npm run build && npm start` — Railway já builda separado | Alterado para `node dist/src/server.js` |
| Tela de loading infinita | Sem timeout de conexão | Adicionado timeout 8s + handler `connect_error` |
| `@import` Google Fonts quebrava CSS | Estava após `@import "tailwindcss"` (deve preceder todas as regras) | Movido para o topo do arquivo |
| Hydration mismatch nas partículas | `Math.random()` gerava valores diferentes no SSR e no cliente | Substituído por fórmulas determinísticas baseadas no índice `i` |

---

## 🏗️ Arquitetura de Arquivos

```
/
├── app/
│   ├── globals.css          # Tema Neo Noir completo
│   ├── layout.tsx           # Layout raiz
│   ├── page.tsx             # Home page
│   ├── lobby/[code]/
│   │   └── page.tsx         # Lobby da sala
│   ├── game/[code]/
│   │   └── page.tsx         # Tela do jogo
│   └── result/[code]/
│       └── page.tsx         # Tela de resultado
│
├── components/
│   ├── ui/index.tsx         # Button, Input, Card, Badge, Avatar, FadeIn, TimerBar, PulseDot
│   └── game/index.tsx       # PhaseBanner, PlayerCard, RoleRevealCard, ChatBox, NightEventBanner, AliveCounter
│
├── lib/
│   ├── hooks/useSocket.ts   # useSocketEvents, usePhaseTimer
│   ├── socket/client.ts     # Singleton Socket.IO client
│   ├── store/gameStore.ts   # Zustand store
│   ├── types/game.ts        # Tipos TypeScript compartilhados
│   └── utils/gameEngine.ts  # Lógica do jogo (papéis, times, vitória)
│
├── server/
│   ├── src/server.ts        # Servidor Socket.IO completo
│   ├── lib/
│   │   ├── game.types.ts    # Cópia dos tipos para o server
│   │   └── gameEngine.ts    # Cópia da engine para o server
│   ├── Procfile             # Railway: web: node dist/src/server.js
│   ├── package.json
│   └── tsconfig.json
│
├── vercel.json
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🚀 Como Rodar Localmente

```bash
# Terminal 1 — Frontend (Next.js)
npm run dev
# → http://localhost:3000

# Terminal 2 — Backend (Socket.IO)
cd server
node_modules/.bin/ts-node --project tsconfig.json src/server.ts
# → http://localhost:3001
```

---

## ⏳ Pendente / Próximos Passos

- [ ] Commit e push do redesign Neo Noir (`git add -A && git commit -m "feat: UI redesign Neo Noir" && git push origin main`)
- [ ] Redeploy no Vercel após push
- [ ] Testar fluxo completo com múltiplos jogadores em produção
- [ ] (Opcional) Adicionar sons/efeitos sonoros
- [ ] (Opcional) Persistência de salas com Redis no Railway
- [ ] (Opcional) Sistema de pontuação / histórico de partidas

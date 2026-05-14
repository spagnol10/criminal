# 🔪 Jogo Criminalista — Investigação Multiplayer

> Deduza. Investigue. Sobreviva.

Jogo multiplayer online de dedução social e investigação criminal, inspirado em Mafia/Among Us. Construído com Next.js + Socket.IO + TypeScript.

---

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 20+
- npm

### Instalação

```bash
# Clonar o repositório
git clone <repo>
cd jogo-criminalista

# Instalar dependências do frontend
npm install

# Instalar dependências do servidor
cd server && npm install && cd ..
```

### Desenvolvimento

**Terminal 1 — Servidor Socket.IO:**
```bash
cd server
npx ts-node --project tsconfig.json src/server.ts
```

**Terminal 2 — Frontend Next.js:**
```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🎮 Como Jogar

1. **Home** — Escolha um nickname e avatar
2. **Criar Sala** — Defina max. jogadores e crie uma sala privada ou pública
3. **Entrar** — Use o código de 6 letras para entrar em uma sala existente
4. **Lobby** — Aguarde 4+ jogadores e o host inicia a partida
5. **Papéis** — Cada jogador recebe um papel secreto
6. **Loop de Jogo:**
   - 🌙 **Noite**: Assassino mata, médico salva, investigador investiga
   - ☀️ **Dia**: Resultados revelados + chat público para discutir
   - ⚖️ **Votação**: Todos votam para eliminar um suspeito
   - 🔨 **Resultado**: Eliminação anunciada + verificação de vitória

---

## 🎭 Papéis

| Papel | Time | Habilidade |
|-------|------|------------|
| 👤 Cidadão | Inocentes | Sobreviva e discuta |
| 🩺 Médico | Inocentes | Salva 1 pessoa por noite |
| 🔍 Investigador | Inocentes | Investiga 1 suspeito por noite |
| 🔪 Assassino | Assassinos | Mata 1 pessoa por noite |
| 🕵️ Cúmplice | Assassinos | Conhece o assassino |

**Balanceamento automático:**
- 4-7 jogadores: 1 assassino
- 8-9 jogadores: 2 assassinos
- 10+ jogadores: 2 assassinos + 1 cúmplice

---

## 🏗️ Arquitetura

```
jogo-criminalista/
├── app/                    # Next.js App Router (Frontend)
│   ├── page.tsx            # Home — criar/entrar sala
│   ├── lobby/[code]/       # Lobby da sala
│   ├── game/[code]/        # Tela principal do jogo
│   └── result/[code]/      # Tela de resultado final
│
├── components/
│   ├── ui/                 # Button, Input, Card, Badge, Avatar…
│   └── game/               # PhaseBanner, PlayerCard, ChatBox…
│
├── lib/
│   ├── types/game.ts       # Tipos TypeScript centrais
│   ├── utils/gameEngine.ts # Lógica pura do jogo
│   ├── store/gameStore.ts  # Estado global (Zustand)
│   ├── socket/client.ts    # Cliente Socket.IO
│   └── hooks/useSocket.ts  # React hooks para eventos
│
└── server/
    └── src/server.ts       # Servidor Socket.IO (Node.js)
```

---

## 🔌 Eventos Socket.IO

### Cliente → Servidor
| Evento | Dados | Descrição |
|--------|-------|-----------|
| `room:create` | nickname, avatar, maxPlayers | Criar sala |
| `room:join` | code, nickname, avatar | Entrar em sala |
| `room:leave` | — | Sair da sala |
| `room:kick` | targetId | Expulsar jogador (host) |
| `game:start` | — | Iniciar partida (host) |
| `game:night_action` | targetId, action | Ação noturna |
| `game:vote` | targetId | Votar |
| `chat:send` | content, type | Enviar mensagem |

### Servidor → Cliente
| Evento | Descrição |
|--------|-----------|
| `room:updated` | Estado da sala atualizado |
| `game:phase_changed` | Nova fase + timer |
| `game:role_assigned` | Papel secreto revelado |
| `game:night_result` | Resultado da noite |
| `game:vote_result` | Apuração dos votos |
| `game:finished` | Fim de jogo + vencedores |
| `chat:message` | Nova mensagem de chat |

---

## 🛡️ Segurança

- **Servidor autoritativo**: nenhuma decisão crítica é tomada no cliente
- **Papéis nunca enviados globalmente**: cada jogador recebe apenas seu próprio papel
- **Chat segmentado**: chat privado dos assassinos só chega a eles
- **Validações server-side**: fase atual, jogador vivo, etc.
- **Nickname único por sala**: verificação no servidor

---

## 📦 Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS v4, Framer Motion |
| Estado | Zustand |
| Realtime | Socket.IO |
| Backend | Node.js + Socket.IO Server |
| Docker | docker-compose (web + server) |

---

## 📅 Roadmap

- [x] Sistema de salas (criar/entrar/sair)
- [x] Distribuição de papéis balanceada
- [x] Loop completo dia/noite/votação
- [x] Chat público e privado (assassinos)
- [x] Narrador dinâmico
- [x] Eventos aleatórios
- [x] UI dark neon noir
- [x] Animações com Framer Motion
- [x] Segurança server-side
- [ ] Persistência (PostgreSQL + Prisma)
- [ ] Sistema de contas e histórico
- [ ] Ranking e MMR
- [ ] Matchmaking automático
- [ ] Redis Pub/Sub para escalabilidade horizontal
- [ ] Testes automatizados (Jest + Playwright)
- [ ] Deploy (Vercel + Fly.io)
- [ ] App mobile

---

## 📄 Licença

MIT

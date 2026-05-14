# Jogo Criminalista — Servidor Socket.IO

Servidor WebSocket para o Jogo Criminalista.

## Deploy no Railway

1. Crie um projeto no [railway.app](https://railway.app)
2. Conecte este repositório (pasta `/server`)
3. Defina as variáveis de ambiente:
   - `SOCKET_PORT=3001` (Railway usa `PORT` automaticamente)
4. O Railway detecta automaticamente o `package.json` e roda `npm start`

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3001` | Porta do servidor (Railway define automaticamente) |
| `CORS_ORIGIN` | `*` | Origem permitida (ex: `https://seu-app.vercel.app`) |

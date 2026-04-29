import { LobbyManager } from './LobbyManager'
import { GameModeSequencer } from './GameModeSequencer'
import { WorldSync } from './WorldSync'
import { createMessage, parseMessage, SERVER_MSG, CLIENT_MSG } from '@/shared/protocol'
import type { WSMessage, PlayerInputPayload } from '@/shared/protocol'
import { WorldState } from '@/shared/types'
const PORT = parseInt(process.env.PORT ?? '3002')
const lobbyManager = new LobbyManager()
const sequencer = new GameModeSequencer()
const worldSync = new WorldSync()
type ServerWebSocket = {
  data: { playerId: string }
  send: (data: string) => void
  close: () => void
}
const server = Bun.serve<{ playerId: string }>({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url)
    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req, { data: { playerId: '' } })
      if (upgraded) return
      console.error('[Server] WebSocket upgrade failed — headers:', Object.fromEntries(req.headers))
      return new Response('WebSocket upgrade failed', { status: 400 })
    }
    return new Response('Engine Server OK', { status: 200 })
  },
  websocket: {
    open(ws) {
      console.log("new connection");
      const playerId = `player_${crypto.randomUUID().slice(0, 8)}`
      ws.data.playerId = playerId
      lobbyManager.addPlayer(playerId, ws as unknown as ServerWebSocket)
      worldSync.addPlayer(playerId)
      ws.send(JSON.stringify(createMessage(SERVER_MSG.CONNECTED, { playerId })))
      const lobbyState = lobbyManager.getState()
      ws.send(JSON.stringify(createMessage(SERVER_MSG.LOAD_SCENE, { sceneId: "lobby" })))
      ws.send(JSON.stringify(createMessage(SERVER_MSG.LOBBY_STATE, lobbyState)))
      console.log(`[Server] Player connected: ${playerId}`)
    },
    message(ws, raw) {
      const msg = parseMessage(raw as string) as WSMessage
      switch (msg.type) {
        case CLIENT_MSG.PLAYER_READY:
          lobbyManager.setReady(ws.data.playerId)
          broadcastLobbyUpdate()
          break
        case CLIENT_MSG.ASSETS_READY:
          sequencer.markAssetsReady(ws.data.playerId)
          break
        case CLIENT_MSG.PLAYER_INPUT: {
          const input = msg.payload as PlayerInputPayload
         worldSync.handleInput(ws.data.playerId, input);
          break
        }
      }
    },
    close(ws) {
      console.log(`[Server] Player disconnected: ${ws.data.playerId}`)
      lobbyManager.removePlayer(ws.data.playerId)
      worldSync.removePlayer(ws.data.playerId)
      broadcastLobbyUpdate()
    },
  },
})
function broadcastLobbyUpdate() {
  const update = lobbyManager.getState()
  const msg = JSON.stringify(createMessage(SERVER_MSG.LOBBY_UPDATE, update))
  lobbyManager.broadcast(msg)
}
sequencer.setBroadcast((msg) => lobbyManager.broadcast(msg))
lobbyManager.onAllReady = () => {
  sequencer.setTotalPlayers(lobbyManager.getPlayerCount())
  sequencer.nextGameMode()
}
setInterval(() => {
  const state = worldSync.getWorldState()
  if (state.players.length > 0) {
    const msg = JSON.stringify(createMessage(SERVER_MSG.WORLD_STATE, state))
    lobbyManager.broadcast(msg)
  }
}, 50)
console.log(`[Server] Engine server running on ws://localhost:${PORT}/ws`)

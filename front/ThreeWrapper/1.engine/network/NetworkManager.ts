import type { Engine } from '../Engine'
import type { WSMessage } from '../../../shared/protocol'
import {
  SERVER_MSG,
  CLIENT_MSG,
  createMessage,
  parseMessage,
} from '../../../shared/protocol'
import type {
  ConnectedPayload,
  PlayerInputPayload,
} from '../../../shared/protocol'
type MessageHandler<T = unknown> = (payload: T) => void
const RECONNECT_ATTEMPTS = 3
const RECONNECT_INTERVAL_MS = 2000
export class NetworkManager {
  private ws: WebSocket | null = null
  private readonly engine: Engine
  private readonly serverUrl: string
  private handlers = new Map<string, MessageHandler[]>()
  private reconnectCount = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  playerId: string | null = null
  constructor(engine: Engine, serverUrl: string) {
    this.engine = engine
    this.serverUrl = serverUrl
    this.registerDefaultHandlers()
  }
  connect(): void {
    this.ws = new WebSocket(this.serverUrl)
    this.ws.onopen = () => {
      console.log('[NetworkManager] Connected to server')
      this.reconnectCount = 0
    }
    this.ws.onmessage = (event) => {
      const msg = parseMessage(event.data as string)
      this.dispatch(msg)
    }
    this.ws.onclose = () => {
      console.warn('[NetworkManager] Connection closed')
      this.attemptReconnect()
    }
    this.ws.onerror = () => {
      console.error(`[NetworkManager] WebSocket error — cannot reach ${this.serverUrl}`)
    }
  }
  private attemptReconnect(): void {
    if (this.reconnectCount >= RECONNECT_ATTEMPTS) {
      console.error('[NetworkManager] Max reconnect attempts reached')
      this.dispatch({ type: '__RECONNECT_FAILED__', payload: null, ts: Date.now() })
      return
    }
    this.reconnectCount++
    console.log(
      `[NetworkManager] Reconnecting... (attempt ${this.reconnectCount}/${RECONNECT_ATTEMPTS})`,
    )
    this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_INTERVAL_MS)
  }
  private registerDefaultHandlers(): void {
    this.on<ConnectedPayload>(SERVER_MSG.CONNECTED, ({ playerId }) => {
      this.playerId = playerId
      console.log(`[NetworkManager] Assigned playerId: ${playerId}`)
    })
  }
  private dispatch(msg: WSMessage): void {
    const list = this.handlers.get(msg.type) ?? []
    for (const handler of list) handler(msg.payload)
  }
  on<T>(type: string, handler: MessageHandler<T>): () => void {
    const list = this.handlers.get(type) ?? []
    list.push(handler as MessageHandler)
    this.handlers.set(type, list)
    return () => {
      const updated = (this.handlers.get(type) ?? []).filter((h) => h !== handler)
      this.handlers.set(type, updated)
    }
  }
  send<T>(type: string, payload: T): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[NetworkManager] Cannot send — not connected')
      return
    }
    this.ws.send(JSON.stringify(createMessage(type, payload)))
  }
  sendPlayerReady(): void {
    this.send(CLIENT_MSG.PLAYER_READY, {})
  }
  sendAssetsReady(): void {
    this.send(CLIENT_MSG.ASSETS_READY, {})
  }
  sendPlayerInput(input: PlayerInputPayload): void {
    this.send(CLIENT_MSG.PLAYER_INPUT, input)
  }
  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }
}

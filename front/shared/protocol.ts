import type {
  Player,
  Quat,
  Ranking,
  Score,
  Vec3,
  WorldState,
} from './types'
export type WSMessage<T = unknown> = {
  type: string
  payload: T
  ts: number
}
export const CLIENT_MSG = {
  PLAYER_READY: 'PLAYER_READY',
  ASSETS_READY: 'ASSETS_READY',
  PLAYER_INPUT: 'PLAYER_INPUT',
} as const
export type PlayerReadyPayload = Record<string, never>
export type AssetsReadyPayload = Record<string, never>
export type PlayerInputPayload = { pos: Vec3; rot: Quat; action?: string }
export const SERVER_MSG = {
  CONNECTED:       'CONNECTED',
  LOAD_SCENE:      'LOAD_SCENE',
  LOAD_WORLD:      'LOAD_WORLD',
  START_WORLD:     'START_WORLD',
  LOAD_GAMEMODE:   'LOAD_GAMEMODE',
  GAMEMODE_START:  'GAMEMODE_START',
  GAMEMODE_END:    'GAMEMODE_END',
  WORLD_STATE:     'WORLD_STATE',
  WORLD_END:       'WORLD_END',
  LOBBY_STATE:     'LOBBY_STATE',
  LOBBY_UPDATE:    'LOBBY_UPDATE',
  SPECTATE_MODE:   'SPECTATE_MODE',
  PLAYER_DROPPED:  'PLAYER_DROPPED',
  ERROR:           'ERROR',
} as const
export type ConnectedPayload     = { playerId: string }
export type LoadWorldPayload     = { worldId: string }
export type StartWorldPayload    = { initialState: WorldState }
export type WorldStatePayload    = WorldState
export type WorldEndPayload      = { scores: Score[]; rankings: Ranking[] }
export type LobbyStatePayload    = { players: Player[]; countdown: number; config?: unknown }
export type LobbyUpdatePayload   = { players: Player[] }
export type SpectateModePayload  = { targetPlayerId?: string }
export type PlayerDroppedPayload = { playerId: string; reason: string }
export type ErrorPayload         = { code: string; message: string }
export function createMessage<T>(type: string, payload: T): WSMessage<T> {
  return { type, payload, ts: Date.now() }
}
export function parseMessage(raw: string): WSMessage {
  return JSON.parse(raw) as WSMessage
}

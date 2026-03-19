export type Vec3 = { x: number; y: number; z: number }
export type Quat = { x: number; y: number; z: number; w: number }
export type DebugConfig = {
  enabled: boolean
  logPhases?: boolean
  logPhaseDurations?: boolean
  logVariables?: boolean
  logFrameCount?: number
  showHitboxes?: boolean
  showBounds?: boolean
  logPhysicsState?: boolean
  logInputState?: boolean
  logRenderState?: boolean
  gameTickRate?: number
  freezeFrames?: boolean
}
export type EngineConfig = {
  mode: 'standalone' | 'online'
  serverUrl?: string
  canvas?: HTMLCanvasElement
  debug?: DebugConfig | boolean
}
export type EnvConfig = {
  id: string
  gravity?: Vec3
  bounds?: { min: Vec3; max: Vec3 }
}
export type WorldConfig = {
  id: string
  gameConfigId?: string
}
export type AssetManifest = {
  id: string
  url: string
  type: 'gltf' | 'texture' | 'audio'
}
export type GameConfigEvent = {
  name: string
  actions: string[]
}
export type GameConfigAction = {
  id: string
  type: string
  params?: Record<string, unknown>
}
export type GameConfig = {
  id: string
  maxPlayers: number
  duration: number
  winCondition: 'last_standing' | 'first_to_finish' | 'highest_score' | string
  allowRejoin: boolean
  spectatorAllowed: boolean
  teams?: TeamConfig[]
  events: GameConfigEvent[]
  actions: GameConfigAction[]
}
export type TeamConfig = {
  id: string
  color: string
  maxPlayers?: number
}
export type PlayerState = {
  id: string
  pos: Vec3
  rot: Quat
  action?: string
  health?: number
  score?: number
}
export type WorldState = {
  tick: number
  players: PlayerState[]
  events: GameEvent[]
}
export type GameEvent = {
  type: string
  data: Record<string, unknown>
  tick: number
}
export type Player = {
  id: string
  name?: string
  ready: boolean
  isSpectator: boolean
}
export type Score = {
  playerId: string
  value: number
}
export type Ranking = {
  playerId: string
  rank: number
  score: number
}
export type KeyBinding = {
  action: string
  key: string
  altKey?: string
}

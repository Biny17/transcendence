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
export type WorldConfig = {
  id: string
}
export type AssetManifest = {
  id: string
  url: string
  type: 'gltf' | 'texture' | 'audio'
}
export type KeyBinding = {
  action: string
  key: string
  altKey?: string
}

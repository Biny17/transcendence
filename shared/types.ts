export type { Vec3, Quat } from './math'
export type { WSMessage, IncomingInterceptor, OutgoingInterceptor, InterceptorHandle, RoundEndPayload, JoinPayload, PlayerReadyPayload, WorldLoadedPayload, PhaseEventPayload, PlayerInputPayload, PlayerInteractPayload, PlayerChoosePayload, ConnectedPayload, LoadWorldPayload, StartWorldPayload, PlayerJoinPayload, PlayerDisconnectPayload, PlayerInteractEventPayload, LoadGamemodePayload, LoadUiPayload, WorldStatePayload, LobbyEndPayload, ErrorPayload, PhaseChangedPayload, PhaseEventName } from './protocol'
export { CLIENT_MSG, SERVER_MSG, PHASE_EVENTS, createMessage, parseMessage, WORLDIDS } from './protocol'
export type { GameEventMap } from './events'
export type { GameConfig, TeamConfig } from './config/game'
export type { DebugConfig, EngineConfig, WorldConfig, AssetManifest, KeyBinding } from './config/engine'
export type { WinConditionQuorumWin, WinConditionTimerSurvival, WinCondition, GameModeCandidate, GameModeSelectEntry, EliminationRule, CinematicPhase, WaitPhase, GamePhase, LoopPhase, EndPhase, SequencePhase, LobbyWinCondition, LobbySequenceConfig } from './config/lobby'
export { KeyAction, KeyActionLabels, DEFAULT_KEYBINDINGS } from './config/keybinds'
export type { PlayerState, Player, LoadWorldPlayer } from './state/player'
export type { GameEvent, WorldState, Score, Ranking } from './state/world'

export type GameConfigAction = {
  id: string
  type: string
  label?: string
}

export type EnvConfig = {
  id: string
  sky?: string
  fog?: 'linear' | 'exponential'
  ambientLight?: number
  directionalLight?: { intensity?: number; position?: { x: number; y: number; z: number } }
}

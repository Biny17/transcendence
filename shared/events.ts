import { SERVER_MSG } from './protocol'
import type {
  ConnectedPayload,
  LoadWorldPayload,
  StartWorldPayload,
  PlayerJoinPayload,
  PlayerDisconnectPayload,
  SessionStolenPayload,
  PlayerInteractEventPayload,
  PlayerEmoteEventPayload,
  LoadGamemodePayload,
  LoadUiPayload,
  WorldStatePayload,
  LobbyEndPayload,
  ErrorPayload,
  PhaseChangedPayload,
  PhaseEventPayload,
} from './protocol'
export type GameEventMap = {
  [SERVER_MSG.CONNECTED]:         ConnectedPayload
  [SERVER_MSG.LOAD_WORLD]:        LoadWorldPayload
  [SERVER_MSG.START_WORLD]:       StartWorldPayload
  [SERVER_MSG.PLAYER_JOIN]:       PlayerJoinPayload
  [SERVER_MSG.PLAYER_DISCONNECT]: PlayerDisconnectPayload
  [SERVER_MSG.SESSION_STOLEN]:    SessionStolenPayload
  [SERVER_MSG.PLAYER_EMOTE]:      PlayerEmoteEventPayload
  [SERVER_MSG.PLAYER_INTERACT]:   PlayerInteractEventPayload
  [SERVER_MSG.LOAD_GAMEMODE]:     LoadGamemodePayload
  [SERVER_MSG.LOAD_UI]:           LoadUiPayload
  [SERVER_MSG.WORLD_STATE]:       WorldStatePayload
  [SERVER_MSG.LOBBY_END]:         LobbyEndPayload
  [SERVER_MSG.ERROR]:             ErrorPayload
  [SERVER_MSG.PHASE_CHANGED]:     PhaseChangedPayload
  [SERVER_MSG.PHASE_EVENT]:       PhaseEventPayload
}

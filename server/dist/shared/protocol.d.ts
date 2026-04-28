import type { Vec3, Quat } from './math';
import type { LoadWorldPlayer } from './state/player';
import type { WorldState, Score, Ranking } from './state/world';
export type WSMessage<T = unknown> = {
    type: string;
    payload: T;
    ts: number;
};
export declare const CLIENT_MSG: {
    readonly JOIN: "JOIN";
    readonly PLAYER_READY: "PLAYER_READY";
    readonly WORLD_LOADED: "WORLD_LOADED";
    readonly PHASE_EVENT: "PHASE_EVENT";
    readonly PLAYER_INPUT: "PLAYER_INPUT";
    readonly PLAYER_INTERACT: "PLAYER_INTERACT";
    readonly PLAYER_CHOOSE: "PLAYER_CHOOSE";
    readonly RESET: "RESET";
};
export type RoundEndPayload = {
    rankings: Ranking[];
};
export type JoinPayload = {
    username: string;
};
export type PlayerReadyPayload = Record<string, never>;
export type WorldLoadedPayload = Record<string, never>;
export type PhaseEventPayload = {
    event: string;
    data?: Record<string, unknown>;
};
export type PlayerInputPayload = {
    pos: Vec3;
    rot: Quat;
    action?: string;
};
export type PlayerInteractPayload = {
    action: string;
    targetId?: string;
    data?: Record<string, unknown>;
};
export type PlayerChoosePayload = {
    choiceId: string;
    data?: Record<string, unknown>;
};
export declare const SERVER_MSG: {
    readonly CONNECTED: "CONNECTED";
    readonly LOAD_WORLD: "LOAD_WORLD";
    readonly START_WORLD: "START_WORLD";
    readonly PLAYER_JOIN: "PLAYER_JOIN";
    readonly PLAYER_DISCONNECT: "PLAYER_DISCONNECT";
    readonly PLAYER_INTERACT: "PLAYER_INTERACT";
    readonly LOAD_GAMEMODE: "LOAD_GAMEMODE";
    readonly LOAD_UI: "LOAD_UI";
    readonly WORLD_STATE: "WORLD_STATE";
    readonly LOBBY_END: "LOBBY_END";
    readonly ERROR: "ERROR";
    readonly PHASE_CHANGED: "PHASE_CHANGED";
    readonly PHASE_EVENT: "PHASE_EVENT";
};
export type ConnectedPayload = {
    playerId: string;
};
export type LoadWorldPayload = {
    worldId: string;
    players: LoadWorldPlayer[];
    extra?: Record<string, unknown>;
};
export type StartWorldPayload = {
    initialState: WorldState;
};
export type PlayerJoinPayload = LoadWorldPlayer;
export type PlayerDisconnectPayload = {
    playerId: string;
    reason: string;
};
export type PlayerInteractEventPayload = {
    playerId: string;
    action: string;
    targetId?: string;
    data?: Record<string, unknown>;
};
export type LoadGamemodePayload = {
    modeId: string;
    winCondition: unknown;
};
export type LoadUiPayload = {
    uiId: string;
    data?: Record<string, unknown>;
};
export type WorldStatePayload = WorldState;
export type LobbyEndPayload = {
    scores: Score[];
    rankings: Ranking[];
};
export type ErrorPayload = {
    code: string;
    message: string;
};
export type PhaseChangedPayload = {
    phaseId: string;
    phaseType: "wait" | "game" | "loop" | "end" | "cinematic";
    data?: {
        rankings?: Ranking[];
        livesRemaining?: Record<string, number>;
        [key: string]: unknown;
    };
};
export declare const PHASE_EVENTS: {
    readonly WIN: "player_won";
    readonly LOST: "player_lost";
    readonly PLAYER_ELIMINATED: "player_eliminated";
    readonly RESULTS_ACK: "results_ack";
};
export type PhaseEventName = (typeof PHASE_EVENTS)[keyof typeof PHASE_EVENTS];
export declare function createMessage<T>(type: string, payload: T): WSMessage<T>;
export declare function parseMessage(raw: string): WSMessage;
export declare const WORLDIDS: {
    LOBBY: string;
};
//# sourceMappingURL=protocol.d.ts.map
import type { Vec3, Quat } from "./math";
import type { LoadWorldPlayer } from "./state/player";
import type { WorldState, Score, Ranking } from "./state/world";
export type WSMessage<T = unknown> = {
	type: string;
	payload: T;
	ts: number;
};
export type IncomingInterceptor = (msg: WSMessage) => boolean;
export type OutgoingInterceptor = (type: string, payload: unknown) => boolean;
export type InterceptorHandle = () => void;
export const CLIENT_MSG = {
	JOIN: "JOIN",
	PLAYER_READY: "PLAYER_READY",
	WORLD_LOADED: "WORLD_LOADED",
	PHASE_EVENT: "PHASE_EVENT",
	PLAYER_INPUT: "PLAYER_INPUT",
	PLAYER_INTERACT: "PLAYER_INTERACT",
	PLAYER_CHOOSE: "PLAYER_CHOOSE",
	RESET: "RESET"
} as const;
export type RoundEndPayload = {
	rankings: Ranking[];
};
export type JoinPayload = { username: string };
export type PlayerReadyPayload = Record<string, never>;
export type WorldLoadedPayload = Record<string, never>;
export type PhaseEventPayload = { event: string; data?: Record<string, unknown> };
export type PlayerInputPayload = { pos: Vec3; rot: Quat; action?: string };
export type PlayerInteractPayload = { action: string; targetId?: string; data?: Record<string, unknown> };
export type PlayerChoosePayload = { choiceId: string; data?: Record<string, unknown> };
export const SERVER_MSG = {
	CONNECTED: "CONNECTED",
	LOAD_WORLD: "LOAD_WORLD",
	START_WORLD: "START_WORLD",
	PLAYER_JOIN: "PLAYER_JOIN",
	PLAYER_DISCONNECT: "PLAYER_DISCONNECT",
	PLAYER_INTERACT: "PLAYER_INTERACT",
	LOAD_GAMEMODE: "LOAD_GAMEMODE",
	LOAD_UI: "LOAD_UI",
	WORLD_STATE: "WORLD_STATE",
	LOBBY_END: "LOBBY_END",
	ERROR: "ERROR",
	PHASE_CHANGED: "PHASE_CHANGED",
	PHASE_EVENT: "PHASE_EVENT"
} as const;
export type ConnectedPayload = { playerId: string };
export type LoadWorldPayload = { worldId: string; players: LoadWorldPlayer[]; extra?: Record<string, unknown> };
export type StartWorldPayload = { initialState: WorldState };
export type PlayerJoinPayload = LoadWorldPlayer;
export type PlayerDisconnectPayload = { playerId: string; reason: string };
export type PlayerInteractEventPayload = { playerId: string; action: string; targetId?: string; data?: Record<string, unknown> };
export type LoadGamemodePayload = { modeId: string; winCondition: unknown };
export type LoadUiPayload = { uiId: string; data?: Record<string, unknown> };
export type WorldStatePayload = WorldState;
export type LobbyEndPayload = { scores: Score[]; rankings: Ranking[] };
export type ErrorPayload = { code: string; message: string };
export type PhaseChangedPayload = {
	phaseId: string;
	phaseType: "wait" | "game" | "loop" | "end" | "cinematic";
	data?: { rankings?: Ranking[]; livesRemaining?: Record<string, number>; [key: string]: unknown };
};
export const PHASE_EVENTS = {
	WIN: "player_won",
	LOST: "player_lost",
	PLAYER_ELIMINATED: "player_eliminated",
	RESULTS_ACK: "results_ack"
} as const;
export type PhaseEventName = (typeof PHASE_EVENTS)[keyof typeof PHASE_EVENTS];
export function createMessage<T>(type: string, payload: T): WSMessage<T> {
	return { type, payload, ts: Date.now() };
}
export function parseMessage(raw: string): WSMessage {
	return JSON.parse(raw) as WSMessage;
}
export const WORLDIDS = {
	LOBBY: "Lobby"
};

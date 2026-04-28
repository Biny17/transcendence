export const CLIENT_MSG = {
    JOIN: 'JOIN',
    PLAYER_READY: 'PLAYER_READY',
    WORLD_LOADED: 'WORLD_LOADED',
    PHASE_EVENT: 'PHASE_EVENT',
    PLAYER_INPUT: 'PLAYER_INPUT',
    PLAYER_INTERACT: 'PLAYER_INTERACT',
    PLAYER_CHOOSE: 'PLAYER_CHOOSE',
    RESET: 'RESET',
};
export const SERVER_MSG = {
    CONNECTED: 'CONNECTED',
    LOAD_WORLD: 'LOAD_WORLD',
    START_WORLD: 'START_WORLD',
    PLAYER_JOIN: 'PLAYER_JOIN',
    PLAYER_DISCONNECT: 'PLAYER_DISCONNECT',
    PLAYER_INTERACT: 'PLAYER_INTERACT',
    LOAD_GAMEMODE: 'LOAD_GAMEMODE',
    LOAD_UI: 'LOAD_UI',
    WORLD_STATE: 'WORLD_STATE',
    LOBBY_END: 'LOBBY_END',
    ERROR: 'ERROR',
    PHASE_CHANGED: 'PHASE_CHANGED',
    PHASE_EVENT: 'PHASE_EVENT',
};
export const PHASE_EVENTS = {
    WIN: 'player_won',
    LOST: 'player_lost',
    PLAYER_ELIMINATED: 'player_eliminated',
    RESULTS_ACK: 'results_ack',
};
export function createMessage(type, payload) {
    return { type, payload, ts: Date.now() };
}
export function parseMessage(raw) {
    return JSON.parse(raw);
}
export const WORLDIDS = {
    LOBBY: 'Lobby',
};
//# sourceMappingURL=protocol.js.map
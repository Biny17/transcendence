export const sockets = new Map();
export const positions = new Map();
export const usernames = new Map();
export let hostId = null;
export function setHost(id) {
    hostId = id;
}
export function resetState() {
    sockets.clear();
    positions.clear();
    usernames.clear();
    hostId = null;
}
export function addPlayer(id, ws) {
    sockets.set(id, ws);
    positions.set(id, { pos: { x: 0, y: 1, z: 0 }, rot: { x: 0, y: 0, z: 0, w: 1 } });
    if (sockets.size === 1)
        hostId = id;
}
export function removePlayer(id) {
    sockets.delete(id);
    positions.delete(id);
    if (hostId === id) {
        hostId = sockets.size > 0 ? sockets.keys().next().value : null;
    }
}
export function findPlayerByUsername(username) {
    for (const [id, name] of usernames) {
        if (name === username)
            return id;
    }
    return undefined;
}
export function sendTo(playerId, message) {
    sockets.get(playerId)?.send(message);
}
export function broadcast(message) {
    for (const ws of sockets.values()) {
        ws.send(message);
    }
}
export function broadcastExcept(excludeId, message) {
    for (const [id, ws] of sockets) {
        if (id !== excludeId)
            ws.send(message);
    }
}
//# sourceMappingURL=state.js.map
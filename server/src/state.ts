import type { Vec3, Quat } from "@/shared/math";
type ClientWS = { send(data: string): void; close(): void };
export type PlayerPosition = { pos: Vec3; rot: Quat; action?: string };
export const sockets = new Map<string, ClientWS>();
export const positions = new Map<string, PlayerPosition>();
export const usernames = new Map<string, string>();
export let hostId: string | null = null;
export function setHost(id: string | null): void {
	hostId = id;
}
export function resetState(): void {
	sockets.clear();
	positions.clear();
	usernames.clear();
	hostId = null;
}
export function addPlayer(id: string, ws: ClientWS): void {
	sockets.set(id, ws);
	positions.set(id, { pos: { x: 0, y: 1, z: 0 }, rot: { x: 0, y: 0, z: 0, w: 1 } });
	if (sockets.size === 1) hostId = id;
}
export function removePlayer(id: string): void {
	sockets.delete(id);
	positions.delete(id);
	if (hostId === id) {
		hostId = sockets.size > 0 ? sockets.keys().next().value! : null;
	}
}
export function findPlayerByUsername(username: string): string | undefined {
	for (const [id, name] of usernames) {
		if (name === username) return id;
	}
	return undefined;
}
export function sendTo(playerId: string, message: string): void {
	sockets.get(playerId)?.send(message);
}
export function broadcast(message: string): void {
	for (const ws of sockets.values()) {
		ws.send(message);
	}
}
export function broadcastExcept(excludeId: string, message: string): void {
	for (const [id, ws] of sockets) {
		if (id !== excludeId) ws.send(message);
	}
}

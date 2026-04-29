import type { Vec3, Quat } from "@/shared/math";
type ClientWS = {
    send(data: string): void;
    close(): void;
};
export type PlayerPosition = {
    pos: Vec3;
    rot: Quat;
    action?: string;
};
export declare const sockets: Map<string, ClientWS>;
export declare const positions: Map<string, PlayerPosition>;
export declare const usernames: Map<string, string>;
export declare let hostId: string | null;
export declare function setHost(id: string | null): void;
export declare function resetState(): void;
export declare function addPlayer(id: string, ws: ClientWS): void;
export declare function removePlayer(id: string): void;
export declare function findPlayerByUsername(username: string): string | undefined;
export declare function sendTo(playerId: string, message: string): void;
export declare function broadcast(message: string): void;
export declare function broadcastExcept(excludeId: string, message: string): void;
export {};
//# sourceMappingURL=state.d.ts.map
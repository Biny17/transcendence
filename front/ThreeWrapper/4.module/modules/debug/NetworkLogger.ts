"use client";
import type { WSMessage } from "shared/protocol";
import { CLIENT_MSG, SERVER_MSG } from "shared/protocol";
import { ServerHandler } from "@/ThreeWrapper/1.engine/tools/ServerHandler";
export const ALL_PACKET_TYPES = {
	incoming: Object.values(SERVER_MSG),
	outgoing: Object.values(CLIENT_MSG)
} as const;
export const ALL_PACKET_TYPE_STRINGS = [...Object.values(SERVER_MSG), ...Object.values(CLIENT_MSG)].sort();
export const FAKE_MESSAGES: Array<{
	label: string;
	type: string;
	direction: "incoming" | "outgoing";
	defaultPayload: string;
}> = [
	{ label: "— Custom —", type: "", direction: "incoming", defaultPayload: "{}" },
	{ label: "IN: CONNECTED", type: SERVER_MSG.CONNECTED, direction: "incoming", defaultPayload: '{"playerId":"fake-id"}' },
	{ label: "IN: LOAD_WORLD", type: SERVER_MSG.LOAD_WORLD, direction: "incoming", defaultPayload: '{"worldId":"Game","players":[]}' },
	{ label: "IN: START_WORLD", type: SERVER_MSG.START_WORLD, direction: "incoming", defaultPayload: '{"initialState":{}}' },
	{ label: "IN: PLAYER_JOIN", type: SERVER_MSG.PLAYER_JOIN, direction: "incoming", defaultPayload: '{"playerId":"p2","username":"Player2","isHost":false}' },
	{ label: "IN: PLAYER_DISCONNECT", type: SERVER_MSG.PLAYER_DISCONNECT, direction: "incoming", defaultPayload: '{"playerId":"p2","reason":"left"}' },
	{ label: "IN: PLAYER_INTERACT", type: SERVER_MSG.PLAYER_INTERACT, direction: "incoming", defaultPayload: '{"playerId":"p2","action":"shoot","targetId":"p1"}' },
	{ label: "IN: LOAD_GAMEMODE", type: SERVER_MSG.LOAD_GAMEMODE, direction: "incoming", defaultPayload: '{"modeId":"tdm","winCondition":null}' },
	{ label: "IN: LOAD_UI", type: SERVER_MSG.LOAD_UI, direction: "incoming", defaultPayload: '{"uiId":"hud"}' },
	{ label: "IN: WORLD_STATE", type: SERVER_MSG.WORLD_STATE, direction: "incoming", defaultPayload: '{"tick":1,"players":[],"events":[]}' },
	{ label: "IN: LOBBY_END", type: SERVER_MSG.LOBBY_END, direction: "incoming", defaultPayload: '{"scores":[],"rankings":[]}' },
	{ label: "IN: ERROR", type: SERVER_MSG.ERROR, direction: "incoming", defaultPayload: '{"code":"ERR_001","message":"Something went wrong"}' },
	{ label: "IN: PHASE_CHANGED", type: SERVER_MSG.PHASE_CHANGED, direction: "incoming", defaultPayload: '{"phaseId":"game","phaseType":"game","data":{}}' },
	{ label: "IN: PHASE_EVENT", type: SERVER_MSG.PHASE_EVENT, direction: "incoming", defaultPayload: '{"event":"player_won"}' },
	{ label: "OUT: JOIN", type: CLIENT_MSG.JOIN, direction: "outgoing", defaultPayload: '{"username":"TestPlayer"}' },
	{ label: "OUT: PLAYER_READY", type: CLIENT_MSG.PLAYER_READY, direction: "outgoing", defaultPayload: "{}" },
	{ label: "OUT: WORLD_LOADED", type: "WORLD_LOADED", direction: "outgoing", defaultPayload: "{}" },
	{ label: "OUT: PLAYER_INPUT", type: CLIENT_MSG.PLAYER_INPUT, direction: "outgoing", defaultPayload: '{"pos":{"x":0,"y":1.7,"z":0},"rot":{"x":0,"y":0,"z":0,"w":1}}' },
	{ label: "OUT: PLAYER_INTERACT", type: CLIENT_MSG.PLAYER_INTERACT, direction: "outgoing", defaultPayload: '{"action":"shoot","targetId":"enemy1"}' },
	{ label: "OUT: PLAYER_CHOOSE", type: CLIENT_MSG.PLAYER_CHOOSE, direction: "outgoing", defaultPayload: '{"choiceId":"primary"}' },
	{ label: "OUT: PHASE_EVENT", type: CLIENT_MSG.PHASE_EVENT, direction: "outgoing", defaultPayload: '{"event":"player_won"}' },
	{ label: "OUT: RESET", type: CLIENT_MSG.RESET, direction: "outgoing", defaultPayload: "{}" }
];
export type PacketEntry = {
	id: number;
	direction: "incoming" | "outgoing";
	type: string;
	payload: unknown;
	timestamp: number;
};
export type PacketState = "allow" | "hide" | "block";
class NetworkLogger {
	private static instance: NetworkLogger | null = null;
	private packets: PacketEntry[] = [];
	private maxPackets = 1000;
	private enabled = false;
	private incomingHandle: (() => void) | null = null;
	private outgoingHandle: (() => void) | null = null;
	private idCounter = 0;
	private logMode: "all" | "selected" = "all";
	private selectedTypes: Set<string> = new Set();
	private selectedDirections: Set<"incoming" | "outgoing"> = new Set(["incoming", "outgoing"]);
	private packetStates: Map<string, PacketState> = new Map();
	private networkEntryListeners: Array<(entry: PacketEntry) => void> = [];
	private serverHandlerRef: ServerHandler | null = null;
	private constructor() {
		this.setPacketState(SERVER_MSG.WORLD_STATE, "hide");
		this.setPacketState(CLIENT_MSG.PLAYER_INPUT, "hide");
	}
	static getInstance(): NetworkLogger {
		if (!NetworkLogger.instance) {
			NetworkLogger.instance = new NetworkLogger();
		}
		return NetworkLogger.instance;
	}
	private push(entry: Omit<PacketEntry, "id" | "timestamp">): void {
		if (!this.enabled) return;
		if (this.logMode === "selected") {
			if (!this.selectedTypes.has(entry.type)) return;
			if (!this.selectedDirections.has(entry.direction)) return;
		} else {
			if (!this.selectedDirections.has(entry.direction)) return;
		}
		const fullEntry: PacketEntry = { ...entry, id: ++this.idCounter, timestamp: Date.now() };
		this.packets.push(fullEntry);
		if (this.packets.length > this.maxPackets) this.packets.shift();
		window.dispatchEvent(new CustomEvent("debug:network", { detail: this.getPackets() }));
		for (const listener of this.networkEntryListeners) {
			listener(fullEntry);
		}
	}
	getPackets(): PacketEntry[] {
		return [...this.packets];
	}
	getPacketCount(): number {
		return this.packets.length;
	}
	clearPackets(): void {
		this.packets = [];
		window.dispatchEvent(new CustomEvent("debug:network", { detail: [] }));
	}
	setMaxPackets(n: number): void {
		this.maxPackets = Math.max(1, n);
		while (this.packets.length > this.maxPackets) this.packets.shift();
	}
	setEnabled(v: boolean): void {
		this.enabled = v;
	}
	isEnabled(): boolean {
		return this.enabled;
	}
	getLogMode(): "all" | "selected" {
		return this.logMode;
	}
	setLogMode(mode: "all" | "selected"): void {
		this.logMode = mode;
	}
	getSelectedTypes(): string[] {
		return [...this.selectedTypes];
	}
	setSelectedTypes(types: string[]): void {
		this.selectedTypes = new Set(types);
	}
	toggleSelectedType(type: string): void {
		if (this.selectedTypes.has(type)) {
			this.selectedTypes.delete(type);
		} else {
			this.selectedTypes.add(type);
		}
	}
	getSelectedDirections(): Array<"incoming" | "outgoing"> {
		return [...this.selectedDirections];
	}
	setSelectedDirections(directions: Array<"incoming" | "outgoing">): void {
		this.selectedDirections = new Set(directions);
	}
	toggleSelectedDirection(direction: "incoming" | "outgoing"): void {
		if (this.selectedDirections.has(direction)) {
			this.selectedDirections.delete(direction);
		} else {
			this.selectedDirections.add(direction);
		}
	}
	setPacketState(type: string, state: PacketState): void {
		if (state === "allow") {
			this.packetStates.delete(type);
		} else {
			this.packetStates.set(type, state);
		}
	}
	getPacketState(type: string): PacketState {
		return this.packetStates.get(type) ?? "allow";
	}
	getPacketStates(): Map<string, PacketState> {
		return new Map(this.packetStates);
	}
	clearPacketStates(): void {
		this.packetStates.clear();
	}
	onNetworkEntry(callback: (entry: PacketEntry) => void): () => void {
		this.networkEntryListeners.push(callback);
		return () => {
			const idx = this.networkEntryListeners.indexOf(callback);
			if (idx >= 0) this.networkEntryListeners.splice(idx, 1);
		};
	}
	attach(server: ServerHandler): void {
		if (this.serverHandlerRef === server) return;
		this.detach();
		this.serverHandlerRef = server;
		this.setEnabledFromConfig();
		const self = this;
		this.incomingHandle = server.addIncomingInterceptor((msg) => {
			if (self.packetStates.get(msg.type) === "block") return false;
			self.push({ direction: "incoming", type: msg.type, payload: msg.payload });
			return true;
		});
		this.outgoingHandle = server.addOutgoingInterceptor((type, payload) => {
			if (self.packetStates.get(type) === "block") return false;
			self.push({ direction: "outgoing", type, payload });
			return true;
		});
	}
	detach(): void {
		this.incomingHandle?.();
		this.incomingHandle = null;
		this.outgoingHandle?.();
		this.outgoingHandle = null;
		this.serverHandlerRef = null;
	}
	setEnabledFromConfig(): void {
		const stored = localStorage.getItem("debugNetworkEnabled");
		this.enabled = stored === "true";
	}
	fakeIncoming(type: string, payload: unknown): void {
		if (!this.enabled) return;
		const msg = { type, payload, ts: Date.now() };
		if (this.packetStates.get(type) === "block") {
			console.log(`[Network] Blocked incoming packet: ${type}`);
			return;
		}
		if (!this.serverHandlerRef) return;
		this.serverHandlerRef.dispatch(msg);
	}
	fakeOutgoing(type: string, payload: unknown): void {
		this.push({ direction: "outgoing", type, payload });
	}
	sendRealOutgoing(type: string, payload: unknown): boolean {
		if (!this.serverHandlerRef) {
			console.warn("[NetworkLogger] No server handler attached, cannot send real packet");
			return false;
		}
		const send = this.serverHandlerRef.send as unknown as Record<string, (...args: unknown[]) => void>;
		const handler = send[type];
		if (handler) {
			try {
				handler(payload);
				return true;
			} catch (e) {
				console.error(`[NetworkLogger] Failed to send packet ${type}:`, e);
				return false;
			}
		}
		this.serverHandlerRef.sendMessage(type, payload);
		return true;
	}
}
export const networkLogger = NetworkLogger.getInstance();

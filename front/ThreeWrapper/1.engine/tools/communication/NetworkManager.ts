import type { Engine } from "@/ThreeWrapper/1.engine/Engine";
import type { JoinPayload, WSMessage } from "shared/protocol";
import { SERVER_MSG, CLIENT_MSG, PHASE_EVENTS, createMessage, parseMessage } from "shared/protocol";
import type { ConnectedPayload, PlayerInputPayload, PlayerInteractPayload, PlayerChoosePayload } from "shared/protocol";
type MessageHandler<T = unknown> = (payload: T) => void;
const RECONNECT_ATTEMPTS = 3;
const RECONNECT_INTERVAL_MS = 2000;
export class NetworkManager {
	private ws: WebSocket | null = null;
	private readonly serverUrl: string;
	private handlers = new Map<string, MessageHandler[]>();
	private reconnectCount = 0;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private intentionalDisconnect = false;
	playerId: string | null = null;
	private simulateLagMs = 0;
	private simulatePacketLossPercent = 0;
	private simulatePacketDuplication = 0;
	private forceDisconnect = false;
	constructor(serverUrl: string) {
		this.serverUrl = serverUrl;
	}
	connect(): void {
		this.ws = new WebSocket(this.serverUrl);
		this.ws.onopen = () => {
			console.log("[NetworkManager] Connected to server");
			this.reconnectCount = 0;
		};
		this.ws.onmessage = (event) => {
			const msg = parseMessage(event.data as string);
			this.dispatch(msg);
		};
		this.ws.onclose = () => {
			console.warn("[NetworkManager] Connection closed");
			this.attemptReconnect();
		};
		this.ws.onerror = () => {
			console.error(`[NetworkManager] WebSocket error — cannot reach ${this.serverUrl}`);
		};
	}
	private attemptReconnect(): void {
		if (this.intentionalDisconnect) return;
		if (this.reconnectCount >= RECONNECT_ATTEMPTS) {
			console.error("[NetworkManager] Max reconnect attempts reached");
			this.dispatch({
				type: "__RECONNECT_FAILED__",
				payload: null,
				ts: Date.now()
			});
			return;
		}
		this.reconnectCount++;
		console.log(`[NetworkManager] Reconnecting... (attempt ${this.reconnectCount}/${RECONNECT_ATTEMPTS})`);
		this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_INTERVAL_MS);
	}
	private registerDefaultHandlers(): void {
		this.on<ConnectedPayload>(SERVER_MSG.CONNECTED, ({ playerId }) => {
			this.playerId = playerId;
			console.log(`[NetworkManager] Assigned playerId: ${playerId}`);
		});
	}
	private dispatch(msg: WSMessage): void {
		const list = this.handlers.get(msg.type) ?? [];
		for (const handler of list) handler(msg.payload);
	}
	on<T>(type: string, handler: MessageHandler<T>): () => void {
		const list = this.handlers.get(type) ?? [];
		list.push(handler as MessageHandler);
		this.handlers.set(type, list);
		return () => {
			const updated = (this.handlers.get(type) ?? []).filter((h) => h !== handler);
			this.handlers.set(type, updated);
		};
	}
	send<T>(type: string, payload: T): void {
		if (this.ws?.readyState !== WebSocket.OPEN) {
			console.warn("[NetworkManager] Cannot send — not connected");
			return;
		}
		const message = JSON.stringify(createMessage(type, payload));
		if (Math.random() < this.simulatePacketLossPercent / 100) {
			console.log(`[NetworkManager] Simulated packet loss for ${type}`);
			return;
		}
		const sendCount = 1 + this.simulatePacketDuplication;
		const sendWithDelay = () => {
			if (this.simulateLagMs > 0) {
				setTimeout(() => {
					if (this.ws?.readyState === WebSocket.OPEN) {
						this.ws.send(message);
					}
				}, this.simulateLagMs);
			} else {
				this.ws?.send(message);
			}
		};
		for (let i = 0; i < sendCount; i++) {
			sendWithDelay();
		}
	}
	sendPlayerReady(): void {
		this.send(CLIENT_MSG.PLAYER_READY, {});
	}
	sendJoin(payload: JoinPayload): void {
		this.send(CLIENT_MSG.JOIN, payload);
	}
	sendWorldLoaded(): void {
		this.send(CLIENT_MSG.WORLD_LOADED, {});
	}
	sendPlayerInput(input: PlayerInputPayload): void {
		this.send(CLIENT_MSG.PLAYER_INPUT, input);
	}
	playerWon(): void {
		this.send(CLIENT_MSG.PHASE_EVENT, { event: PHASE_EVENTS.WIN });
	}
	playerLost(): void {
		this.send(CLIENT_MSG.PHASE_EVENT, { event: PHASE_EVENTS.LOST });
	}
	playerEliminated(): void {
		this.send(CLIENT_MSG.PHASE_EVENT, {
			event: PHASE_EVENTS.PLAYER_ELIMINATED
		});
	}
	resultsAck(): void {
		this.send(CLIENT_MSG.PHASE_EVENT, { event: PHASE_EVENTS.RESULTS_ACK });
	}
	playerInteract(payload: PlayerInteractPayload): void {
		this.send(CLIENT_MSG.PLAYER_INTERACT, payload);
	}
	playerChoose(payload: PlayerChoosePayload): void {
		this.send(CLIENT_MSG.PLAYER_CHOOSE, payload);
	}
	disconnect(): void {
		this.intentionalDisconnect = true;
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
		this.ws?.close();
		this.ws = null;
	}
	setSimulateLag(ms: number): void {
		this.simulateLagMs = Math.max(0, ms);
		console.log(`[NetworkManager] Simulating lag: ${this.simulateLagMs}ms`);
	}
	setSimulatePacketLoss(percent: number): void {
		this.simulatePacketLossPercent = Math.max(0, Math.min(100, percent));
		console.log(`[NetworkManager] Simulating packet loss: ${this.simulatePacketLossPercent}%`);
	}
	setSimulatePacketDuplication(count: number): void {
		this.simulatePacketDuplication = Math.max(0, count);
		console.log(`[NetworkManager] Simulating packet duplication: ${this.simulatePacketDuplication}x`);
	}
	forceDisconnectAndReconnect(): void {
		console.log("[NetworkManager] forceDisconnectAndReconnect called, ws state:", this.ws?.readyState);
		const oldWs = this.ws;
		if (!oldWs) {
			console.log("[NetworkManager] No WebSocket to disconnect");
			return;
		}
		this.intentionalDisconnect = true;
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
		this.reconnectCount = 0;
		oldWs.close();
		this.ws = null;
		setTimeout(() => {
			this.intentionalDisconnect = false;
			this.connect();
		}, 100);
	}
	getSimulationState(): { lag: number; packetLoss: number; duplication: number } {
		return {
			lag: this.simulateLagMs,
			packetLoss: this.simulatePacketLossPercent,
			duplication: this.simulatePacketDuplication,
		};
	}
}

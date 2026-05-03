"use client";
import type { GameEventMap } from "shared/events";
import type { WSMessage, PlayerInputPayload, PlayerInteractPayload, PlayerChoosePayload, ConnectedPayload, JoinPayload, PhaseEventPayload, IncomingInterceptor, OutgoingInterceptor, InterceptorHandle } from "shared/protocol";
import { SERVER_MSG, CLIENT_MSG, PHASE_EVENTS, createMessage, parseMessage } from "shared/protocol";
import type { LoadWorldPlayer } from "shared/state";
import type { World } from "@/ThreeWrapper/2.world/WorldClass";
import { Logger } from "./Logger";
import { NetworkManager } from "./communication/NetworkManager";
import type { Engine } from "../Engine";
type MessageHandler<T = unknown> = (payload: T) => void;
const RECONNECT_ATTEMPTS = 3;
const RECONNECT_INTERVAL_MS = 2000;
export interface ServerSend {
	join(payload: JoinPayload): void;
	playerReady(): void;
	playerInput(input: PlayerInputPayload): void;
	playerWon(): void;
	playerLost(): void;
	playerEliminated(): void;
	resultsAck(): void;
	playerInteract(payload: PlayerInteractPayload): void;
	playerChoose(payload: PlayerChoosePayload): void;
	reset(): void;
}
export interface ServerHandlerScope {
	on<K extends keyof GameEventMap & string>(event: K, handler: (payload: GameEventMap[K]) => void): () => void;
	send: ServerSend;
	readonly playerId: string | null;
	addIncomingInterceptor(fn: IncomingInterceptor): InterceptorHandle;
	addOutgoingInterceptor(fn: OutgoingInterceptor): InterceptorHandle;
	dispose(): void;
}
export class ServerHandler {
	private ws: WebSocket | null = null;
	private readonly serverUrl: string;
	private readonly handlers = new Map<string, MessageHandler[]>();
	private reconnectCount = 0;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private intentionalDisconnect = false;
	private handlersRegistered = false;
	private readonly logger = Logger.getInstance().for("ServerHandler");
	playerId: string | null = null;
	public readonly networkManager: NetworkManager;
	private readonly engine: Engine;
	private pendingWorldId: string | null = null;
	private pendingPlayers: LoadWorldPlayer[] = [];
	private pendingWorld: World | null = null;
	private worldResolver: ((worldId: string) => Promise<World>) | null = null;
	private incomingInterceptors: IncomingInterceptor[] = [];
	private outgoingInterceptors: OutgoingInterceptor[] = [];
	readonly send: ServerSend;
	constructor(serverUrl: string, engine: Engine) {
		this.serverUrl = serverUrl;
		this.engine = engine;
		this.networkManager = new NetworkManager(serverUrl);
		this.send = {
			join: (payload: JoinPayload) => this.sendRaw(CLIENT_MSG.JOIN, payload),
			playerReady: () => this.sendRaw(CLIENT_MSG.PLAYER_READY, {}),
			playerInput: (input) => this.sendRaw(CLIENT_MSG.PLAYER_INPUT, input),
			playerWon: () => this.sendRaw(CLIENT_MSG.PHASE_EVENT, { event: PHASE_EVENTS.WIN }),
			playerLost: () => this.sendRaw(CLIENT_MSG.PHASE_EVENT, { event: PHASE_EVENTS.LOST }),
			playerEliminated: () => this.sendRaw(CLIENT_MSG.PHASE_EVENT, { event: PHASE_EVENTS.PLAYER_ELIMINATED }),
			resultsAck: () => this.sendRaw(CLIENT_MSG.PHASE_EVENT, { event: PHASE_EVENTS.RESULTS_ACK }),
			playerInteract: (payload) => this.sendRaw(CLIENT_MSG.PLAYER_INTERACT, payload),
			playerChoose: (payload) => this.sendRaw(CLIENT_MSG.PLAYER_CHOOSE, payload),
			reset: () => this.sendRaw(CLIENT_MSG.RESET, {})
		};
	}
	setWorldResolver(resolver: (worldId: string) => Promise<World>): void {
		this.worldResolver = resolver;
	}
	addIncomingInterceptor(fn: IncomingInterceptor): InterceptorHandle {
		this.incomingInterceptors.push(fn);
		return () => {
			this.incomingInterceptors = this.incomingInterceptors.filter((f) => f !== fn);
		};
	}
	addOutgoingInterceptor(fn: OutgoingInterceptor): InterceptorHandle {
		this.outgoingInterceptors.push(fn);
		return () => {
			this.outgoingInterceptors = this.outgoingInterceptors.filter((f) => f !== fn);
		};
	}
	connect(): void {
		this.ws = new WebSocket(this.serverUrl);
		if (!this.handlersRegistered) {
			this.registerInternalHandlers();
			this.handlersRegistered = true;
		}
		this.ws.onopen = () => {
			this.logger.info("Connected to server");
			this.reconnectCount = 0;
		};
		this.ws.onmessage = (event) => {
			const msg = parseMessage(event.data as string);
			this.dispatch(msg);
		};
		this.ws.onclose = () => {
			this.logger.warn("Connection closed");
			this.attemptReconnect();
		};
		this.ws.onerror = () => {
			this.logger.error(`WebSocket error — cannot reach ${this.serverUrl}`);
		};
	}
	on<K extends keyof GameEventMap & string>(event: K, handler: (payload: GameEventMap[K]) => void): () => void {
		const list = this.handlers.get(event) ?? [];
		list.push(handler as MessageHandler);
		this.handlers.set(event, list);
		return () => {
			const updated = (this.handlers.get(event) ?? []).filter((h) => h !== handler);
			this.handlers.set(event, updated);
		};
	}
	scope(): ServerHandlerScope {
		const unsubs: Array<() => void> = [];
		const self = this;
		return {
			on: <K extends keyof GameEventMap & string>(event: K, handler: (payload: GameEventMap[K]) => void) => {
				const unsub = self.on(event, handler);
				unsubs.push(unsub);
				return unsub;
			},
			send: self.send,
			get playerId() {
				return self.playerId;
			},
			addIncomingInterceptor(fn: IncomingInterceptor): InterceptorHandle {
				const unsub = self.addIncomingInterceptor(fn);
				unsubs.push(unsub);
				return unsub;
			},
			addOutgoingInterceptor(fn: OutgoingInterceptor): InterceptorHandle {
				const unsub = self.addOutgoingInterceptor(fn);
				unsubs.push(unsub);
				return unsub;
			},
			dispose() {
				for (const unsub of unsubs) unsub();
				unsubs.length = 0;
			}
		};
	}
	disconnect(): void {
		this.intentionalDisconnect = true;
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
		this.ws?.close();
		this.ws = null;
	}
	dispose(): void {
		this.disconnect();
		this.handlers.clear();
		this.handlersRegistered = false;
	}
	forceDisconnectAndReconnect(): void {
		console.log("[ServerHandler] forceDisconnectAndReconnect called, ws state:", this.ws?.readyState);
		const oldWs = this.ws;
		if (!oldWs) {
			console.log("[ServerHandler] No WebSocket to disconnect");
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
	private sendRaw<T>(type: string, payload: T): void {
		for (const interceptor of this.outgoingInterceptors) {
			if (!interceptor(type, payload)) return;
		}
		if (this.ws?.readyState !== WebSocket.OPEN) {
			this.logger.warn("Cannot send — not connected");
			return;
		}
		this.ws.send(JSON.stringify(createMessage(type, payload)));
	}
	sendMessage<T>(type: string, payload: T): void {
		this.sendRaw(type, payload);
	}
	dispatch(msg: WSMessage): void {
		for (const interceptor of this.incomingInterceptors) {
			if (!interceptor(msg)) return;
		}
		const list = this.handlers.get(msg.type) ?? [];
		for (const handler of list) handler(msg.payload);
	}
	private attemptReconnect(): void {
		if (this.intentionalDisconnect) return;
		if (this.reconnectCount >= RECONNECT_ATTEMPTS) {
			this.logger.error("Max reconnect attempts reached");
			this.dispatch({ type: "__RECONNECT_FAILED__", payload: null, ts: Date.now() });
			return;
		}
		this.reconnectCount++;
		this.logger.info(`Reconnecting... (attempt ${this.reconnectCount}/${RECONNECT_ATTEMPTS})`);
		this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_INTERVAL_MS);
	}
	private registerInternalHandlers(): void {
		this.on(SERVER_MSG.CONNECTED, (p: ConnectedPayload) => {
			this.playerId = p.playerId;
			this.logger.info(`Assigned playerId: ${p.playerId}`);
			const urlParams = new URLSearchParams(window.location.search);
			const username = urlParams.get("username") ?? p.playerId;
			this.send.join({ username });
		});
		this.on(SERVER_MSG.LOAD_WORLD, async (p) => {
			this.logger.debug("Loading world: " + p.worldId);
			this.pendingWorldId = p.worldId;
			this.pendingPlayers = p.players;
			try {
				if (!this.worldResolver) throw new Error("[ServerHandler] No world resolver set");
				const loading = await this.worldResolver("Loading");
				await this.engine.load(loading, this.pendingPlayers);
				this.engine.startActive();
				const targetWorld = await this.worldResolver(p.worldId);
				await this.engine.preload(targetWorld, this.pendingPlayers);
				this.pendingWorld = targetWorld;
				this.logger.debug("Target world assets ready, notifying server");
				this.sendRaw(CLIENT_MSG.WORLD_LOADED, {});
			} catch (e) {
				this.logger.error(`Failed to load world "${p.worldId}":`, { error: String(e) });
				this.pendingWorldId = null;
				this.pendingPlayers = [];
			}
		});
		this.on(SERVER_MSG.START_WORLD, async (p) => {
			if (!this.pendingWorld) return;
			this.logger.debug("Starting world: " + this.pendingWorldId);
			this.engine.activate(this.pendingWorld);
			this.engine.startActive(p.initialState);
			this.pendingWorld = null;
			this.pendingWorldId = null;
			this.pendingPlayers = [];
		});
		this.on(SERVER_MSG.PHASE_EVENT, (p: PhaseEventPayload) => {
			this.dispatch({ type: p.event, payload: p, ts: Date.now() });
		});
	}
}

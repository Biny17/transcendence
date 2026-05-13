"use client";
import * as THREE from "three";
import type { EngineConfig, KeyBinding } from "shared/config";
import type { World, EngineContext } from "@/ThreeWrapper/2.world/WorldClass";
import { KeymapHandler, Logger, ServerHandler, Self } from "./tools";
import { DEFAULT_KEYBINDS } from "./tools/KeymapHandler";
import type { LoadWorldPlayer } from "shared/state";
import { SERVER_MSG, type PhaseChangedPayload } from "shared/protocol";
import { networkLogger } from "@/ThreeWrapper/4.module/modules/debug/NetworkLogger";
import { DebugControlModule } from "@/ThreeWrapper/4.module";
import { UIModule } from "@/ThreeWrapper/4.module/modules/ui/UIModule";
export class Engine {
	readonly mode: "standalone" | "online";
	readonly renderer: THREE.WebGLRenderer;
	readonly keymap: KeymapHandler;
	readonly logger: Logger;
	readonly selfServerClient: Self;
	readonly server: ServerHandler | null = null;
	readonly debug: DebugControlModule;
	readonly uiModule: UIModule;
	private readonly _onEndGame?: (won: boolean) => void;
	private _redirecting = false;
	private clock = new THREE.Clock();
	private animationId: number | null = null;
	private active: World | null = null;
	previewWorld: World | null = null;
	private lastFpsTime = 0;
	private frameCount = 0;
	public paused = false;
	public timeScale = 1;
	public gravity = 9.8;
	public stepRequested = false;
	private stepOneFrame = false;
	private _lastWireframeState = false;
	constructor(config: EngineConfig, defaultKeymap: KeyBinding[] = DEFAULT_KEYBINDS) {
		this.mode = config.mode;
		this._onEndGame = config.onEndGame;
		this.logger = Logger.getInstance();
		if (config.debug !== undefined) {
			Logger.setDebugConfig(config.debug);
		}
		this.selfServerClient = new Self();
		this.keymap = new KeymapHandler(defaultKeymap);
		this.uiModule =
			window.__uiModule ??
			(() => {
				const m = new UIModule();
				window.__uiModule = m;
				return m;
			})();
		this.debug = new DebugControlModule("F1");
		const canvas = config.canvas ?? this.createCanvas();
		this.renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true
		});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		if (config.mode === "online" && config.serverUrl) {
			this.server = new ServerHandler(config.serverUrl, this);
			this.server.on(SERVER_MSG.CONNECTED, (p) => {
				this.selfServerClient.id = p.playerId;
				this.logger.for("Engine").info("Received playerId from server", { playerId: p.playerId });
			});
			this.server.on(SERVER_MSG.PHASE_CHANGED, (p: PhaseChangedPayload) => {
				if (p.phaseType === "cinematic") {
					this.uiModule.hide("loading");
					const server = this.server!;
					const world = server.pendingWorld;
					if (world) {
						this.previewWorld = world;
					}
					const description = world?.mapDefinition?.description;
					if (description) {
						window.dispatchEvent(new CustomEvent("cinematic:show", { detail: { description } }));
					}
					return;
				}
			if (p.phaseId === "game" && p.phaseType === "end" && p.data?.rankings) {
				if (this._redirecting) return;
				const selfId = this.selfServerClient.id;
				if (!selfId) return;
				const myEntry = p.data.rankings.find((r) => r.playerId === selfId);
				this._redirecting = true;
				this.dispose();
				// Not in rankings → spectator (eliminated) → treat as loss
				const won = myEntry !== undefined && myEntry.rank === 1;
				this.logger.for("Engine").info(`Player ${won ? "won" : "lost"} — redirecting`);
				if (this._onEndGame) {
					this._onEndGame(won);
				} else {
					window.location.href = won ? "/wining" : "/lose";
				}
			}
			});
			networkLogger.attach(this.server);
			(window as any).__networkMgr = this.server.networkManager;
			(window as any).__serverHandler = this.server;
			window.addEventListener("cinematic:show", (e: Event) => {
				const { description } = (e as CustomEvent).detail;
				if (description) {
					import("react").then(({ createElement }) =>
						import("@/ThreeWrapper/4.module/modules/ui/components/CinematicUI").then(({ CinematicUI }) => {
							this.uiModule.show("cinematic", createElement(CinematicUI, { description }));
							this.uiModule.enablePointer("cinematic");
						})
					);
				}
			});
			window.addEventListener("cinematic:hide", () => {
				this.uiModule.hide("cinematic");
			});
		}
	}
	private createCanvas(): HTMLCanvasElement {
		const canvas = document.createElement("canvas");
		canvas.style.width = "100%";
		canvas.style.height = "100%";
		canvas.style.display = "block";
		return canvas;
	}
	get canvas(): HTMLCanvasElement {
		return this.renderer.domElement;
	}
	async preload(world: World, players: LoadWorldPlayer[] = []): Promise<void> {
		const me = players.find((p) => p.id === this.selfServerClient.id);
		if (me?.name) this.selfServerClient.name = me.name;
		const engineCtx: EngineContext = {
			renderer: this.renderer,
			keymap: this.keymap,
			logger: this.logger,
			selfServerClient: this.selfServerClient,
			debug: this.debug,
			uiModule: this.uiModule,
			...(this.server ? { server: this.server.scope() } : {})
		};
		world._bindEngine(engineCtx, players);
		if (this.debug && "init" in this.debug) {
			this.debug.init((world as any).ctx);
		}
		await world.init();
	}
	async load(world: World, players: LoadWorldPlayer[] = []): Promise<void> {
		this.active?.dispose();
		this.active = world;
		await this.preload(world, players);
	}
	activate(world: World): void {
		this.active?.dispose();
		this.active = world;
	}
	startActive(initialState?: unknown): void {
		this.active?.start(initialState);
	}
	async loadAndStart(world: World): Promise<void> {
		await this.load(world);
		this.startActive();
	}
	connect(): void {
		if (!this.server) throw new Error("[Engine] Not in online mode");
		this.server.connect();
	}
	start(): void {
		if (this.animationId !== null) return;
		this.clock.start();
		const tickRate = this.logger.getDebugConfig().gameTickRate;
		const loop = () => {
			if (tickRate) {
				setTimeout(() => {
					this.animationId = requestAnimationFrame(loop);
				}, tickRate);
			} else {
				this.animationId = requestAnimationFrame(loop);
			}
			Logger.incrementFrameCounter();
			const eng = (globalThis as any).__engine;
			if (eng) {
				this.paused = eng.paused;
				this.timeScale = eng.timeScale;
				this.gravity = eng.gravity;
				this.renderer.shadowMap.enabled = eng.shadows;
				if (this.active) {
					this.active.scene.fog = eng.fog ? this.active.scene.fog : null;
					const ambient = this.active.scene.children.find((c: THREE.Object3D) => c instanceof THREE.AmbientLight) as THREE.AmbientLight | undefined;
					if (ambient) ambient.intensity = eng.ambient;
				}
			}
			if (this.paused && !eng?.stepRequested) return;
			if (eng?.stepRequested) {
				eng.stepRequested = false;
				this.stepOneFrame = true;
			}
		if (this.paused && !this.stepOneFrame) return;
		this.stepOneFrame = false;
		const delta = this.clock.getDelta() * this.timeScale;
		if (this.previewWorld) {
			const camera = this.previewWorld.getCamera();
			const t = performance.now() / 1000;
			const speed = 0.15;
			const radius = Math.max(5, camera.position.length());
			camera.position.x = Math.sin(t * speed) * radius;
			camera.position.z = Math.cos(t * speed) * radius;
			camera.lookAt(0, 0, 0);
			this.renderer.render(this.previewWorld.scene, camera);
			return;
		}
		if (this.active) {
			this.active.update(delta);
			this.debug.update(delta); 
			this.renderer.render(this.active.scene, this.active.getCamera());
				if (eng) {
					eng.frameCount++;
					this.frameCount++;
					const info = this.renderer.info;
					eng.drawCalls = info.render.calls;
					eng.triangles = info.render.triangles;
					eng.memory = info.memory.geometries;
					const now = Date.now();
					if (now - this.lastFpsTime >= 1000) {
						eng.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
						this.frameCount = 0;
						this.lastFpsTime = now;
					}
					this.active.scene.traverse((obj: THREE.Object3D) => {
						if (obj instanceof THREE.Mesh && obj.material) {
							const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
							for (const m of mats) m.wireframe = !!eng.wireframe;
						}
					});
					if (!eng.wireframe && this._lastWireframeState) {
						this.active.scene.traverse((obj: THREE.Object3D) => {
							if (obj instanceof THREE.Mesh && obj.material) {
								const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
								for (const m of mats) m.wireframe = false;
							}
						});
					}
					this._lastWireframeState = !!eng.wireframe;
				}
			}
		};
		loop();
	}
	stop(): void {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
		this.clock.stop();
	}
	resize(width: number, height: number): void {
		this.renderer.setSize(width, height, false);
		if (this.active) {
			const camera = this.active.getCamera();
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
		}
	}
	dispose(): void {
		this.stop();
		this.active?.dispose();
		networkLogger.detach();
		this.server?.dispose();
		this.debug.dispose();
		this.renderer.dispose();
	}
}

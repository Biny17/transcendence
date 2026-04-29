import * as THREE from "three";
import type { KeymapHandler, Logger, Self, ServerHandlerScope } from "@/ThreeWrapper/1.engine/tools";
import type { Environment } from "@/ThreeWrapper/3.environment/EnvironmentClass";
import type { WorldContext, Module } from "@/ThreeWrapper/4.module";
import { ModuleKey } from "@/ThreeWrapper/4.module";
import type { WorldConfig } from "shared/config";
import type { LoadWorldPlayer } from "shared/state";
import { GLTFLoader, MapLoader, ObjectManager, OBJECT_TYPE } from "./tools";
import type { PhysicsWorld, ManagedObject } from "./tools";
export type EngineContext = {
	renderer: THREE.WebGLRenderer;
	keymap: KeymapHandler;
	logger: Logger;
	selfServerClient: Self;
	server?: ServerHandlerScope;
	debug?: any;
	uiModule?: import("@/ThreeWrapper/4.module/modules/ui/UIModule").UIModule;
};
export abstract class World {
	readonly config: WorldConfig;
	protected ctx!: WorldContext;
	private readonly _scene: THREE.Scene;
	private readonly _camera: THREE.PerspectiveCamera;
	private readonly _gltf: GLTFLoader;
	private readonly _objects: ObjectManager;
	private readonly _map: MapLoader;
	protected modules: Map<string, Module> = new Map();
	private _appliedEnvironments: string[] = [];
	private _started = false;
	constructor(config: WorldConfig) {
		this.config = config;
		this._scene = new THREE.Scene();
		this._camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
		this._camera.position.set(0, 5, 10);
		this._gltf = new GLTFLoader();
		this._objects = new ObjectManager(this._scene);
		this._map = new MapLoader(this._scene);
		this.setupEnvironment();
	}
	protected abstract setupEnvironment(): void;
	_bindEngine(engineCtx: EngineContext, players: LoadWorldPlayer[]): void {
		const size = engineCtx.renderer.getSize(new THREE.Vector2());
		if (size.x > 0 && size.y > 0) {
			this._camera.aspect = size.x / size.y;
			this._camera.updateProjectionMatrix();
		}
		if (!this.modules.has(ModuleKey.ui) && engineCtx.uiModule) {
			this.modules.set(ModuleKey.ui, engineCtx.uiModule);
		}
		for (const player of players) {
			this._objects.add({
				id: player.id,
				type: OBJECT_TYPE.PLAYER,
				name: player.name,
				extraData: { serverData: player }
			});
		}
		const log = engineCtx.logger.for("World");
		log.logVariable("selfServerClientId", engineCtx.selfServerClient.id);
		log.logVariable("playersCount", players.length);
		log.logVariable(
			"playersIds",
			players.map((p) => p.id)
		);
		const selfWorldPlayer = engineCtx.selfServerClient.id ? (this._objects.getById(engineCtx.selfServerClient.id, OBJECT_TYPE.PLAYER) ?? null) : players.length > 0 ? (this._objects.getById(players[0].id, OBJECT_TYPE.PLAYER) ?? null) : null;
		log.logVariable("selfWorldPlayerResolved", selfWorldPlayer?.id ?? null);
		this.ctx = {
			renderer: engineCtx.renderer,
			canvas: engineCtx.renderer.domElement,
			keymap: engineCtx.keymap,
			logger: engineCtx.logger,
			selfServerClient: engineCtx.selfServerClient,
			debug: engineCtx.debug,
			uiModule: engineCtx.uiModule,
			...(engineCtx.server ? { server: engineCtx.server } : {}),
			scene: this._scene,
			camera: this._camera,
			gltf: this._gltf,
			objects: this._objects,
			map: this._map,
			selfWorldPlayer,
			getModule: <T extends Module>(type: string) => this.modules.get(type) as T | undefined
		};
	}
	get scene(): THREE.Scene {
		return this._scene;
	}
	getCamera(): THREE.PerspectiveCamera {
		return this.ctx.camera;
	}
	addModule(module: Module): void {
		this.modules.set(module.type, module);
	}
	getModule<T extends Module>(type: string): T | undefined {
		return this.modules.get(type) as T | undefined;
	}
	removeModule(type: string): void {
		const module = this.modules.get(type);
		module?.dispose();
		this.modules.delete(type);
	}
	applyEnvironment(env: Environment): void {
		this._appliedEnvironments.push(env.constructor.name);
		for (const module of env.getModules()) this.addModule(module);
	}
	async init(): Promise<void> {
		const log = this.ctx.logger.for("World");
		const worldPhase = this.ctx.logger.pushPhase(`World [${this.config.id}] init`);
		const physicsPhase = this.ctx.logger.pushPhase("Physics init");
		try {
			const { PhysicsWorld } = await import("@/ThreeWrapper/2.world/tools/PhysicsWorld");
			const physics = new PhysicsWorld(this._scene, { debug: false });
			await physics.init();
			this._objects.attachPhysics(physics);
		} finally {
			physicsPhase.close();
		}
		for (const envName of this._appliedEnvironments) {
			log.info(`Environment: ${envName}`, {
				modules: [...this.modules.keys()].join(", ")
			});
		}
		for (const module of this.modules.values()) {
			if (module.requires) {
				for (const dep of module.requires) {
					if (!this.modules.has(dep)) {
						throw new Error(`[${module.type}] requires '${dep}' module but it was not added to this world`);
					}
				}
			}
		}
		const onLoadPhase = this.ctx.logger.pushPhase("onLoad");
		await this.onLoad();
		onLoadPhase.close();
		for (const module of this.modules.values()) {
			const phase = this.ctx.logger.pushPhase(`Module [${module.type}] init`);
			try {
				await module.init(this.ctx);
			} catch (e) {
				log.error(`Module [${module.type}] init failed`, { error: String(e) });
				throw e;
			} finally {
				phase.close();
			}
		}
		worldPhase.close();
	}
	start(initialState?: unknown): void {
		if (this._started) return;
		this._started = true;
		const startPhase = this.ctx.logger.pushPhase(`World [${this.config.id}] start`);
		const onStartPhase = this.ctx.logger.pushPhase("onStart");
		this.onStart(initialState);
		onStartPhase.close();
		startPhase.close();
	}
	update(delta: number): void {
		this.ctx.objects.updatePhysics(delta);
		for (const module of this.modules.values()) {
			module.update?.(delta);
		}
		this.ctx.objects.update(delta);
	}
	dispose(): void {
		const disposePhase = this.ctx.logger.pushPhase(`World [${this.config.id}] dispose`);
		for (const module of this.modules.values()) module.dispose();
		this.modules.clear();
		this.ctx.gltf.dispose();
		this.ctx.objects.dispose();
		this._scene.clear();
		this._started = false;
		this.onDispose();
		this.ctx.server?.dispose();
		disposePhase.close();
	}
	protected async onLoad(): Promise<void> {}
	protected onStart(_initialState?: unknown): void {}
	protected onDispose(): void {}
}

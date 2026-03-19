import * as THREE from 'three'
import type { EventHandler } from '../1.engine/EventHandler'
import type { KeymapHandler } from '../1.engine/KeymapHandler'
import type { Logger } from '../1.engine/Logger'
import type { NetworkManager } from '../1.engine/network/NetworkManager'
import type { Environment } from '../3.environments/EnvironmentClass'
import type { Extension } from '../4.extensions/Extension'
import type { EngineContext, Module } from '../5.modules/Module'
import type { WorldConfig } from '../../shared/types'
import { GameConfigLoader } from './tools/GameConfigLoader'
import { GLTFLoader } from './tools/GLTFLoader'
import { MapLoader } from './tools/MapLoader'
import { ObjectManager } from './tools/ObjectManager'
export class World {
	readonly config: WorldConfig
	readonly scene: THREE.Scene
	readonly camera: THREE.PerspectiveCamera
	readonly gltf: GLTFLoader
	readonly objects: ObjectManager
	readonly map: MapLoader
	readonly gameConfig: GameConfigLoader
	protected modules: Map<string, Module> = new Map()
	protected extensions: Map<string, Extension> = new Map()
	protected renderer: THREE.WebGLRenderer | null = null
	networkManager: NetworkManager | null = null
	eventHandler: EventHandler | null = null
	keymap: KeymapHandler | null = null
	logger: Logger | null = null
	private _appliedEnvironments: string[] = []
	private _started = false
	constructor(config: WorldConfig) {
		this.config = config
		this.scene = new THREE.Scene()
		this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
		this.camera.position.set(0, 5, 10)
		this.gltf = new GLTFLoader()
		this.objects = new ObjectManager(this.scene)
		this.map = new MapLoader(this.scene)
		this.gameConfig = new GameConfigLoader()
	}
	attachRenderer(renderer: THREE.WebGLRenderer): void {
		this.renderer = renderer
		const size = renderer.getSize(new THREE.Vector2())
		if (size.x > 0 && size.y > 0) {
			this.camera.aspect = size.x / size.y
			this.camera.updateProjectionMatrix()
		}
	}
	getCamera(): THREE.PerspectiveCamera {
		return this.camera
	}
	getContext(): EngineContext {
		if (!this.renderer) throw new Error('[World] Not attached to renderer')
		return {
			scene: this.scene,
			camera: this.camera,
			renderer: this.renderer,
			canvas: this.renderer.domElement,
			world: this,
			...(this.networkManager ? { networkManager: this.networkManager } : {}),
			...(this.eventHandler ? { eventHandler: this.eventHandler } : {}),
			...(this.keymap ? { keymap: this.keymap } : {}),
			...(this.logger ? { logger: this.logger } : {}),
		}
	}
	addModule(module: Module): void {
		this.modules.set(module.type, module)
	}
	getModule<T extends Module>(type: string): T | undefined {
		return this.modules.get(type) as T | undefined
	}
	removeModule(type: string): void {
		const module = this.modules.get(type)
		module?.dispose()
		this.modules.delete(type)
	}
	applyEnvironment(env: Environment): void {
		this._appliedEnvironments.push(env.constructor.name)
		for (const module of env.getModules()) this.addModule(module)
		for (const ext of env.getExtensions()) this.addExtension(ext)
	}
	addExtension(extension: Extension): void {
		this.extensions.set(extension.type, extension)
	}
	getExtension<T extends Extension>(type: string): T | undefined {
		return this.extensions.get(type) as T | undefined
	}
	removeExtension(type: string): void {
		const ext = this.extensions.get(type)
		ext?.dispose()
		this.extensions.delete(type)
	}
	async init(): Promise<void> {
		const context = this.getContext()
		const log = this.logger?.for('World')
		const worldPhase = this.logger?.pushPhase(`World [${this.config.id}] init`) ?? null
		for (const envName of this._appliedEnvironments) {
			log?.info(`Environment: ${envName}`, {
				modules: [...this.modules.keys()].join(', '),
				extensions: [...this.extensions.keys()].join(', ') || 'none',
			})
		}
		for (const module of this.modules.values()) {
			const phase = this.logger?.pushPhase(`Module [${module.type}] init`) ?? null
			try {
				await module.init(context)
			} catch (e) {
				log?.error(`Module [${module.type}] init failed`, { error: String(e) })
				throw e
			} finally {
				phase?.close()
			}
		}
		for (const ext of this.extensions.values()) {
			const phase = this.logger?.pushPhase(`Extension [${ext.type}] init`) ?? null
			try {
				await ext.init(context)
			} catch (e) {
				log?.error(`Extension [${ext.type}] init failed`, { error: String(e) })
				throw e
			} finally {
				phase?.close()
			}
		}
		if (this.config.gameConfigId && this.eventHandler) {
			const phase = this.logger?.pushPhase('GameConfig load') ?? null
			await this.gameConfig.load(this.config.gameConfigId, this.eventHandler)
			phase?.close()
		}
		const onLoadPhase = this.logger?.pushPhase('onLoad') ?? null
		await this.onLoad()
		onLoadPhase?.close()
		worldPhase?.close()
	}
	start(initialState?: unknown): void {
		if (this._started) return
		this._started = true
		const startPhase = this.logger?.pushPhase(`World [${this.config.id}] start`) ?? null
		const onStartPhase = this.logger?.pushPhase('onStart') ?? null
		this.onStart(initialState)
		onStartPhase?.close()
		startPhase?.close()
	}
	update(delta: number): void {
		for (const module of this.modules.values()) {
			module.update?.(delta)
		}
		for (const ext of this.extensions.values()) {
			ext.update?.(delta)
		}
	}
	dispose(): void {
		const disposePhase = this.logger?.pushPhase(`World [${this.config.id}] dispose`) ?? null
		for (const ext of this.extensions.values()) ext.dispose()
		this.extensions.clear()
		for (const module of this.modules.values()) module.dispose()
		this.modules.clear()
		this.gltf.dispose()
		this.objects.dispose()
		this.scene.clear()
		this._started = false
		this.onDispose()
		disposePhase?.close()
	}
	protected async onLoad(): Promise<void> { }
	protected onStart(_initialState?: unknown): void { }
	protected onDispose(): void { }
}

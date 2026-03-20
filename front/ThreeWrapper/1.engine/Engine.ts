'use client'
import * as THREE from 'three'
import type { EngineConfig, KeyBinding } from '@/shared/types'
import type { World } from '@/ThreeWrapper/2.world/WorldClass'
import { EventHandler } from './EventHandler'
import { KeymapHandler } from './KeymapHandler'
import { Logger } from './Logger'
import { NetworkManager } from './network/NetworkManager'
import { OnlineModeHandler } from './ServerMessageHandler'
export class Engine {
  readonly mode: 'standalone' | 'online'
  readonly renderer: THREE.WebGLRenderer
  readonly eventHandler: EventHandler
  readonly keymap: KeymapHandler
  readonly logger: Logger
  readonly networkManager: NetworkManager | null = null
  private clock = new THREE.Clock()
  private animationId: number | null = null
  private active: World | null = null
  constructor(config: EngineConfig, defaultKeymap: KeyBinding[] = []) {
    this.mode = config.mode
    this.logger = Logger.getInstance()
    if (config.debug !== undefined) {
      Logger.setDebugConfig(config.debug)
    }
    this.eventHandler = new EventHandler()
    this.keymap = new KeymapHandler(defaultKeymap)
    const canvas = config.canvas ?? this.createCanvas()
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    if (config.mode === 'online' && config.serverUrl) {
      this.networkManager = new NetworkManager(this, config.serverUrl)
      new OnlineModeHandler(
        this.networkManager,
        this.load.bind(this),
        this.startActive.bind(this),
      )
    }
  }
  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    return canvas
  }
  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement
  }
async load(world: World): Promise<void> {
    this.active?.dispose()
    this.active = world
    world.networkManager = this.networkManager
    world.eventHandler = this.eventHandler
    world.keymap = this.keymap
    world.logger = this.logger
    world.attachRenderer(this.renderer)
    await world.init()
  }
  startActive(initialState?: unknown): void {
    this.active?.start(initialState)
  }
  async loadAndStart(world: World): Promise<void> {
    await this.load(world)
    this.startActive()
  }
  connect(): void {
    if (!this.networkManager) throw new Error('[Engine] Not in online mode')
    this.networkManager.connect()
  }
  start(): void {
    if (this.animationId !== null) return
    this.clock.start()
    const tickRate = this.logger.getDebugConfig().gameTickRate
    const loop = () => {
      if (tickRate) {
        setTimeout(() => { this.animationId = requestAnimationFrame(loop) }, tickRate)
      } else {
        this.animationId = requestAnimationFrame(loop)
      }
      Logger.incrementFrameCounter()
      const delta = this.clock.getDelta()
      if (this.active) {
        this.active.update(delta)
        this.renderer.render(this.active.scene, this.active.getCamera())
      }
    }
    loop()
  }
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.clock.stop()
  }
  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false)
    if (this.active) {
      const camera = this.active.getCamera()
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
  }
  dispose(): void {
    this.stop()
    this.active?.dispose()
    this.networkManager?.disconnect()
    this.eventHandler.dispose()
    this.renderer.dispose()
  }
}

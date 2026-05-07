import * as THREE from "three"
import { createElement } from "react"
import type { Module, WorldContext } from "@/ThreeWrapper/4.module"
import { ModuleKey } from "@/ThreeWrapper/4.module"
import { EditorTestEnvironment } from "@/ThreeWrapper/3.environment/envs/EditorTestEnvironment"
import type { EditorPlacementModule } from "./EditorPlacementModule"
import type { EditorOrbitCameraModule } from "./EditorOrbitCameraModule"
import type { EditorHotbarModule } from "./EditorHotbarModule"
import { OBJECT_TYPE, ComponentLoader } from "@/ThreeWrapper/2.world/tools"
import type { UIModule } from "@/ThreeWrapper/4.module/modules/ui/UIModule"
const TEST_PLAYER_ID = "test_mode_player"
export class EditorTestModeModule implements Module {
  readonly type = ModuleKey.editorTestMode
  readonly requires = [ModuleKey.editorOrbitCamera, ModuleKey.editorPlacement, ModuleKey.editorHotbar, ModuleKey.ui] as const
  private ctx: WorldContext | null = null
  private isTesting = false
  private testModules: Module[] = []
  private spawnDispose: (() => void) | null = null
  private savedYaml = ""
  private savedHistory: any = null
  private savedHistoryIndex = 0
  private savedCamPos = new THREE.Vector3()
  private savedCamTarget = new THREE.Vector3()
  private _onKeyDown: ((e: KeyboardEvent) => void) | null = null
  get active(): boolean { return this.isTesting }
  onTestModeChange: ((active: boolean) => void) | null = null
  async init(ctx: WorldContext): Promise<void> {
    this.ctx = ctx
  }
  async enterTestMode(): Promise<void> {
    if (!this.ctx || this.isTesting) return
    const placement = this.ctx.getModule<EditorPlacementModule>(ModuleKey.editorPlacement)
    const orbitCam = this.ctx.getModule<EditorOrbitCameraModule>(ModuleKey.editorOrbitCamera)
    const hotbar = this.ctx.getModule<EditorHotbarModule>(ModuleKey.editorHotbar)
    if (!placement || !orbitCam || !hotbar) return
    const mapDef = placement.buildMapDef()
    this.savedYaml = placement.exportYaml()
    this.savedHistory = placement.historyCopy
    this.savedHistoryIndex = placement.historyIndexValue
    this.savedCamPos.copy(this.ctx.camera.position)
    const controls = orbitCam.getControls()
    if (controls) this.savedCamTarget.copy(controls.target)
    hotbar.dispose()
    placement.dispose()
    orbitCam.dispose()
    this.ctx.selfWorldPlayer = null
    const objects = this.ctx.objects
    for (const id of placement.placedCopy.map(p => p.id)) {
      if (objects.getById(id)) objects.remove(id)
    }
    const scene = this.ctx.scene as any as THREE.Scene
    scene.background = new THREE.Color(0x87ceeb)
    scene.fog = null
    const bgGrid = scene.getObjectByName('__editor_bg_grid__')
    if (bgGrid) bgGrid.visible = false
    objects.add({
      id: TEST_PLAYER_ID,
      type: OBJECT_TYPE.PLAYER,
      name: "Test Player",
    })
    const player = objects.getById(TEST_PLAYER_ID, OBJECT_TYPE.PLAYER) as any
    if (player) (this.ctx as any).selfWorldPlayer = player
    const components = new ComponentLoader()
    const disposeFn = await this.ctx.map.spawn(mapDef, components, this.ctx.gltf, this.ctx.objects)
    this.spawnDispose = disposeFn
    const testEnv = new EditorTestEnvironment()
    const testModules = testEnv.getModules()
    this.testModules = testModules
    for (const m of testModules) {
      this.ctx.addModule?.(m)
      await m.init(this.ctx)
    }
    const spawnInst = mapDef.objects.find(o => o.id.includes('spawn') || o.component.includes('spawn'))
    if (spawnInst) {
      this.ctx.objects.setPosition(TEST_PLAYER_ID, {
        x: spawnInst.position.x,
        y: spawnInst.position.y + 1,
        z: spawnInst.position.z,
      })
    }
    this._onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        this.exitTestMode()
      }
    }
    window.addEventListener('keydown', this._onKeyDown)
    const ui = this.ctx.getModule<UIModule>(ModuleKey.ui)
    if (ui) {
      ui.show("test-mode-overlay",
        createElement('div', {
          style: {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'monospace',
            fontSize: '13px',
            background: 'rgba(0,0,0,0.4)',
            padding: '6px 16px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 10000,
          }
        }, 'Test Mode — Press ESC to exit')
      )
    }
    if (spawnInst) {
      this.ctx.camera.position.set(spawnInst.position.x, spawnInst.position.y + 3, spawnInst.position.z + 8)
      this.ctx.camera.lookAt(spawnInst.position.x, spawnInst.position.y + 1, spawnInst.position.z)
    } else {
      this.ctx.camera.position.set(0, 3, 10)
      this.ctx.camera.lookAt(0, 0, 0)
    }
    this.isTesting = true
    this.onTestModeChange?.(true)
  }
  async exitTestMode(): Promise<void> {
    if (!this.ctx || !this.isTesting) return
    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown)
      this._onKeyDown = null
    }
    const ui = this.ctx.getModule<UIModule>(ModuleKey.ui)
    ui?.hide("test-mode-overlay")
    for (const m of [...this.testModules].reverse()) {
      this.ctx.removeModule?.(m.type)
    }
    this.testModules = []
    this.spawnDispose?.()
    this.spawnDispose = null
    const player = this.ctx.objects.getById(TEST_PLAYER_ID, OBJECT_TYPE.PLAYER)
    if (player) this.ctx.objects.remove(TEST_PLAYER_ID)
    this.ctx.selfWorldPlayer = null
    const scene = this.ctx.scene as any as THREE.Scene
    const bgGrid = scene.getObjectByName('__editor_bg_grid__')
    if (bgGrid) bgGrid.visible = true
    const placement = this.ctx.getModule<EditorPlacementModule>(ModuleKey.editorPlacement)
    if (placement) {
      await placement.init(this.ctx)
      await placement.loadMap(this.savedYaml)
      placement.setHistoryState(this.savedHistory, this.savedHistoryIndex)
    }
    this.savedCamPos.y = Math.max(1, this.savedCamPos.y)
    const orbitCam = this.ctx.getModule<EditorOrbitCameraModule>(ModuleKey.editorOrbitCamera)
    if (orbitCam) {
      await orbitCam.init(this.ctx)
      this.ctx.camera.position.copy(this.savedCamPos)
      const ctrl = orbitCam.getControls()
      if (ctrl) ctrl.target.copy(this.savedCamTarget)
      ctrl?.update()
    }
    const hotbar = this.ctx.getModule<EditorHotbarModule>(ModuleKey.editorHotbar)
    if (hotbar) {
      await hotbar.init(this.ctx)
    }
    this.isTesting = false
    this.onTestModeChange?.(false)
  }
  update(delta: number): void {
    for (const m of this.testModules) {
      m.update?.(delta)
    }
  }
  dispose(): void {
    if (this.isTesting) {
      if (this._onKeyDown) {
        window.removeEventListener('keydown', this._onKeyDown)
        this._onKeyDown = null
      }
      const ui = this.ctx?.getModule<UIModule>(ModuleKey.ui)
      ui?.hide("test-mode-overlay")
      for (const m of [...this.testModules].reverse()) {
        this.ctx?.removeModule?.(m.type)
      }
      this.testModules = []
      this.spawnDispose?.()
      this.spawnDispose = null
    }
    this.ctx = null
    this.onTestModeChange = null
  }
}

import { createElement } from "react"
import type { Module, WorldContext } from "@/ThreeWrapper/4.module"
import { ModuleKey } from "@/ThreeWrapper/4.module"
import type { UIModule } from "@/ThreeWrapper/4.module/modules/ui/UIModule"
import type { CharacterCustomizerModule, AccessoryConfig } from "./CharacterCustomizerModule"
import type { CharacterOrbitCameraModule } from "./CharacterOrbitCameraModule"
import { CharacterCustomizerUI, type CharacterCustomizerApi } from "./components/CharacterCustomizerUI"
type PaintState = {
  active: boolean
  color: string
  brushSize: number
}
export class CharacterCustomizerUIModule implements Module {
  readonly type = ModuleKey.characterCustomizerUI
  readonly requires = [ModuleKey.ui, ModuleKey.characterCustomizerPreview, ModuleKey.characterOrbitCamera] as const
  private ctx: WorldContext | null = null
  private ui: UIModule | null = null
  private preview: CharacterCustomizerModule | null = null
  private orbit: CharacterOrbitCameraModule | null = null
  private api: CharacterCustomizerApi | null = null
  private paintState: PaintState = { active: false, color: "#3a7bd5", brushSize: 0.3 }
  private isPainting = false
  private _onMouseDown: ((e: MouseEvent) => void) | null = null
  private _onMouseMove: ((e: MouseEvent) => void) | null = null
  private _onMouseUp: (() => void) | null = null
  async init(ctx: WorldContext): Promise<void> {
    this.ctx = ctx
    this.ui = ctx.getModule<UIModule>(ModuleKey.ui) ?? null
    this.preview = ctx.getModule<CharacterCustomizerModule>(ModuleKey.characterCustomizerPreview) ?? null
    this.orbit = ctx.getModule<CharacterOrbitCameraModule>(ModuleKey.characterOrbitCamera) ?? null
    this.ui?.show(
      "character-customizer",
      createElement(CharacterCustomizerUI, {
        onMount: (api) => {
          this.api = api
          this._loadCharacter()
        },
        onPaintStateChange: (state) => {
          this.paintState = state
          this.orbit?.setEnabled(!state.active)
          if (ctx.canvas) ctx.canvas.style.cursor = state.active ? "crosshair" : "default"
        },
        onFillColor: (color) => this.preview?.fillColor(color),
        onClearPaint: () => this.preview?.clearPaint(),
        onAddAccessory: (config, gltfFile) => this._saveAccessory(config, gltfFile, false),
        onUpdateAccessory: (config, gltfFile) => this._saveAccessory(config, gltfFile, true),
        onRemoveAccessory: (id) => this.preview?.removeAccessory(id),
        onPlayAnimation: (name) => this.preview?.playAnimation(name),
        onStopAnimation: () => this.preview?.stopAnimation(),
        onExport: () => this._handleExport(),
        onDownloadTexture: () => this._handleDownloadTexture()
      })
    )
    this.ui?.enablePointer("character-customizer")
    this._onMouseDown = (e) => this._handlePaintEvent(e, true)
    this._onMouseMove = (e) => { if (this.isPainting) this._handlePaintEvent(e, false) }
    this._onMouseUp = () => { this.isPainting = false }
    ctx.canvas.addEventListener("mousedown", this._onMouseDown)
    ctx.canvas.addEventListener("mousemove", this._onMouseMove)
    ctx.canvas.addEventListener("mouseup", this._onMouseUp)
  }
  private async _saveAccessory(config: AccessoryConfig, gltfFile: File | undefined, isUpdate: boolean): Promise<void> {
    if (!this.preview) return
    if (config.meshKind === "gltf") {
      if (gltfFile) {
        const url = URL.createObjectURL(gltfFile)
        const configWithUrl = { ...config, gltfUrl: url }
        await this.preview.addGltfAccessory(configWithUrl)
      } else if (isUpdate) {
        this.preview.updateAccessory(config)
      }
    } else {
      if (isUpdate) {
        this.preview.updateAccessory(config)
      } else {
        this.preview.addAccessory(config)
      }
    }
  }
  private async _loadCharacter(): Promise<void> {
    if (!this.preview || !this.api) return
    const { bones, animations } = await this.preview.loadCharacter()
    this.api.setBones(bones)
    this.api.setAnimations(animations)
    this.api.setLoaded(true)
    this.preview.playAnimation("FG_Idle_A")
  }
  private _handlePaintEvent(e: MouseEvent, isDown: boolean): void {
    if (!this.paintState.active || !this.ctx || !this.preview) return
    if (isDown) this.isPainting = true
    if (!this.isPainting) return
    const rect = this.ctx.canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    const uv = this.preview.raycastUV({ x, y }, this.ctx.camera)
    if (uv) this.preview.paintAt(uv, this.paintState.color, this.paintState.brushSize)
  }
  private _handleExport(): void {
    if (!this.preview) return
    const config = this.preview.exportConfig()
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "character_config.json"
    a.click()
    URL.revokeObjectURL(url)
  }
  private _handleDownloadTexture(): void {
    if (!this.preview) return
    const dataUrl = this.preview.getPaintDataUrl()
    if (!dataUrl) return
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = "character_texture.png"
    a.click()
  }
  update(_delta: number): void {}
  dispose(): void {
    if (this.ctx) {
      if (this._onMouseDown) this.ctx.canvas.removeEventListener("mousedown", this._onMouseDown)
      if (this._onMouseMove) this.ctx.canvas.removeEventListener("mousemove", this._onMouseMove)
      if (this._onMouseUp) this.ctx.canvas.removeEventListener("mouseup", this._onMouseUp)
      this.ctx.canvas.style.cursor = "default"
    }
    this.ui?.hide("character-customizer")
    this.ui = null
    this.preview = null
    this.orbit = null
    this.ctx = null
  }
}

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
import { ModuleKey } from '@/ThreeWrapper/4.module'
export type AccessoryConfig = {
  id: string
  name: string
  boneName: string
  meshKind: 'box' | 'sphere' | 'cylinder' | 'gltf'
  size: { x: number; y: number; z: number }
  color: string
  gltfUrl?: string
  offset: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
}
type AccessoryEntry = {
  object3d: THREE.Object3D
  boneObject: THREE.Bone | null
  config: AccessoryConfig
}
const PAINT_TEX_SIZE = 1024
const _pos = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _offset = new THREE.Vector3()
const _localRot = new THREE.Euler()
const _localQuat = new THREE.Quaternion()
export class CharacterCustomizerModule implements Module {
  readonly type = ModuleKey.characterCustomizerPreview
  private ctx: WorldContext | null = null
  private characterScene: THREE.Group | null = null
  private mixer: THREE.AnimationMixer | null = null
  private clips: THREE.AnimationClip[] = []
  private activeAction: THREE.AnimationAction | null = null
  private skinnedMesh: THREE.SkinnedMesh | null = null
  private paintCanvas: HTMLCanvasElement | null = null
  private paintCtx2d: CanvasRenderingContext2D | null = null
  private paintTexture: THREE.CanvasTexture | null = null
  private accessories = new Map<string, AccessoryEntry>()
  private raycaster = new THREE.Raycaster()
  init(ctx: WorldContext): void {
    this.ctx = ctx
  }
  async loadCharacter(): Promise<{ bones: string[]; animations: string[] }> {
    if (!this.ctx) return { bones: [], animations: [] }
    this._clearCharacter()
    const loader = new GLTFLoader()
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load('/game/modeles/charactere/scene.gltf', resolve, undefined, reject)
    })
    this.characterScene = gltf.scene as THREE.Group
    this.clips = gltf.animations as THREE.AnimationClip[]
    if (this.clips.length > 0) {
      this.mixer = new THREE.AnimationMixer(gltf.scene)
    }
    gltf.scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.SkinnedMesh && !this.skinnedMesh) {
        this.skinnedMesh = child
      }
    })
    this._setupPaintCanvas()
    this.ctx.objects.addRaw(gltf.scene)
    const boneSet = new Set<string>()
    gltf.scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Bone && child.name) boneSet.add(child.name)
    })
    return {
      bones: Array.from(boneSet),
      animations: this.clips.map((c) => c.name)
    }
  }
  private _setupPaintCanvas(): void {
    const canvas = document.createElement('canvas')
    canvas.width = PAINT_TEX_SIZE
    canvas.height = PAINT_TEX_SIZE
    this.paintCanvas = canvas
    const ctx2d = canvas.getContext('2d')!
    this.paintCtx2d = ctx2d
    ctx2d.fillStyle = '#ffffff'
    ctx2d.fillRect(0, 0, PAINT_TEX_SIZE, PAINT_TEX_SIZE)
    const texture = new THREE.CanvasTexture(canvas)
    this.paintTexture = texture
    if (this.skinnedMesh) {
      const original = this.skinnedMesh.material as THREE.MeshStandardMaterial
      this.skinnedMesh.material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: original.roughness ?? 0.9,
        metalness: original.metalness ?? 0,
        side: THREE.DoubleSide
      })
    }
  }
  paintAt(uv: THREE.Vector2, color: string, brushSize: number): void {
    if (!this.paintCtx2d || !this.paintTexture) return
    const x = uv.x * PAINT_TEX_SIZE
    const y = (1 - uv.y) * PAINT_TEX_SIZE
    const radius = Math.max(2, brushSize * PAINT_TEX_SIZE * 0.06)
    this.paintCtx2d.beginPath()
    this.paintCtx2d.arc(x, y, radius, 0, Math.PI * 2)
    this.paintCtx2d.fillStyle = color
    this.paintCtx2d.fill()
    this.paintTexture.needsUpdate = true
  }
  fillColor(color: string): void {
    if (!this.paintCtx2d || !this.paintTexture) return
    this.paintCtx2d.fillStyle = color
    this.paintCtx2d.fillRect(0, 0, PAINT_TEX_SIZE, PAINT_TEX_SIZE)
    this.paintTexture.needsUpdate = true
  }
  clearPaint(): void {
    this.fillColor('#ffffff')
  }
  raycastUV(mouseNdc: { x: number; y: number }, camera: THREE.Camera): THREE.Vector2 | null {
    if (!this.skinnedMesh) return null
    this.raycaster.setFromCamera(new THREE.Vector2(mouseNdc.x, mouseNdc.y), camera)
    const hits = this.raycaster.intersectObject(this.skinnedMesh, false)
    if (hits.length > 0 && hits[0].uv) return hits[0].uv.clone()
    return null
  }
  getPaintDataUrl(): string | null {
    return this.paintCanvas?.toDataURL('image/png') ?? null
  }
  addAccessory(config: AccessoryConfig): void {
    if (!this.ctx || !this.characterScene) return
    this.removeAccessory(config.id)
    const mesh = this._buildPrimitiveMesh(config)
    if (!mesh) return
    const bone = this._findBone(config.boneName)
    if (!bone) {
      this._applyStaticTransform(mesh, config)
    }
    this.ctx.objects.addRaw(mesh)
    this.accessories.set(config.id, { object3d: mesh, boneObject: bone, config })
  }
  async addGltfAccessory(config: AccessoryConfig & { gltfUrl: string }): Promise<void> {
    if (!this.ctx || !this.characterScene) return
    this.removeAccessory(config.id)
    const loader = new GLTFLoader()
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(config.gltfUrl, resolve, undefined, reject)
    })
    const mesh = gltf.scene as THREE.Group
    const bone = this._findBone(config.boneName)
    if (!bone) this._applyStaticTransform(mesh, config)
    this.ctx.objects.addRaw(mesh)
    this.accessories.set(config.id, { object3d: mesh, boneObject: bone, config: { ...config } })
  }
  updateAccessory(config: AccessoryConfig): void {
    const entry = this.accessories.get(config.id)
    if (!entry || !this.ctx) return
    const prev = entry.config
    if (
      config.meshKind !== 'gltf' &&
      (config.meshKind !== prev.meshKind ||
        config.size.x !== prev.size.x ||
        config.size.y !== prev.size.y ||
        config.size.z !== prev.size.z)
    ) {
      this.ctx.objects.removeRaw(entry.object3d)
      this._disposeObject3d(entry.object3d)
      const newMesh = this._buildPrimitiveMesh(config)
      if (!newMesh) return
      this.ctx.objects.addRaw(newMesh)
      entry.object3d = newMesh
    } else if (config.meshKind !== 'gltf') {
      const colorHex = parseInt(config.color.replace('#', ''), 16)
      entry.object3d.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          ;(c.material as THREE.MeshStandardMaterial).color.setHex(colorHex)
        }
      })
    }
    entry.boneObject = this._findBone(config.boneName)
    if (!entry.boneObject) this._applyStaticTransform(entry.object3d, config)
    entry.config = { ...config }
  }
  removeAccessory(id: string): void {
    const entry = this.accessories.get(id)
    if (!entry || !this.ctx) return
    this.ctx.objects.removeRaw(entry.object3d)
    this._disposeObject3d(entry.object3d)
    this.accessories.delete(id)
  }
  getAccessories(): AccessoryConfig[] {
    return Array.from(this.accessories.values()).map((e) => e.config)
  }
  playAnimation(clipName: string, loop = true): void {
    if (!this.mixer) return
    this.activeAction?.fadeOut(0.2)
    const clip = this.clips.find((c) => c.name === clipName)
    if (!clip) return
    this.activeAction = this.mixer.clipAction(clip)
    this.activeAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
    this.activeAction.reset().fadeIn(0.2).play()
  }
  stopAnimation(): void {
    this.activeAction?.fadeOut(0.2)
    this.activeAction = null
  }
  exportConfig(): { bodyTexture: string | null; accessories: AccessoryConfig[] } {
    return { bodyTexture: this.getPaintDataUrl(), accessories: this.getAccessories() }
  }
  update(delta: number): void {
    this.mixer?.update(delta)
    this._followBones()
  }
  dispose(): void {
    this._clearCharacter()
    this.ctx = null
  }
  private _followBones(): void {
    for (const entry of this.accessories.values()) {
      if (!entry.boneObject) continue
      entry.boneObject.updateWorldMatrix(true, false)
      entry.boneObject.matrixWorld.decompose(_pos, _quat, _scale)
      _offset.set(entry.config.offset.x, entry.config.offset.y, entry.config.offset.z)
      _offset.applyQuaternion(_quat)
      entry.object3d.position.copy(_pos).add(_offset)
      _localRot.set(
        THREE.MathUtils.degToRad(entry.config.rotation.x),
        THREE.MathUtils.degToRad(entry.config.rotation.y),
        THREE.MathUtils.degToRad(entry.config.rotation.z)
      )
      _localQuat.setFromEuler(_localRot)
      entry.object3d.quaternion.copy(_quat).multiply(_localQuat)
      entry.object3d.scale.set(entry.config.scale.x, entry.config.scale.y, entry.config.scale.z)
    }
  }
  private _applyStaticTransform(obj: THREE.Object3D, config: AccessoryConfig): void {
    obj.position.set(config.offset.x, config.offset.y, config.offset.z)
    obj.rotation.set(
      THREE.MathUtils.degToRad(config.rotation.x),
      THREE.MathUtils.degToRad(config.rotation.y),
      THREE.MathUtils.degToRad(config.rotation.z)
    )
    obj.scale.set(config.scale.x, config.scale.y, config.scale.z)
  }
  private _buildPrimitiveMesh(config: AccessoryConfig): THREE.Object3D | null {
    const colorHex = parseInt(config.color.replace('#', ''), 16)
    const mat = new THREE.MeshStandardMaterial({ color: colorHex })
    if (config.meshKind === 'box') {
      return new THREE.Mesh(new THREE.BoxGeometry(config.size.x, config.size.y, config.size.z), mat)
    }
    if (config.meshKind === 'sphere') {
      return new THREE.Mesh(new THREE.SphereGeometry(config.size.x / 2, 16, 8), mat)
    }
    if (config.meshKind === 'cylinder') {
      return new THREE.Mesh(
        new THREE.CylinderGeometry(config.size.x / 2, config.size.x / 2, config.size.y, 16),
        mat
      )
    }
    return null 
  }
  private _findBone(name: string): THREE.Bone | null {
    if (!this.characterScene || !name) return null
    let found: THREE.Bone | null = null
    this.characterScene.traverse((c) => {
      if (c instanceof THREE.Bone && c.name === name) found = c
    })
    return found
  }
  private _disposeObject3d(obj: THREE.Object3D): void {
    obj.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose()
        const mats = Array.isArray(c.material) ? c.material : [c.material]
        mats.forEach((m) => m.dispose())
      }
    })
  }
  private _clearCharacter(): void {
    if (!this.ctx) return
    for (const id of [...this.accessories.keys()]) this.removeAccessory(id)
    if (this.characterScene) {
      this.ctx.objects.removeRaw(this.characterScene)
      this._disposeObject3d(this.characterScene)
      this.characterScene = null
    }
    this.paintTexture?.dispose()
    this.paintTexture = null
    this.paintCanvas = null
    this.paintCtx2d = null
    this.skinnedMesh = null
    this.activeAction?.stop()
    this.activeAction = null
    this.mixer?.stopAllAction()
    this.mixer = null
    this.clips = []
  }
}

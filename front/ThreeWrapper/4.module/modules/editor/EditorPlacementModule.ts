import * as THREE from 'three'
import { dump as yamlDump, load as yamlLoad } from 'js-yaml'
import type { Module, WorldContext } from '@/ThreeWrapper/4.module'
import { ModuleKey } from '@/ThreeWrapper/4.module'
import { ComponentLoader, OBJECT_TYPE } from '@/ThreeWrapper/2.world/tools'
import type { ComponentDef, MapObjectInstance } from '@/ThreeWrapper/2.world/tools'
type PlacedObject = {
  id: string
  component: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
}
type HistoryEntry =
  | { type: 'place';  id: string; placed: PlacedObject }
  | { type: 'delete'; id: string; placed: PlacedObject }
function buildGhostGeometry(def: ComponentDef): THREE.BufferGeometry {
  const mesh = def.meshes?.[0] ?? def.mesh
  if (mesh && 'primitive' in mesh) {
    const s = mesh.size ?? { x: 1, y: 1, z: 1 }
    switch (mesh.primitive) {
      case 'box':      return new THREE.BoxGeometry(s.x, s.y, s.z)
      case 'sphere':   return new THREE.SphereGeometry(s.x / 2, 16, 8)
      case 'cylinder': return new THREE.CylinderGeometry(s.x / 2, s.x / 2, s.y, 16)
      case 'plane':    return new THREE.PlaneGeometry(s.x, s.z ?? s.x)
    }
  }
  return new THREE.BoxGeometry(1, 1, 1)
}
export class EditorPlacementModule implements Module {
  readonly type = ModuleKey.editorPlacement
  private ctx: WorldContext | null = null
  private loader = new ComponentLoader()
  private placementPlane: THREE.Mesh | null = null
  private ghostGroup: THREE.Group | null = null
  private raycaster = new THREE.Raycaster()
  private mouseNdc = new THREE.Vector2()
  private placed: PlacedObject[] = []
  private placementCounter = new Map<string, number>()
  private meshRegistry = new Map<string, THREE.Group>()
  private selectedObjectId: string | null = null
  private history: HistoryEntry[] = []
  private historyIndex = -1
  private selectedComponent: string | null = null
  private mouseDownPos: { x: number; y: number } | null = null
  private readonly dragThreshold = 5
  readonly gridSize = 1
  private placementY = 0
  private _waypointAnim: { waypoints: THREE.Vector3[]; rotations: THREE.Euler[]; speed: number; loop: boolean; targetIdx: number; direction: number; progress: number } | null = null
  private _waypointOrigPos: THREE.Vector3 | null = null
  private _waypointOrigRot: THREE.Euler | null = null
  private _playingAnimationName: string | null = null
  private _allAnimTrackers = new Map<string, { tracker: { waypoints: THREE.Vector3[]; rotations: THREE.Euler[]; speed: number; loop: boolean; targetIdx: number; direction: number; progress: number }; origPos: THREE.Vector3; origRot: THREE.Euler }>()
  private _isPlayingAll = false
  private _env: { sky: any; fog: any; lights: any[]; clouds: boolean } = { sky: null, fog: null, lights: [], clouds: false }
  private _skyDispose: (() => void) | null = null
  private _envLights: THREE.Light[] = []
  private _dragMode: 'move' | 'rotate-y' | null = null
  private _dragStartClient = { x: 0, y: 0 }
  private _dragBeforePos: { x: number; y: number; z: number } | null = null
  private _dragBeforeRot: { x: number; y: number; z: number } | null = null
  onStateChange: (() => void) | null = null
  get canUndo(): boolean { return this.historyIndex >= 0 }
  get canRedo(): boolean { return this.historyIndex < this.history.length - 1 }
  get currentY(): number { return this.placementY }
  get placedCount(): number { return this.placed.length }
  get selectedRotationDeg(): { x: number; y: number; z: number } | null {
    if (!this.selectedObjectId) return null
    const obj = this.placed.find(p => p.id === this.selectedObjectId)
    if (!obj) return null
    const r = obj.rotation
    const toDeg = (rad: number) => rad * (180 / Math.PI)
    return { x: toDeg(r.x), y: toDeg(r.y), z: toDeg(r.z) }
  }
  get selectedAnimationNames(): string[] {
    if (!this.selectedObjectId) return []
    const obj = this.placed.find(p => p.id === this.selectedObjectId)
    if (!obj) return []
    const def = this.loader.get(obj.component)
    if (!def?.animations) return []
    return Object.entries(def.animations)
      .filter(([, anim]) => anim.kind === 'waypoints')
      .map(([name]) => name)
  }
  get playingAnimationName(): string | null { return this._playingAnimationName }
  get isPlayingAll(): boolean { return this._isPlayingAll }
  get hasAnyAnimations(): boolean {
    return this.placed.some(p => {
      const def = this.loader.get(p.component)
      return Object.values(def?.animations ?? {}).some((a: any) => a.kind === 'waypoints')
    })
  }
  get env(): { sky: any; fog: any; lights: any[]; clouds: boolean } { return this._env }
  init(ctx: WorldContext): void {
    this.ctx = ctx
    const geo = new THREE.PlaneGeometry(2000, 2000)
    const mat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    this.placementPlane = new THREE.Mesh(geo, mat)
    this.placementPlane.rotation.x = -Math.PI / 2
    this.placementPlane.name = '__editor_placement_plane__'
    ctx.objects.addRaw(this.placementPlane)
    ctx.canvas.addEventListener('pointermove', this._onPointerMove)
    ctx.canvas.addEventListener('pointerdown', this._onPointerDown)
    ctx.canvas.addEventListener('pointerup', this._onPointerUp)
    window.addEventListener('keydown', this._onKeyDown)
  }
  dispose(): void {
    this.stopAnimation()
    this.stopAllAnimations()
    this._skyDispose?.()
    this._skyDispose = null
    if (this.ctx) {
      this.ctx.canvas.removeEventListener('pointermove', this._onPointerMove)
      this.ctx.canvas.removeEventListener('pointerdown', this._onPointerDown)
      this.ctx.canvas.removeEventListener('pointerup', this._onPointerUp)
      const scene = this.ctx.scene as any as THREE.Scene
      for (const l of this._envLights) scene.remove(l)
      if (this.placementPlane) this.ctx.objects.removeRaw(this.placementPlane)
      for (const id of this.meshRegistry.keys()) {
        if (this.ctx.objects.getById(id)) this.ctx.objects.remove(id)
      }
    }
    window.removeEventListener('keydown', this._onKeyDown)
    this._removeGhost()
    this.meshRegistry.clear()
    this._envLights = []
    this.ctx = null
  }
  selectComponent(path: string | null): void {
    this._removeGhost()
    this.selectedComponent = path
    if (!path) return
    this.loader.load(path).then(def => {
      if (!this.ctx || this.selectedComponent !== path) return
      const meshDef = def.meshes?.[0] ?? def.mesh
      if (meshDef && 'gltf' in meshDef) {
        this.ctx.gltf.load(meshDef.gltf, meshDef.gltf).then(model => {
          if (!this.ctx || this.selectedComponent !== path) return
          const group = model.scene.clone()
          if (meshDef.scale) group.scale.set(meshDef.scale.x, meshDef.scale.y, meshDef.scale.z)
          group.traverse(c => {
            if (c instanceof THREE.Mesh) {
              c.material = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.3, depthWrite: false })
            }
          })
          const wireMat = new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.8, wireframe: true })
          const wireGroup = group.clone()
          wireGroup.traverse(c => {
            if (c instanceof THREE.Mesh) c.material = wireMat
          })
          const combined = new THREE.Group()
          combined.add(group)
          combined.add(wireGroup)
          combined.visible = false
          this.ghostGroup = combined
          this.ctx.objects.addRaw(combined)
        })
      } else {
        const geo = buildGhostGeometry(def)
        const fillMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.3, depthWrite: false })
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.8, wireframe: true })
        const group = new THREE.Group()
        group.add(new THREE.Mesh(geo, fillMat))
        group.add(new THREE.Mesh(geo, wireMat))
        group.visible = false
        this.ghostGroup = group
        this.ctx.objects.addRaw(group)
      }
    })
  }
  setPlacementY(y: number): void {
    this.placementY = y
    if (this.placementPlane) this.placementPlane.position.y = y
    this.onStateChange?.()
  }
  update(delta: number): void {
    if (this._waypointAnim && this.selectedObjectId) {
      const mesh = this.meshRegistry.get(this.selectedObjectId)
      if (mesh) {
        const anim = this._waypointAnim
        if (anim.waypoints.length >= 2) {
          const srcIdx = Math.max(0, Math.min(anim.targetIdx - anim.direction, anim.waypoints.length - 1))
          const from = anim.waypoints[srcIdx]
          const to = anim.waypoints[anim.targetIdx]
          if (from && to) {
            const dist = from.distanceTo(to)
            anim.progress += (anim.speed * delta) / Math.max(dist, 0.001)
            while (anim.progress >= 1) {
              anim.progress -= 1
              const next = anim.targetIdx + anim.direction
              if (next >= anim.waypoints.length) {
                if (anim.loop) { anim.direction = -1; anim.targetIdx = anim.waypoints.length - 2 }
                else { anim.progress = 1; break }
              } else if (next < 0) {
                if (anim.loop) { anim.direction = 1; anim.targetIdx = 1 }
                else { anim.progress = 1; break }
              } else { anim.targetIdx = next }
            }
            const newFrom = anim.waypoints[Math.max(0, Math.min(anim.waypoints.length - 1, anim.targetIdx - anim.direction))]
            const newTo = anim.waypoints[anim.targetIdx]
            if (newTo) mesh.position.lerpVectors(newFrom, newTo, Math.min(anim.progress, 1))
            if (anim.rotations && anim.rotations.length >= 2) {
              const rotFrom = anim.rotations[srcIdx]
              const rotTo = anim.rotations[anim.targetIdx]
              if (rotFrom && rotTo) {
                mesh.rotation.x = rotFrom.x + (rotTo.x - rotFrom.x) * Math.min(anim.progress, 1)
                mesh.rotation.y = rotFrom.y + (rotTo.y - rotFrom.y) * Math.min(anim.progress, 1)
                mesh.rotation.z = rotFrom.z + (rotTo.z - rotFrom.z) * Math.min(anim.progress, 1)
              }
            }
          }
        }
      }
    }
    for (const [id, animData] of this._allAnimTrackers) {
      const mesh = this.meshRegistry.get(id)
      if (!mesh) continue
      const anim = animData.tracker
      if (anim.waypoints.length < 2) continue
      const srcIdx = Math.max(0, Math.min(anim.targetIdx - anim.direction, anim.waypoints.length - 1))
      const from = anim.waypoints[srcIdx]
      const to = anim.waypoints[anim.targetIdx]
      if (!from || !to) continue
      const dist = from.distanceTo(to)
      anim.progress += (anim.speed * delta) / Math.max(dist, 0.001)
      while (anim.progress >= 1) {
        anim.progress -= 1
        const next = anim.targetIdx + anim.direction
        if (next >= anim.waypoints.length) {
          if (anim.loop) { anim.direction = -1; anim.targetIdx = anim.waypoints.length - 2 }
          else { anim.progress = 1; break }
        } else if (next < 0) {
          if (anim.loop) { anim.direction = 1; anim.targetIdx = 1 }
          else { anim.progress = 1; break }
        } else { anim.targetIdx = next }
      }
      const newFrom = anim.waypoints[Math.max(0, Math.min(anim.waypoints.length - 1, anim.targetIdx - anim.direction))]
      const newTo = anim.waypoints[anim.targetIdx]
      if (newTo) mesh.position.lerpVectors(newFrom, newTo, Math.min(anim.progress, 1))
      if (anim.rotations && anim.rotations.length >= 2) {
        const rotFrom = anim.rotations[srcIdx]
        const rotTo = anim.rotations[anim.targetIdx]
        if (rotFrom && rotTo) {
          mesh.rotation.x = rotFrom.x + (rotTo.x - rotFrom.x) * Math.min(anim.progress, 1)
          mesh.rotation.y = rotFrom.y + (rotTo.y - rotFrom.y) * Math.min(anim.progress, 1)
          mesh.rotation.z = rotFrom.z + (rotTo.z - rotFrom.z) * Math.min(anim.progress, 1)
        }
      }
    }
  }
  private _pushHistory(entry: HistoryEntry): void {
    this.history.splice(this.historyIndex + 1)
    this.history.push(entry)
    this.historyIndex = this.history.length - 1
  }
  undo(): void {
    if (this.historyIndex < 0) return
    const entry = this.history[this.historyIndex--]
    if (entry.type === 'place') {
      this._removeFromObjects(entry.id)
      this.placed = this.placed.filter(p => p.id !== entry.id)
    } else {
      this._addToObjects(entry.id)
      this.placed.push(entry.placed)
    }
    this.onStateChange?.()
  }
  redo(): void {
    if (this.historyIndex >= this.history.length - 1) return
    const entry = this.history[++this.historyIndex]
    if (entry.type === 'place') {
      this._addToObjects(entry.id)
      this.placed.push(entry.placed)
    } else {
      this._removeFromObjects(entry.id)
      this.placed = this.placed.filter(p => p.id !== entry.id)
    }
    this.onStateChange?.()
  }
  deleteSelected(): void {
    const id = this.selectedObjectId
    if (!id) return
    const placedObj = this.placed.find(p => p.id === id)
    if (!placedObj) return
    this.stopAnimation()
    this._removeFromObjects(id)
    this.placed = this.placed.filter(p => p.id !== id)
    this._pushHistory({ type: 'delete', id, placed: placedObj })
    this.selectedObjectId = null
    this.onStateChange?.()
  }
  setSelectedRotation(xDeg: number, yDeg: number, zDeg: number): void {
    const id = this.selectedObjectId
    if (!id) return
    const obj = this.placed.find(p => p.id === id)
    if (!obj) return
    const toRad = (deg: number) => deg * (Math.PI / 180)
    obj.rotation = { x: toRad(xDeg), y: toRad(yDeg), z: toRad(zDeg) }
    const mesh = this.meshRegistry.get(id)
    if (mesh) mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z)
    if (this.ctx) {
      const euler = new THREE.Euler(obj.rotation.x, obj.rotation.y, obj.rotation.z)
      const quat = new THREE.Quaternion().setFromEuler(euler)
      this.ctx.objects.setRotation(id, quat)
    }
    this.onStateChange?.()
  }
  playAnimation(name: string): void {
    const id = this.selectedObjectId
    if (!id) return
    const obj = this.placed.find(p => p.id === id)
    if (!obj) return
    const def = this.loader.get(obj.component)
    const animDef = def?.animations?.[name]
    if (!animDef || animDef.kind !== 'waypoints' || animDef.waypoints.length < 2) return
    const mesh = this.meshRegistry.get(id)
    if (!mesh) return
    this._waypointOrigPos = mesh.position.clone()
    this._waypointOrigRot = mesh.rotation.clone()
    const basePos = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z)
    this._waypointAnim = {
      waypoints: animDef.waypoints.map((w: any) => new THREE.Vector3(w.position.x + basePos.x, w.position.y + basePos.y, w.position.z + basePos.z)),
      rotations: animDef.waypoints.map((w: any) => new THREE.Euler(
        w.rotation?.x ?? 0,
        w.rotation?.y ?? 0,
        w.rotation?.z ?? 0
      )),
      speed: animDef.speed ?? 2,
      loop: animDef.loop ?? true,
      targetIdx: 1,
      direction: 1,
      progress: 0,
    }
    this._playingAnimationName = name
    this.onStateChange?.()
  }
  stopAnimation(): void {
    const id = this.selectedObjectId
    if (id && this._waypointOrigPos) {
      const mesh = this.meshRegistry.get(id)
      if (mesh) {
        mesh.position.copy(this._waypointOrigPos)
        if (this._waypointOrigRot) mesh.rotation.copy(this._waypointOrigRot)
      }
    }
    this._waypointAnim = null
    this._waypointOrigPos = null
    this._waypointOrigRot = null
    this._playingAnimationName = null
    this.onStateChange?.()
  }
  playAllAnimations(): void {
    if (!this.ctx) return
    this._allAnimTrackers.clear()
    for (const placed of this.placed) {
      const def = this.loader.get(placed.component)
      if (!def?.animations) continue
      const firstAnim = Object.entries(def.animations).find(([, a]: any) => a.kind === 'waypoints')
      if (!firstAnim) continue
      const [animName, animDef] = firstAnim as [string, any]
      if (!animDef.waypoints || animDef.waypoints.length < 2) continue
      const mesh = this.meshRegistry.get(placed.id)
      if (!mesh) continue
      const origPos = mesh.position.clone()
      const origRot = mesh.rotation.clone()
      const basePos = new THREE.Vector3(placed.position.x, placed.position.y, placed.position.z)
      const tracker = {
        waypoints: animDef.waypoints.map((w: any) => new THREE.Vector3(w.position.x + basePos.x, w.position.y + basePos.y, w.position.z + basePos.z)),
        rotations: animDef.waypoints.map((w: any) => new THREE.Euler(
          w.rotation?.x ?? 0,
          w.rotation?.y ?? 0,
          w.rotation?.z ?? 0
        )),
        speed: animDef.speed ?? 2,
        loop: animDef.loop ?? true,
        targetIdx: 1,
        direction: 1,
        progress: 0,
      }
      this._allAnimTrackers.set(placed.id, { tracker, origPos, origRot })
    }
    this._isPlayingAll = this._allAnimTrackers.size > 0
    this.onStateChange?.()
  }
  stopAllAnimations(): void {
    for (const [id, anim] of this._allAnimTrackers) {
      const mesh = this.meshRegistry.get(id)
      if (mesh) {
        mesh.position.copy(anim.origPos)
        mesh.rotation.copy(anim.origRot)
      }
    }
    this._allAnimTrackers.clear()
    this._isPlayingAll = false
    this.onStateChange?.()
  }
  setEnv(env: { sky: any; fog: any; lights: any[]; clouds: boolean }): void {
    this._env = env
    this._applyEnv()
    this.onStateChange?.()
  }
  private async _applyEnv(): Promise<void> {
    if (!this.ctx) return
    const scene = this.ctx.scene as any as THREE.Scene
    this._skyDispose?.()
    this._skyDispose = null
    if (this._env.sky) {
      try {
        this._skyDispose = await this._applySkyToScene(this._env.sky) ?? null
      } catch (e) {
        console.warn('[EditorPlacementModule] Failed to apply sky:', e)
      }
    }
    scene.fog = null
    if (this._env.fog) {
      if (this._env.fog.kind === 'exponential') {
        scene.fog = new THREE.FogExp2(this._env.fog.color, this._env.fog.density ?? 0.01)
      } else {
        scene.fog = new THREE.Fog(this._env.fog.color, this._env.fog.near ?? 10, this._env.fog.far ?? 200)
      }
    }
    for (const l of this._envLights) scene.remove(l)
    this._envLights = []
    for (const def of this._env.lights) {
      const light = this._buildLightFromDef(def)
      if (light) {
        scene.add(light)
        this._envLights.push(light)
        if (light instanceof THREE.DirectionalLight || light instanceof THREE.SpotLight) {
          scene.add(light.target)
        }
      }
    }
  }
  private async _applySkyToScene(sky: any): Promise<(() => void) | undefined> {
    const scene = this.ctx!.scene as any as THREE.Scene
    if ('equirect' in sky) {
      return new Promise((resolve) => {
        const onLoad = (tex: THREE.Texture) => {
          tex.mapping = THREE.EquirectangularReflectionMapping
          scene.background = tex
          resolve(() => {
            scene.background = null
            tex.dispose()
          })
        }
        if (sky.equirect.endsWith('.hdr')) {
          import('three/examples/jsm/loaders/RGBELoader.js').then(({ RGBELoader }) => {
            new RGBELoader().load(sky.equirect, onLoad)
          })
        } else {
          new THREE.TextureLoader().load(sky.equirect, onLoad)
        }
      })
    }
    const SKYBOX_PRESETS: Record<string, any> = {
      day: {
        px: '/game/skybox/sunset/right.png',
        nx: '/game/skybox/sunset/left.png',
        py: '/game/skybox/sunset/top.png',
        ny: '/game/skybox/sunset/bottom.png',
        pz: '/game/skybox/sunset/front.png',
        nz: '/game/skybox/sunset/back.png',
      },
    }
    const faces = 'preset' in sky ? SKYBOX_PRESETS[sky.preset] : sky.cubemap
    if (!faces) return undefined
    const texture = new THREE.CubeTextureLoader().load([faces.px, faces.nx, faces.py, faces.ny, faces.pz, faces.nz])
    scene.background = texture
    return () => {
      scene.background = null
      texture.dispose()
    }
  }
  private _buildLightFromDef(def: any): THREE.Light | null {
    switch (def.type) {
      case 'ambient':
        return new THREE.AmbientLight(def.color ?? 0xffffff, def.intensity ?? 1)
      case 'directional': {
        const light = new THREE.DirectionalLight(def.color ?? 0xffffff, def.intensity ?? 1)
        if (def.position) light.position.set(def.position.x, def.position.y, def.position.z)
        if (def.target) light.target.position.set(def.target.x, def.target.y, def.target.z)
        if (def.castShadow) light.castShadow = true
        return light
      }
      case 'point': {
        const light = new THREE.PointLight(def.color ?? 0xffffff, def.intensity ?? 1)
        if (def.position) light.position.set(def.position.x, def.position.y, def.position.z)
        if (def.distance) light.distance = def.distance
        if (def.decay) light.decay = def.decay
        return light
      }
      case 'hemisphere': {
        const light = new THREE.HemisphereLight(def.skyColor ?? 0xffffff, def.groundColor ?? 0xffffff, def.intensity ?? 1)
        return light
      }
      default:
        return null
    }
  }
  async loadMap(yamlText: string): Promise<void> {
    if (!this.ctx) return
    const parsed = yamlLoad(yamlText) as { objects?: MapObjectInstance[]; sky?: any; fog?: any; lights?: any[]; clouds?: boolean }
    const objects = parsed?.objects ?? []
    this._env = {
      sky: parsed.sky ?? null,
      fog: parsed.fog ?? null,
      lights: parsed.lights ?? [],
      clouds: parsed.clouds ?? false,
    }
    await this._applyEnv()
    for (const id of this.meshRegistry.keys()) {
      if (this.ctx.objects.getById(id)) this.ctx.objects.remove(id)
    }
    this.meshRegistry.clear()
    this.placed = []
    this.history = []
    this.historyIndex = -1
    this.selectedObjectId = null
    this.stopAllAnimations()
    await Promise.all(objects.map(async obj => {
      if (!this.ctx) return
      const def = await this.loader.load(obj.component)
      const meshDef = def?.meshes?.[0] ?? def?.mesh
      let loadedGroup: THREE.Group
      if (meshDef && 'gltf' in meshDef) {
        const model = await this.ctx.gltf.load(meshDef.gltf, meshDef.gltf)
        loadedGroup = model.scene.clone()
        if (meshDef.scale) loadedGroup.scale.set(meshDef.scale.x, meshDef.scale.y, meshDef.scale.z)
      } else {
        const geo = buildGhostGeometry(def)
        loadedGroup = this._makeSolidMesh(geo, obj.id)
      }
      loadedGroup.position.set(obj.position.x, obj.position.y, obj.position.z)
      if (obj.rotation) loadedGroup.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z)
      if (obj.scale) loadedGroup.scale.set(obj.scale.x, obj.scale.y, obj.scale.z)
      loadedGroup.name = obj.id
      this.meshRegistry.set(obj.id, loadedGroup)
      this.ctx.objects.add({ id: obj.id, type: OBJECT_TYPE.MAP, name: obj.id, position: obj.position, rotation: obj.rotation ?? { x: 0, y: 0, z: 0 }, pieces: [{ asset: loadedGroup, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }] })
      this.placed.push({
        id: obj.id,
        component: obj.component,
        position: obj.position,
        rotation: obj.rotation ?? { x: 0, y: 0, z: 0 },
        scale: obj.scale ?? { x: 1, y: 1, z: 1 },
      })
    }))
    this.onStateChange?.()
  }
  private _hitTestSelected(e: PointerEvent): boolean {
    if (!this.ctx || !this.selectedObjectId) return false
    const rect = this.ctx.canvas.getBoundingClientRect()
    this.mouseNdc.set(
      ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
    this.raycaster.setFromCamera(this.mouseNdc, this.ctx.camera)
    const mesh = this.meshRegistry.get(this.selectedObjectId)
    return mesh ? this.raycaster.intersectObject(mesh, true).length > 0 : false
  }
  private _handleDrag(e: PointerEvent): void {
    const id = this.selectedObjectId
    if (!id || !this.ctx) return
    const mesh = this.meshRegistry.get(id)
    const obj = this.placed.find(p => p.id === id)
    if (!mesh || !obj) return
    if (this._dragMode === 'move') {
      const hits = this.raycaster.intersectObject(this.placementPlane!)
      if (hits.length > 0) {
        const p = hits[0].point
        const sx = Math.round(p.x / this.gridSize) * this.gridSize
        const sz = Math.round(p.z / this.gridSize) * this.gridSize
        obj.position = { x: sx, y: this.placementY, z: sz }
        mesh.position.set(sx, this.placementY, sz)
      }
    } else if (this._dragMode === 'rotate-y') {
      const dx = e.clientX - this._dragStartClient.x
      let angle = (this._dragBeforeRot?.y ?? 0) + dx * 0.01  
      if (e.shiftKey) {
        angle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)  
      }
      obj.rotation = { ...obj.rotation, y: angle }
      mesh.rotation.y = angle
    }
    this.onStateChange?.()
  }
  private _onPointerMove = (e: PointerEvent): void => {
    if (!this.ctx) return
    const rect = this.ctx.canvas.getBoundingClientRect()
    this.mouseNdc.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1
    this.mouseNdc.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.mouseNdc, this.ctx.camera)
    if (this._dragMode && this.selectedObjectId) {
      this._handleDrag(e)
      return
    }
    if (!this.ghostGroup || !this.placementPlane) return
    const hits = this.raycaster.intersectObject(this.placementPlane)
    if (hits.length > 0) {
      const p = hits[0].point
      this.ghostGroup.position.set(
        Math.round(p.x / this.gridSize) * this.gridSize,
        this.placementY,
        Math.round(p.z / this.gridSize) * this.gridSize,
      )
      this.ghostGroup.visible = true
    } else {
      this.ghostGroup.visible = false
    }
  }
  private _onPointerDown = (e: PointerEvent): void => {
    this.mouseDownPos = { x: e.clientX, y: e.clientY }
    if (this.selectedObjectId && this._hitTestSelected(e)) {
      const obj = this.placed.find(p => p.id === this.selectedObjectId)
      if (obj) {
        this._dragBeforePos = { ...obj.position }
        this._dragBeforeRot = { ...obj.rotation }
        this._dragStartClient = { x: e.clientX, y: e.clientY }
        this._dragMode = e.button === 2 ? 'rotate-y' : 'move'  
        e.preventDefault()
      }
    }
  }
  private _onPointerUp = (e: PointerEvent): void => {
    if (this._dragMode && this.selectedObjectId) {
      e.preventDefault()
      const obj = this.placed.find(p => p.id === this.selectedObjectId)
      if (obj && this._dragBeforePos && this._dragBeforeRot) {
        const posChanged = obj.position.x !== this._dragBeforePos.x || obj.position.z !== this._dragBeforePos.z
        const rotChanged = obj.rotation.y !== this._dragBeforeRot.y
        if (posChanged || rotChanged) {
          this._pushHistory({
            type: 'place',
            id: obj.id,
            placed: { ...obj }
          })
        }
      }
      this._dragMode = null
      this._dragBeforePos = null
      this._dragBeforeRot = null
      this.onStateChange?.()
      return
    }
    if (!this.mouseDownPos) return
    const dx = e.clientX - this.mouseDownPos.x
    const dy = e.clientY - this.mouseDownPos.y
    this.mouseDownPos = null
    if (Math.sqrt(dx * dx + dy * dy) > this.dragThreshold) return
    if (!this.ctx) return
    if (this.selectedComponent && this.ghostGroup?.visible) {
      this._placeComponent()
    } else if (!this.selectedComponent) {
      this._trySelectObject(e)
    }
  }
  private async _placeComponent(): Promise<void> {
    if (!this.ghostGroup || !this.selectedComponent || !this.ctx) return
    const pos = this.ghostGroup.position.clone()
    const name = this.selectedComponent.split('/').pop()?.replace(/\.ya?ml$/i, '') ?? 'object'
    const idx = this.placementCounter.get(name) ?? 0
    this.placementCounter.set(name, idx + 1)
    const id = `${name}_${idx}`
    const def = this.loader.get(this.selectedComponent)
    const meshDef = def?.meshes?.[0] ?? def?.mesh
    let placedGroup: THREE.Group
    if (meshDef && 'gltf' in meshDef) {
      const model = await this.ctx.gltf.load(meshDef.gltf, meshDef.gltf)
      placedGroup = model.scene.clone()
      if (meshDef.scale) placedGroup.scale.set(meshDef.scale.x, meshDef.scale.y, meshDef.scale.z)
    } else {
      const geo = (this.ghostGroup.children[0] as THREE.Mesh).geometry.clone()
      placedGroup = this._makeSolidMesh(geo, id)
    }
    placedGroup.position.copy(pos)
    placedGroup.rotation.set(0, 0, 0)
    placedGroup.name = id
    this.meshRegistry.set(id, placedGroup)
    this.ctx.objects.add({ id, type: OBJECT_TYPE.MAP, name: id, position: { x: pos.x, y: pos.y, z: pos.z }, rotation: { x: 0, y: 0, z: 0 }, pieces: [{ asset: placedGroup, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }] })
    const placedObj: PlacedObject = {
      id,
      component: this.selectedComponent,
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation: { x: 0, y: 0, z: 0 },
      scale: meshDef && 'scale' in meshDef ? meshDef.scale : { x: 1, y: 1, z: 1 },
    }
    this.placed.push(placedObj)
    this._pushHistory({ type: 'place', id, placed: placedObj })
    this.onStateChange?.()
  }
  private _trySelectObject(e: PointerEvent): void {
    if (!this.ctx) return
    this.stopAnimation()
    this.stopAllAnimations()
    const rect = this.ctx.canvas.getBoundingClientRect()
    this.mouseNdc.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1
    this.mouseNdc.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.mouseNdc, this.ctx.camera)
    const meshList = this.placed
      .map(p => this.meshRegistry.get(p.id))
      .filter(Boolean) as THREE.Group[]
    if (this.selectedObjectId) {
      this._setHighlight(this.selectedObjectId, false)
    }
    const hits = this.raycaster.intersectObjects(meshList, true)
    if (hits.length > 0) {
      let obj: THREE.Object3D | null = hits[0].object
      while (obj && !this.meshRegistry.has(obj.name)) obj = obj.parent
      const id = obj?.name ?? null
      this.selectedObjectId = id
      if (id) this._setHighlight(id, true)
    } else {
      this.selectedObjectId = null
    }
    this.onStateChange?.()
  }
  private _onKeyDown = (e: KeyboardEvent): void => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      this.deleteSelected()
    } else if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
      e.preventDefault()
      this.undo()
    } else if (e.ctrlKey && (e.key === 'y' || e.shiftKey)) {
      e.preventDefault()
      this.redo()
    }
  }
  private _makeSolidMesh(geo: THREE.BufferGeometry, name: string): THREE.Group {
    const group = new THREE.Group()
    group.name = name
    const mat = new THREE.MeshBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.85 })
    const mesh = new THREE.Mesh(geo, mat)
    group.add(mesh)
    return group
  }
  private _setHighlight(id: string, on: boolean): void {
    this.meshRegistry.get(id)?.traverse(c => {
      if (c instanceof THREE.Mesh) {
        (c.material as THREE.MeshBasicMaterial).color.set(on ? 0xff8844 : 0xaaccff)
      }
    })
  }
  private _addToObjects(id: string): void {
    const mesh = this.meshRegistry.get(id)
    if (!mesh || !this.ctx) return
    this.ctx.objects.add({ id, type: OBJECT_TYPE.MAP, name: id, pieces: [{ asset: mesh, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }] })
  }
  private _removeFromObjects(id: string): void {
    if (!this.ctx) return
    if (this.ctx.objects.getById(id)) this.ctx.objects.remove(id)
  }
  private _removeGhost(): void {
    if (this.ghostGroup && this.ctx) {
      this.ctx.objects.removeRaw(this.ghostGroup)
      this.ghostGroup.traverse(c => {
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose()
          if (Array.isArray(c.material)) c.material.forEach(m => m.dispose())
          else c.material.dispose()
        }
      })
      this.ghostGroup = null
    }
  }
  exportYaml(): string {
    const round = (n: number, d = 6) => Math.round(n * 10 ** d) / 10 ** d
    const envFields: Record<string, unknown> = {}
    if (this._env.sky) envFields.sky = this._env.sky
    if (this._env.fog) envFields.fog = this._env.fog
    if (this._env.lights.length > 0) envFields.lights = this._env.lights
    if (this._env.clouds) envFields.clouds = true
    return yamlDump({
      id: 'editor_export',
      ...envFields,
      objects: this.placed.map(o => ({
        id: o.id,
        component: o.component,
        type: 'map',
        position: { x: round(o.position.x), y: round(o.position.y), z: round(o.position.z) },
        rotation: { x: round(o.rotation.x), y: round(o.rotation.y), z: round(o.rotation.z) },
        scale:    { x: round(o.scale.x),    y: round(o.scale.y),    z: round(o.scale.z) },
      })),
    }, { lineWidth: -1 })
  }
  downloadYaml(): void {
    const blob = new Blob([this.exportYaml()], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'map_export.yaml'
    a.click()
    URL.revokeObjectURL(url)
  }
}

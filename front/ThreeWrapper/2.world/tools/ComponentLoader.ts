import { load as yamlLoad } from 'js-yaml'
export type Vec3 = { x: number; y: number; z: number }
export type TextureAll = { all: string }
export type TexturePBR = {
  map?: string
  normalMap?: string
  roughnessMap?: string
  metalnessMap?: string
  emissiveMap?: string
  aoMap?: string
  displacementMap?: string
}
export type TextureFaces = {
  faces: {
    px?: string; nx?: string
    py?: string; ny?: string
    pz?: string; nz?: string
  }
}
export type TextureDef = string | TextureAll | TexturePBR | TextureFaces
export type MeshGLTF = {
  gltf: string
  scale?: Vec3
  offset?: Vec3
}
export type MeshPrimitive = {
  primitive: 'box' | 'sphere' | 'plane' | 'cylinder'
  size?: Vec3
  color?: number
  textures?: TextureDef
  offset?: Vec3
  displacementScale?: number
}
export type MeshDef = MeshGLTF | MeshPrimitive
export type HitboxSize = 'auto' | 'full' | Vec3
export type HitboxDef = {
  shape: 'box' | 'sphere' | 'capsule'
  size?: HitboxSize
  radius?: number
  height?: number
  offset?: Vec3
  collidesWith?: string[]
  isSensor?: boolean
  tag?: string
}
export type PhysicsDef = {
  bodyType?: 'dynamic' | 'static' | 'kinematic'
  gravityScale?: number
  mass?: number
  restitution?: number
  friction?: number
}
export type WaypointDef = {
  position: Vec3
  rotation?: Vec3
}
export type WaypointAnimDef = {
  kind: 'waypoints'
  targetMesh?: number 
  waypoints: WaypointDef[]
  speed?: number
  loop?: boolean
  autoPlay?: boolean
  pauseAtWaypoint?: number
}
export type ClipAnimDef = {
  kind: 'clip'
  targetMesh?: number 
  autoPlay?: boolean
  loop?: boolean
}
export type AnimationDef = WaypointAnimDef | ClipAnimDef
export type ComponentDef = {
  id: string
  meshes?: MeshDef[]
  mesh?: MeshDef
  physics?: PhysicsDef
  hitboxes?: HitboxDef[]
  animations?: Record<string, AnimationDef>
}
export class ComponentLoader {
  private readonly cache = new Map<string, ComponentDef>()
  async load(url: string): Promise<ComponentDef> {
    if (this.cache.has(url)) return this.cache.get(url)!
    const res = await fetch(url)
    if (!res.ok)
      throw new Error(`[ComponentLoader] Failed to fetch: ${url} (${res.status})`)
    const text = await res.text()
    const isYaml = /\.ya?ml(\?.*)?$/i.test(url)
    const def = isYaml
      ? (yamlLoad(text) as ComponentDef)
      : (JSON.parse(text) as ComponentDef)
    this.cache.set(url, def)
    return def
  }
  get(url: string): ComponentDef | undefined {
    return this.cache.get(url)
  }
  getLoadedIds(): string[] {
    return [...this.cache.keys()]
  }
  clear(): void {
    this.cache.clear()
  }
}

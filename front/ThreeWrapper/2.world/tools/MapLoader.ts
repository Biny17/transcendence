import * as THREE from 'three'
export type MapObjectDef = {
  id: string
  type: string
  position: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  scale?: { x: number; y: number; z: number }
  asset?: string
  primitive?: 'box' | 'sphere' | 'plane' | 'cylinder'
  size?: { x: number; y: number; z: number }
  color?: number
  extraData?: Record<string, unknown>
}
export type MapDef = {
  id: string
  sky?: { color?: number; skyboxId?: string }
  fog?: { color: number; near: number; far: number }
  objects: MapObjectDef[]
}
export class MapLoader {
  private readonly scene: THREE.Scene
  private current: MapDef | null = null
  constructor(scene: THREE.Scene) {
    this.scene = scene
  }
  get definition(): MapDef | null {
    return this.current
  }
  async loadFile(url: string): Promise<MapDef> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`[MapLoader] Failed to fetch map: ${url} (${res.status})`)
    const def = (await res.json()) as MapDef
    this.current = def
    return def
  }
  generate(fn: (scene: THREE.Scene) => MapDef): MapDef {
    const def = fn(this.scene)
    this.current = def
    return def
  }
}

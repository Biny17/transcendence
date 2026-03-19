import type * as THREE from 'three'
import type { Module, EngineContext } from '../Module'
export class ObjectManagerModule implements Module {
  readonly type = 'object-manager'
  private objects: Map<string, THREE.Object3D> = new Map()
  private counter = 0
  init(_context: EngineContext): void {}
  register(id: string, object: THREE.Object3D): void {
    if (this.objects.has(id)) {
      console.warn(`[ObjectManagerModule] "${id}" already registered, overwriting`)
    }
    this.objects.set(id, object)
  }
  registerAuto(object: THREE.Object3D): string {
    const key = `object_${this.counter++}`
    this.objects.set(key, object)
    return key
  }
  get(id: string): THREE.Object3D | undefined {
    return this.objects.get(id)
  }
  remove(id: string): void {
    this.objects.delete(id)
  }
  has(id: string): boolean {
    return this.objects.has(id)
  }
  getAll(): Map<string, THREE.Object3D> {
    return new Map(this.objects)
  }
  query(predicate: (obj: THREE.Object3D, id: string) => boolean): Map<string, THREE.Object3D> {
    const result = new Map<string, THREE.Object3D>()
    this.objects.forEach((obj, id) => {
      if (predicate(obj, id)) result.set(id, obj)
    })
    return result
  }
  update(_delta: number): void {}
  dispose(): void {
    this.objects.clear()
    this.counter = 0
  }
}

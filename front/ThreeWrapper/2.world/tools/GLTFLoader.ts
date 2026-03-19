import * as THREE from 'three'
import { GLTFLoader as ThreeGLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
export type LoadedModel = {
  scene: THREE.Group
  animations: THREE.AnimationClip[]
  mixer?: THREE.AnimationMixer
}
export class GLTFLoader {
  private readonly loader = new ThreeGLTFLoader()
  private readonly cache = new Map<string, LoadedModel>()
  async load(id: string, url: string): Promise<LoadedModel> {
    if (this.cache.has(id)) return this.cache.get(id)!
    const gltf: GLTF = await new Promise((resolve, reject) => {
      this.loader.load(url, resolve, undefined, reject)
    })
    const model: LoadedModel = {
      scene: gltf.scene,
      animations: gltf.animations,
    }
    if (gltf.animations.length > 0) {
      model.mixer = new THREE.AnimationMixer(gltf.scene)
    }
    this.cache.set(id, model)
    return model
  }
  clone(id: string): LoadedModel | null {
    const original = this.cache.get(id)
    if (!original) return null
    const cloned: LoadedModel = {
      scene: original.scene.clone(true),
      animations: original.animations,
    }
    if (original.animations.length > 0) {
      cloned.mixer = new THREE.AnimationMixer(cloned.scene)
    }
    return cloned
  }
  update(delta: number): void {
    for (const model of this.cache.values()) {
      model.mixer?.update(delta)
    }
  }
  get(id: string): LoadedModel | undefined {
    return this.cache.get(id)
  }
  dispose(): void {
    this.cache.clear()
  }
}

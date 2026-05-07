import * as THREE from 'three'
import { World } from '../WorldClass'
import { EditorEnvironment } from '@/ThreeWrapper/3.environment/envs/EditorEnvironment'
import { LightFactory } from '../tools'
export class EditorWorld extends World {
  constructor() {
    super({ id: 'Editor' })
  }
  protected setupEnvironment(): void {
    this.applyEnvironment(new EditorEnvironment())
  }
  protected override async onLoad(): Promise<void> {
    this.ctx.scene.background = new THREE.Color(0x18182a)
    const ambient = LightFactory.createAmbientLight({ color: 0xffffff, intensity: 0.85 })
    this.ctx.objects.addRaw(ambient)
    const sun = LightFactory.createDirectionalLight({
      color: 0xffffff,
      intensity: 3.8,
      position: { x: 8, y: 5, z: -8 },
      castShadow: false,
    })
    this.ctx.objects.addRaw(sun)
    this.ctx.objects.addRaw(sun.target)
    const fill = LightFactory.createDirectionalLight({
      color: 0x8899bb,
      intensity: 0.5,
      position: { x: -5, y: 4, z: -6 },
      castShadow: false,
    })
    this.ctx.objects.addRaw(fill)
    this.ctx.objects.addRaw(fill.target)
    this.ctx.objects.addRaw(new THREE.GridHelper(200, 200, 0x444466, 0x222244))
  }
}

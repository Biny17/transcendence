import * as THREE from 'three'
import { World } from '../WorldClass'
import { DefaultEnvironment } from '@/ThreeWrapper/3.environment/envs/DefaultEnvironment'
import { GeometryFactory } from '../tools'
import { Logger } from '@/ThreeWrapper/1.engine/tools'
export type DemoWorldArgs = {
	id?: string
}
export class DemoWorld extends World {
	private cube: THREE.Mesh | null = null
	private velocity = { y: 0 }
	constructor(args: DemoWorldArgs = {}) {
		super({ id: args.id ?? 'demo' })
	}
	protected setupEnvironment(): void {
		this.applyEnvironment(new DefaultEnvironment())
	}
	protected override async onLoad(): Promise<void> {
		const sun = new THREE.DirectionalLight(0xffffff, 1.2)
		sun.position.set(10, 20, 10)
		sun.castShadow = true
		this.ctx.objects.add({ type: 'map', name: "sun", pieces: [{ asset: sun, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [] }] })
		this.ctx.scene.background = new THREE.Color(0x87ceeb)
		this.cube = new THREE.Mesh(
			new THREE.BoxGeometry(1, 1, 1),
			new THREE.MeshPhongMaterial({ color: 0xff4444 }),
		)
		this.cube.position.set(0, 8, 0)
		this.cube.castShadow = true
		const cubeObj = this.ctx.objects.add({ type: 'map', name: "cube", pieces: [{ asset: this.cube, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [{ shape: { kind: 'auto' }, relativeOffset: { x: 0, y: 0, z: 0 } }] }], physics: { bodyType: 'static' } });
		this.ctx.camera.position.set(5, 8, 12)
		this.ctx.camera.lookAt(0, 2, 0)
		const floor = GeometryFactory.box({width:5, depth:5})
		const floorId = this.ctx.objects.add({ type: "map", pieces: [{ asset: floor, relativePosition: { x: 0, y: 0, z: 0 }, hitboxes: [{ shape: { kind: 'auto' }, relativeOffset: { x: 0, y: 0, z: 0 } }] }], physics: { bodyType: 'static' } });
	}
	protected override onStart(): void {
	}
}

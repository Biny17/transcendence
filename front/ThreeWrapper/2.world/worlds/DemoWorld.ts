import * as THREE from 'three'
import { World } from '../WorldClass'
import { DefaultEnvironment } from '@/ThreeWrapper/3.environments/envs/DefaultEnvironment'
import { ObjectManager } from '../tools/ObjectManager'
import { applyGravity, autoFitCollisionBox, makeCollisionBody, makeCollisionBox } from '@/ThreeWrapper/5.modules'
import { GeometryFactory } from '../tools/GeometryFactory'
import { Logger } from '@/ThreeWrapper/1.engine/Logger'
export class DemoWorld extends World {
	private cube: THREE.Mesh | null = null
	private velocity = { y: 0 }
	constructor() {
		super({ id: 'demo' })
		this.applyEnvironment(new DefaultEnvironment())
	}
	protected override async onLoad(): Promise<void> {
		const sun = new THREE.DirectionalLight(0xffffff, 1.2)
		sun.position.set(10, 20, 10)
		sun.castShadow = true
		this.objects.add({ type: 'map', name: "sun", object3d: sun })
		this.scene.background = new THREE.Color(0x87ceeb)
		this.cube = new THREE.Mesh(
			new THREE.BoxGeometry(1, 1, 1),
			new THREE.MeshPhongMaterial({ color: 0xff4444 }),
		)
		this.cube.position.set(0, 8, 0)
		this.cube.castShadow = true
		const cubeid = this.objects.add({ type: 'map', object3d: this.cube, name: "cube" })
		const cubeeObj = this.objects.getById(cubeid);
		if(cubeeObj)autoFitCollisionBox(cubeeObj);
		this.camera.position.set(5, 8, 12)
		this.camera.lookAt(0, 2, 0)
		const floor = GeometryFactory.box({width:5, depth:5})
		const floorId = this.objects.add({ type: "map", object3d: floor })
		const floorObj = this.objects.getById(floorId);
		if(floorObj)autoFitCollisionBox(floorObj);
	}
	protected override onStart(): void {
		const cube = this.objects.get("cube");
		if(cube)applyGravity(cube);
	}
}

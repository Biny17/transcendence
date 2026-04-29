import * as THREE from "three";
import { World } from "../WorldClass";
import { MinimalEnvironment } from "@/ThreeWrapper/3.environment/envs/MinimalEnvironment";
import { GeometryFactory } from "../tools";
interface AnimatedObject {
	obj: THREE.Object3D;
	rotationSpeed: { x: number; y: number; z: number };
	bobSpeed?: number;
	bobAmount?: number;
	initialY: number;
}
export class LoadingWorld extends World {
	private animatedObjects: AnimatedObject[] = [];
	private orbitingObjects: THREE.Mesh[] = [];
	private coreSphere: THREE.Mesh | null = null;
	private coreInitialScale = 1;
	constructor() {
		super({ id: "minimal" });
	}
	protected setupEnvironment(): void {
		this.applyEnvironment(new MinimalEnvironment());
	}
	protected override async onLoad(): Promise<void> {
		this.ctx.scene.background = new THREE.Color(0x0a0a12);
		const ambient = new THREE.AmbientLight(0x404060, 0.4);
		this.ctx.objects.addRaw(ambient);
		const pointLight = new THREE.PointLight(0x00ffff, 2, 50);
		pointLight.position.set(0, 8, 0);
		this.ctx.objects.addRaw(pointLight);
		const ringColors = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff88];
		const ringRadii = [3, 4.5, 6, 7.5];
		const ringTilts = [0, Math.PI / 6, Math.PI / 4, Math.PI / 3];
		for (let i = 0; i < 4; i++) {
			const ring = GeometryFactory.torus({
				radius: ringRadii[i],
				tube: 0.08,
				radialSegments: 8,
				tubularSegments: 64,
				material: {
					color: ringColors[i],
					emissive: ringColors[i],
					type: "basic",
				},
			});
			(ring.material as THREE.MeshBasicMaterial).opacity = 0.9;
			(ring.material as THREE.MeshBasicMaterial).transparent = true;
			ring.rotation.x = ringTilts[i];
			ring.rotation.y = (i * Math.PI) / 4;
			ring.position.y = 5;
			this.ctx.objects.addRaw(ring);
			this.animatedObjects.push({
				obj: ring,
				rotationSpeed: {
					x: 0.1 + i * 0.05,
					y: 0.15 + i * 0.08,
					z: 0.05,
				},
				bobSpeed: 0.5 + i * 0.2,
				bobAmount: 0.3,
				initialY: 5,
			});
		}
		this.coreSphere = GeometryFactory.sphere({
			radius: 0.6,
			widthSegments: 32,
			heightSegments: 32,
			material: {
				color: 0xffffff,
				emissive: 0x00ffff,
			},
		});
		(this.coreSphere.material as THREE.MeshStandardMaterial).emissiveIntensity = 1;
		this.coreSphere.position.y = 5;
		this.ctx.objects.addRaw(this.coreSphere);
		this.coreInitialScale = 1;
		const orbitRadius = 8;
		for (let i = 0; i < 6; i++) {
			const angle = (i / 6) * Math.PI * 2;
			const orbitShape =
				i % 2 === 0
					? GeometryFactory.icosahedron({ radius: 0.2, detail: 0 })
					: GeometryFactory.octahedron({ radius: 0.2, detail: 0 });
			(orbitShape.material as THREE.MeshStandardMaterial).color.setHex(ringColors[i % 4]);
			(orbitShape.material as THREE.MeshStandardMaterial).emissive.setHex(ringColors[i % 4]);
			(orbitShape.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;
			(orbitShape.material as THREE.MeshStandardMaterial).metalness = 0.8;
			(orbitShape.material as THREE.MeshStandardMaterial).roughness = 0.2;
			orbitShape.position.x = Math.cos(angle) * orbitRadius;
			orbitShape.position.z = Math.sin(angle) * orbitRadius;
			orbitShape.position.y = 5 + Math.sin(angle * 2) * 0.5;
			this.ctx.objects.addRaw(orbitShape);
			this.orbitingObjects.push(orbitShape);
		}
		this.ctx.camera.position.set(0, 5, 18);
		this.ctx.camera.lookAt(0, 5, 0);
	}
	override update(delta: number): void {
		const time = performance.now() * 0.001;
		for (const anim of this.animatedObjects) {
			anim.obj.rotation.x += anim.rotationSpeed.x * delta;
			anim.obj.rotation.y += anim.rotationSpeed.y * delta;
			anim.obj.rotation.z += anim.rotationSpeed.z * delta;
			if (anim.bobSpeed !== undefined && anim.bobAmount !== undefined) {
				anim.obj.position.y =
					anim.initialY + Math.sin(time * anim.bobSpeed) * anim.bobAmount;
			}
		}
		if (this.coreSphere) {
			const pulseScale =
				this.coreInitialScale +
				Math.sin(time * 3) * 0.15 +
				Math.sin(time * 5) * 0.1;
			this.coreSphere.scale.setScalar(pulseScale);
			this.coreSphere.rotation.y += delta * 0.5;
		}
		const orbitRadius = 8;
		for (let i = 0; i < this.orbitingObjects.length; i++) {
			const obj = this.orbitingObjects[i];
			const angle = (i / 6) * Math.PI * 2 + time * 0.3;
			obj.position.x = Math.cos(angle) * orbitRadius;
			obj.position.z = Math.sin(angle) * orbitRadius;
			obj.position.y = 5 + Math.sin(time * 2 + i) * 0.8;
			obj.rotation.x += delta * (0.5 + i * 0.1);
			obj.rotation.y += delta * (0.3 + i * 0.15);
		}
		const cameraAngle = time * 0.1;
		this.ctx.camera.position.x = Math.sin(cameraAngle) * 18;
		this.ctx.camera.position.z = Math.cos(cameraAngle) * 18;
		this.ctx.camera.position.y = 5 + Math.sin(time * 0.5) * 2;
		this.ctx.camera.lookAt(0, 5, 0);
	}
	protected override onStart(): void {}
	protected override onDispose(): void {
		this.animatedObjects = [];
		this.orbitingObjects = [];
		this.coreSphere = null;
	}
}

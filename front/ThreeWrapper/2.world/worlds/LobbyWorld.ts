import * as THREE from "three";
import { World } from "../WorldClass";
import { OnlineEnvironement } from "@/ThreeWrapper/3.environment/envs/OnlineEnvironement";
import { GeometryFactory, LightFactory } from "../tools";
interface FloatingPlatform {
	mesh: THREE.Mesh;
	initialY: number;
	bobSpeed: number;
	bobAmount: number;
	rotationSpeed: number;
}
export class LobbyWorld extends World {
	private floatingPlatforms: FloatingPlatform[] = [];
	private showcasePiece: THREE.Mesh | null = null;
	private orbitingRings: THREE.Mesh[] = [];
	constructor() {
		super({ id: "lobby" });
	}
	protected setupEnvironment(): void {
		this.applyEnvironment(new OnlineEnvironement());
	}
	protected override async onLoad(): Promise<void> {
		const { sun, sky, bounce } = LightFactory.createCinematicLighting();
		this.ctx.objects.addRaw(sun);
		this.ctx.objects.addRaw(sky);
		this.ctx.objects.addRaw(bounce);
		const ambient = LightFactory.createAmbientLight({
			color: 0x8899bb,
			intensity: 0.3
		});
		this.ctx.objects.addRaw(ambient);
		const floor = GeometryFactory.circle({
			radius: 20,
			segments: 64,
			material: {
				color: 0x1a1a2e,
				metalness: 0.8,
				roughness: 0.3
			}
		});
		floor.rotation.x = -Math.PI / 2;
		floor.position.y = 0;
		floor.receiveShadow = true;
		this.ctx.objects.addRaw(floor);
		const platformPositions = [
			{ x: 0, y: 2, z: 0, radius: 3 },
			{ x: 8, y: 4, z: 5, radius: 2 },
			{ x: -7, y: 3, z: 6, radius: 2.5 },
			{ x: 6, y: 5, z: -6, radius: 1.8 },
			{ x: -8, y: 4, z: -5, radius: 2.2 }
		];
		for (const pos of platformPositions) {
			const platform = GeometryFactory.cylinder({
				radiusTop: pos.radius,
				radiusBottom: pos.radius * 0.9,
				height: 0.4,
				material: {
					color: 0x2a2a4a,
					metalness: 0.6,
					roughness: 0.4
				}
			});
			platform.position.set(pos.x, pos.y, pos.z);
			platform.castShadow = true;
			platform.receiveShadow = true;
			this.ctx.objects.addRaw(platform);
			this.floatingPlatforms.push({
				mesh: platform,
				initialY: pos.y,
				bobSpeed: 0.4 + Math.random() * 0.3,
				bobAmount: 0.2 + Math.random() * 0.2,
				rotationSpeed: 0.05 + Math.random() * 0.1
			});
		}
		this.showcasePiece = GeometryFactory.dodecahedron({
			radius: 1.2,
			detail: 0,
			material: {
				color: 0xff6600,
				emissive: 0xff3300,
				metalness: 0.9,
				roughness: 0.1
			}
		});
		(this.showcasePiece.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
		this.showcasePiece.position.set(0, 2.5, 0);
		this.showcasePiece.castShadow = true;
		this.ctx.objects.addRaw(this.showcasePiece);
		for (let i = 0; i < 3; i++) {
			const ring = GeometryFactory.torus({
				radius: 2 + i * 0.5,
				tube: 0.03,
				radialSegments: 8,
				tubularSegments: 64,
				material: {
					color: 0x00ffff,
					emissive: 0x00ffff,
					type: "basic"
				}
			});
			(ring.material as THREE.MeshBasicMaterial).opacity = 0.7;
			(ring.material as THREE.MeshBasicMaterial).transparent = true;
			ring.position.set(0, 2.5, 0);
			ring.rotation.x = Math.PI / 2 + (i * Math.PI) / 6;
			ring.rotation.y = (i * Math.PI) / 4;
			this.ctx.objects.addRaw(ring);
			this.orbitingRings.push(ring);
		}
		const cube = GeometryFactory.box({
			width: 1.5,
			height: 1.5,
			depth: 1.5,
			material: {
				color: 0x4488ff,
				emissive: 0x2244aa,
				metalness: 0.7,
				roughness: 0.3
			}
		});
		(cube.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
		cube.position.set(8, 5.5, 5);
		cube.castShadow = true;
		this.ctx.objects.addRaw(cube);
		this.floatingPlatforms.push({
			mesh: cube,
			initialY: 5.5,
			bobSpeed: 0.5,
			bobAmount: 0.3,
			rotationSpeed: 0.2
		});
		const sphere = GeometryFactory.sphere({
			radius: 0.8,
			widthSegments: 32,
			heightSegments: 32,
			material: {
				color: 0xff4488,
				emissive: 0xaa2244,
				metalness: 0.8,
				roughness: 0.2
			}
		});
		(sphere.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
		sphere.position.set(-7, 4.5, 6);
		sphere.castShadow = true;
		this.ctx.objects.addRaw(sphere);
		this.floatingPlatforms.push({
			mesh: sphere,
			initialY: 4.5,
			bobSpeed: 0.6,
			bobAmount: 0.25,
			rotationSpeed: 0.15
		});
		const pyramid = GeometryFactory.pyramid({
			width: 1.2,
			height: 1.8,
			depth: 1.2,
			material: {
				color: 0x44ff88,
				emissive: 0x22aa44,
				metalness: 0.6,
				roughness: 0.4
			}
		});
		(pyramid.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
		pyramid.position.set(6, 6.5, -6);
		pyramid.castShadow = true;
		this.ctx.objects.addRaw(pyramid);
		this.floatingPlatforms.push({
			mesh: pyramid,
			initialY: 6.5,
			bobSpeed: 0.45,
			bobAmount: 0.35,
			rotationSpeed: 0.18
		});
		this.ctx.camera.position.set(0, 8, 20);
		this.ctx.camera.lookAt(0, 3, 0);
	}
	override update(delta: number): void {
		const time = performance.now() * 0.001;
		for (const platform of this.floatingPlatforms) {
			platform.mesh.position.y = platform.initialY + Math.sin(time * platform.bobSpeed) * platform.bobAmount;
			platform.mesh.rotation.y += platform.rotationSpeed * delta;
		}
		if (this.showcasePiece) {
			this.showcasePiece.rotation.y += delta * 0.3;
			this.showcasePiece.rotation.x = Math.sin(time * 0.5) * 0.1;
			this.showcasePiece.position.y = 2.5 + Math.sin(time * 0.8) * 0.2;
		}
		for (let i = 0; i < this.orbitingRings.length; i++) {
			const ring = this.orbitingRings[i];
			ring.rotation.z += (0.1 + i * 0.05) * delta;
			ring.rotation.x += (0.05 + i * 0.03) * delta;
		}
		const cameraAngle = time * 0.08;
		const cameraRadius = 22;
		this.ctx.camera.position.x = Math.sin(cameraAngle) * cameraRadius;
		this.ctx.camera.position.z = Math.cos(cameraAngle) * cameraRadius;
		this.ctx.camera.position.y = 8 + Math.sin(time * 0.3) * 1;
		this.ctx.camera.lookAt(0, 3, 0);
	}
	protected override onStart(): void {
		console.log("LobbyWorld started");
	}
	protected override onDispose(): void {
		this.floatingPlatforms = [];
		this.showcasePiece = null;
		this.orbitingRings = [];
	}
}

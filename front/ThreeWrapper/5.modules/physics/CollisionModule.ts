import * as THREE from 'three'
import type { Module, EngineContext } from '../Module'
import type { ManagedObject } from '../../2.world/tools/ObjectManager'
export interface CollisionConfig {
	friction?: number
	debug?: boolean
	restitution?: number
}
export interface CollisionBody {
	obj: ManagedObject
	radius: number
	lastPosition: THREE.Vector3
}
export interface CollisionBoxBody {
	obj: ManagedObject
	halfExtents: THREE.Vector3
	offset: THREE.Vector3
}
export interface CollisionContact {
	objA: ManagedObject
	objB: ManagedObject
	normal: THREE.Vector3
	depth: number
}
export class CollisionModule implements Module {
	readonly type = 'collision'
	private context: EngineContext | null = null
	private config: Required<CollisionConfig>
	private debugHelpers: Map<string, THREE.Mesh> = new Map()
	private debugBoxHelpers: Map<string, THREE.LineSegments> = new Map()
	private activeCollisions: Map<string, CollisionContact> = new Map()
	private collisionsByObject: Map<string, Set<ManagedObject>> = new Map()
	constructor(config: CollisionConfig = {}) {
		this.config = {
			restitution: config.restitution ?? 0.5,
			friction: config.friction ?? 0.8,
			debug: config.debug ?? false,
		}
	}
	init(context: EngineContext): void {
		this.context = context
		if (context.logger?.isDebugFeatureEnabled('showHitboxes')) {
			this.config.debug = true
		}
		const log = context.logger?.for(this.type)
		log?.logVariable('restitution', this.config.restitution)
		log?.logVariable('friction', this.config.friction)
		log?.logVariable('showHitboxes', this.config.debug)
	}
	isColliding(a: ManagedObject, b: ManagedObject): boolean {
		const key = this.pairKey(a, b)
		return this.activeCollisions.has(key)
	}
	getContact(a: ManagedObject, b: ManagedObject): CollisionContact | null {
		const key = this.pairKey(a, b)
		return this.activeCollisions.get(key) ?? null
	}
	getCollisions(obj: ManagedObject): ManagedObject[] {
		return Array.from(this.collisionsByObject.get(obj.id) ?? [])
	}
	isTouching(obj: ManagedObject): boolean {
		const set = this.collisionsByObject.get(obj.id)
		return set !== undefined && set.size > 0
	}
	private pairKey(a: ManagedObject, b: ManagedObject): string {
		return a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`
	}
	private recordCollision(
		a: ManagedObject,
		b: ManagedObject,
		normal: THREE.Vector3,
		depth: number,
	): void {
		const key = this.pairKey(a, b)
		this.activeCollisions.set(key, { objA: a, objB: b, normal, depth })
		let setA = this.collisionsByObject.get(a.id)
		if (!setA) { setA = new Set(); this.collisionsByObject.set(a.id, setA) }
		setA.add(b)
		let setB = this.collisionsByObject.get(b.id)
		if (!setB) { setB = new Set(); this.collisionsByObject.set(b.id, setB) }
		setB.add(a)
	}
	update(_delta: number): void {
		if (!this.context) return
		this.activeCollisions.clear()
		this.collisionsByObject.clear()
		const bodies: CollisionBody[] = []
		const boxBodies: CollisionBoxBody[] = []
		const planes: Array<{ obj: ManagedObject; normal: THREE.Vector3; position: THREE.Vector3 }> = []
		const allObjects = this.context.world.objects.getAll()
		for (const managedObj of allObjects) {
			if (!managedObj.object3d) continue
			if (managedObj.extraData.isCollisionBody as boolean) {
				bodies.push({
					obj: managedObj,
					radius: (managedObj.extraData.collisionRadius as number) ?? 0.5,
					lastPosition: managedObj.object3d.position.clone()
				})
			}
			if (managedObj.extraData.isCollisionBox as boolean) {
				const he = managedObj.extraData.collisionHalfExtents as { x: number; y: number; z: number }
				const off = (managedObj.extraData.collisionOffset as { x: number; y: number; z: number }) ?? { x: 0, y: 0, z: 0 }
				boxBodies.push({
					obj: managedObj,
					halfExtents: new THREE.Vector3(he.x, he.y, he.z),
					offset: new THREE.Vector3(off.x, off.y, off.z),
				})
			}
			if (managedObj.extraData.isCollisionPlane as boolean) {
				const normal = (managedObj.extraData.planeNormal as THREE.Vector3) ?? new THREE.Vector3(0, 1, 0)
				const planePos = managedObj.object3d.position.clone()
				const offset = (managedObj.extraData.planeOffset as number) ?? 0
				if (offset !== 0) {
					planePos.addScaledVector(normal, offset)
				}
				planes.push({ obj: managedObj, normal, position: planePos })
			}
		}
		if (this.config.debug) {
			this.updateDebugHelpers(bodies)
			this.updateDebugBoxHelpers(boxBodies)
		}
		for (let i = 0; i < bodies.length; i++) {
			for (let j = i + 1; j < bodies.length; j++) {
				this.resolveSphereCollision(bodies[i], bodies[j])
			}
		}
		for (const body of bodies) {
			for (const plane of planes) {
				this.resolvePlaneCollision(body, plane)
			}
		}
		for (let i = 0; i < boxBodies.length; i++) {
			for (let j = i + 1; j < boxBodies.length; j++) {
				this.resolveBoxCollision(boxBodies[i], boxBodies[j])
			}
		}
		for (const body of bodies) {
			for (const box of boxBodies) {
				this.resolveSphereBoxCollision(body, box)
			}
		}
		for (const box of boxBodies) {
			for (const plane of planes) {
				this.resolveBoxPlaneCollision(box, plane)
			}
		}
	}
	private updateDebugHelpers(bodies: CollisionBody[]): void {
		if (!this.context) return
		const seenIds = new Set<string>()
		for (const body of bodies) {
			if (!body.obj.object3d) continue
			const id = body.obj.id
			seenIds.add(id)
			let helper = this.debugHelpers.get(id)
			if (!helper) {
				const geo = new THREE.SphereGeometry(1, 8, 6)
				const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
				helper = new THREE.Mesh(geo, mat)
				this.context.scene.add(helper)
				this.debugHelpers.set(id, helper)
			}
			helper.scale.setScalar((body.obj.extraData.collisionRadius as number) ?? 0.5)
			helper.position.copy(body.obj.object3d.position)
		}
		for (const [id, helper] of this.debugHelpers.entries()) {
			if (!seenIds.has(id)) {
				this.context.scene.remove(helper);
				(helper.material as THREE.Material).dispose()
				helper.geometry.dispose()
				this.debugHelpers.delete(id)
			}
		}
	}
	private updateDebugBoxHelpers(boxBodies: CollisionBoxBody[]): void {
		if (!this.context) return
		const seenIds = new Set<string>()
		for (const box of boxBodies) {
			if (!box.obj.object3d) continue
			const id = box.obj.id
			seenIds.add(id)
			let helper = this.debugBoxHelpers.get(id)
			const he = box.halfExtents
			if (!helper) {
				const geo = new THREE.BoxGeometry(2, 2, 2)
				const edges = new THREE.EdgesGeometry(geo)
				geo.dispose()
				const mat = new THREE.LineBasicMaterial({ color: 0xff6600 })
				helper = new THREE.LineSegments(edges, mat)
				this.context.scene.add(helper)
				this.debugBoxHelpers.set(id, helper)
			}
			helper.scale.set(he.x, he.y, he.z)
			helper.position.copy(box.obj.object3d.position).add(box.offset)
			helper.quaternion.copy(box.obj.object3d.quaternion)
		}
		for (const [id, helper] of this.debugBoxHelpers.entries()) {
			if (!seenIds.has(id)) {
				this.context.scene.remove(helper);
				(helper.material as THREE.Material).dispose()
				helper.geometry.dispose()
				this.debugBoxHelpers.delete(id)
			}
		}
	}
	private isStatic(obj: ManagedObject): boolean {
		return !(obj.extraData.useGravity as boolean) && !(obj.extraData.isDynamic as boolean)
	}
	private resolveSphereCollision(a: CollisionBody, b: CollisionBody): void {
		if (!a.obj.object3d || !b.obj.object3d) return
		const delta3 = new THREE.Vector3().subVectors(b.obj.object3d.position, a.obj.object3d.position)
		const distance = delta3.length()
		const minDistance = a.radius + b.radius
		if (distance < minDistance) {
			const overlap = minDistance - distance
			const normal = delta3.normalize()
			this.recordCollision(a.obj, b.obj, normal.clone(), overlap)
			const aStatic = this.isStatic(a.obj)
			const bStatic = this.isStatic(b.obj)
			const pushA = aStatic ? 0 : bStatic ? 1 : 0.5
			const pushB = 1 - pushA
			a.obj.object3d.position.sub(normal.clone().multiplyScalar(overlap * pushA * 1.01))
			b.obj.object3d.position.add(normal.clone().multiplyScalar(overlap * pushB * 1.01))
			const aVel = a.obj.extraData.velocity as { x: number; y: number; z: number }
			const bVel = b.obj.extraData.velocity as { x: number; y: number; z: number }
			if (aVel && bVel) {
				const aVelVec = new THREE.Vector3(aVel.x, aVel.y, aVel.z)
				const bVelVec = new THREE.Vector3(bVel.x, bVel.y, bVel.z)
				const restitution = this.config.restitution
				const relVel = new THREE.Vector3().subVectors(aVelVec, bVelVec)
				const velAlongNormal = relVel.dot(normal)
				if (velAlongNormal > 0) {
					const impulse = -(1 + restitution) * velAlongNormal
					if (!aStatic) {
						aVelVec.addScaledVector(normal, impulse * pushA)
						a.obj.extraData.velocity = { x: aVelVec.x, y: aVelVec.y, z: aVelVec.z }
					}
					if (!bStatic) {
						bVelVec.addScaledVector(normal, -impulse * pushB)
						b.obj.extraData.velocity = { x: bVelVec.x, y: bVelVec.y, z: bVelVec.z }
					}
				}
			}
		}
	}
	private resolveSphereBoxCollision(sphere: CollisionBody, box: CollisionBoxBody): void {
		if (!sphere.obj.object3d || !box.obj.object3d) return
		const boxPos = new THREE.Vector3().copy(box.obj.object3d.position).add(box.offset)
		const delta = new THREE.Vector3().subVectors(sphere.obj.object3d.position, boxPos)
		const closest = new THREE.Vector3(
			Math.max(-box.halfExtents.x, Math.min(box.halfExtents.x, delta.x)),
			Math.max(-box.halfExtents.y, Math.min(box.halfExtents.y, delta.y)),
			Math.max(-box.halfExtents.z, Math.min(box.halfExtents.z, delta.z)),
		)
		const diff = new THREE.Vector3().subVectors(delta, closest)
		const distance = diff.length()
		if (distance < sphere.radius && distance > 0) {
			const normal = diff.normalize()
			const overlap = sphere.radius - distance
			this.recordCollision(sphere.obj, box.obj, normal.clone(), overlap)
			const sStatic = this.isStatic(sphere.obj)
			const bStatic = this.isStatic(box.obj)
			const pushS = sStatic ? 0 : bStatic ? 1 : 0.5
			const pushB = 1 - pushS
			sphere.obj.object3d.position.addScaledVector(normal, overlap * pushS * 1.01)
			box.obj.object3d.position.addScaledVector(normal, -overlap * pushB * 1.01)
			const sVel = sphere.obj.extraData.velocity as { x: number; y: number; z: number }
			const bVel = box.obj.extraData.velocity as { x: number; y: number; z: number }
			if (sVel && bVel) {
				const sVelVec = new THREE.Vector3(sVel.x, sVel.y, sVel.z)
				const bVelVec = new THREE.Vector3(bVel.x, bVel.y, bVel.z)
				const restitution = this.config.restitution
				const relVel = new THREE.Vector3().subVectors(sVelVec, bVelVec)
				const velAlongNormal = relVel.dot(normal)
				if (velAlongNormal < 0) {
					const impulse = -(1 + restitution) * velAlongNormal
					if (!sStatic) {
						sVelVec.addScaledVector(normal, impulse * pushS)
						sphere.obj.extraData.velocity = { x: sVelVec.x, y: sVelVec.y, z: sVelVec.z }
					}
					if (!bStatic) {
						bVelVec.addScaledVector(normal, -impulse * pushB)
						box.obj.extraData.velocity = { x: bVelVec.x, y: bVelVec.y, z: bVelVec.z }
					}
				}
			}
		}
	}
	private resolveBoxCollision(a: CollisionBoxBody, b: CollisionBoxBody): void {
		if (!a.obj.object3d || !b.obj.object3d) return
		const aPos = new THREE.Vector3().copy(a.obj.object3d.position).add(a.offset)
		const bPos = new THREE.Vector3().copy(b.obj.object3d.position).add(b.offset)
		const delta = new THREE.Vector3().subVectors(bPos, aPos)
		const overlapX = a.halfExtents.x + b.halfExtents.x - Math.abs(delta.x)
		const overlapY = a.halfExtents.y + b.halfExtents.y - Math.abs(delta.y)
		const overlapZ = a.halfExtents.z + b.halfExtents.z - Math.abs(delta.z)
		if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) return
		let normal: THREE.Vector3
		let overlap: number
		if (overlapX < overlapY && overlapX < overlapZ) {
			overlap = overlapX
			normal = new THREE.Vector3(delta.x < 0 ? -1 : 1, 0, 0)
		} else if (overlapY < overlapZ) {
			overlap = overlapY
			normal = new THREE.Vector3(0, delta.y < 0 ? -1 : 1, 0)
		} else {
			overlap = overlapZ
			normal = new THREE.Vector3(0, 0, delta.z < 0 ? -1 : 1)
		}
		this.recordCollision(a.obj, b.obj, normal.clone(), overlap)
		const aStatic = this.isStatic(a.obj)
		const bStatic = this.isStatic(b.obj)
		const pushA = aStatic ? 0 : bStatic ? 1 : 0.5
		const pushB = 1 - pushA
		a.obj.object3d.position.sub(normal.clone().multiplyScalar(overlap * pushA * 1.01))
		b.obj.object3d.position.add(normal.clone().multiplyScalar(overlap * pushB * 1.01))
		const aVel = a.obj.extraData.velocity as { x: number; y: number; z: number }
		const bVel = b.obj.extraData.velocity as { x: number; y: number; z: number }
		if (aVel && bVel) {
			const aVelVec = new THREE.Vector3(aVel.x, aVel.y, aVel.z)
			const bVelVec = new THREE.Vector3(bVel.x, bVel.y, bVel.z)
			const restitution = this.config.restitution
			const relVel = new THREE.Vector3().subVectors(aVelVec, bVelVec)
			const velAlongNormal = relVel.dot(normal)
			if (velAlongNormal > 0) {
				const impulse = -(1 + restitution) * velAlongNormal
				if (!aStatic) {
					aVelVec.addScaledVector(normal, impulse * pushA)
					a.obj.extraData.velocity = { x: aVelVec.x, y: aVelVec.y, z: aVelVec.z }
				}
				if (!bStatic) {
					bVelVec.addScaledVector(normal, -impulse * pushB)
					b.obj.extraData.velocity = { x: bVelVec.x, y: bVelVec.y, z: bVelVec.z }
				}
			}
		}
	}
	private resolveBoxPlaneCollision(
		box: CollisionBoxBody,
		plane: { obj: ManagedObject; normal: THREE.Vector3; position: THREE.Vector3 },
	): void {
		if (!box.obj.object3d) return
		const effectiveRadius =
			Math.abs(box.halfExtents.x * plane.normal.x) +
			Math.abs(box.halfExtents.y * plane.normal.y) +
			Math.abs(box.halfExtents.z * plane.normal.z)
		const boxPos = new THREE.Vector3().copy(box.obj.object3d.position).add(box.offset)
		const toBody = new THREE.Vector3().subVectors(boxPos, plane.position)
		const distanceToPlane = toBody.dot(plane.normal)
		if (distanceToPlane < effectiveRadius && distanceToPlane > -effectiveRadius * 2) {
			this.recordCollision(box.obj, plane.obj, plane.normal.clone(), effectiveRadius - distanceToPlane)
			box.obj.object3d.position.addScaledVector(plane.normal, effectiveRadius - distanceToPlane)
			const vel = box.obj.extraData.velocity as { x: number; y: number; z: number }
			if (vel) {
				const velVec = new THREE.Vector3(vel.x, vel.y, vel.z)
				const velAlongNormal = velVec.dot(plane.normal)
				if (velAlongNormal < 0) {
					const restitution = this.config.restitution
					const friction = this.config.friction
					velVec.addScaledVector(plane.normal, -(1 + restitution) * velAlongNormal)
					velVec.multiplyScalar(friction)
					box.obj.extraData.velocity = { x: velVec.x, y: velVec.y, z: velVec.z }
				}
			}
		}
	}
	private resolvePlaneCollision(
		body: CollisionBody,
		plane: { obj: ManagedObject; normal: THREE.Vector3; position: THREE.Vector3 },
	): void {
		if (!body.obj.object3d) return
		const toBody = new THREE.Vector3().subVectors(body.obj.object3d.position, plane.position)
		const distanceToPlane = toBody.dot(plane.normal)
		if (distanceToPlane < body.radius && distanceToPlane > -body.radius * 2) {
			this.recordCollision(body.obj, plane.obj, plane.normal.clone(), body.radius - distanceToPlane)
			body.obj.object3d.position.addScaledVector(plane.normal, body.radius - distanceToPlane)
			const vel = body.obj.extraData.velocity as { x: number; y: number; z: number }
			if (vel) {
				const velVec = new THREE.Vector3(vel.x, vel.y, vel.z)
				const velAlongNormal = velVec.dot(plane.normal)
				if (velAlongNormal < 0) {
					const restitution = this.config.restitution
					const friction = this.config.friction
					velVec.addScaledVector(plane.normal, -(1 + restitution) * velAlongNormal)
					velVec.multiplyScalar(friction)
					body.obj.extraData.velocity = { x: velVec.x, y: velVec.y, z: velVec.z }
				}
			}
		}
	}
	dispose(): void {
		if (this.context) {
			Array.from(this.debugHelpers.values()).forEach(helper => {
				this.context!.scene.remove(helper);
				(helper.material as THREE.Material).dispose()
				helper.geometry.dispose()
			})
			Array.from(this.debugBoxHelpers.values()).forEach(helper => {
				this.context!.scene.remove(helper);
				(helper.material as THREE.Material).dispose()
				helper.geometry.dispose()
			})
		}
		this.debugHelpers.clear()
		this.debugBoxHelpers.clear()
		this.context = null
	}
}
export function makeCollisionBody(obj: ManagedObject, radius = 0.5): void {
	obj.extraData.isCollisionBody = true
	obj.extraData.collisionRadius = radius
	if (!obj.extraData.velocity) obj.extraData.velocity = { x: 0, y: 0, z: 0 }
}
export function autoFitCollisionBox(obj: ManagedObject): THREE.Vector3 {
	if (!obj.object3d) return new THREE.Vector3(0.5, 0.5, 0.5)
	const box = new THREE.Box3().setFromObject(obj.object3d)
	const size = box.getSize(new THREE.Vector3())
	const halfExtents = size.multiplyScalar(0.5)
	const center = box.getCenter(new THREE.Vector3())
	const offset = new THREE.Vector3(
		center.x - obj.object3d.position.x,
		center.y - obj.object3d.position.y,
		center.z - obj.object3d.position.z,
	)
	makeCollisionBox(obj, halfExtents, offset)
	return halfExtents
}
export function makeCollisionBox(
	obj: ManagedObject,
	halfExtents: THREE.Vector3 = new THREE.Vector3(0.5, 0.5, 0.5),
	offset: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
): void {
	obj.extraData.isCollisionBox = true
	obj.extraData.collisionHalfExtents = { x: halfExtents.x, y: halfExtents.y, z: halfExtents.z }
	obj.extraData.collisionOffset = { x: offset.x, y: offset.y, z: offset.z }
	if (!obj.extraData.velocity) obj.extraData.velocity = { x: 0, y: 0, z: 0 }
}
export function makeDynamic(obj: ManagedObject): void {
	obj.extraData.isDynamic = true
	if (!obj.extraData.velocity) obj.extraData.velocity = { x: 0, y: 0, z: 0 }
}
export function makeStatic(obj: ManagedObject): void {
	obj.extraData.isDynamic = false
	obj.extraData.useGravity = false
}
export function makeCollisionPlane(
	obj: ManagedObject,
	normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0),
	offsetAlongNormal = 0,
): void {
	obj.extraData.isCollisionPlane = true
	obj.extraData.planeNormal = normal
	obj.extraData.planeOffset = offsetAlongNormal
}

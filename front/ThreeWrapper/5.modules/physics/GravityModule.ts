import * as THREE from 'three'
import { Logger } from '../../1.engine/Logger'
import type { Module, EngineContext } from '../Module'
import { ManagedObject } from '@/ThreeWrapper/2.world/tools/ObjectManager'
export interface GravityConfig {
	acceleration?: number
}
export type GravityObject = {
	obj: THREE.Object3D
	velocity: THREE.Vector3
}
export class GravityModule implements Module {
	readonly type = 'gravity'
	private context: EngineContext | null = null
	private config: Required<GravityConfig>
	constructor(config: GravityConfig = {}) {
		this.config = {
			acceleration: config.acceleration ?? -9.81,
		}
	}
	init(context: EngineContext): void {
		this.context = context
		const log = context.logger?.for(this.type)
		log?.logVariable('acceleration', this.config.acceleration)
	}
	update(delta: number): void {
		if (!this.context) return
		const accel = this.config.acceleration
		const allObjects = this.context.world.objects.getAll()
		for (const managedObj of allObjects) {
			if (managedObj.object3d && (managedObj.extraData.useGravity as boolean)) {
				updateGravityObject(managedObj, delta, accel)
			}
		}
		const logger = Logger.getInstance()
		if (logger.isDebugFeatureEnabled('logPhysicsState') && logger.shouldLogThisFrame()) {
			const log = logger.for(this.type)
			for (const managedObj of allObjects) {
				if (managedObj.object3d && (managedObj.extraData.useGravity as boolean)) {
					log.logVariable(`${managedObj.id}.pos`, managedObj.object3d.position)
					log.logVariable(`${managedObj.id}.vel`, managedObj.extraData.velocity)
				}
			}
		}
	}
	dispose(): void {
		this.context = null
	}
}
export function applyGravity(obj: ManagedObject, _acceleration: number = -9.81,): void {
	obj.extraData.useGravity = true
	obj.extraData.velocity = obj.extraData.velocity ?? { x: 0, y: 0, z: 0 }
}
export function updateGravityObject(obj: ManagedObject,delta: number,acceleration: number = -9.81,): void {
	if (!obj.object3d) return
	const vel = obj.extraData.velocity as { x: number; y: number; z: number }
	vel.y += acceleration * delta
	obj.object3d.position.x += vel.x * delta
	obj.object3d.position.y += vel.y * delta
	obj.object3d.position.z += vel.z * delta
}

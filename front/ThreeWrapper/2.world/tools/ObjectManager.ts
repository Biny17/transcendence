import * as THREE from 'three'
export type ObjectType =
	| 'player'
	| 'npc'
	| 'map'
export type HitboxShape =
	| { kind: 'box'; size: THREE.Vector3 }
	| { kind: 'sphere'; radius: number }
	| { kind: 'capsule'; radius: number; height: number }
export type ManagedObject = {
	id: string
	name?: string
	type: ObjectType
	object3d?: THREE.Object3D
	hitbox?: HitboxShape
	extraData: Record<string, unknown>
}
export type ManagedObjectInput = {
	type: ObjectType
	name?: string
	object3d?: THREE.Object3D
	hitbox?: HitboxShape
	extraData?: Record<string, unknown>
}
export class ObjectManager {
	private readonly scene: THREE.Scene
	private readonly registry = new Map<ObjectType, Map<string, ManagedObject>>()
	constructor(scene: THREE.Scene) {
		this.scene = scene
	}
	private generateId(): string {
		return `obj_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
	}
	add(obj: ManagedObjectInput): string {
		const id = this.generateId()
		const managedObj: ManagedObject = { ...obj, id, extraData: obj.extraData || {} }
		if (!this.registry.has(managedObj.type)) {
			this.registry.set(managedObj.type, new Map())
		}
		this.registry.get(managedObj.type)!.set(id, managedObj)
		if (managedObj.object3d) this.scene.add(managedObj.object3d)
		return id
	}
	attachObject3d(id: string, object3d: THREE.Object3D): void {
		const entry = this.getById(id)
		if (!entry) {
			console.warn(`[ObjectManager] attachObject3d: unknown id "${id}"`)
			return
		}
		if (entry.object3d) this.scene.remove(entry.object3d)
		entry.object3d = object3d
		this.scene.add(object3d)
	}
	remove(id: string): void {
		const entry = this.getById(id)
		if (!entry) return
		if (entry.object3d) this.scene.remove(entry.object3d)
		this.registry.get(entry.type)?.delete(id)
	}
	get(name: string): ManagedObject | undefined {
		for (const typeMap of this.registry.values()) {
			for (const obj of typeMap.values()) {
				if (obj.name === name) return obj
			}
		}
		return undefined
	}
	getById(id: string): ManagedObject | undefined {
		for (const typeMap of this.registry.values()) {
			const obj = typeMap.get(id)
			if (obj) return obj
		}
		return undefined
	}
	getByType(type: ObjectType): ManagedObject[] {
		return [...(this.registry.get(type)?.values() ?? [])]
	}
	getAll(): ManagedObject[] {
		const all: ManagedObject[] = []
		for (const typeMap of this.registry.values()) {
			all.push(...typeMap.values())
		}
		return all
	}
	has(id: string): boolean {
		for (const typeMap of this.registry.values()) {
			if (typeMap.has(id)) return true
		}
		return false
	}
	setExtra(id: string, key: string, value: unknown): void {
		const entry = this.getById(id)
		if (!entry) return
		entry.extraData = { ...entry.extraData, [key]: value }
	}
	getExtra<T>(id: string, key: string): T | undefined {
		return this.getById(id)?.extraData?.[key] as T | undefined
	}
	dispose(): void {
		for (const typeMap of this.registry.values()) {
			for (const entry of typeMap.values()) {
				if (entry.object3d) this.scene.remove(entry.object3d)
			}
		}
		this.registry.clear()
	}
}

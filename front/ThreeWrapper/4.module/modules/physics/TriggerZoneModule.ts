import type { Module, WorldContext } from "@/ThreeWrapper/4.module";
import type { Zone, ZoneShape } from "@/ThreeWrapper/2.world/tools/PhysicsWorld";
import type { ManagedObject, ObjectManager } from "@/ThreeWrapper/2.world/tools";
export type TriggerDef = {
	id: string;
	center: { x: number; y: number; z: number };
	shape: ZoneShape;
	onEnter?: (obj: ManagedObject) => void;
	onExit?: (obj: ManagedObject) => void;
	once?: boolean;
};
export type TriggerZoneModuleOptions = {
	triggers?: TriggerDef[];
};
export class TriggerZoneModule implements Module {
	readonly type = "trigger_zone";
	private ctx: WorldContext | null = null;
	private triggers: TriggerDef[] = [];
	private firedOnce: Set<string> = new Set();
	constructor(options: TriggerZoneModuleOptions = {}) {
		this.triggers = options.triggers ?? [];
	}
	init(ctx: WorldContext): void {
		this.ctx = ctx;
		for (const trigger of this.triggers) {
			this.registerTrigger(ctx.objects, trigger);
		}
	}
	addTrigger(trigger: TriggerDef): void {
		this.triggers.push(trigger);
		if (this.ctx) this.registerTrigger(this.ctx.objects, trigger);
	}
	removeTrigger(triggerId: string): void {
		this.triggers = this.triggers.filter((t) => t.id !== triggerId);
		this.ctx?.objects.removeZone(`trigger_${triggerId}`);
		this.firedOnce.delete(triggerId);
	}
	private registerTrigger(objects: ObjectManager, trigger: TriggerDef): void {
		const zone: Zone = {
			id: `trigger_${trigger.id}`,
			center: trigger.center,
			shape: trigger.shape,
			onEnter: (obj) => {
				if (trigger.once && this.firedOnce.has(trigger.id)) return;
				if (trigger.once) this.firedOnce.add(trigger.id);
				trigger.onEnter?.(obj);
			},
			onExit: (obj) => {
				trigger.onExit?.(obj);
			}
		};
		objects.addZone(zone);
	}
	resetOnce(triggerId?: string): void {
		if (triggerId) this.firedOnce.delete(triggerId);
		else this.firedOnce.clear();
	}
	update(_delta: number): void {}
	dispose(): void {
		if (this.ctx) {
			for (const trigger of this.triggers) {
				this.ctx.objects.removeZone(`trigger_${trigger.id}`);
			}
		}
		this.triggers = [];
		this.firedOnce.clear();
		this.ctx = null;
	}
}

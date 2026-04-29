import { ManagedObject, OBJECT_TYPE } from "@/ThreeWrapper/2.world/tools";
import { ModuleKey, type Module, type WorldContext } from "../../ModuleClass";
import { forEach } from "jszip";
import { TriggerZoneModule } from "../physics/TriggerZoneModule";
export type EndLineModuleOptions = {
	enabled?: boolean;
	exampleOption?: string;
};
export class EndlineModule implements Module {
	readonly type = "endline";
	private ctx: WorldContext | null = null;
	readonly requires = [ModuleKey.triggerZone] as const;
	private options: Required<EndLineModuleOptions>;
	constructor(options: EndLineModuleOptions = {}, ...requires: [typeof ModuleKey.triggerZone]) {
		this.options = {
			enabled: options.enabled ?? true,
			exampleOption: options.exampleOption ?? "default"
		};
	}
	init(ctx: WorldContext): void | Promise<void> {
		this.ctx = ctx;
		const endlineObj: ManagedObject<OBJECT_TYPE.MAP> | undefined = this.ctx.objects.getById("floor_end", OBJECT_TYPE.MAP);
		if (!endlineObj) return;
		const trigger = ctx.getModule<TriggerZoneModule>(ModuleKey.triggerZone);
		const piece = endlineObj.pieces[0];
		if (!piece) return;
		const pos = piece.asset.position;
		trigger?.addTrigger({
			id: endlineObj.id,
			center: { x: pos.x, y: pos.y, z: pos.z },
			shape: { kind: "box", halfExtents: { x: 10, y: 2, z: 10 } },
			onEnter: (obj) => {
				this.win(obj);
			}
		});
	}
	update(delta: number): void {
		if (!this.options.enabled || !this.ctx) return;
	}
	dispose(): void {
		this.ctx = null;
	}
	win(obj: ManagedObject): void {
		console.log(obj.id === this.ctx?.selfWorldPlayer?.id);
		if (obj.id === this.ctx?.selfWorldPlayer?.id) this.ctx?.server?.send.playerWon();
	}
}

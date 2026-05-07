import { ManagedObject, OBJECT_TYPE } from "@/ThreeWrapper/2.world/tools";
import { ModuleKey, type Module, type WorldContext } from "../../ModuleClass";
import { TriggerZoneModule } from "../physics/TriggerZoneModule";

export type WinZoneModuleOptions = {
	enabled?: boolean;
};

export class WinZoneModule implements Module {
	readonly type = "win_zone";
	private ctx: WorldContext | null = null;
	readonly requires = [ModuleKey.triggerZone] as const;
	private options: Required<WinZoneModuleOptions>;

	constructor(options: WinZoneModuleOptions = {}, ...requires: [typeof ModuleKey.triggerZone]) {
		this.options = {
			enabled: options.enabled ?? true,
		};
	}

	init(ctx: WorldContext): void | Promise<void> {
		this.ctx = ctx;
		if (!this.options.enabled) return;

		const trigger = ctx.getModule<TriggerZoneModule>(ModuleKey.triggerZone);
		if (!trigger) return;

		const crowns = ctx.objects.getAll().filter(
			(obj) => obj.type === OBJECT_TYPE.MAP && obj.componentId === "utils_win_crown"
		);

		for (const crown of crowns) {
			const piece = crown.pieces[0];
			if (!piece) continue;
			const pos = piece.asset.position;
			trigger.addTrigger({
				id: `win_${crown.id}`,
				center: { x: pos.x, y: pos.y, z: pos.z },
				shape: { kind: "box", halfExtents: { x: 3, y: 3, z: 3 } },
				onEnter: (obj) => {
					this.win(obj);
				},
			});
		}
	}

	update(_delta: number): void {}

	dispose(): void {
		this.ctx = null;
	}

	win(obj: ManagedObject): void {
		console.log(obj.id === this.ctx?.selfWorldPlayer?.id);
		if (obj.id === this.ctx?.selfWorldPlayer?.id) this.ctx?.server?.send.playerWon();
	}
}

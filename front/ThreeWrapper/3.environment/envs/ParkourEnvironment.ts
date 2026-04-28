import {
	ResizeModule,
	PlayerControlModule,
	EscapeUIModule,
	EndlineModule,
	InputModule,
	ModuleKey,
	SkyboxModule,
	PlayerAnimationModule,
	RagdollModule,
	TriggerZoneModule,
	TPVModule,
	RespawnModule,
	CheckpointModule,
	PlayerBodyModule,
	FPVModule,
	AntiFallModule,
	PlayerSyncModule,
	LagCompensationModule
} from "@/ThreeWrapper/4.module";
import { Environment } from "../EnvironmentClass";
export class ParkourEnvironement extends Environment {
	constructor() {
		super({ id: "online" });
		this.addModule(new ResizeModule());
		this.addModule(new InputModule({ enablePointerLock: true }));
		this.addModule(new PlayerBodyModule({ size: 4.93 }));
		this.addModule(new RespawnModule({ fallThresholdY: -10 }));
		this.addModule(new AntiFallModule({ fallThresholdY: -20 }));
		this.addModule(new CheckpointModule());
		this.addModule(new PlayerControlModule({ moveSpeed: 10 }, ModuleKey.input));
		this.addModule(new PlayerSyncModule());
		this.addModule(new LagCompensationModule());
		this.addModule(new PlayerAnimationModule());
		this.addModule(new RagdollModule());
		this.addModule(new EscapeUIModule(ModuleKey.ui, ModuleKey.input));
		this.addModule(new TriggerZoneModule());
		this.addModule(new TPVModule({}, ModuleKey.input));
		this.addModule(new EndlineModule({}, ModuleKey.triggerZone));
	}
}

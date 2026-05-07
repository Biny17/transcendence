import { ResizeModule, PlayerControlModule, InputModule, ModuleKey, PlayerAnimationModule, RagdollModule, TriggerZoneModule, RespawnModule, CheckpointModule, PlayerBodyModule, FPVModule, AntiFallModule, TPVModule } from "@/ThreeWrapper/4.module";
import { Environment } from "../EnvironmentClass";
export class EditorTestEnvironment extends Environment {
	constructor() {
		super({ id: "editor_test" });
		this.addModule(new ResizeModule());
		this.addModule(new InputModule({ enablePointerLock: true }));
		this.addModule(new PlayerBodyModule({ size: 4.93 }));
		this.addModule(new RespawnModule({ fallThresholdY: -10 }));
		this.addModule(new AntiFallModule({ fallThresholdY: -20 }));
		this.addModule(new CheckpointModule());
		this.addModule(new PlayerControlModule({ moveSpeed: 10 }, ModuleKey.input));
		this.addModule(new PlayerAnimationModule());
		this.addModule(new RagdollModule());
		this.addModule(new TriggerZoneModule());
		this.addModule(new TPVModule({}, ModuleKey.input));
	}
}

import { ResizeModule, PlayerControlModule, EscapeUIModule, InputModule, ModuleKey, SkyboxModule, PlayerAnimationModule, RagdollModule } from "@/ThreeWrapper/4.module";
import { Environment } from "../EnvironmentClass";
export class OnlineEnvironement extends Environment {
	constructor() {
		super({ id: "online" });
		this.addModule(new SkyboxModule({ preset: "day" }));
		this.addModule(new ResizeModule());
		this.addModule(new InputModule());
		this.addModule(new PlayerControlModule({ moveSpeed: 5 }, ModuleKey.input));
		this.addModule(new PlayerAnimationModule());
		this.addModule(new RagdollModule());
		this.addModule(new EscapeUIModule(ModuleKey.ui, ModuleKey.input));
	}
}

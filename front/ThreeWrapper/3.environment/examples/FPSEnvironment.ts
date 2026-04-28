import { Environment } from '../EnvironmentClass'
import { ResizeModule } from '@/ThreeWrapper/4.module/modules/rendering/ResizeModule'
import { InputModule } from '@/ThreeWrapper/4.module/modules/input/InputModule'
import { PlayerControlModule, ModuleKey } from '@/ThreeWrapper/4.module'
export class FPSEnvironment extends Environment {
  constructor() {
    super({ id: 'fps' })
    this.addModule(new ResizeModule())
    this.addModule(new InputModule())
    this.addModule(new PlayerControlModule({ moveSpeed: 5 }, ModuleKey.input))
  }
}

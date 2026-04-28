import { Environment } from '../EnvironmentClass'
import { ResizeModule } from '@/ThreeWrapper/4.module/modules/rendering/ResizeModule'
import { InputModule } from '@/ThreeWrapper/4.module/modules/input/InputModule'
import { PlayerControlModule, ModuleKey } from '@/ThreeWrapper/4.module'
import { NetworkPlayerModule } from '@/ThreeWrapper/4.module/examples/NetworkPlayerModule'
export class NetworkEnvironment extends Environment {
  constructor() {
    super({ id: 'network' })
    this.addModule(new ResizeModule())
    this.addModule(new InputModule())
    this.addModule(new PlayerControlModule({}, ModuleKey.input))
    this.addModule(new NetworkPlayerModule())
  }
}

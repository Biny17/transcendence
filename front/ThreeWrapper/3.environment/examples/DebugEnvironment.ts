import { Environment } from '../EnvironmentClass'
import { ResizeModule } from '@/ThreeWrapper/4.module/modules/rendering/ResizeModule'
import { InputModule } from '@/ThreeWrapper/4.module/modules/input/InputModule'
import { FreecamModule } from '@/ThreeWrapper/4.module/modules/camera/FreecamModule'
export class DebugEnvironment extends Environment {
  constructor() {
    super({ id: 'debug' })
    this.addModule(new ResizeModule())
    this.addModule(new InputModule())
    this.addModule(new FreecamModule())
  }
}

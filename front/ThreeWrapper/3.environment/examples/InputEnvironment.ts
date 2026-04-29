import { Environment } from '../EnvironmentClass'
import { ResizeModule } from '@/ThreeWrapper/4.module/modules/rendering/ResizeModule'
import { InputModule } from '@/ThreeWrapper/4.module/modules/input/InputModule'
export class InputEnvironment extends Environment {
  constructor() {
    super({ id: 'input' })
    this.addModule(new ResizeModule())
    this.addModule(new InputModule())
  }
}

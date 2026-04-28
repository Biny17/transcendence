import { Environment } from '../EnvironmentClass'
import { ResizeModule } from '@/ThreeWrapper/4.module/modules/rendering/ResizeModule'
import { ObjectInteractionModule } from '@/ThreeWrapper/4.module/examples/ObjectInteractionModule'
export class InteractiveEnvironment extends Environment {
  constructor() {
    super({ id: 'interactive' })
    this.addModule(new ResizeModule())
    this.addModule(new ObjectInteractionModule())
  }
}

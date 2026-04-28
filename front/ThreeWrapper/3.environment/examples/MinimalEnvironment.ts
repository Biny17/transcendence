import { Environment } from '../EnvironmentClass'
import { ResizeModule } from '@/ThreeWrapper/4.module/modules/rendering/ResizeModule'
export class MinimalEnvironment extends Environment {
  constructor() {
    super({ id: 'minimal' })
    this.addModule(new ResizeModule())
  }
}

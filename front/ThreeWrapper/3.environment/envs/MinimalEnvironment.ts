import { ResizeModule } from '@/ThreeWrapper/4.module/modules/rendering/ResizeModule'
import { Environment } from '@/ThreeWrapper/3.environment/EnvironmentClass'
export class MinimalEnvironment extends Environment {
  constructor() {
    super({ id: 'minimal' })
    this.addModule(new ResizeModule())
  }
}

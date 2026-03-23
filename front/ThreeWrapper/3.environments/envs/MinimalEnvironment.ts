import { ResizeModule } from '@/ThreeWrapper/5.modules/rendering/ResizeModule'
import { Environment } from '@/ThreeWrapper/3.environments/EnvironmentClass'
export class MinimalEnvironment extends Environment {
  constructor() {
    super({ id: 'minimal' })
    this.addModule(new ResizeModule())
  }
}

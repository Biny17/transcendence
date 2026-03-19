import { ResizeModule } from '../5.modules/rendering/ResizeModule'
import { Environment } from '../EnvironmentClass'
export class MinimalEnvironment extends Environment {
  constructor() {
    super({ id: 'minimal' })
    this.addModule(new ResizeModule())
  }
}

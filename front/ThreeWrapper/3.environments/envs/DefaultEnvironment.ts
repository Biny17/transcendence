import { CollisionModule,ResizeModule,GravityModule, UIModule, SkyboxModule } from '../../5.modules/index'
import { Environment } from '../EnvironmentClass'
import { UIExtension } from '../../4.extensions/UIExtension'
export class DefaultEnvironment extends Environment {
  constructor() {
    super({
      id: 'default',
      gravity: { x: 0, y: -9.81, z: 0 },
      bounds: {
        min: { x: -50, y: -20, z: -50 },
        max: { x: 50, y: 50, z: 50 },
      },
    })
    this.addModule(new ResizeModule())
    this.addModule(new GravityModule({ acceleration: -9.81 }))
    this.addModule(new CollisionModule({ debug: false }))
    this.addModule(new UIModule());
    this.addExtension(new UIExtension());
  }
}

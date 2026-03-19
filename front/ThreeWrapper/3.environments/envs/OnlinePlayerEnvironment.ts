import { CollisionModule } from '../5.modules/physics/CollisionModule'
import { GravityModule } from '../5.modules/physics/GravityModule'
import { TeamModule } from '../5.modules/players/TeamModule'
import { ResizeModule } from '../5.modules/rendering/ResizeModule'
import { Environment } from './EnvironmentClass'
export class OnlinePlayerEnvironment extends Environment {
  constructor() {
    super({
      id: 'online_player',
      gravity: { x: 0, y: -9.81, z: 0 },
      bounds: {
        min: { x: -100, y: -20, z: -100 },
        max: { x: 100, y: 100, z: 100 },
      },
    })
    this.addModule(new ResizeModule())
    this.addModule(new GravityModule({ acceleration: -9.81 }))
    this.addModule(new CollisionModule({ debug: false }))
    this.addModule(new TeamModule({ teams: [] }))
  }
}

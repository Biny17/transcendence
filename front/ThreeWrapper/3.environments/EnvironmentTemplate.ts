import { Environment } from './EnvironmentClass'
export class MyEnvironment extends Environment {
  constructor() {
    super({
      id: 'my_environment',
      gravity: { x: 0, y: -9.81, z: 0 },
      bounds: {
        min: { x: -100, y: -50, z: -100 },
        max: { x: 100, y: 100, z: 100 },
      },
    })
  }
}

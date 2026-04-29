import { World } from './WorldClass'
export class MyWorld extends World {
  constructor() {
    super({ id: 'my_world' })
  }
  protected override async onLoad(): Promise<void> {
  }
  protected override onStart(_initialState?: unknown): void {
  }
  protected override onDispose(): void {}
}

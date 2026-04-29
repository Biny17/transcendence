import { Environment } from '../EnvironmentClass'
import { ResizeModule, ModuleKey } from '@/ThreeWrapper/4.module'
import { CharacterOrbitCameraModule } from '@/ThreeWrapper/4.module/modules/editor/CharacterOrbitCameraModule'
import { CharacterCustomizerModule } from '@/ThreeWrapper/4.module/modules/editor/CharacterCustomizerModule'
import { CharacterCustomizerUIModule } from '@/ThreeWrapper/4.module/modules/editor/CharacterCustomizerUIModule'
export class CharacterCustomizerEnvironment extends Environment {
  constructor() {
    super({})
    this.addModule(new ResizeModule())
    this.addModule(new CharacterOrbitCameraModule())
    this.addModule(new CharacterCustomizerModule())
    this.addModule(new CharacterCustomizerUIModule())
  }
}

import { Environment } from '../EnvironmentClass'
import { ResizeModule, ModuleKey } from '@/ThreeWrapper/4.module'
import { EditorOrbitCameraModule } from '@/ThreeWrapper/4.module/modules/editor/EditorOrbitCameraModule'
import { EditorPlacementModule } from '@/ThreeWrapper/4.module/modules/editor/EditorPlacementModule'
import { EditorHotbarModule } from '@/ThreeWrapper/4.module/modules/editor/EditorHotbarModule'
export class EditorEnvironment extends Environment {
  constructor() {
    super({})
    this.addModule(new ResizeModule())
    this.addModule(new EditorOrbitCameraModule())
    this.addModule(new EditorPlacementModule())
    this.addModule(new EditorHotbarModule(ModuleKey.ui, ModuleKey.editorPlacement))
  }
}

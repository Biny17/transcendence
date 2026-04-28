import { Environment } from '../EnvironmentClass'
import { ResizeModule, ModuleKey } from '@/ThreeWrapper/4.module'
import { ComponentOrbitCameraModule } from '@/ThreeWrapper/4.module/modules/editor/ComponentOrbitCameraModule'
import { ComponentPreviewModule } from '@/ThreeWrapper/4.module/modules/editor/ComponentPreviewModule'
import { ComponentCreatorUIModule } from '@/ThreeWrapper/4.module/modules/editor/ComponentCreatorUIModule'
export class ComponentCreatorEnvironment extends Environment {
  constructor() {
    super({})
    this.addModule(new ResizeModule())
    this.addModule(new ComponentOrbitCameraModule())
    this.addModule(new ComponentPreviewModule())
    this.addModule(new ComponentCreatorUIModule(ModuleKey.ui, ModuleKey.componentCreatorPreview))
  }
}

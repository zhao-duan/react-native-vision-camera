import {
  RNPackage,
  TurboModulesFactory,
} from "@rnoh/react-native-openharmony/ts";
import type {
  TurboModule,
  TurboModuleContext,
} from "@rnoh/react-native-openharmony/ts";
import { VisionCameraModule } from './VisionCameraModule';
import { VisionCameraModuleSpec } from './types/VisionCameraModuleSpec';

class VisionCameraModulesFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (name === VisionCameraModuleSpec.NAME) {
      return new VisionCameraModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === VisionCameraModuleSpec.NAME;
  }
}

export class VisionCameraModulePackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new VisionCameraModulesFactory(ctx);
  }
}

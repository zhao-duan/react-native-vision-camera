import { RNPackage } from '@rnoh/react-native-openharmony/ts';
import type {
  DescriptorWrapperFactoryByDescriptorTypeCtx,
  DescriptorWrapperFactoryByDescriptorType
} from '@rnoh/react-native-openharmony/ts';
import { VisionCameraViewSpec } from './types/VisionCameraViewSpec';

export class VisionCameraViewPackage extends RNPackage {
  createDescriptorWrapperFactoryByDescriptorType(ctx: DescriptorWrapperFactoryByDescriptorTypeCtx): DescriptorWrapperFactoryByDescriptorType {
    return {
      [VisionCameraViewSpec.NAME]: (ctx) => new VisionCameraViewSpec.DescriptorWrapper(ctx.descriptor)
    }
  }
}

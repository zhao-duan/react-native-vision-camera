// This file was generated.
import { Tag } from "@rnoh/react-native-openharmony/ts"

export namespace VisionCameraModuleSpec {
  export const NAME = 'VisionCameraModule' as const

  export interface Spec {
    getAvailableCameraDevices(): unknown[];

    addCameraDevicesChangedListener(listener: (newDevices: unknown[]) => void): Object;

    getCameraPermissionStatus(): string;

    requestCameraPermission(): Promise<string>;

    getMicrophonePermissionStatus(): string;

    requestMicrophonePermission(): Promise<string>;

    getLocationPermissionStatus(): string;

    requestLocationPermission(): Promise<string>;

  }
}

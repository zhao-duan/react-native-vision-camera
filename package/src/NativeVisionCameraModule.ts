import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import { CameraDevice } from './types/CameraDevice';

export type CameraPermissionStatus = 'granted' | 'not-determined' | 'denied' | 'restricted'
export type CameraPermissionRequestResult = 'granted' | 'denied'

export type CameraDevicesChangedCallback = (newDevices: CameraDevice[]) => void;
export type CameraDevicesChangedReturn = unknown;

export interface Spec extends TurboModule {
    getAvailableCameraDevices: () => CameraDevice[];
    addCameraDevicesChangedListener: (listener: CameraDevicesChangedCallback) => CameraDevicesChangedReturn;
    getCameraPermissionStatus: () => CameraPermissionStatus;
    requestCameraPermission: () => Promise<CameraPermissionRequestResult>;
    getMicrophonePermissionStatus: () => CameraPermissionStatus;
    requestMicrophonePermission: () => Promise<CameraPermissionRequestResult>;
    getLocationPermissionStatus: () => CameraPermissionStatus;
    requestLocationPermission: () => Promise<CameraPermissionRequestResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('VisionCameraModule');

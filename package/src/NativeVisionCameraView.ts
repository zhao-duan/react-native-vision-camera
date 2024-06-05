/*
 * MIT License
 *
 * Copyright (C) Huawei Technologies Co.,Ltd. 2024. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import type { ViewProps } from "react-native/Libraries/Components/View/ViewPropTypes";;
import type { HostComponent } from "react-native";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";
import { BubblingEventHandler, Float, Int32, WithDefault } from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeCommands from "react-native/Libraries/Utilities/codegenNativeCommands";
import { PhotoFile } from "./types/PhotoFile";
import { Code, CodeScannerFrame } from "./types/CodeScanner";
import { Point } from "./types/Point";
import { RecordVideoOptions } from "./types/VideoFile";

export interface TakePhotoOptions {
  flash?: WithDefault<'on' | 'off' | 'auto', 'auto'>
  enableAutoRedEyeReduction?: WithDefault<boolean, false>;
  enableAutoDistortionCorrection?: WithDefault<boolean, false>;
  enableShutterSound?: WithDefault<boolean, true>;
}

type Orientation = WithDefault<'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right', 'portrait'>
type AutoFocusSystem = WithDefault<'contrast-detection' | 'phase-detection' | 'none', 'contrast-detection'>
type VideoStabilizationMode = 'off' | 'standard' | 'cinematic' | 'cinematic-extended' | 'auto';
type CameraPosition = WithDefault<'front' | 'back' | 'external', 'front'>
type PhysicalCameraDeviceType = 'ultra-wide-angle-camera' | 'wide-angle-camera' | 'telephoto-camera'

interface CameraDeviceFormat {
  photoHeight: Int32
  photoWidth: Int32
  videoHeight: Int32
  videoWidth: Int32
  maxISO: Int32
  minISO: Int32
  fieldOfView: Int32
  supportsVideoHdr: boolean
  supportsPhotoHdr: boolean
  supportsDepthCapture: boolean
  minFps: Int32
  maxFps: Int32
  autoFocusSystem?: AutoFocusSystem
  videoStabilizationModes?: WithDefault<ReadonlyArray<VideoStabilizationMode>, null>
}

interface CameraDevice {
  id: string
  physicalDevices?: WithDefault<ReadonlyArray<PhysicalCameraDeviceType>, null>
  position?: CameraPosition
  name: string
  hasFlash: boolean
  hasTorch: boolean
  minFocusDistance: Int32
  isMultiCam: boolean
  minZoom: Float
  maxZoom: Float
  neutralZoom: Float
  minExposure: Float
  maxExposure: Float
  formats: CameraDeviceFormat[]
  supportsLowLightBoost: boolean
  supportsRawCapture: boolean
  supportsFocus: boolean
  hardwareLevel?: WithDefault<'legacy' | 'limited' | 'full', 'legacy'>
  sensorOrientation?: Orientation
}

type CodeType =
  | 'code-128'
  | 'code-39'
  | 'code-93'
  | 'codabar'
  | 'ean-13'
  | 'ean-8'
  | 'itf'
  | 'upc-e'
  | 'upc-a'
  | 'qr'
  | 'pdf-417'
  | 'aztec'
  | 'data-matrix'

interface CodeScanner {
  codeTypes?: WithDefault<ReadonlyArray<CodeType>, null>;
  onCodeScanned: (codes: Code[], frame: CodeScannerFrame) => void
  regionOfInterest?: {
    x: Int32
    y: Int32
    width: Int32
    height: Int32
  }
}

export interface NativeVisionCameraProps extends ViewProps {
  codeScanner?: CodeScanner;
  fps?: WithDefault<Int32, 30>;
  videoHdr?: WithDefault<boolean, false>;
  isActive: boolean;
  preview?: WithDefault<boolean, true>;
  device?: CameraDevice;
  resizeMode?: WithDefault<'cover' | 'contain', 'cover'>;
  enableZoomGesture?: WithDefault<boolean, false>;
  exposure?: WithDefault<Int32, 0>;
  zoom?: WithDefault<Float, 1.0>;
  audio?: WithDefault<boolean, false>;
  video?: WithDefault<boolean, false>;
  torch?: WithDefault<'off' | 'on', 'off'>;
  photo?: WithDefault<boolean, true>;
  videoStabilizationMode?: WithDefault<VideoStabilizationMode, 'auto'>;
  androidPreviewViewType?: WithDefault<'surface-view' | 'texture-view', 'surface-view'>;
  enableLocation?: WithDefault<boolean, false>;
  photoQualityBalance?: WithDefault<'speed' | 'balanced' | 'quality', 'balanced'>;
  onStarted?: BubblingEventHandler<Readonly<{}>>;
  onStopped?: BubblingEventHandler<Readonly<{}>>;
  onInitialized?: BubblingEventHandler<Readonly<{}>>;
  onShutter?: BubblingEventHandler<{ type: 'photo' | 'snapshot' }>;
  onError?: BubblingEventHandler<{ error: string }>;
  onCodeScanned?: (codes: Code[], frame: CodeScannerFrame) => void;
}

// export interface Point 
export type VisionCameraComponentType = HostComponent<NativeVisionCameraProps>
export interface VisionCameraCommandsType {
  requestLocationPermission(viewRef: React.ElementRef<VisionCameraComponentType>): any;
  getLocationPermissionStatus(viewRef: React.ElementRef<VisionCameraComponentType>): any;
  requestMicrophonePermission(viewRef: React.ElementRef<VisionCameraComponentType>): any;
  getMicrophonePermissionStatus(viewRef: React.ElementRef<VisionCameraComponentType>): any;
  requestCameraPermission(viewRef: React.ElementRef<VisionCameraComponentType>): any;
  getCameraPermissionStatus(viewRef: React.ElementRef<VisionCameraComponentType>): any;
  addCameraDevicesChangedListener(viewRef: React.ElementRef<VisionCameraComponentType>): any;
  getAvailableCameraDevices(viewRef: React.ElementRef<VisionCameraComponentType>): any;
  takePhoto: (viewRef: React.ElementRef<VisionCameraComponentType>, options?: TakePhotoOptions) => Promise<PhotoFile>;
  focus: (viewRef: React.ElementRef<VisionCameraComponentType>, point: Point) => Promise<void>;
  setIsActive: (viewRef: React.ElementRef<VisionCameraComponentType>, isActive: boolean) => Promise<void>;
  startRecording: (viewRef: React.ElementRef<VisionCameraComponentType>, options: RecordVideoOptions) => void;
  stopRecording: (viewRef: React.ElementRef<VisionCameraComponentType>) => void;
  pauseRecording: (viewRef: React.ElementRef<VisionCameraComponentType>) => void;
  resumeRecording: (viewRef: React.ElementRef<VisionCameraComponentType>) => void;
  cancelRecording: (viewRef: React.ElementRef<VisionCameraComponentType>) => void;
}

export const VisionCameraCommands: VisionCameraCommandsType = codegenNativeCommands<VisionCameraCommandsType>({
  supportedCommands: [
    'takePhoto',
    'focus',
    'setIsActive',
    'startRecording',
    'stopRecording',
    'pauseRecording',
    'resumeRecording',
    'cancelRecording',
    'getAvailableCameraDevices',
    'addCameraDevicesChangedListener',
    'getCameraPermissionStatus',
    'requestCameraPermission',
    'getMicrophonePermissionStatus',
    'requestMicrophonePermission',
    'getLocationPermissionStatus',
    'requestLocationPermission',
  ],
});

export default codegenNativeComponent<NativeVisionCameraProps>(
  "VisionCameraView"
) as VisionCameraComponentType;

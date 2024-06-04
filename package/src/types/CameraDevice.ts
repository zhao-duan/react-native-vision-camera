import type { Orientation } from './Orientation'

export type CameraPosition = 'front' | 'back' | 'external'

export type PhysicalCameraDeviceType = 'ultra-wide-angle-camera' | 'wide-angle-camera' | 'telephoto-camera'

export type AutoFocusSystem = 'contrast-detection' | 'phase-detection' | 'none'

export type VideoStabilizationMode = 'off' | 'standard' | 'cinematic' | 'cinematic-extended' | 'auto'
export interface CameraDeviceFormat {

  photoHeight: number

  photoWidth: number

  videoHeight: number

  videoWidth: number

  maxISO: number

  minISO: number

  fieldOfView: number

  supportsVideoHdr: boolean

  supportsPhotoHdr: boolean

  supportsDepthCapture: boolean

  minFps: number

  maxFps: number

  autoFocusSystem: AutoFocusSystem

  videoStabilizationModes: VideoStabilizationMode[]
}


export interface CameraDevice {

  id: string

  physicalDevices: PhysicalCameraDeviceType[]

  position: CameraPosition

  name: string

  hasFlash: boolean

  hasTorch: boolean

  minFocusDistance: number

  isMultiCam: boolean

  minZoom: number

  maxZoom: number

  neutralZoom: number

  minExposure: number

  maxExposure: number

  formats: CameraDeviceFormat[]

  supportsLowLightBoost: boolean

  supportsRawCapture: boolean

  supportsFocus: boolean

  hardwareLevel: 'legacy' | 'limited' | 'full'

  sensorOrientation: Orientation
}

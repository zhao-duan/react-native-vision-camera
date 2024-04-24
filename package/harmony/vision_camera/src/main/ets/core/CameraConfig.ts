import { Orientation } from "./CameraEnumBox"
import { Permissions } from '@kit.AbilityKit';
import { ErrorWithCause } from '../types/CameraError';

/**
 * VC坐标系(x,y)-> OH坐标系(x/w,y/h)
 * vision-camera：这应该与相机视图的坐标系相关，并以点表示。(0, 0) 表示左上角，(CameraView.width, CameraView.height) 表示右下角。请确保该值不超过 CameraView 的尺寸
 * harmony：焦点应在0-1坐标系内，该坐标系左上角为{0，0}，右下角为{1，1}
 */
export interface Point {
  x: number;
  y: number;
}


export interface TakePhotoOptions {
  /**
   * Whether the Flash should be enabled or disabled
   *
   * @default "auto"
   */
  flash?: 'on' | 'off' | 'auto'
  /**
   * Specifies whether red-eye reduction should be applied automatically on flash captures.
   *
   * @platform iOS
   * @default false
   */
  enableAutoRedEyeReduction?: boolean
  /**
   * Specifies whether the photo output should use content aware distortion correction on this photo request.
   * For example, the algorithm may not apply correction to faces in the center of a photo, but may apply it to faces near the photo’s edges.
   *
   * @platform iOS
   * @default false
   */
  enableAutoDistortionCorrection?: boolean
  /**
   * Whether to play the default shutter "click" sound when taking a picture or not.
   *
   * @default true
   */
  enableShutterSound?: boolean
}

export interface PhotoFile {
  /**
   * The width of the photo, in pixels.
   */
  width: number
  /**
   * The height of the photo, in pixels.
   */
  height: number
  /**
   * Whether this photo is in RAW format or not.
   */
  isRawPhoto: boolean
  /**
   * Display orientation of the photo, relative to the Camera's sensor orientation.
   *
   * Note that Camera sensors are landscape, so e.g. "portrait" photos will have a value of "landscape-left", etc.
   */
  orientation: Orientation
  /**
   * Whether this photo is mirrored (selfies) or not.
   */
  isMirrored: boolean
  thumbnail?: Record<string, unknown>
  /**
   * The path of the file.
   *
   * * **Note:** If you want to consume this file (e.g. for displaying it in an `<Image>` component), you might have to add the `file://` prefix.
   *
   * * **Note:** This file might get deleted once the app closes because it lives in the temp directory.
   */
  path: string
}
export interface ScanResult {
  codes: Code[]
  frame: CodeScannerFrame
}

export interface Code {
  type: string
  value?: string
  corners?: Point[]
  frame?: Frame
}

export interface CodeScannerFrame {
  width: number
  height: number
}

export interface Frame {
  x: number
  y: number
  width: number
  height: number
}

export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

export interface CodeScanner {
  codeTypes: CodeType[]
  onCodeScanned: (codes: Code[], frame: CodeScannerFrame) => void
}

export const PermissionArray: Array<Permissions> = [
  'ohos.permission.CAMERA',
  'ohos.permission.MEDIA_LOCATION',
  'ohos.permission.MICROPHONE',
  'ohos.permission.APPROXIMATELY_LOCATION',
  'ohos.permission.WRITE_IMAGEVIDEO',
  'ohos.permission.READ_IMAGEVIDEO',
];

export type CameraPermissionStatus = 'granted' | 'not-determined' | 'denied' | 'restricted'

export interface ScanRect {width: number, height: number}

export type CameraPermissionRequestResult = 'granted' | 'denied'

export type CodeType =
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

export interface OnErrorEvent {
  code: string
  message: string
  cause?: ErrorWithCause
}
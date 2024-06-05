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
import { Orientation } from "./CameraEnumBox"
import { Permissions } from '@kit.AbilityKit';
import { ErrorWithCause } from '../types/CameraError';

export interface Point {
  x: number;
  y: number;
}


export interface TakePhotoOptions {

  flash?: 'on' | 'off' | 'auto'

  enableAutoRedEyeReduction?: boolean

  enableAutoDistortionCorrection?: boolean

  enableShutterSound?: boolean
}

export interface PhotoFile {

  width: number

  height: number

  isRawPhoto: boolean

  orientation: Orientation

  isMirrored: boolean
  thumbnail?: Record<string, unknown>

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

export interface ScanRect {
  width: number,
  height: number
}

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
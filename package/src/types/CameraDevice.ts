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

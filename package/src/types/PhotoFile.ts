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
import type { Orientation } from '../../src/types/Orientation'
import type { TemporaryFile } from '../../src/types/TemporaryFile'

export interface TakePhotoOptions {

  flash?: 'on' | 'off' | 'auto'

  enableAutoRedEyeReduction?: boolean

  enableAutoDistortionCorrection?: boolean

  enableShutterSound?: boolean
}


export interface PhotoFile extends TemporaryFile {

  width: number

  height: number

  isRawPhoto: boolean

  orientation: Orientation

  isMirrored: boolean
  thumbnail?: Record<string, unknown>

  metadata?: {

    Orientation: number

    DPIHeight: number

    DPIWidth: number

    '{MakerApple}'?: Record<string, unknown>
    '{TIFF}': {
      ResolutionUnit: number
      Software: string
      Make: string
      DateTime: string
      XResolution: number
      /**
       * @platform iOS
       */
      HostComputer?: string
      Model: string
      YResolution: number
    }
    '{Exif}': {
      DateTimeOriginal: string
      ExposureTime: number
      FNumber: number
      LensSpecification: number[]
      ExposureBiasValue: number
      ColorSpace: number
      FocalLenIn35mmFilm: number
      BrightnessValue: number
      ExposureMode: number
      LensModel: string
      SceneType: number
      PixelXDimension: number
      ShutterSpeedValue: number
      SensingMethod: number
      SubjectArea: number[]
      ApertureValue: number
      SubsecTimeDigitized: string
      FocalLength: number
      LensMake: string
      SubsecTimeOriginal: string
      OffsetTimeDigitized: string
      PixelYDimension: number
      ISOSpeedRatings: number[]
      WhiteBalance: number
      DateTimeDigitized: string
      OffsetTimeOriginal: string
      ExifVersion: string
      OffsetTime: string
      Flash: number
      ExposureProgram: number
      MeteringMode: number
    }
  }
}

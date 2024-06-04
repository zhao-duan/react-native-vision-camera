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

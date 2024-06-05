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
export type PermissionError = 'permission/microphone-permission-denied' | 'permission/camera-permission-denied'
export type ParameterError =
  | 'parameter/invalid-parameter'
  | 'parameter/unsupported-output'
  | 'parameter/unsupported-input'
  | 'parameter/invalid-combination'
export type DeviceError =
  | 'device/configuration-error'
  | 'device/no-device'
  | 'device/invalid-device'
  | 'device/microphone-unavailable'
  | 'device/pixel-format-not-supported'
  | 'device/low-light-boost-not-supported'
  | 'device/focus-not-supported'
  | 'device/camera-not-available-on-simulator'
  | 'device/camera-already-in-use'
export type FormatError =
  | 'format/invalid-fps'
  | 'format/invalid-video-hdr'
  | 'format/photo-hdr-and-video-hdr-not-suppoted-simultaneously'
  | 'format/low-light-boost-not-supported-with-hdr'
  | 'format/invalid-video-stabilization-mode'
  | 'format/incompatible-pixel-format-with-hdr-setting'
  | 'format/invalid-format'
  | 'format/format-required'
export type SessionError =
  | 'session/camera-not-ready'
  | 'session/audio-in-use-by-other-app'
  | 'session/no-outputs'
  | 'session/audio-session-failed-to-activate'
  | 'session/hardware-cost-too-high'
  | 'session/invalid-output-configuration'
export type CodeScannerError =
  | 'code-scanner/not-compatible-with-outputs'
  | 'code-scanner/code-type-not-supported'
  | 'code-scanner/cannot-load-model'
export type CaptureError =
  | 'capture/recording-in-progress'
  | 'capture/recording-canceled'
  | 'capture/no-recording-in-progress'
  | 'capture/file-io-error'
  | 'capture/create-temp-file-error'
  | 'capture/create-recorder-error'
  | 'capture/insufficient-storage'
  | 'capture/video-not-enabled'
  | 'capture/photo-not-enabled'
  | 'capture/frame-invalid'
  | 'capture/no-data'
  | 'capture/recorder-error'
  | 'capture/focus-canceled'
  | 'capture/focus-requires-preview'
  | 'capture/timed-out'
  | 'capture/snapshot-failed'
  | 'capture/snapshot-failed-preview-not-enabled'
  | 'capture/image-data-access-error'
  | 'capture/encoder-error'
  | 'capture/invalid-image-type'
  | 'capture/failed-writing-metadata'
  | 'capture/unknown'
export type SystemError =
  | 'system/camera-module-not-found'
  | 'system/camera-is-restricted'
  | 'system/location-not-enabled'
  | 'system/no-camera-manager'
  | 'system/frame-processors-unavailable'
  | 'system/recording-while-frame-processing-unavailable'
  | 'system/view-not-found'
  | 'system/max-cameras-in-use'
  | 'system/do-not-disturb-bug'
export type UnknownError = 'unknown/unknown'

export interface ErrorWithCause {

  code?: number

  domain?: string

  message: string

  details?: Record<string, unknown>

  stacktrace?: string

  cause?: ErrorWithCause
}

type CameraErrorCode =
  | PermissionError
  | ParameterError
  | DeviceError
  | FormatError
  | SessionError
  | CaptureError
  | SystemError
  | UnknownError

class CameraError<TCode extends CameraErrorCode> extends Error {
  private readonly _code: TCode
  private readonly _message: string
  private readonly _cause?: ErrorWithCause

  public get code(): TCode {
    return this._code
  }
  public get message(): string {
    return this._message
  }
  public get cause(): Error | undefined {
    const c = this._cause
    if (c == null) return undefined
    return new Error(`[${c.code}]: ${c.message}`)
  }

  /**
   * @internal
   */
  constructor(code: TCode, message: string, cause?: ErrorWithCause) {
    super(`[${code}]: ${message}${cause != null ? ` (Cause: ${cause.message})` : ''}`)
    super.name = code
    super.message = message
    this._code = code
    this._message = message
    this._cause = cause
  }

  public toString(): string {
    return `[${this.code}]: ${this.message}`
  }
}


export class CameraCaptureError extends CameraError<CaptureError> { }

export class CameraRuntimeError extends CameraError<
  PermissionError | ParameterError | DeviceError | FormatError | SessionError | SystemError | UnknownError
> { }

export const isErrorWithCause = (error: unknown): error is ErrorWithCause =>
  typeof error === 'object' &&
  error != null &&
  // @ts-expect-error error is still unknown
  typeof error.message === 'string' &&
  // @ts-expect-error error is still unknown
  (typeof error.stacktrace === 'string' || error.stacktrace == null) &&
  // @ts-expect-error error is still unknown
  (isErrorWithCause(error.cause) || error.cause == null)

const isCameraErrorJson = (error: unknown): error is { code: string; message: string; cause?: ErrorWithCause } =>
  typeof error === 'object' &&
  error != null &&
  // @ts-expect-error error is still unknown
  typeof error.code === 'string' &&
  // @ts-expect-error error is still unknown
  typeof error.message === 'string' &&
  // @ts-expect-error error is still unknown
  (typeof error.cause === 'object' || error.cause == null)

export const tryParseNativeCameraError = <T>(nativeError: T): (CameraRuntimeError | CameraCaptureError) | T => {
  if (isCameraErrorJson(nativeError)) {
    if (nativeError.code.startsWith('capture')) {
      return new CameraCaptureError(nativeError.code as CaptureError, nativeError.message, nativeError.cause)
    } else {
      return new CameraRuntimeError(
        // @ts-expect-error the code is string, we narrow it down to TS union.
        nativeError.code,
        nativeError.message,
        nativeError.cause,
      )
    }
  } else {
    return nativeError
  }
}

import type { Orientation } from './Orientation'
import type { PixelFormat } from './PixelFormat'

export interface Frame {

  readonly isValid: boolean

  readonly width: number

  readonly height: number

  readonly bytesPerRow: number

  readonly planesCount: number

  readonly isMirrored: boolean

  readonly timestamp: number

  readonly orientation: Orientation

  readonly pixelFormat: PixelFormat

  toArrayBuffer(): ArrayBuffer

  toString(): string
}
interface NativeBuffer {

  pointer: bigint

  delete(): void
}

export interface FrameInternal extends Frame {

  incrementRefCount(): void

  decrementRefCount(): void

  getNativeBuffer(): NativeBuffer
}

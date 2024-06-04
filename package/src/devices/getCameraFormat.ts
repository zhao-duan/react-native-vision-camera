import type { AutoFocusSystem, CameraDevice, CameraDeviceFormat, VideoStabilizationMode } from '../types/CameraDevice'
import { CameraRuntimeError } from '../types/CameraError'

interface Size {
  width: number
  height: number
}

export interface FormatFilter {
  videoResolution?: Size | 'max'
  photoResolution?: Size | 'max'
  videoAspectRatio?: number
  photoAspectRatio?: number
  fps?: number | 'max'
  videoStabilizationMode?: VideoStabilizationMode
  photoHdr?: boolean
  videoHdr?: boolean
  iso?: number | 'max' | 'min'
  autoFocusSystem?: AutoFocusSystem
}

type FilterWithPriority<T> = {
  target: Exclude<T, null | undefined>
  priority: number
}
type FilterMap = {
  [K in keyof FormatFilter]: FilterWithPriority<FormatFilter[K]>
}
function filtersToFilterMap(filters: FormatFilter[]): FilterMap {
  return filters.reduce<FilterMap>((map, curr, index) => {
    for (const key in curr) {
      // @ts-expect-error keys are untyped
      map[key] = {
        // @ts-expect-error keys are untyped
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        target: curr[key],
        priority: filters.length - index,
      }
    }
    return map
  }, {})
}

export function getCameraFormat(device: CameraDevice, filters: FormatFilter[]): CameraDeviceFormat {
  const filter = filtersToFilterMap(filters)

  let bestFormat = device.formats[0]
  if (bestFormat == null)
    throw new CameraRuntimeError('device/invalid-device', `The given Camera Device (${device.id}) does not have any formats!`)

  for (const format of device.formats) {
    let leftPoints = 0
    let rightPoints = 0

    if (filter.videoResolution != null) {
      const leftVideoResolution = bestFormat.videoWidth * bestFormat.videoHeight
      const rightVideoResolution = format.videoWidth * format.videoHeight
      if (filter.videoResolution.target === 'max') {
        if (leftVideoResolution > rightVideoResolution) leftPoints += filter.videoResolution.priority
        if (rightVideoResolution > leftVideoResolution) rightPoints += filter.videoResolution.priority
      } else {
        const targetResolution = filter.videoResolution.target.width * filter.videoResolution.target.height
        const leftDiff = Math.abs(leftVideoResolution - targetResolution)
        const rightDiff = Math.abs(rightVideoResolution - targetResolution)
        if (leftDiff < rightDiff) leftPoints += filter.videoResolution.priority
        if (rightDiff < leftDiff) rightPoints += filter.videoResolution.priority
      }
    }
    if (filter.photoResolution != null) {
      const leftPhotoResolution = bestFormat.photoWidth * bestFormat.photoHeight
      const rightPhotoResolution = format.photoWidth * format.photoHeight
      if (filter.photoResolution.target === 'max') {
        if (leftPhotoResolution > rightPhotoResolution) leftPoints += filter.photoResolution.priority
        if (rightPhotoResolution > leftPhotoResolution) rightPoints += filter.photoResolution.priority
      } else {
        const targetResolution = filter.photoResolution.target.width * filter.photoResolution.target.height
        const leftDiff = Math.abs(leftPhotoResolution - targetResolution)
        const rightDiff = Math.abs(rightPhotoResolution - targetResolution)
        if (leftDiff < rightDiff) leftPoints += filter.photoResolution.priority
        if (rightDiff < leftDiff) rightPoints += filter.photoResolution.priority
      }
    }

    if (filter.videoAspectRatio != null) {
      const leftAspect = bestFormat.videoWidth / bestFormat.videoHeight
      const rightAspect = format.videoWidth / format.videoHeight
      const leftDiff = Math.abs(leftAspect - filter.videoAspectRatio.target)
      const rightDiff = Math.abs(rightAspect - filter.videoAspectRatio.target)
      if (leftDiff < rightDiff) leftPoints += filter.videoAspectRatio.priority
      if (rightDiff < leftDiff) rightPoints += filter.videoAspectRatio.priority
    }

    // Find closest aspect ratio (photo)
    if (filter.photoAspectRatio != null) {
      const leftAspect = bestFormat.photoWidth / bestFormat.photoHeight
      const rightAspect = format.photoWidth / format.photoHeight
      const leftDiff = Math.abs(leftAspect - filter.photoAspectRatio.target)
      const rightDiff = Math.abs(rightAspect - filter.photoAspectRatio.target)
      if (leftDiff < rightDiff) leftPoints += filter.photoAspectRatio.priority
      if (rightDiff < leftDiff) rightPoints += filter.photoAspectRatio.priority
    }

    // Find closest max FPS
    if (filter.fps != null) {
      if (filter.fps.target === 'max') {
        if (bestFormat.maxFps > format.maxFps) leftPoints += filter.fps.priority
        if (format.maxFps > bestFormat.maxFps) rightPoints += filter.fps.priority
      } else {
        if (bestFormat.maxFps >= filter.fps.target) leftPoints += filter.fps.priority
        if (format.maxFps >= filter.fps.target) rightPoints += filter.fps.priority
      }
    }

    // Find closest ISO
    if (filter.iso != null) {
      if (filter.iso.target === 'max') {
        if (bestFormat.maxISO > format.maxISO) leftPoints += filter.iso.priority
        if (format.maxISO > bestFormat.maxISO) rightPoints += filter.iso.priority
      } else if (filter.iso.target === 'min') {
        if (bestFormat.minISO < format.minISO) leftPoints += filter.iso.priority
        if (format.minISO < bestFormat.minISO) rightPoints += filter.iso.priority
      } else {
        if (filter.iso.target >= bestFormat.minISO && filter.iso.target <= bestFormat.maxISO) leftPoints += filter.iso.priority
        if (filter.iso.target >= format.minISO && filter.iso.target <= format.maxISO) rightPoints += filter.iso.priority
      }
    }

    // Find video stabilization mode
    if (filter.videoStabilizationMode != null) {
      if (bestFormat.videoStabilizationModes.includes(filter.videoStabilizationMode.target))
        leftPoints += filter.videoStabilizationMode.priority
      if (format.videoStabilizationModes.includes(filter.videoStabilizationMode.target))
        rightPoints += filter.videoStabilizationMode.priority
    }

    // Find Photo HDR formats
    if (filter.photoHdr != null) {
      if (bestFormat.supportsPhotoHdr === filter.photoHdr.target) leftPoints += filter.photoHdr.priority
      if (format.supportsPhotoHdr === filter.photoHdr.target) rightPoints += filter.photoHdr.priority
    }

    // Find Video HDR formats
    if (filter.videoHdr != null) {
      if (bestFormat.supportsVideoHdr === filter.videoHdr.target) leftPoints += filter.videoHdr.priority
      if (format.supportsVideoHdr === filter.videoHdr.target) rightPoints += filter.videoHdr.priority
    }

    // Find matching AF system
    if (filter.autoFocusSystem != null) {
      if (bestFormat.autoFocusSystem === filter.autoFocusSystem.target) leftPoints += filter.autoFocusSystem.priority
      if (format.autoFocusSystem === filter.autoFocusSystem.target) rightPoints += filter.autoFocusSystem.priority
    }

    if (rightPoints > leftPoints) bestFormat = format
  }

  return bestFormat
}

import { useMemo } from 'react'
import type { CameraDevice, CameraDeviceFormat } from '../types/CameraDevice'
import type { FormatFilter } from '../devices/getCameraFormat'
import { getCameraFormat } from '../devices/getCameraFormat'

export function useCameraFormat(device: CameraDevice | undefined, filters: FormatFilter[]): CameraDeviceFormat | undefined {
  const format = useMemo(() => {
    if (device == null) return undefined
    return getCameraFormat(device, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, JSON.stringify(filters)])

  return format
}

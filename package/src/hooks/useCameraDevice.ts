import { useMemo } from 'react'
import { useCameraDevices } from './useCameraDevices'
import { DeviceFilter } from '../devices/getCameraDevice'
import { CameraDevice, CameraPosition } from '../types/CameraDevice'

export function useCameraDevice(position: CameraPosition, filter?: DeviceFilter): CameraDevice | undefined {
  const devices = useCameraDevices()
  const device = useMemo(
    () => devices.filter(d => d.position === position)[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [devices, position, JSON.stringify(filter)],
  )
  return device
}
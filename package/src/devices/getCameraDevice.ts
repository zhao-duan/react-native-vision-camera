import type { CameraDevice, CameraPosition, PhysicalCameraDeviceType } from '../types/CameraDevice'

export interface DeviceFilter {
  physicalDevices?: PhysicalCameraDeviceType[]
}
export function getCameraDevice(devices: CameraDevice[], position: CameraPosition, filter: DeviceFilter = {}): CameraDevice | undefined {
  const filtered = devices.filter((d) => d.position === position)

  let bestDevice = filtered[0]
  if (bestDevice == null) return undefined
  for (const device of filtered) {
    let leftPoints = 0
    let rightPoints = 0
    if (bestDevice.hardwareLevel === 'full') leftPoints += 4
    if (device.hardwareLevel === 'full') rightPoints += 4

    if (filter.physicalDevices != null) {
      for (const d of bestDevice.physicalDevices) {
        if (filter.physicalDevices.includes(d)) leftPoints += 1
        else leftPoints -= 1
      }
      for (const d of device.physicalDevices) {
        if (filter.physicalDevices.includes(d)) rightPoints += 1
        else rightPoints -= 1
      }
    } else {
      if (bestDevice.physicalDevices.includes('wide-angle-camera')) leftPoints += 2
      if (device.physicalDevices.includes('wide-angle-camera')) rightPoints += 2
      if (bestDevice.physicalDevices.length > device.physicalDevices.length) leftPoints -= 1
      if (device.physicalDevices.length > bestDevice.physicalDevices.length) rightPoints -= 1
    }

    if (rightPoints > leftPoints) bestDevice = device
  }

  return bestDevice
}

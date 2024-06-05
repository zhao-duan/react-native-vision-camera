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

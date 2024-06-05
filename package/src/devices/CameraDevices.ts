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
import { NativeModules, NativeEventEmitter } from 'react-native'
import { CameraDevice } from '../types/CameraDevice'

const CameraDevicesManager = NativeModules.CameraDevices as {
  getConstants: () => {
    availableCameraDevices: CameraDevice[]
    userPreferredCameraDevice: CameraDevice | undefined
  }
}

const constants = CameraDevicesManager.getConstants()
let devices = constants.availableCameraDevices

const DEVICES_CHANGED_NAME = 'CameraDevicesChanged'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventEmitter = new NativeEventEmitter(CameraDevicesManager as any)
eventEmitter.addListener(DEVICES_CHANGED_NAME, (newDevices: CameraDevice[]) => {
  devices = newDevices
})

export const CameraDevices = {
  userPreferredCameraDevice: constants.userPreferredCameraDevice,
  getAvailableCameraDevices: () => devices,
  addCameraDevicesChangedListener: (callback: (newDevices: CameraDevice[]) => void) => {
    return eventEmitter.addListener(DEVICES_CHANGED_NAME, callback)
  },
}

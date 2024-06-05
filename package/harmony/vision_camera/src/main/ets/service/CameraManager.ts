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
import Logger from '../utils/Logger';

import { CameraPermissionRequestResult, CameraPermissionStatus, PermissionArray } from '../core/CameraConfig';
import PermissionUtils from '../utils/PermissionUtils';
import { CameraDeviceInfo } from '../core/CameraDeviceInfo';
import CameraSession from './CameraSession';


const TAG: string = 'CameraDevice:'

export default class CameraManager {
  getAvailableCameraDevices(): CameraDeviceInfo[] {
    let cameraSession: CameraSession = new CameraSession();
    let cameraInfos = cameraSession.initDeviceInfo();
    Logger.info(TAG, `initDeviceInfo end CameraDeviceArray size:${cameraInfos?.length}`);
    Logger.info(TAG, `initDeviceInfo end CameraDeviceArray cameraInfos:${JSON.stringify(cameraInfos)}`);
    return cameraInfos;
  }

  /**
   * 获取当前相机权限状态
   */
  getCameraPermissionStatus() {
    let value = new PermissionUtils().checkPermission(PermissionArray[0]);
    let cameraStatus: CameraPermissionStatus = value ? "granted" : "not-determined";
    Logger.info(TAG, `getCameraPermissionStatus:${cameraStatus}`);
    return cameraStatus;
  }

  /**
   * 向用户请求相机权限
   */
  async requestCameraPermission(): Promise<CameraPermissionRequestResult> {
    let value = await new PermissionUtils().grantPermission(PermissionArray[0]);
    let requestPermission: CameraPermissionRequestResult = value ? "granted" : "denied";
    Logger.info(TAG, `requestCameraPermission:${requestPermission}`);
    return requestPermission;
  }

  /**
   * 获取当前麦克风录制权限状态
   */
  getMicrophonePermissionStatus(): CameraPermissionStatus {
    let value = new PermissionUtils().checkPermission(PermissionArray[2]);
    let microStatus: CameraPermissionStatus = value ? "granted" : "not-determined";
    Logger.info(TAG, `getMicrophonePermissionStatus:${microStatus}`);
    return microStatus;
  }

  /**
   * 向用户请求麦克风权限
   */
  async requestMicrophonePermission(): Promise<CameraPermissionRequestResult> {
    let value = await new PermissionUtils().grantPermission(PermissionArray[2]);
    let requestPermission: CameraPermissionRequestResult = value ? "granted" : "denied";
    Logger.info(TAG, `requestMicrophonePermission:${requestPermission}`);
    return requestPermission;
  }

  /**
   * 获取当前位置权限状态
   */
  getLocationPermissionStatus(): CameraPermissionStatus {
    let value = new PermissionUtils().checkPermission(PermissionArray[1]);
    let locationStatus: CameraPermissionStatus = value ? "granted" : "not-determined";
    Logger.info(TAG, `getLocationPermissionStatus:${locationStatus}`);
    return locationStatus;
  }

  /**
   * 向用户请求位置权限
   */
  async requestLocationPermission() {
    let value = await new PermissionUtils().grantPermission(PermissionArray[1]);
    let requestPermission: CameraPermissionRequestResult = value ? "granted" : "denied";
    Logger.info(TAG, `requestLocationPermission:${requestPermission}`);
    return requestPermission;
  }
}
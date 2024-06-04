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
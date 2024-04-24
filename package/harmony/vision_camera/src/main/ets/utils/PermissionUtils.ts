/*
 * Copyright (c) 2023 Hunan OpenValley Digital Industry Development Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import abilityAccessCtrl, { PermissionRequestResult } from '@ohos.abilityAccessCtrl';
import { Permissions } from '@ohos.abilityAccessCtrl';
import bundleManager from '@ohos.bundle.bundleManager';
import Logger from './Logger';
import { PermissionArray } from '../core/CameraConfig';
import common from '@ohos.app.ability.common';

const TAG: string = '[Permission]';

declare function getContext(context: any): common.UIAbilityContext;

export default class PermissionUtils {
  private atManager: abilityAccessCtrl.AtManager;
  private context: common.UIAbilityContext;


  constructor() {
    this.context = getContext(this);
    this.atManager = abilityAccessCtrl.createAtManager();
  }

  async defaultGrantPermission(permissions: Permissions[]): Promise<boolean> {
    try {
      let pems: Array<Permissions> = [];
      // 获取应用程序的accessTokenID
      let bundleInfo: bundleManager.BundleInfo =
        await bundleManager.getBundleInfoForSelf(
          bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_APPLICATION
        );
      let appInfo: bundleManager.ApplicationInfo = bundleInfo.appInfo;
      let tokenId = appInfo.accessTokenId;
      Logger.info(TAG,
        `defaultGrantPermission tokenId :${tokenId},atManager:${this.atManager} checkAccessToken  + : ${JSON.stringify(permissions)}`);
      for (let i = 0; i < permissions.length; i++) {
        try {
          let state = await this.atManager.checkAccessToken(tokenId, permissions[i]);
          Logger.info(TAG,
            `defaultGrantPermission  checkAccessToken ${permissions[i]} + : ${JSON.stringify(state)}`);
          if (state !== abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED) {
            pems.push(permissions[i]);
          }
        } catch (error) {
          Logger.error(TAG,
            `defaultGrantPermission  checkAccessToken error ${permissions[i]} error: ${JSON.stringify(error)}`);
        }
      }
      if (pems.length > 0) {
        Logger.info(TAG, 'defaultGrantPermission requestPermissionsFromUser :' + JSON.stringify(pems));
        let result: PermissionRequestResult = await this.atManager.requestPermissionsFromUser(this.context, pems);

        let grantStatus: Array<number> = result.authResults;
        let length: number = grantStatus.length;
        for (let i = 0; i < length; i++) {
          Logger.info(TAG,
            `defaultGrantPermission  requestPermissionsFromUser ${result.permissions[i]} + : ${grantStatus[i]}`);
          if (grantStatus[i] === 0) {
            // 用户授权，可以继续访问目标操作
          } else {
            // 用户拒绝授权，提示用户必须授权才能访问当前页面的功能
            Logger.error(TAG + `defaultGrantPermission  fail ${result.permissions[i]},status:${grantStatus[i]}`);
            return false;
          }
        }
      }
      // 授权成功
      Logger.info(TAG, 'defaultGrantPermission  success ');
      return true;
    } catch (e) {
      Logger.info(TAG, `defaultGrantPermission  fail, error:${e}`);
      return false;
    }
  }

  checkPermission(permission: Permissions): boolean {
    Logger.info(TAG, `checkAccessToken ${permission} begin`);
    let bundleInfo: bundleManager.BundleInfo = bundleManager.getBundleInfoForSelfSync(
      bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_APPLICATION
    )
    let appInfo: bundleManager.ApplicationInfo = bundleInfo.appInfo;
    let tokenId = appInfo.accessTokenId;
    let  state = this.atManager.checkAccessTokenSync(tokenId, permission);
    Logger.info(TAG, `checkAccessToken permission:${permission} = ${JSON.stringify(state)}`);
    return state === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED;
  }

  grantPermission(permission: Permissions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      Logger.info(TAG, `grantPermission  grantPermission ${permission} begin`);
      this.atManager.requestPermissionsFromUser(this.context, [permission])
        .then((data: PermissionRequestResult) => {
          Logger.info(TAG, `grantPermission  grantPermission ${permission} : ${JSON.stringify(data.authResults)}`);
          resolve(data?.authResults[0] === 0)
        }).catch((error) => {
        Logger.error(TAG, `grantPermission ${permission} : ${JSON.stringify(error)}`);
        reject(error)
      })
    });

  }
}
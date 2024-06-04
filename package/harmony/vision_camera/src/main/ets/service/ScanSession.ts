import { customScan, scanBarcode, scanCore } from '@kit.ScanKit';
import Logger from '../utils/Logger';
import { BusinessError } from '@ohos.base';
import { Code, Frame, Point, Rect, ScanResult } from '../core/CameraConfig';
import { AsyncCallback } from '@kit.BasicServicesKit';

const TAG: string = 'ScanSession:'

export default class ScanSession {
  private ScanFrame = {
    width: 0, height: 0
  };
  private codeType =
    ['unknown', 'aztec', 'codabar', 'code-39', 'code-93', 'code-128', 'data-matrix', 'ean-8', 'ean-13', 'itf',
      'pdf-417', 'qr', 'upc-a', 'upc-e']
  private isScanEnd: boolean = true;

  constructor() {
  }

  /**
   * 初始化扫描仪
   */
  initScan(types) {
    Logger.info(TAG, `initScan types:${JSON.stringify(types)}`);
    let type = []
    if (types && types.length > 0) {
      type = types.map((item) => {
        return this.codeType.indexOf(item)
      })
    }
    Logger.info(TAG, `init:type:${JSON.stringify(type)}`);
    let options: scanBarcode.ScanOptions = {
      scanTypes: type || [scanCore.ScanType.ALL],
      enableMultiMode: true,
      enableAlbum: true
    }
    try {
      customScan.init(options);
    } catch (error) {
      Logger.error(TAG, `init fail, error:${JSON.stringify(error)}`);
    }
  }

  /**
   * 启动相机进行扫码
   */
  async scanStart(surfaceId: string, SurfaceRect, isFirst?: boolean): Promise<ScanResult> {
    Logger.info(TAG, `ScanStart:surfaceId: ${surfaceId}`)
    Logger.info(TAG, `ScanStart:SurfaceRect: ${JSON.stringify(SurfaceRect)}`)
    Logger.info(TAG, `ScanStart:isFirst: ${isFirst}`)
    Logger.info(TAG, `ScanStart:this.isScanEnd: ${this.isScanEnd}`)
    if (this.isScanEnd) {
      this.setEndStatus(false)
      // 获取到扫描结果后暂停相机流
      if (!isFirst) {
        Logger.info(TAG, `ScanStart:start.stop`)
        this.scanStop()
      }
      this.ScanFrame = SurfaceRect;

      return new Promise((resolve, reject) => {
        let viewControl: customScan.ViewControl = {
          width: SurfaceRect.width,
          height: SurfaceRect.height,
          surfaceId: surfaceId
        };
        Logger.info(TAG, `start viewControl, info: ${JSON.stringify(viewControl)}`);
        customScan.start(viewControl, (error: BusinessError, result: Array<scanBarcode.ScanResult>) => {
          if (error) {
            Logger.error(TAG, `start failed, code: ${error.code}, message: ${error.message}`);
            reject(error);
            return;
          }
          const scanResult = this.showScanResult(result);
          Logger.info(TAG, `scanResult11: ${JSON.stringify(scanResult)}`);
          this.setEndStatus(true)
          resolve(scanResult)
        }, this.frameCallback);
      })
    }
  }

  /**
   * 获取扫描结果
   */
  showScanResult(result: Array<scanBarcode.ScanResult>) {
    if (result.length > 0) {
      const codes: Code[] = []
      result.forEach((data, index) => {
        const rect: Rect = {
          left: data.scanCodeRect?.left || 0,
          top: data.scanCodeRect?.top || 0,
          right: data.scanCodeRect?.right || 0,
          bottom: data.scanCodeRect?.bottom || 0
        }
        const codeW = rect.right - rect.left
        const codeH = rect.bottom - rect.top

        const layout = {
          width: this.ScanFrame.width,
          height: this.ScanFrame.height,
        }
        const scanFrame = this.ScanFrame;
        const codeFrame: Frame = {
          width: codeW / (layout.height / scanFrame.width),
          height: codeH / (layout.width / scanFrame.height),
          x: rect.left / (layout.width / scanFrame.height),
          y: rect.top / (layout.height / scanFrame.width)
        }
        const corners: Point[] = [{
          x: rect.left, y: rect.top
        }, {
          x: rect.left + codeW, y: rect.top
        }, {
          x: rect.left + codeW, y: rect.top + codeH
        }, {
          x: rect.left, y: rect.top + codeH
        }]
        codes.push({
          "frame": codeFrame,
          "corners": corners,
          "value": data.originalValue,
          "type": this.codeType[data.scanType]
        })
      })
      const scanResult: ScanResult = {
        codes: codes,
        frame: this.ScanFrame
      }
      Logger.info(TAG, `scan self result: ${JSON.stringify(scanResult)}`);
      return scanResult
    }
    return null
  }

  /**
   * 回调获取ScanFrame
   */
  private frameCallback: AsyncCallback<customScan.ScanFrame> =
    async (error: BusinessError, scanFrame: customScan.ScanFrame) => {
      if (error) {
        Logger.error(TAG, `start frame failed, code: ${error.code}, message: ${error.message}`);
        return;
      }
      if (!this.ScanFrame.width || !this.ScanFrame.height) {
        this.ScanFrame = {
          width: scanFrame.width,
          height: scanFrame.height
        }
        Logger.info(TAG, `start frame succeeded, ${JSON.stringify(scanFrame)}`);
      }
    }

  setEndStatus(flag: boolean) {
    this.isScanEnd = flag
  }

  /**
   * 页面消失或隐藏时，停止相机流/获取到扫描结果后暂停相机流
   */
  async scanStop() {
    try {
      customScan.stop().then(() => {
        Logger.info(TAG, 'stop success!');
      }).catch((error: BusinessError) => {
        Logger.error(TAG, `stop try failed error: ${JSON.stringify(error)}`);
      })
    } catch (error) {
      Logger.error(TAG, `stop catch failed error: ${JSON.stringify(error)}`);
    }
  }

  /**
   * 页面消失或隐藏时，释放相机流
   */
  async scanRelease() {
    try {
      customScan.release().then(() => {
        Logger.info(TAG, 'release success!');
      }).catch((error: BusinessError) => {
        Logger.error(TAG, `release failed error: ${JSON.stringify(error)}`);
      })
    } catch (error) {
      Logger.error(TAG, `Catch: release error ${JSON.stringify(error)}`);
    }
  }

  setTorch(torch: string) {
    Logger.info(TAG, `setTorch start,isTorch: ${torch}`);
    let isTorch: boolean = torch === 'on';
    let status = customScan.getFlashLightStatus();
    if (status !== isTorch) {
      if (isTorch) {
        customScan.openFlashLight();
        Logger.info(TAG, `setTorch openFlashLight success`);
      } else {
        customScan.closeFlashLight();
        Logger.info(TAG, `setTorch closeFlashLight success`);
      }
    }
  }
}
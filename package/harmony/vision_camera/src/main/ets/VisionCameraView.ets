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
import camera from '@ohos.multimedia.camera';
import { RNComponentContext, RNViewBase } from '@rnoh/react-native-openharmony';
import Logger from './utils/Logger';
import { CameraCaptureError, CameraRuntimeError, CaptureError } from './types/CameraError';
import PermissionUtils from './utils/PermissionUtils';
import CameraSession from './service/CameraSession';
import {
  CameraPermissionRequestResult,
  CameraPermissionStatus,
  PhotoFile,
  Point,
  ScanResult,
  TakePhotoOptions
} from './core/CameraConfig';
import { display } from '@kit.ArkUI';
import ScanSession from './service/ScanSession';
import { cameraState, VideoStabilizationMode } from './core/CameraEnumBox';
import CameraManager from './service/CameraManager';
import { CameraDeviceInfo } from './core/CameraDeviceInfo';
import Utils from './utils/Utils';
import { VisionCameraViewSpec } from './types/VisionCameraViewSpec';
import { RecordVideoOptions } from './types/VideoFile';
import { Permissions } from '@kit.AbilityKit';

const previewViewType: Record<'surface-view' | 'texture-view', 'surface' | 'texture'> = {
  'surface-view': 'surface',
  'texture-view': 'texture'
}
const TAG: string = 'VisionCameraView:'

@Component
export struct VisionCameraView {
  public static readonly NAME = VisionCameraViewSpec.NAME
  public ctx!: RNComponentContext
  public tag: number = 0
  @State private descriptorWrapper: VisionCameraViewSpec.DescriptorWrapper =
    {} as VisionCameraViewSpec.DescriptorWrapper
  private eventEmitter: VisionCameraViewSpec.EventEmitter | undefined = undefined
  private cleanUpCallbacks: (() => void)[] = []
  private cleanCommandCallback?: () => void;
  @State propertyArr: Array<string> = [];
  private mXComponentController: XComponentController = new XComponentController();
  private surfaceId: string = '';
  context: Context = getContext(this);
  private localDisplay?: display.Display;
  private cameraSession: CameraSession = {} as CameraSession;
  private cameraState: cameraState = cameraState.PHOTO;
  rect: SurfaceRect = { surfaceWidth: 1920, surfaceHeight: 1080 };
  private scanSession: ScanSession = {} as ScanSession;
  private cameraManager: CameraManager = new CameraManager();
  @State scaleValue: number = 1;
  @State componentWidth: number = 0;
  @State componentHeight: number = 0;
  private timer = 0
  private enableZoomGesture: boolean | undefined = undefined;
  private prevProps: VisionCameraViewSpec.RawProps | undefined = undefined;
  private currentProps: VisionCameraViewSpec.RawProps = {} as VisionCameraViewSpec.RawProps;
  @State pageFlag: boolean = false;
  @State localDisplayWidth: number = 100;
  @State localDisplayHeight: number = 100;
  @State androidPreviewViewType: 'surface' | 'texture' = 'surface';
  private noViewPhoto: boolean = false;

  aboutToAppear() {
    this.localDisplay = display.getDefaultDisplaySync();

    Logger.info(TAG, `localDisplay  ${JSON.stringify(this.localDisplay)}`);
    this.eventEmitter = new VisionCameraViewSpec.EventEmitter(this.ctx.rnInstance, this.tag)
    this.onDescriptorWrapperChange(this.ctx.descriptorRegistry.findDescriptorWrapperByTag<VisionCameraViewSpec.DescriptorWrapper>(this.tag)!)
    this.cleanUpCallbacks.push(this.ctx.descriptorRegistry.subscribeToDescriptorChanges(this.tag,
      (_descriptor, newDescriptorWrapper) => {
        this.onDescriptorWrapperChange(newDescriptorWrapper! as VisionCameraViewSpec.DescriptorWrapper)
      }
    ))

    this.subscribeToLifecycleEvents();

    const descriptorBase = this.descriptorWrapper['descriptor'];
    const props = descriptorBase.rawProps;
    this.localDisplayWidth = typeof props.width === 'number' ? vp2px(props.width) : this.localDisplay?.width;
    this.localDisplayHeight = typeof props.height === 'number' ? vp2px(props.height) : this.localDisplay?.height;
    this.enableZoomGesture = props.enableZoomGesture;
    Logger.info(TAG, `descriptorBase.rawProps: ${JSON.stringify(props)}`);
    Logger.info(TAG, `descriptorWrapper: ${JSON.stringify(this.descriptorWrapper)}`);
    this.registerCommandCallback();

    Logger.info(TAG, `props.registerCommandCallback end`);
    if (props.codeScanner) {
      this.cameraState = cameraState.SCAN;
      Logger.info(TAG, `props.codeScanner ${JSON.stringify(props.codeScanner)}`);
    }
    if (props.photo) {
      this.cameraState = cameraState.PHOTO;
    } else if (props.video) {
      this.cameraState = cameraState.VIDEO
    }
    if (props.androidPreviewViewType && props.androidPreviewViewType !== `${this.androidPreviewViewType}-view`) {
      this.androidPreviewViewType = previewViewType[`${props.androidPreviewViewType}`];
    }
    Logger.info(TAG, `defaultGrantPermission before`);
    this.defaultGrantPermission(props).then(res => {
      this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
      this.initSession(props);
      this.onInitialized();
    });
  }

  /**
   * 初始化Session
   */
  initSession(props: VisionCameraViewSpec.RawProps) {
    Logger.info(TAG, `aboutToAppear surfaceId:  ${this.surfaceId},cameraState:  ${this.cameraState}`);
    if (this.cameraState === cameraState.SCAN) {
      Logger.info(TAG, `aboutToAppear cameraState:  ${this.cameraState}`);
      this.scanSession = new ScanSession();
      Logger.info(TAG, `aboutToAppear initScan:  ${JSON.stringify(props.codeScanner)}`);
      this.scanSession.initScan(props.codeScanner?.codeTypes);
      this.scanStart(true);
    } else {
      this.cameraSession = new CameraSession(this.ctx);
      this.cameraSession.initCamera(this.surfaceId, props,
        this.cameraState === cameraState.PHOTO ? camera.SceneMode.NORMAL_PHOTO : camera.SceneMode.NORMAL_VIDEO);
      this.cameraSession.setResizeMode(props.resizeMode, this.localDisplayWidth, this.localDisplayHeight,
        (width, height) => {
          this.componentWidth = width;
          this.componentHeight = height;
        });
    }
  }

  /**
   * 请求权限
   */
  async defaultGrantPermission(props: VisionCameraViewSpec.RawProps) {
    const permissions: Permissions[] = [
      'ohos.permission.CAMERA',
    ]
    if (props.audio) {
      permissions.push('ohos.permission.MICROPHONE')
    }
    if (props.enableLocation) {
      permissions.push('ohos.permission.APPROXIMATELY_LOCATION')
    }
    if (props.photo || props.video) {
      permissions.push('ohos.permission.READ_IMAGEVIDEO')
      permissions.push('ohos.permission.WRITE_IMAGEVIDEO')
    }
    try {
      const res = await new PermissionUtils().defaultGrantPermission(permissions);
      Logger.info(TAG, `defaultGrantPermission success: ${JSON.stringify(res)}`);
      return res;
    } catch (e) {
      Logger.info(TAG, `defaultGrantPermission failed: ${JSON.stringify(e)}`);
      throw (new Error(e))
    }
  }

  /**
   * 订阅生命周期监听事件
   */
  subscribeToLifecycleEvents() {
    Logger.info(TAG, `subscribeToLifecycleEvents start`);
    this.ctx.rnInstance.subscribeToLifecycleEvents("FOREGROUND", () => {
      Logger.info(TAG, `subscribeToLifecycleEvents FOREGROUND`);
      const props = this.descriptorWrapper['descriptor'].rawProps;
      if (this.cameraState === cameraState.SCAN) {
        setTimeout(() => {
          this.scanSession = new ScanSession();
          this.scanSession.initScan(props.codeScanner?.codeTypes);
          Logger.info(TAG,
            `subscribeToLifecycleEvents FOREGROUND scanSession initScan, ${JSON.stringify(this.scanSession)}`);
          if (props.isActive) {
            this.scanStart(true);
          }
        }, 200)
      } else {
        try {
          let mediaModel =
            this.cameraState === cameraState.VIDEO ? camera.SceneMode.NORMAL_VIDEO : camera.SceneMode.NORMAL_PHOTO
          this.cameraSession.initCamera(this.surfaceId, props, mediaModel)
          this.cameraSession.setResizeMode(props.resizeMode, this.localDisplayWidth, this.localDisplayHeight,
            (width, height) => {
              Logger.info(TAG, `componentWidth ${width}`);
              Logger.info(TAG, `componentHeight ${height}`);
              this.componentWidth = width;
              this.componentHeight = height;
            });
        } catch (err) {
          Logger.error(TAG, `subscribeToLifecycleEvents initCamera error: ${JSON.stringify(err)}`);
        }
      }
    })
    this.ctx.rnInstance.subscribeToLifecycleEvents("BACKGROUND", async () => {
      Logger.info(TAG, `subscribeToLifecycleEvents BACKGROUND`);
      if (this.cameraState === cameraState.SCAN) {
        clearTimeout(this.timer)
        await this.scanSession.scanStop();
        this.scanSession.scanRelease();
        Logger.info(TAG, `subscribeToLifecycleEvents BACKGROUND , ${JSON.stringify(this.scanSession)}`);
      }
    })
    this.ctx.rnInstance.subscribeToLifecycleEvents("CONFIGURATION_UPDATE", () => {
      Logger.info(TAG, `subscribeToLifecycleEvents CONFIGURATION_UPDATE`);
    })
    this.ctx.rnInstance.subscribeToLifecycleEvents("JS_BUNDLE_EXECUTION_FINISH", () => {
      Logger.info(TAG, `subscribeToLifecycleEvents JS_BUNDLE_EXECUTION_FINISH`);
    })
    this.ctx.rnInstance.subscribeToLifecycleEvents("RELOAD", () => {
      Logger.info(TAG, `subscribeToLifecycleEvents RELOAD`);
    })
    this.ctx.rnInstance.subscribeToLifecycleEvents("WINDOW_SIZE_CHANGE", () => {
      Logger.info(TAG, `subscribeToLifecycleEvents WINDOW_SIZE_CHANGE`);
    })
    Logger.info(TAG, `subscribeToLifecycleEvents end`);
  }

  //更新props
  updateProps(props: VisionCameraViewSpec.RawProps) {
    Logger.info(TAG, `updateProps, props:${JSON.stringify(props)}`);
    this.defaultGrantPermission(props);
    if (props.isActive !== undefined && this.prevProps?.isActive !== props.isActive) {
      Logger.info(TAG, `updateProps, activeChange: ${props.isActive}`);
      this.cameraSession.activeChange(props.isActive);
      if (props.isActive) {
        Logger.info(TAG, `emitDeviceEvent, onCameraStarted`);
        this.ctx.rnInstance.emitDeviceEvent('onCameraStarted', {});
      } else {
        Logger.info(TAG, `emitDeviceEvent, onCameraStopped`);
        this.ctx.rnInstance.emitDeviceEvent('onCameraStopped', {});
      }
    }
    if (props.audio !== undefined && this.prevProps?.audio !== props.audio) {
      Logger.info(TAG, `updateProps, audioChange: ${props.audio}`);
      this.cameraSession.setAudio(props.audio);
    }
    if (props.preview !== undefined && this.prevProps?.preview !== props.preview) {
      Logger.info(TAG, `updateProps, previewChange: ${props.preview}`);
      this.cameraSession.previewChange(props.preview);
    }
    if (props.enableZoomGesture !== undefined && this.prevProps?.enableZoomGesture !== props.enableZoomGesture) {
      Logger.info(TAG, `updateProps, enableZoomGesture: ${props.enableZoomGesture}`);
      this.enableZoomGesture = props.enableZoomGesture;
    }
    if (props.exposure !== undefined && this.prevProps?.exposure !== props.exposure) {
      Logger.info(TAG, `updateProps, setExposure: ${props.exposure}`);
      this.cameraSession.setExposure(props.exposure);
    }
    if (props.zoom !== undefined && this.prevProps?.zoom !== props.zoom) {
      Logger.info(TAG, `updateProps, setSmoothZoom: ${props.zoom}`);
      this.cameraSession.setSmoothZoom(props.zoom);
    }
    if (props.torch !== undefined && this.prevProps?.torch !== props.torch) {
      Logger.info(TAG, `updateProps, setTorch: ${props.torch}`);
      this.cameraSession.setTorch(props.torch)
    }
    if (props.photoQualityBalance !== undefined && this.prevProps?.photoQualityBalance !== props.photoQualityBalance) {
      this.cameraSession.setPhotoQualitySetting(props.photoQualityBalance);
      Logger.info(TAG, `photoQualityBalance update:${props.photoQualityBalance}.`)
    }
    if (props.enableLocation !== undefined && this.prevProps?.enableLocation !== props.enableLocation) {
      this.cameraSession.setPhotoLocationSetting(props.enableLocation);
      Logger.info(TAG, `enableLocation update:${props.enableLocation}.`)
    }
    if (props.androidPreviewViewType && this.prevProps?.androidPreviewViewType !== props.androidPreviewViewType) {
      this.androidPreviewViewType = previewViewType[`${props.androidPreviewViewType}`];
    }
    if (props.videoHdr !== undefined && this.prevProps?.videoHdr !== props.videoHdr) {
      Logger.info(TAG, `videoHdr update:${props.videoHdr}.`)
      if (props.videoHdr !== undefined && props.videoStabilizationMode !== VideoStabilizationMode.AUTO) {
        this.onError(new CameraRuntimeError('unknown/unknown', 'props.videoStabilizationMode must be auto'))
        return;
      }
      this.cameraSession.hdrChange(props);
    }
    if (props.videoStabilizationMode !== undefined &&
      this.prevProps?.videoStabilizationMode !== props.videoStabilizationMode) {
      if (props.videoHdr) {
        this.onError(new CameraRuntimeError('unknown/unknown', 'props.videoHdr must be false'))
        return;
      }
      Logger.info(TAG, `updateProps, videoStabilizationModeChange: ${props.videoStabilizationMode}`);
      this.cameraSession.setVideoStabilizationMode(false, props.videoStabilizationMode);
    }
    this.cameraSession.setResizeMode(props.resizeMode, this.localDisplay?.width, this.localDisplay?.height,
      (width, height) => {
        this.componentWidth = width;
        this.componentHeight = height;
        Logger.info(TAG, `setResizeMode: ${width},${height}`);
      });

    this.pageFlag = !this.pageFlag;
  }

  private onDescriptorWrapperChange(descriptorWrapper: VisionCameraViewSpec.DescriptorWrapper) {
    Logger.info(TAG, `onDescriptorWrapperChange  ${JSON.stringify(descriptorWrapper)}`);
    this.descriptorWrapper = descriptorWrapper;
    const descriptorBase = descriptorWrapper['descriptor'];
    const props = descriptorBase.rawProps;
    this.currentProps = props;
    Logger.info(TAG, `currentProps: ${JSON.stringify(this.currentProps)}`)
    if (this.cameraState !== cameraState.SCAN && !Utils.isEmptyObject(this.cameraSession)) {
      Logger.info(TAG, `updateProps cameraSession`);
      this.updateProps(props);
    }
    if (this.cameraState === cameraState.SCAN && !Utils.isEmptyObject(this.scanSession)) {
      Logger.info(TAG, `updateProps scanSession`);
      const isActiveChange = props.isActive !== undefined && this.prevProps?.isActive !== props.isActive;
      if (isActiveChange) {
        Logger.info(TAG, `Scan updateProps, isActive: ${props.isActive}`);
        if (props.isActive) {
          this.scanStart(true);
        } else {
          this.scanSession.scanStop();
          this.scanSession.setEndStatus(true);
        }
      }
      if (props.torch !== undefined && this.prevProps?.torch !== props.torch) {
        Logger.info(TAG, `updateProps, setTorch: ${props.torch}`);
        this.scanSession.setTorch(props.torch);
      }
    }
    this.prevProps = props;
  }

  async aboutToDisappear() {
    this.cleanUpCallbacks.forEach(cb => cb())
    Logger.info(TAG, 'aboutToDisappear begin');
    if (this.cameraState === cameraState.SCAN) {
      clearTimeout(this.timer)
      await this.scanSession.scanStop();
      this.scanSession.scanRelease();
    } else {
      await this.cameraSession.cameraRelease();
    }
    this.cleanCommandCallback?.();
  }

  registerCommandCallback() {
    if (this.ctx) {
      this.cleanCommandCallback = this.ctx.componentCommandReceiver.registerCommandCallback(
        this.tag,
        (command, args: (string | number | boolean | object)[]) => {
          if (command === 'takePhoto') {
            if (this.currentProps.photo) {
              Logger.debug(TAG, `registerCommandCallback: takePhoto,  ${JSON.stringify(args)}`)
              const options = args[0] as TakePhotoOptions;
              if (this.currentProps.preview) {
                this.takePhoto(options);
                this.noViewPhoto = false;
              } else if (!this.noViewPhoto) {
                this.noViewPhoto = true;
                this.takePhoto(options);
              } else {
                this.ctx.rnInstance.emitDeviceEvent('onError', new CameraCaptureError('capture/unknown',
                  `When preview is set to false, the photo can be taken only once.`));
              }
            } else {
              Logger.info(TAG, `props photo error, photo:${JSON.stringify(this.currentProps.photo)}`);
            }
          }
          if (command === 'focus') {
            Logger.debug(TAG, `registerCommandCallback: focus,  ${JSON.stringify(args)}`)
            const point = args[0] as Point;
            this.focus({
              x: vp2px(point.x),
              y: vp2px(point.y),
            });
          }
          if (command === 'getAvailableCameraDevices') {
            Logger.debug(TAG, `registerCommandCallback: getAvailableCameraDevices.`)
            this.getAvailableCameraDevices();
          }
          if (command === 'getCameraPermissionStatus') {
            Logger.debug(TAG, `registerCommandCallback: getCameraPermissionStatus.`)
            this.getCameraPermissionStatus();
          }
          if (command === 'requestCameraPermission') {
            Logger.debug(TAG, `registerCommandCallback: requestCameraPermission.`)
            this.requestCameraPermission();
          }
          if (command === 'getMicrophonePermissionStatus') {
            Logger.debug(TAG, `registerCommandCallback: getMicrophonePermissionStatus.`)
            this.getMicrophonePermissionStatus();
          }
          if (command === 'requestMicrophonePermission') {
            Logger.debug(TAG, `registerCommandCallback: requestMicrophonePermission.`)
            this.requestMicrophonePermission();
          }
          if (command === 'getLocationPermissionStatus') {
            Logger.debug(TAG, `registerCommandCallback: getLocationPermissionStatus.`)
            this.getLocationPermissionStatus();
          }
          if (command === 'startRecording') {
            const options = args[0] as RecordVideoOptions;
            Logger.debug(TAG, `registerCommandCallback: startRecording.${JSON.stringify(options)}}`)
            this.startRecording(options);
          }
          if (command === 'stopRecording') {
            Logger.debug(TAG, `registerCommandCallback: stopRecording.`)
            this.stopRecording();
          }
          if (command === 'pauseRecording') {
            Logger.debug(TAG, `registerCommandCallback: pauseRecording.`)
            this.pauseRecording();
          }
          if (command === 'resumeRecording') {
            Logger.debug(TAG, `registerCommandCallback: resumeRecording.`)
            this.resumeRecording();
          }
        });
    }
  }

  onInitialized() {
    Logger.info(TAG, `emitDeviceEvent onInitialized`)
    this.ctx.rnInstance.emitDeviceEvent('onInitialized', {});
    Logger.info(TAG, `emitDeviceEvent onInitialized end`)
  }

  onError(cameraError: CameraRuntimeError) {
    Logger.info(TAG, `emitDeviceEvent onError`)
    this.ctx.rnInstance.emitDeviceEvent('onError', cameraError);
  }

  async scanStart(isFirst?: boolean) {
    clearTimeout(this.timer)
    let scanResult: ScanResult | undefined = undefined;
    try {
      scanResult = await this.scanSession.scanStart(this.surfaceId,
        { width: this.localDisplayWidth, height: this.localDisplayHeight }, isFirst);
    } catch (error) {
      if (error.code === '1000500001') {
        this.onError(new CameraRuntimeError('unknown/unknown', 'codeScanner preview size not support.'))
      }
    }
    if (scanResult) {
      this.ctx.rnInstance.emitDeviceEvent('onCodeScanned', scanResult);
      Logger.info(TAG, `get scan result: ${JSON.stringify(scanResult)}`)

      const isActive = this.descriptorWrapper['rawProps'].isActive;
      if (isActive) {
        this.scanStart();
      }
    }

  }

  /**
   * 拍照
   */
  async takePhoto(options: TakePhotoOptions): Promise<PhotoFile> {
    this.ctx.rnInstance.emitDeviceEvent('onShutter', { type: 'photo' });
    const photoFile = await this.cameraSession.takePhoto(options);
    this.ctx.rnInstance.emitDeviceEvent('onTaskPhoto', photoFile);
    return photoFile;
  }

  /**
   * focus
   * @param rnPoint
   */
  focus(rnPoint: Point) {
    this.cameraSession.focus(rnPoint);
  }

  /**
   * 获取可用设备
   */
  getAvailableCameraDevices(): CameraDeviceInfo[] {
    return this.cameraManager.getAvailableCameraDevices();
  }

  /**
   * 获取当前相机权限状态
   */
  getCameraPermissionStatus(): CameraPermissionStatus {
    return this.cameraManager.getCameraPermissionStatus();
  }

  /**
   * 向用户请求相机权限
   */
  requestCameraPermission(): Promise<CameraPermissionRequestResult> {
    return this.cameraManager.requestCameraPermission();
  }

  /**
   * 获取当前麦克风录制权限状态
   */
  getMicrophonePermissionStatus(): CameraPermissionStatus {
    return this.cameraManager.getMicrophonePermissionStatus();
  }

  /**
   * 向用户请求麦克风权限
   */
  requestMicrophonePermission(): Promise<CameraPermissionRequestResult> {
    return this.cameraManager.requestMicrophonePermission();
  }

  /**
   * 获取当前位置权限状态
   */
  getLocationPermissionStatus(): CameraPermissionStatus {
    return this.cameraManager.getLocationPermissionStatus();
  }

  /**
   * 向用户请求位置权限
   */
  requestLocationPermission(): Promise<CameraPermissionRequestResult> {
    return this.cameraManager.requestLocationPermission();
  }

  /**
   * 开始录制
   */
  startRecording(options: RecordVideoOptions): void {
    this.cameraSession.startRecording(options, this.currentProps)
  }

  /**
   * 停止录制
   */
  stopRecording() {
    this.cameraSession.stopRecording()
  }

  /**
   * 暂停录制
   */
  pauseRecording() {
    this.cameraSession.pauseRecording()
  }

  /**
   * 恢复录制
   */
  resumeRecording() {
    this.cameraSession.resumeRecording()
  }

  build() {
    RNViewBase({
      ctx: this.ctx,
      tag: this.tag,
      controlsFocus: false
    }) {
      Stack({ alignContent: Alignment.Bottom }) {
        Column() {
          XComponent({
            id: 'CameraViewComponent',
            type: this.androidPreviewViewType,
            controller: this.mXComponentController
          })
            .onLoad(() => {
              this.surfaceId = this.mXComponentController.getXComponentSurfaceId();
            })
            .width(this.cameraState === cameraState.SCAN ? this.localDisplayWidth + 'px' : this.componentWidth + 'px')
            .height(this.cameraState === cameraState.SCAN ? this.localDisplayHeight + 'px' :
              this.componentHeight + 'px')
        }
        .onClick((clickEvent) => {
          if (this.cameraState === cameraState.PHOTO) {
            this.cameraSession.focus({ x: vp2px(clickEvent.x), y: vp2px(clickEvent.y) } as Point)
          }
        })
        .width('100%')
        .height('100%')
        .justifyContent(FlexAlign.Center)
        .gesture(
          // 在组件上绑定三指触发的捏合手势
          PinchGesture({ fingers: 2 })// 当捏合手势触发时，可以通过回调函数获取缩放比例，从而修改组件的缩放比例
            .onActionUpdate((event: GestureEvent) => {
              this.scaleValue = this.cameraSession.photoPreviewScale * event.scale;
            })
            .onActionEnd(() => {
              if (this.enableZoomGesture) {
                this.cameraSession.setSmoothZoom(this.scaleValue);
              }
            })
        )
      }
      .width(this.localDisplayWidth + 'px')
      .height(this.localDisplayHeight + 'px')
    }
  }
}
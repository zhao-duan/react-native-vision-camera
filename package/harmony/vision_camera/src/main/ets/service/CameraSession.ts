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
import Logger from '../utils/Logger';
import { PhotoFile, Point, TakePhotoOptions } from '../core/CameraConfig';
import { media } from '@kit.MediaKit';
import { Context } from '@kit.AbilityKit';
import { BusinessError } from '@ohos.base';
import fs from '@ohos.file.fs';
import { CameraPosition, PhysicalCameraDeviceType, VideoStabilizationMode, Orientation } from '../core/CameraEnumBox';
import { CameraDeviceFormat, CameraDeviceInfo } from '../core/CameraDeviceInfo';
import { display } from '@kit.ArkUI';
import { RecordVideoOptions } from '../types/VideoFile';
import { CameraCaptureError } from '../types/CameraError';
import { RNOHContext } from '@rnoh/react-native-openharmony/ts';
import geoLocationManager from '@ohos.geoLocationManager';
import type { VisionCameraViewSpec } from '../types/VisionCameraViewSpec';
import colorSpaceManager from '@ohos.graphics.colorSpaceManager';
import { photoAccessHelper } from '@kit.MediaLibraryKit';

declare function getContext(component?: Object | undefined): Context;

const TAG: string = 'CameraSession:'

type ZoomRangeType = [number, number];

export default class CameraSession {
  context: Context = undefined;
  phAccessHelper: photoAccessHelper.PhotoAccessHelper = undefined;
  private cameraManager?: camera.CameraManager;
  private camerasArray?: Array<camera.CameraDevice>;
  private cameraInput?: camera.CameraInput;
  private mediaModel: camera.SceneMode = camera.SceneMode.NORMAL_PHOTO;
  private capability?: camera.CameraOutputCapability;
  private localDisplay?: display.Display;
  rect = {
    surfaceWidth: 1216, surfaceHeight: 2224
  };

  private photoSession?: camera.PhotoSession;

  private previewOutput: camera.PreviewOutput = undefined;
  private photoOutPut?: camera.PhotoOutput;
  private photoProfile?: camera.Profile;
  private preSurfaceId: string;

  private videoOutput?: camera.VideoOutput;
  private videoProfile: camera.VideoProfile;
  private videoSession?: camera.VideoSession;
  private avRecorder: media.AVRecorder;
  private photoPath: string = '';
  private basicPath: string = '';
  private outPathArray: string[] = ['photo', 'video'];
  private videoFile: fs.File;

  private videoSize: camera.Size = {
    width: 1920,
    height: 1080
  }
  private videoUri: string;
  private hasAudio: boolean = false
  private ctx!: RNOHContext;
  private videoCodeC: 'h264' | 'h265' = 'h265'

  public ZoomRange: ZoomRangeType | null = null;
  public photoPreviewScale: number = 1;
  public previewProfile: camera.Profile = {} as camera.Profile;
  private photoCaptureSetting: camera.PhotoCaptureSetting = {
    rotation: camera.ImageRotation.ROTATION_0,
    mirror: false,
    quality: camera.QualityLevel.QUALITY_LEVEL_MEDIUM,
  };
  private videoStartParams: RecordVideoOptions = {
    onRecordingError: (error) => {
    },
    onRecordingFinished: (video) => {
    },
    videoCodec: this.videoCodeC
  }
  // preview原点相对于设备原点x偏移量
  private offsetX: number = 0;
  // preview原点相对于设备原点y偏移量
  private offsetY: number = 0;

  constructor(_ctx?: RNOHContext) {
    _ctx && (this.ctx = _ctx);
    this.context = getContext(this);
    this.phAccessHelper = photoAccessHelper.getPhotoAccessHelper(this.context);
    this.basicPath = this.context.filesDir;
    for (let outPath of this.outPathArray) {
      this.initTempPath(outPath);
    }
    this.localDisplay = display.getDefaultDisplaySync();
    if (this.localDisplay) {
      let previewSize = {
        surfaceWidth: this.localDisplay.width, surfaceHeight: this.localDisplay.height
      }
      this.rect = previewSize;
    }

    try {
      this.cameraManager = camera.getCameraManager(this.context);
    } catch (e) {
      Logger.error(TAG, `getCameraManager catch e:${JSON.stringify(e)}`);
    }
  }

  /**
   * 初始化保存图片和视频的目录
   * @param path
   */
  initTempPath(path: string) {
    let pathDir = this.basicPath + '/' + path;
    let res;
    // /data/app/el2/100/base/com.example.kacha/haps/entry/files/photo
    try {
      res = fs.accessSync(pathDir);
    } catch (error) {
      Logger.error(TAG, `constructor error path not exists:${JSON.stringify(error)}`);
    }
    if (!res) {
      Logger.error(TAG, `constructor photo path not exists:${pathDir}`);
      fs.mkdirSync(pathDir, true);
    }
  }

  /**
   * 初始化相机
   * @param surfaceId
   */
  async initCamera(surfaceId: string, props: VisionCameraViewSpec.RawProps,
    mediaModel: camera.SceneMode): Promise<void> {
    this.preSurfaceId = surfaceId;
    this.mediaModel = mediaModel
    if (!this.cameraManager) {
      Logger.error(TAG, 'initCamera check cameraManager is empty');
      return;
    }
    if (!this.camerasArray) {
      let camerasArrayTemp = this.getAvailableCameraDevices();
      if (!camerasArrayTemp) {
        Logger.error(TAG, 'initCamera get getAvailableCameraDevices is empty');
        return;
      }
    }
    let currentDevice = this.camerasArray.find(d => d.cameraId === props.device?.id);
    if (!currentDevice) {
      currentDevice = this.camerasArray[0];
    }
    if (this.mediaModel === camera.SceneMode.NORMAL_PHOTO) {
      await this.initPhotoSession(currentDevice, surfaceId, props);
      await this.photoSession.start();
      this.setPhotoOutputCb(this.photoOutPut);
    } else {
      await this.initVideoSession(currentDevice, surfaceId, props);
    }
    if (!props.isActive) {
      this.activeChange(props.isActive);
    }
    this.focus(undefined);
    this.initProps(props);
  }

  /**
   * 初始化props参数
   */
  async initProps(props) {
    if (props.exposure !== undefined) {
      this.setExposure(props.exposure);
    }
    if (props.zoom !== undefined) {
      this.setSmoothZoom(props.zoom);
    }
    if (props.audio !== undefined) {
      this.setAudio(props.audio);
    }
    if (props.torch !== undefined) {
      this.setTorch(props.torch)
    }
    if (props.photoQualityBalance !== 'balanced') {
      this.setPhotoQualitySetting(props.photoQualityBalance);
    }
    if (props.enableLocation) {
      this.setPhotoLocationSetting(props.enableLocation);
    }
  }

  async initVideoSession(currentDevice: camera.CameraDevice, surfaceId: string, props: VisionCameraViewSpec.RawProps) {
    this.setAudio(props.audio)

    this.cameraInput = this.cameraManager.createCameraInput(currentDevice);
    this.cameraInput.open();
    this.capability = this.cameraManager.getSupportedOutputCapability(currentDevice, camera.SceneMode.NORMAL_VIDEO);
    if (surfaceId && props.preview) {
      this.previewProfile = this.capability.previewProfiles.find((profile: camera.Profile) => {
        if (props.videoHdr) {
          return profile.size.width === this.videoSize.width && profile.size.height === this.videoSize.height &&
            profile.format === camera.CameraFormat.CAMERA_FORMAT_YCRCB_P010;
        } else {
          return profile.size.width === this.videoSize.width && profile.size.height === this.videoSize.height &&
            profile.format === camera.CameraFormat.CAMERA_FORMAT_YUV_420_SP;
        }
      });
      this.previewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, surfaceId);
    }
    this.videoProfile = this.capability.videoProfiles.find((profile: camera.VideoProfile) => {
      if (props.videoHdr) {
        return profile.size.width === this.videoSize.width && profile.size.height === this.videoSize.height &&
          profile.format === camera.CameraFormat.CAMERA_FORMAT_YCRCB_P010;
      } else {
        return profile.size.width === this.videoSize.width && profile.size.height === this.videoSize.height &&
          profile.format === camera.CameraFormat.CAMERA_FORMAT_YUV_420_SP;
      }
    });

    this.videoOutput = await this.recordPrepared(this.videoStartParams, props);

    this.videoSession = this.cameraManager?.createSession(camera.SceneMode.NORMAL_VIDEO);
    this.videoSession.beginConfig();
    this.videoSession.addInput(this.cameraInput);
    if (surfaceId && this.previewOutput && props.preview) {
      this.videoSession.addOutput(this.previewOutput);
    }
    if (this.videoOutput) {
      this.videoSession?.addOutput(this.videoOutput);
    }
    try {
      await this.videoSession.commitConfig();
    } catch (error) {
      Logger.error(TAG, `initVideoSession commitConfig1 ${JSON.stringify(error)}`);
    }

    if (props.videoHdr) {
      await this.setVideoStabilizationMode(true);
    } else {
      await this.setVideoStabilizationMode(false, props.videoStabilizationMode);
    }

    await this.videoSession.start();
  }

  async initPhotoSession(currentDevice: camera.CameraDevice, surfaceId: string, props: VisionCameraViewSpec.RawProps) {
    this.cameraInput = this.cameraManager.createCameraInput(currentDevice);
    this.cameraInput.open();
    this.capability = this.cameraManager.getSupportedOutputCapability(currentDevice, camera.SceneMode.NORMAL_PHOTO);
    if (surfaceId && props.preview) {
      // previewProfile是通过this.capability.previewProfiles获取的，这里和OS沟通可设置为通用的1920和1080
      this.previewProfile = {
        format: 1003,
        size: {
          width: 1920,
          height: 1080
        }
      }
      this.previewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, surfaceId);
    }
    this.photoProfile = this.capability.photoProfiles[0];
    this.photoSession = this.cameraManager?.createSession(camera.SceneMode.NORMAL_PHOTO);
    this.photoOutPut = this.cameraManager.createPhotoOutput(this.photoProfile);
    this.photoSession.beginConfig();
    this.photoSession.addInput(this.cameraInput);
    if (this.previewOutput && props.preview) {
      this.photoSession.addOutput(this.previewOutput);
    }
    this.photoSession.addOutput(this.photoOutPut);
    try {
      await this.photoSession.commitConfig();
    } catch (error) {
      Logger.error(TAG, `initPhotoSession commitConfig error: ${JSON.stringify(error)}`);
    }
  }

  async hdrChange(props: VisionCameraViewSpec.RawProps) {
    this.previewProfile = this.capability?.previewProfiles.find((profile: camera.VideoProfile) => {
      if (props?.videoHdr) {
        return profile.size.width === this.videoSize.width && profile.size.height === this.videoSize.height &&
          profile.format === camera.CameraFormat.CAMERA_FORMAT_YCRCB_P010;
      } else {
        return profile.size.width === this.videoSize.width && profile.size.height === this.videoSize.height &&
          profile.format === camera.CameraFormat.CAMERA_FORMAT_YUV_420_SP;
      }
    });
    this.videoProfile = this.capability?.videoProfiles.find((profile: camera.VideoProfile) => {
      if (props?.videoHdr) {
        return profile.size.width === this.videoSize.width && profile.size.height === this.videoSize.height &&
          profile.format === camera.CameraFormat.CAMERA_FORMAT_YCRCB_P010;
      } else {
        return profile.size.width === this.videoSize.width && profile.size.height === this.videoSize.height &&
          profile.format === camera.CameraFormat.CAMERA_FORMAT_YUV_420_SP;
      }
    });

    await this.videoSession?.stop();
    try {
      this.videoSession?.beginConfig();
      if (this.previewOutput) {
        this.videoSession?.removeOutput(this.previewOutput);
        await this.previewOutput.release();
      }
      let localPreviewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, this.preSurfaceId);
      this.previewOutput = localPreviewOutput;
      this.videoSession?.addOutput(localPreviewOutput);

      let localVideoOutput = await this.recordPrepared(this.videoStartParams, props)
      if (this.videoOutput) {
        this.videoSession?.removeOutput(this.videoOutput);
        await this.videoOutput.release();
      }
      this.videoOutput = localVideoOutput;
      this.videoSession.addOutput(this.videoOutput);
      let colorSpace =
        props?.videoHdr ? colorSpaceManager.ColorSpace.BT2020_HLG_LIMIT : colorSpaceManager.ColorSpace.BT709_LIMIT;
      this.videoSession?.setColorSpace(colorSpace);
      await this.videoSession?.commitConfig();
      let isSupported = this.videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.AUTO);
      if (isSupported) {
        this.videoSession.setVideoStabilizationMode(camera.VideoStabilizationMode.AUTO);
      }
      await this.videoSession?.start();

    } catch (error) {
      Logger.error(TAG, `hdrChange change Output error,${JSON.stringify(error)}`);
    }
  }

  async previewChange(preview: boolean): Promise<void> {
    const targetSession = this.photoSession ? this.photoSession : this.videoSession;
    if (preview) {
      if (this.previewOutput) {
        targetSession?.beginConfig();
        targetSession?.addOutput(this.previewOutput);
        await targetSession?.commitConfig();
        await targetSession?.start();
      } else {
        this.previewProfile = this.capability.previewProfiles[this.capability.previewProfiles.length - 1];
        this.previewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, this.preSurfaceId);
        targetSession?.beginConfig();
        targetSession?.addOutput(this.previewOutput);
        await targetSession?.commitConfig();
        await targetSession?.start();
      }
    } else {
      if (this.previewOutput) {
        targetSession?.beginConfig();
        targetSession?.removeOutput(this.previewOutput);
        await targetSession?.commitConfig();
        await targetSession?.start();
      }
    }
  }

  /**
   * 录制准备
   */
  async recordPrepared(options: RecordVideoOptions, props: VisionCameraViewSpec.RawProps) {
    if (this.avRecorder) {
      await this.avRecorder.release();
    }
    this.avRecorder = await media.createAVRecorder();
    let videoBitRate: number = 1
    if (typeof options.videoBitRate === 'number') {
      videoBitRate = options.videoBitRate
    } else if (typeof options.videoBitRate === 'string') {
      videoBitRate = this.getBitRateMultiplier(options.videoBitRate)
    }
    let audioConfig = {
      audioChannels: 2,
      audioCodec: media.CodecMimeType.AUDIO_AAC,
      audioBitrate: 48000,
      audioSampleRate: 48000,
    }
    let videoConfig: media.AVRecorderProfile = {
      fileFormat: media.ContainerFormatType.CFT_MPEG_4,
      videoBitrate: videoBitRate * 70_000_000,
      videoCodec: options.videoCodec === 'h265' ? media.CodecMimeType.VIDEO_HEVC : media.CodecMimeType.VIDEO_AVC,
      videoFrameWidth: this.videoSize.width,
      videoFrameHeight: this.videoSize.height,
      videoFrameRate: props.fps ? props.fps : 30,
      isHdr: props.videoHdr ? props.videoHdr : false
    };
    let videoConfigProfile: media.AVRecorderProfile = this.hasAudio ? {
      ...audioConfig, ...videoConfig
    } : videoConfig
    this.videoUri = `${this.basicPath}/${this.outPathArray[1]}/${Date.now()}.${options.fileType || 'mp4'}`;
    // 点击开始录制才询问是否保存到图库,此时options.fileType不是undefined
    if (options.fileType != undefined) {
      this.videoUri =
        await this.getMediaLibraryUri(this.videoUri, `${Date.now()}`, `${options.fileType || 'mp4'}`,
          photoAccessHelper.PhotoType.VIDEO)
    }
    this.videoFile = fs.openSync(this.videoUri, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE);
    let aVAudio = {
      audioSourceType: media.AudioSourceType.AUDIO_SOURCE_TYPE_MIC
    }
    let aVVideo = {
      videoSourceType: media.VideoSourceType.VIDEO_SOURCE_TYPE_SURFACE_YUV,
      profile: videoConfigProfile,
      url: `fd://${this.videoFile.fd.toString()}`, // 文件需先由调用者创建，赋予读写权限，将文件fd传给此参数，eg.fd://45--file:///data/media/01.mp4
      rotation: 90, // 合理值0、90、180、270，非合理值prepare接口将报错
      location: {
        latitude: 30, longitude: 130
      }
    }
    let aVRecorderConfig: media.AVRecorderConfig = this.hasAudio ? {
      ...aVAudio, ...aVVideo
    } : aVVideo;
    await this.avRecorder.prepare(aVRecorderConfig);
    let videoSurfaceId = await this.avRecorder.getInputSurface();
    let videoOutput: camera.VideoOutput;
    try {
      videoOutput = this.cameraManager.createVideoOutput(this.videoProfile, videoSurfaceId);
    } catch (error) {
      Logger.error(TAG, `recordPrepared createVideoOutput.error ${JSON.stringify(error)}`);
    }
    return videoOutput;
  }

  private getBitRateMultiplier(bitRate: RecordVideoOptions['videoBitRate']): number {
    switch (bitRate) {
      case 'extra-low':
        return 0.6
      case 'low':
        return 0.8
      case 'normal':
        return 1
      case 'high':
        return 1.2
      case 'extra-high':
        return 1.4
    }
  }


  //设置预览样式 cover/contain
  setResizeMode(resizeMode: string, displayWidth: number = 1216, displayHeight: number = 2688,
    callback: (width: number, height: number) => void) {
    let previewSize = this.previewProfile.size
    let screenAspect = displayWidth / displayHeight;
    let previewAspect = previewSize.height / previewSize.width;
    let componentWidth: number = 0;
    let componentHeight: number = 0;
    if (resizeMode === 'cover') {
      if (screenAspect >= previewAspect) {
        componentWidth = displayWidth;
        componentHeight = displayWidth / previewAspect;
      } else {
        componentWidth = displayHeight * previewAspect;
        componentHeight = displayHeight;
      }
    } else if (resizeMode === 'contain') {
      if (screenAspect >= previewAspect) {
        componentWidth = displayHeight * previewAspect;
        componentHeight = displayHeight;
      } else {
        componentWidth = displayWidth;
        componentHeight = displayWidth / previewAspect;
      }
    }
    // 计算设备左上角与预览流左上角偏移量
    this.offsetX = (componentWidth - displayWidth) / 2;
    this.offsetY = (componentHeight - displayHeight) / 2;
    this.rect = {
      surfaceWidth: componentWidth, surfaceHeight: componentHeight
    }
    callback(componentWidth, componentHeight);
  }

  //开始预览 isActive:true
  async activeChange(isActive: boolean): Promise<void> {
    const targetSession = this.photoSession ? this.photoSession : this.videoSession;
    try {
      if (isActive) {
        await targetSession.start();
      } else {
        await targetSession.stop();
      }
    } catch (error) {
      Logger.error(TAG, `The activeChange targetSession start call failed. error code: ${error.code}`);
    }
  }

  //设置曝光补偿
  setExposure(exposure: number): void {
    try {
      //[-4,4]
      const [min, max]: Array<number> = this.photoSession?.getExposureBiasRange();
      if (exposure >= min && exposure <= max) {
        let value = this.photoSession?.getExposureValue();
        this.photoSession?.setExposureBias(exposure);
      } else {
      }
    } catch (error) {
      Logger.error(TAG, `The setExposureBias call failed. error code: ${error.code}`);
    }
  }

  //设置缩放[0.49,50]
  setSmoothZoom(zoom: number): void {
    try {
      const [min, max]: Array<number> = this.getZoomRange();
      if (zoom <= min) {
        zoom = min;
      } else if (zoom >= max) {
        zoom = max;
      }
      this.photoSession?.setSmoothZoom(zoom, camera.SmoothZoomMode.NORMAL);
      this.photoPreviewScale = zoom;
    } catch (error) {
      Logger.error(TAG, `The setSmoothZoom call failed. error code: ${error.code}.`);
    }
  }

  //获取缩放阈值
  getZoomRange(forceUpdate: boolean = false): ZoomRangeType {
    try {
      if (this.ZoomRange === null || forceUpdate) {
        const [min, max]: Array<number> = this.photoSession?.getZoomRatioRange();
        this.ZoomRange = [min, max];
      }
      return this.ZoomRange;
    } catch (error) {
      Logger.error(TAG, `The getZoomRatioRange call failed. error code: ${error.code}.`);
    }
  }

  //设置手电筒模式
  setTorch(mode: string): void {
    let cameraSession;
    if (this.photoSession) {
      cameraSession = this.photoSession;
    } else if (this.videoSession) {
      cameraSession = this.videoSession;
    } else {
      Logger.error(TAG, `The setTorchMode call failed. error cameraSession is undefined`);
      return;
    }
    if (cameraSession.hasFlash()) {
      if (mode === 'on' && cameraSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_ALWAYS_OPEN)) {
        cameraSession?.setFlashMode(camera.FlashMode.FLASH_MODE_ALWAYS_OPEN);
      } else if (mode === 'off' && cameraSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_CLOSE)) {
        cameraSession?.setFlashMode(camera.FlashMode.FLASH_MODE_CLOSE);
      }
    }
  }

  /**
   * 设置视频防抖模式
   */
  async setVideoStabilizationMode(isStart: boolean, mode?: string) {
    if (!this.videoSession) {
      return
    }
    let videoMode = camera.VideoStabilizationMode.AUTO
    if (mode === 'off') {
      videoMode = camera.VideoStabilizationMode.OFF
    }
    if (mode === 'standard') {
      videoMode = camera.VideoStabilizationMode.LOW
    }
    if (mode === 'cinematic') {
      videoMode = camera.VideoStabilizationMode.MIDDLE
    }
    if (mode === 'cinematic-extended') {
      videoMode = camera.VideoStabilizationMode.HIGH
    }
    let isSupported: boolean = false;
    try {
      isSupported = this.videoSession.isVideoStabilizationModeSupported(videoMode);
    } catch (error) {
      let err = error as BusinessError;
      Logger.error(TAG, `The isVideoStabilizationModeSupported call failed. error code: ${err.code}`);
    }
    if (isSupported) {
      try {
        this.videoSession.setVideoStabilizationMode(videoMode);
        if (!isStart) {
          this.videoSession.beginConfig();
          await this.videoSession.commitConfig();
          await this.videoSession.start();
        }
      } catch (error) {
        let err = error as BusinessError;
        Logger.error(TAG, `The setVideoStabilizationMode call failed. error code: ${err.code}`);
      }
    } else {
      this.ctx &&
      this.ctx.rnInstance.emitDeviceEvent('onError', new CameraCaptureError('capture/unknown',
        `the device does not support the ${mode} video stabilization mode.`));
    }
  }

  /**
   * 相机输出能力
   */
  getSupportedOutputCapability(cameraDevice: camera.CameraDevice,
    cameraManager: camera.CameraManager): camera.CameraOutputCapability {
    let cameraOutputCapability: camera.CameraOutputCapability =
      cameraManager.getSupportedOutputCapability(cameraDevice, this.mediaModel);
    return cameraOutputCapability;
  }

  /**
   * 资源释放
   */
  async cameraRelease() {
    try {
      if (this.cameraInput) {
        await this.cameraInput.close();
      }
      if (this.previewOutput) {
        await this.previewOutput.release();
      }
      if (this.photoOutPut) {
        await this.photoOutPut.release();
      }
      if (this.videoOutput) {
        await this.videoOutput.release();
      }
      if (this.photoSession) {
        await this.photoSession.release();
      }
      if (this.videoSession) {
        await this.videoSession.release();
      }
      if (this.videoFile && this.videoFile.fd) {
        fs.closeSync(this.videoFile);
      }
      if (this.avRecorder) {
        await this.avRecorder.release();
      }
    } catch (error) {
      Logger.error(TAG, `releaseCamera end error: ${JSON.stringify(error)}`);
    }
  }

  // 通过弹窗获取需要保存到媒体库的位于应用沙箱的图片/视频uri
  async getMediaLibraryUri(srcFileUri: string, title: string, fileNameExtension: string,
    photoType: photoAccessHelper.PhotoType): Promise<string> {
    try {
      let srcFileUris: Array<string> = [
      // 应用沙箱的图片/视频uri
        srcFileUri
      ];
      let photoCreationConfigs: Array<photoAccessHelper.PhotoCreationConfig> = [
        {
          title: title,
          fileNameExtension: fileNameExtension,
          photoType: photoType,
          subtype: photoAccessHelper.PhotoSubtype.DEFAULT,
        }
      ];
      let desFileUris: Array<string> =
        await this.phAccessHelper.showAssetsCreationDialog(srcFileUris, photoCreationConfigs);
      return desFileUris[0];
    } catch (err) {
      Logger.error(TAG, `showAssetsCreationDialog failed, errCode is:${err.code},errMsg is:${err.message}`);
    }
  }

  // 保存图片
  async savePicture(photoAccess: photoAccessHelper.PhotoAsset): Promise<void> {
    let photoFile = `${this.basicPath}/${this.outPathArray[0]}/${Date.now().toString()}.jpeg`;
    photoFile = await this.getMediaLibraryUri(photoFile, `${Date.now()}`, 'jpeg', photoAccessHelper.PhotoType.IMAGE)
    // 根据相机拍照图片路径，获取文件buffer
    let file = fs.openSync(photoAccess.uri, fs.OpenMode.READ_ONLY);
    let stat = fs.statSync(file.fd);
    let buffer = new ArrayBuffer(stat.size);
    fs.readSync(file.fd, buffer);
    fs.fsyncSync(file.fd);
    fs.closeSync(file);
    try {
      file = fs.openSync(photoFile, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE);
      await fs.write(file.fd, buffer);
    } catch (error) {
      Logger.error(TAG, `savePicture statSync failed,code:${error}.`);
    }
    fs.closeSync(file);
    this.photoPath = photoFile;
  }


  setPhotoOutputCb(photoOutput: camera.PhotoOutput): void {
    photoOutput.on('photoAssetAvailable', (err: BusinessError, photoAsset: photoAccessHelper.PhotoAsset) => {
      if (err || photoAsset === undefined) {
        Logger.error(TAG, `setPhotoOutputCb photoAssetAvailable failed, ${JSON.stringify(err)}`);
        return;
      }
      this.savePicture(photoAsset);
    });
  }

  /**
   * 参数配置
   */
  focus(rnPoint: Point) {
    let status: boolean = false;
    const targetSession = this.photoSession ? this.photoSession : this.videoSession;
    try {
      status = targetSession.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_AUTO);
    } catch (error) {
      Logger.error(TAG, `The focus isFocusModeSupported call failed. error code: ${JSON.stringify(error)}`);
      return;
    }
    if (status) {
      // 指定焦点时设置焦点
      if (rnPoint) {
        try {
          targetSession.setFocusMode(camera.FocusMode.FOCUS_MODE_AUTO);
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(TAG, `The setFocusMode call failed. error code: ${err.code}`);
          return;
        }
        let ohPoint = this.convertPoint(rnPoint);
        try {
          targetSession.setFocusPoint(ohPoint);
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(TAG, `The setFocusPoint call failed. error code: ${err.code}`);
        }
      } else {
        // 没有指定焦点时设置自动对焦
        try {
          targetSession.setFocusMode(camera.FocusMode.FOCUS_MODE_AUTO);
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(TAG, `The setFocusMode call failed. error code: ${err.code}`);
          return;
        }
      }
    }
  }

  /**
   * 转换为鸿蒙Point坐标
   * VC坐标系(x,y)-> OH坐标系(x/w,y/h)
   * @param rnPoint
   * @returns
   */
  convertPoint(rnPoint: Point): Point {
    let ohPoint: Point = {
      x: 0, y: 0
    }
    if (rnPoint) {
      ohPoint.x = (rnPoint.x + this.offsetX) / this.rect.surfaceWidth;
      ohPoint.y = (rnPoint.y + this.offsetY) / this.rect.surfaceHeight;
    }
    return ohPoint;
  }


  /**
   * 设置photoQuality
   * @param quality
   */
  setPhotoQualitySetting(quality: 'speed' | 'balanced' | 'quality' = 'speed'): void {
    this.photoCaptureSetting.quality = this.getQualityLevel(quality);
  }

  /**
   * photoQuality转换
   * @param level
   * @returns
   */
  getQualityLevel(level) {
    switch (level) {
      case 'speed':
        return camera.QualityLevel.QUALITY_LEVEL_LOW;
      case 'balanced':
        return camera.QualityLevel.QUALITY_LEVEL_MEDIUM;
      case 'quality':
        return camera.QualityLevel.QUALITY_LEVEL_HIGH;
      default:
        return camera.QualityLevel.QUALITY_LEVEL_MEDIUM;
    }
  }

  /**
   * 设置拍摄位置
   * @param enableLocation
   */
  async setPhotoLocationSetting(enableLocation: boolean): Promise<void> {
    if (enableLocation) {
      this.photoCaptureSetting.location = await this.getLocation();
    } else {
      delete this.photoCaptureSetting.location;
    }
  }

  /**
   * 获取当前位置
   */
  async getLocation(): Promise<camera.Location> {
    let requestInfo: geoLocationManager.CurrentLocationRequest = {
      'priority': geoLocationManager.LocationRequestPriority.FIRST_FIX,
      'scenario': geoLocationManager.LocationRequestScenario.UNSET,
      'maxAccuracy': 0
    };
    try {
      const result = await geoLocationManager.getCurrentLocation(requestInfo);
      return result
    } catch (error) {
      if (error.code === '3301100') {
        Logger.error(TAG, `the switch for the location function is not turned on, error code: ${error?.code}.`);
        this.ctx &&
        this.ctx.rnInstance.emitDeviceEvent('onError', new CameraCaptureError('capture/location-not-turned-on',
          'the switch for the location function is not turned on.'));
      }
      Logger.error(TAG, `getCurrentLocation error, error code is ${error?.code}.`);
      delete this.photoCaptureSetting.location;
    }
  }

  /**
   * 拍照
   */
  async takePhoto(options: TakePhotoOptions): Promise<PhotoFile> {
    if (options && this.photoSession.hasFlash()) {
      if (options.flash === 'on' && this.photoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_OPEN)) {
        this.photoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_OPEN);
      } else if (options.flash === 'off' &&
      this.photoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_CLOSE)) {
        this.photoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_CLOSE);
      } else if (options.flash === 'auto' &&
      this.photoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_AUTO)) {
        this.photoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_AUTO);
      }
    }
    try {
      await this.photoOutPut.capture(this.photoCaptureSetting);
    } catch (error) {
      Logger.error(TAG, `Failed to capture error: ${error.message},code:${error.code}`);
      return;
    }
    await this.waitForPathResult();
    let photoFile: PhotoFile = {} as PhotoFile;
    photoFile.width = this.photoProfile?.size.height;
    photoFile.height = this.photoProfile?.size.width;
    photoFile.path = this.photoPath;
    photoFile.isRawPhoto = false;
    photoFile.orientation = this.getOrientation(this.photoCaptureSetting.rotation)

    this.photoPath = '';
    return photoFile;
  }

  getOrientation(orientation: camera.ImageRotation) {
    switch (orientation) {
      case camera.ImageRotation.ROTATION_0:
        return Orientation.PORTRAIT;
      case camera.ImageRotation.ROTATION_90:
        return Orientation.LANDSCAPE_LEFT;
      case camera.ImageRotation.ROTATION_180:
        return Orientation.PORTRAIT_UPSIDE_DOWN;
      case camera.ImageRotation.ROTATION_270:
        return Orientation.LANDSCAPE_RIGHT;
      default:
        Logger.error(TAG, `getOrientation param:${orientation}`);
        break;
    }
  }

  /**
   * 等待path的值被设置
   * @returns
   */
  private waitForPathResult(): Promise<void> {
    return new Promise(resolve => {
      const intervalId = setInterval(() => {
        if (this.photoPath !== '') {
          clearInterval(intervalId);
          resolve();
        }
      }, 100);
    })
  }

  /**
   * 获取可用设备
   */
  getAvailableCameraDevices(): Array<camera.CameraDevice> {
    let camerasArray = this.cameraManager?.getSupportedCameras();
    if (!camerasArray) {
      Logger.error(TAG, 'getAvailableCameraDevices cannot get cameras');
      return;
    }
    this.camerasArray = camerasArray;
    return camerasArray;
  }

  convertCameraDevice(): CameraDeviceInfo[] {
    if (!this.camerasArray) {
      Logger.error(TAG, 'convertCameraDeviceInfo cameraDevices is null');
    }
    let cameraDevices = this.camerasArray

    let cameraArray: Array<CameraDeviceInfo> = [];
    for (const cameraDevice of cameraDevices) {
      let cameraInfo: CameraDeviceInfo = {} as CameraDeviceInfo;
      cameraInfo.id = cameraDevice.cameraId;
      this.getDeviceTypeAndConnectType(cameraDevice, cameraInfo);

      cameraInfo.hasFlash = this.cameraManager?.isTorchSupported();
      cameraInfo.hasTorch = this.cameraManager?.isTorchModeSupported(camera.TorchMode.ON);

      let cameraDeviceFormats: Array<CameraDeviceFormat> = [];
      let capability =
        this.cameraManager.getSupportedOutputCapability(cameraDevice, camera.SceneMode.NORMAL_VIDEO);
      for (const pProfile of capability.photoProfiles) {
        let cameraDeviceFormat = {} as CameraDeviceFormat;
        cameraDeviceFormat.photoHeight = pProfile.size.height;
        cameraDeviceFormat.photoWidth = pProfile.size.width;
        cameraDeviceFormats.push(cameraDeviceFormat);
      }
      let supportedVideoStabilizationMode: Array<VideoStabilizationMode> =
        this.getSupportedVideoStabilizationMode(this.videoSession);
      for (const vProfile of capability.videoProfiles) {
        let cameraDeviceFormat = {} as CameraDeviceFormat;
        cameraDeviceFormat.videoHeight = vProfile.size.height;
        cameraDeviceFormat.videoWidth = vProfile.size.width;
        cameraDeviceFormat.minFps = vProfile.frameRateRange.min;
        cameraDeviceFormat.maxFps = vProfile.frameRateRange.max;
        cameraDeviceFormat.videoStabilizationModes = supportedVideoStabilizationMode;
        cameraDeviceFormats.push(cameraDeviceFormat);
      }
      this.getVideoSessionParams(cameraDevice, cameraInfo, cameraDevices);
      cameraInfo.formats = cameraDeviceFormats;
      cameraArray.push(cameraInfo);
    }
    return cameraArray;
  }

  private getDeviceTypeAndConnectType(cameraDevice: camera.CameraDevice, cameraInfo: CameraDeviceInfo) {
    if (cameraDevice.cameraType === camera.CameraType.CAMERA_TYPE_WIDE_ANGLE) {
      cameraInfo.physicalDevices = [PhysicalCameraDeviceType.WIDE_ANGLE_CAMERA];
    } else if (cameraDevice.cameraType === camera.CameraType.CAMERA_TYPE_ULTRA_WIDE) {
      cameraInfo.physicalDevices = [PhysicalCameraDeviceType.ULTRA_WIDE_ANGLE_CAMERA];
    } else {
    }

    if (cameraDevice.connectionType === camera.ConnectionType.CAMERA_CONNECTION_BUILT_IN) {
      if (cameraDevice.cameraPosition === camera.CameraPosition.CAMERA_POSITION_BACK) {
        cameraInfo.position = CameraPosition.BACK;
      } else if (cameraDevice.cameraPosition === camera.CameraPosition.CAMERA_POSITION_FRONT) {
        cameraInfo.position = CameraPosition.FRONT;
      } else {
      }
    } else {
      cameraInfo.position = CameraPosition.EXTERNAL;
    }
  }


  private getVideoSessionParams(cameraDevice: camera.CameraDevice, cameraInfo: CameraDeviceInfo,
    cameraDevices: camera.CameraDevice[] | undefined) {
    this.initVideoSession(cameraDevice, undefined, {} as VisionCameraViewSpec.RawProps).then(() => {
      cameraInfo.supportsFocus = this.focusSupport(this.videoSession);

      let [minZoom, maxZoom]: number[] = this.videoSession.getZoomRatioRange();
      let biasRangeArray: Array<number> = this.videoSession.getExposureBiasRange();
      cameraInfo.minZoom = minZoom;
      cameraInfo.maxZoom = maxZoom;
      cameraInfo.minExposure = biasRangeArray[0];
      cameraInfo.maxExposure = biasRangeArray[1];
      this.cameraRelease();
    });
  }

  initDeviceInfo(): CameraDeviceInfo[] {
    this.getAvailableCameraDevices();
    let cameraInfos = this.convertCameraDevice();
    return cameraInfos;
  }

  private getSupportedVideoStabilizationMode(videoSession: camera.VideoSession) {
    let supportedVideoStabilizationMode: Array<VideoStabilizationMode> = [];
    if (!videoSession) {
      Logger.error(TAG, `getSupportedVideoStabilizationMode params videoSession is empty`)
      return supportedVideoStabilizationMode;
    }
    if (videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.OFF)) {
      supportedVideoStabilizationMode.push(VideoStabilizationMode.OFF);
    }
    if (videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.LOW)) {
      supportedVideoStabilizationMode.push(VideoStabilizationMode.STANDARD);
    }
    if (videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.MIDDLE)) {
      supportedVideoStabilizationMode.push(VideoStabilizationMode.CINEMATIC);
    }
    if (videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.HIGH)) {
      supportedVideoStabilizationMode.push(VideoStabilizationMode.CINEMATIC_EXTENDED);
    }
    if (videoSession.isVideoStabilizationModeSupported(camera.VideoStabilizationMode.AUTO)) {
      supportedVideoStabilizationMode.push(VideoStabilizationMode.AUTO);
    }
    return supportedVideoStabilizationMode;
  }

  private focusSupport(photoSession: camera.PhotoSession): boolean {
    if (photoSession.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_MANUAL)) {
      return true
    }
    if (photoSession.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_CONTINUOUS_AUTO)) {
      return true
    }
    if (photoSession.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_AUTO)) {
      return true
    }
    if (photoSession.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_LOCKED)) {
      return true
    }
    return false;
  }

  /**
   * @param options
   * 更新audio属性
   */
  setAudio(isAudio) {
    if (isAudio !== undefined) {
      this.hasAudio = isAudio
    }
  }

  /**
   * @param options
   * 开始录制
   */
  async startRecording(options: RecordVideoOptions, props: VisionCameraViewSpec.RawProps) {

    try {
      if (await fs.access(this.videoFile?.path)) {
        await fs.unlink(this.videoFile?.path);
      }
    } catch (error) {
      Logger.error(TAG, `startRecording not init videoFile, error:${JSON.stringify(error)}`);
    }
    if (options.fileType && options.fileType === 'mov') {
      this.ctx &&
      this.ctx.rnInstance.emitDeviceEvent('onRecordingError', new CameraCaptureError('capture/no-recording-in-progress',
        'the system does not support the MOV format.'));
      return;
    }

    let rateRange = this.videoProfile.frameRateRange;
    if (rateRange && props.fps) {
      if (rateRange.min <= props.fps && rateRange.max >= props.fps) {
      } else {
        this.ctx && this.ctx.rnInstance.emitDeviceEvent('onRecordingError',
          new CameraCaptureError('capture/no-recording-in-progress',
            `FPS should be in (${rateRange.min}-${rateRange.max})`));
        return;
      }
    }
    if (props.videoHdr && options.videoCodec === 'h264') {
      Logger.error(TAG, `recordPrepared rateRange, props videoHdr:${props.videoHdr},videoCodec:${options.videoCodec}`);
      this.ctx &&
      this.ctx.rnInstance.emitDeviceEvent('onRecordingError', new CameraCaptureError('capture/encoder-error',
        'the encoding formats of videoHdr and videoCodec do not match.'));
      return;
    }
    if (this.avRecorder.state === 'prepared' || this.avRecorder.state === 'idle' ||
      this.avRecorder.state === 'released') {
      if (this.avRecorder.state !== 'released') {
        await this.avRecorder.release();
      }
      if (options.videoCodec && options.videoCodec !== this.videoCodeC) {
        this.videoCodeC = options.videoCodec;
      }
      if (this.avRecorder.state === 'released') {
        let videoOutput: camera.VideoOutput = await this.recordPrepared(options, props)
        this.videoSession.beginConfig();
        if (this.videoOutput) {
          this.videoSession?.removeOutput(this.videoOutput);
          await this.videoOutput.release();
        }
        this.videoOutput = videoOutput;
        this.videoSession.addOutput(this.videoOutput);
        let colorSpace =
          props?.videoHdr ? colorSpaceManager.ColorSpace.BT2020_HLG_LIMIT : colorSpaceManager.ColorSpace.BT709_LIMIT;
        this.videoSession?.setColorSpace(colorSpace);
        await this.videoSession.commitConfig();
        await this.setVideoStabilizationMode(true);
        await this.videoSession.start();

      }
      if (this.videoSession.hasFlash()) {
        if (options.flash === 'on' &&
        this.videoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_ALWAYS_OPEN)) {
          this.videoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_ALWAYS_OPEN);
        } else if (options.flash === 'off' &&
        this.videoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_CLOSE)) {
          this.videoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_CLOSE);
        }
      }
      const vsMode = this.videoSession.getActiveVideoStabilizationMode();
      try {
        await this.avRecorder.start();
      } catch (error) {
        Logger.error(TAG, 'startRecording catch Failed to start recording.' + JSON.stringify(error))
        this.ctx && this.ctx.rnInstance.emitDeviceEvent('onRecordingError',
          new CameraCaptureError('capture/recording-in-progress', 'Failed to start recording.'));
      }
      this.videoOutput.start((err: BusinessError) => {
        if (err) {
          Logger.error(TAG, 'startRecording videoOutput.start Failed to start recording.' + JSON.stringify(err))
          this.ctx && this.ctx.rnInstance.emitDeviceEvent('onRecordingError',
            new CameraCaptureError('capture/recording-in-progress', 'Failed to start recording.'));
          return;
        }
      });
    }
  }

  /**
   * 停止录制
   */
  async stopRecording() {
    if (this.avRecorder.state === 'started' || this.avRecorder.state === 'paused') {
      await this.avRecorder.stop();
      this.videoOutput.stop((err: BusinessError) => {
        if (err) {
          Logger.error(TAG, `stopRecording: Failed to stop the video output. error: ${JSON.stringify(err)}`);
          return;
        }
      });
      // 2.重置
      await this.avRecorder.release();

      if (this.videoSession.hasFlash() &&
        this.videoSession.getFlashMode() === camera.FlashMode.FLASH_MODE_ALWAYS_OPEN &&
      this.videoSession?.isFlashModeSupported(camera.FlashMode.FLASH_MODE_CLOSE)) {
        this.videoSession?.setFlashMode(camera.FlashMode.FLASH_MODE_CLOSE);
      }

      let avMetadataExtractor: media.AVMetadataExtractor = await media.createAVMetadataExtractor()
      avMetadataExtractor.fdSrc = {
        fd: this.videoFile.fd
      }
      let avMetadata: media.AVMetadata = await avMetadataExtractor.fetchMetadata()
      let duration: number = parseInt(avMetadata.duration) / 1000
      this.ctx && this.ctx.rnInstance.emitDeviceEvent('onRecordingFinished', {
        height: parseInt(avMetadata.videoHeight),
        width: parseInt(avMetadata.videoWidth),
        path: this.videoUri,
        duration: Math.floor(duration)
      });
      fs.closeSync(this.videoFile);
    }
  }

  // 暂停录制
  async pauseRecording() {
    if (this.avRecorder.state === 'started') {
      await this.avRecorder.pause();
      this.videoOutput.stop((err: BusinessError) => {
        if (err) {
          Logger.error(TAG, `pauseRecording: Failed to stop the video output. error: ${JSON.stringify(err)}`);
          return;
        }
      });
    }
  }

  /**
   * 恢复录制
   */
  async resumeRecording() {
    if (this.avRecorder.state === 'paused') {
      await this.avRecorder.resume();
      this.videoOutput.start((err: BusinessError) => {
        if (err) {
          Logger.error(TAG, `resumeRecording: Failed to stop the video output. error: ${JSON.stringify(err)}`);
          return;
        }
      });
    }
  }
}

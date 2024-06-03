import camera from '@ohos.multimedia.camera';
import Logger from '../utils/Logger';
import { PhotoFile, Point, TakePhotoOptions } from '../core/CameraConfig';
import { media } from '@kit.MediaKit';
import { Context } from '@kit.AbilityKit';
import image from '@ohos.multimedia.image';
import { BusinessError } from '@ohos.base';
import fs from '@ohos.file.fs';
import { CameraPosition, PhysicalCameraDeviceType, VideoStabilizationMode } from '../core/CameraEnumBox';
import { CameraDeviceFormat, CameraDeviceInfo } from '../core/CameraDeviceInfo';
import PhotoAccessHelper from '@ohos.file.photoAccessHelper';
import { display } from '@kit.ArkUI';
import { dataSharePredicates } from '@kit.ArkData';
import { RecordVideoOptions } from '../types/VideoFile';
import { CameraCaptureError } from '../types/CameraError';
import { RNOHContext } from '@rnoh/react-native-openharmony/ts';
import geoLocationManager from '@ohos.geoLocationManager';
import type { VisionCameraViewSpec } from '../types/VisionCameraViewSpec';

declare function getContext(component?: Object | undefined): Context;

const TAG: string = 'CameraSession:'

type ZoomRangeType = [number, number];


export default class CameraSession {
  context: Context = undefined;
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
  private takingPhoto: boolean = false;
  private preSurfaceId: string;

  private videoOutput?: camera.VideoOutput;
  private videoProfile: camera.VideoProfile;
  private videoSession?: camera.VideoSession;
  private avRecorder: media.AVRecorder;
  private photoPath: string = '';
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

  constructor(ctx?:RNOHContext) {
    this.context = getContext(this);
    if(ctx) {
      this.ctx = ctx
    }
    this.context = getContext(this);
    this.localDisplay = display.getDefaultDisplaySync();
    if (this.localDisplay) {
      Logger.info(TAG, `localDisplay: ${JSON.stringify(this.localDisplay)}`);
      let previewSize = {
        surfaceWidth: this.localDisplay.width, surfaceHeight: this.localDisplay.height
      }
      this.rect = previewSize;
    }

    try {
      Logger.info(TAG, 'getCameraManager try begin');
      this.cameraManager = camera.getCameraManager(this.context);
      Logger.info(TAG, 'getCameraManager try end');
    } catch (e) {
      Logger.info(TAG, `getCameraManager catch e:${JSON.stringify(e)}`);
    }
  }

  /**
   * 初始化相机
   * @param surfaceId
   */
  async initCamera(surfaceId: string, props: VisionCameraViewSpec.RawProps, mediaModel: camera.SceneMode): Promise<void> {
    this.preSurfaceId = surfaceId;
    Logger.info(TAG, `initCamera surfaceId:${surfaceId}`);
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
    Logger.info(TAG, `initCamera cameraDevice: ${currentDevice.cameraId}`);
    Logger.info(TAG, `initCamera this.cameraManager: ${this.cameraManager}`);
    if (this.mediaModel === camera.SceneMode.NORMAL_PHOTO) {
      await this.initPhotoSession(currentDevice, surfaceId, props);
      await this.photoSession.start();
      this.setPhotoOutputCb(this.photoOutPut);
    } else {
      Logger.info(TAG, `initCamera video branch`);
      await this.initVideoSession(currentDevice, surfaceId, props);
      Logger.info(TAG, `initVideoSession: before: ${surfaceId}`);
      await this.videoSession.start();
    }
    if (!props.isActive) {
      this.activeChange(props.isActive);
    }
    this.focus(undefined);
    Logger.info(TAG, 'initCamera end');
    this.initProps(props);
  }

  /**
   * 初始化props参数
   */
  async initProps(props) {
    Logger.info(TAG, `init props : ${JSON.stringify(props)}`);
    Logger.info(TAG, `init props videoSession: ${JSON.stringify(this.videoSession)}`);
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
    if (props.videoStabilizationMode) {
      this.setVideoStabilizationMode(props.videoStabilizationMode)
      Logger.info(TAG, `props.setVideoStabilizationMode:${props.videoStabilizationMode}`)
    }
    if (props.photoQualityBalance !== 'balanced') {
      this.setPhotoQualitySetting(props.photoQualityBalance);
    }
    if (props.enableLocation) {
      this.setPhotoLocationSetting(props.enableLocation);
    }
  }

  async initVideoSession(currentDevice: camera.CameraDevice, surfaceId: string, props: VisionCameraViewSpec.RawProps) {
    Logger.info(TAG, `initVideoSession createCameraInput ${currentDevice.cameraId})`);
    this.setAudio(props.audio)

    this.cameraInput = this.cameraManager.createCameraInput(currentDevice);
    this.cameraInput.open();
    this.capability = this.cameraManager.getSupportedOutputCapability(currentDevice, camera.SceneMode.NORMAL_VIDEO);
    if (surfaceId && props.preview) {
      this.previewProfile = this.capability.previewProfiles[this.capability.previewProfiles.length - 1];
      Logger.info(TAG, `initVideoSession previewProfile ${JSON.stringify(this.previewProfile)})`);
      this.previewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, surfaceId);
      Logger.info(TAG, `initVideoSession previewOutput ${this.previewOutput}`);
    }

    this.avRecorder = await media.createAVRecorder();
    this.videoProfile = this.capability.videoProfiles.find((profile: camera.VideoProfile) => {
      return profile.size.width === this.videoSize.width && profile.size.height === this.videoSize.height;
    });

    Logger.info(TAG, `initVideoSession: income: no surfaceId`);
    let videoStartParams: RecordVideoOptions = {
      onRecordingError: (error) => {
        Logger.info(TAG, `videoStartParmas CameraSession: onRecordingError.${JSON.stringify(error)}`);
      },
      onRecordingFinished: (video) => {
        Logger.info(TAG, `CameraSession: onRecordingFinished ${JSON.stringify(video)}}`);
      },
      videoCodec: this.videoCodeC
    }
    this.videoOutput = await this.recordPrepared(videoStartParams, props);

    Logger.info(TAG, `initVideoSession videoProfiles: ${JSON.stringify(this.videoProfile)}`);
    this.videoSession = this.cameraManager?.createSession(camera.SceneMode.NORMAL_VIDEO);
    Logger.info(TAG, `initVideoSession videoProfiles: ${this.videoSession}`);
    this.videoSession.beginConfig();
    Logger.info(TAG, `initVideoSession beginConfig`);
    this.videoSession.addInput(this.cameraInput);
    Logger.info(TAG, `initVideoSession cameraInput`);
    if (surfaceId) {
      this.videoSession.addOutput(this.previewOutput);
      Logger.info(TAG, `initVideoSession previewOutput`);
    }
    if (this.videoOutput) {
      this.videoSession?.addOutput(this.videoOutput);
      Logger.info(TAG, `initVideoSession videoOutput`);
    }
    Logger.info(TAG, `initVideoSession commitConfig`);
    try {
      await this.videoSession.commitConfig();
    } catch (error) {
      Logger.error(TAG, `initVideoSession commitConfig1 ${JSON.stringify(error)}`);
    }
    Logger.info(TAG, `initVideoSession end`);
  }

  async initPhotoSession(currentDevice: camera.CameraDevice, surfaceId: string, props: VisionCameraViewSpec.RawProps) {
    Logger.info(TAG, `initPhotoSession createCameraInput ${JSON.stringify(currentDevice)})`);
    this.cameraInput = this.cameraManager.createCameraInput(currentDevice);
    this.cameraInput.open();
    this.capability = this.cameraManager.getSupportedOutputCapability(currentDevice, camera.SceneMode.NORMAL_PHOTO);
    if (surfaceId && props.preview) {
      this.previewProfile = this.capability.previewProfiles[this.capability.previewProfiles.length - 1];
      Logger.info(TAG, `initPhotoSession createCameraInput ${JSON.stringify(this.previewProfile)})`);
      this.previewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, surfaceId);
    }

    Logger.info(TAG, `initPhotoSession createPreviewOutput`);
    this.photoProfile = this.capability.photoProfiles[this.capability.photoProfiles.length - 1];
    this.photoSession = this.cameraManager?.createSession(camera.SceneMode.NORMAL_PHOTO);
    this.photoOutPut = this.cameraManager.createPhotoOutput(this.photoProfile);
    Logger.info(TAG, `initPhotoSession createPhotoOutput`);
    this.photoSession.beginConfig();
    this.photoSession.addInput(this.cameraInput);
    Logger.info(TAG, `initPhotoSession addInput`);
    if (this.previewOutput) {
      Logger.info(TAG, `initPhotoSession previewOutput`);
      this.photoSession.addOutput(this.previewOutput);
    }
    this.photoSession.addOutput(this.photoOutPut);
    Logger.info(TAG, `initPhotoSession photoOutPut`);
    try {
      await this.photoSession.commitConfig();
      Logger.info(TAG, `initPhotoSession commitConfig`);
    } catch (error) {
      Logger.error(TAG, `initPhotoSession commitConfig error: ${JSON.stringify(error)}`);
    }
    Logger.info(TAG, `initPhotoSession commitConfig end`);
  }

  async previewChange(preview: boolean): Promise<void> {
    const targetSession = this.photoSession ? this.photoSession : this.videoSession;
    Logger.info(TAG, `previewChange preview ${preview}`);
    if (preview) {
      if (this.previewOutput) {
        Logger.info(TAG, `previewChange preview previewOutput is exits`);
        targetSession?.beginConfig();
        targetSession?.addOutput(this.previewOutput);
        targetSession?.commitConfig();
        Logger.info(TAG, `previewChange previewOutput exits addOutput end`);
        targetSession?.start();
        Logger.info(TAG, `previewChange previewOutput exits addOutput start`);
      } else {
        this.previewProfile = this.capability.previewProfiles[this.capability.previewProfiles.length - 1];
        Logger.info(TAG, `previewChange previewProfile ${JSON.stringify(this.previewProfile)})`);
        this.previewOutput = this.cameraManager.createPreviewOutput(this.previewProfile, this.preSurfaceId);
        Logger.info(TAG, `previewChange createPreviewOutput`);
        targetSession?.beginConfig();
        targetSession?.addOutput(this.previewOutput);
        targetSession?.commitConfig();
        Logger.info(TAG, `previewChange preview previewOutput addOutput end`);
        targetSession?.start();
        Logger.info(TAG, `previewChange preview previewOutput addOutput start`);
      }
    } else {
      if (this.previewOutput) {
        Logger.info(TAG, `previewChange preview false,previewOutput removeOutput start`);
        targetSession?.beginConfig();
        targetSession?.removeOutput(this.previewOutput);
        targetSession?.commitConfig();
        Logger.info(TAG, `previewChange preview false,previewOutput removeOutput end`);
        targetSession?.start();
        Logger.info(TAG, `previewChange preview false,previewOutput removeOutput start`);
      }
    }
  }

  /**
   * 录制准备
   */
  async recordPrepared(options: RecordVideoOptions, props: VisionCameraViewSpec.RawProps) {
    let videoBitRate: number = 1
    if (typeof options.videoBitRate === 'number') {
      videoBitRate = options.videoBitRate
    } else if (typeof options.videoBitRate === 'string') {
      videoBitRate = this.getBitRateMultiplier(options.videoBitRate)
    }
    Logger.info(TAG, `recordPrepared videoBitRate: ${videoBitRate * 1_000_000}`)
    let rateRange = this.videoProfile.frameRateRange;
    let fps = props.fps
    if(rateRange && fps){
      Logger.info(TAG, `recordPrepared rateRange, min:${rateRange.min}, max:${rateRange.max}}`);
      if (rateRange.min<= fps && rateRange.max>= fps ){
        Logger.info(TAG, `recordPrepared rateRange, props fps:${fps}}`);
      }else{
        this.ctx.rnInstance.emitDeviceEvent('onError', new CameraCaptureError('capture/unknown',
          `FPS should be in (${rateRange.min}-${rateRange.max})`));
        return;
      }
    }
    let audioConfig = {
      audioChannels: 2,
      audioCodec: media.CodecMimeType.AUDIO_AAC,
      audioBitrate: 48000,
      audioSampleRate: 48000,
    }
    let videoConfig: media.AVRecorderProfile = {
      fileFormat: media.ContainerFormatType.CFT_MPEG_4,
      videoBitrate: videoBitRate * 1_000_000,
      videoCodec: options.videoCodec === 'h265' ? media.CodecMimeType.VIDEO_HEVC : media.CodecMimeType.VIDEO_AVC,
      videoFrameWidth: this.videoSize.width,
      videoFrameHeight: this.videoSize.height,
      videoFrameRate: fps ? fps : 30,
      isHdr: props.videoHdr?props.videoHdr:false
    };
    let videoConfigProfile: media.AVRecorderProfile = this.hasAudio ? {
      ...audioConfig, ...videoConfig
    } : videoConfig
    Logger.info(TAG, `recordPrepared videoConfigProfile: ${JSON.stringify(videoConfigProfile)}`);
    let vOptions: PhotoAccessHelper.CreateOptions = {
      title: Date.now().toString()
    };
    let photoAccessHelper: PhotoAccessHelper.PhotoAccessHelper = PhotoAccessHelper.getPhotoAccessHelper(this.context);
    this.videoUri =
      await photoAccessHelper.createAsset(PhotoAccessHelper.PhotoType.VIDEO, options.fileType || 'mp4', vOptions);
    Logger.info(TAG, `recordPrepared videoUri: ${this.videoUri}`);
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
    Logger.info(TAG, `recordPrepared aVRecorderConfig: ${JSON.stringify(aVRecorderConfig)}`);
    await this.avRecorder.prepare(aVRecorderConfig);
    let videoSurfaceId = await this.avRecorder.getInputSurface();
    Logger.info(TAG, `recordPrepared videoSurfaceId: ${videoSurfaceId}`);
    let videoOutput: camera.VideoOutput;
    try {
      videoOutput = this.cameraManager.createVideoOutput(this.videoProfile, videoSurfaceId);
    } catch (error) {
      Logger.error(TAG, `recordPrepared createVideoOutput.error ${JSON.stringify(error)}`);
    }
    Logger.info(TAG, `recordPrepared cameraSession.start`);
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
    Logger.info(TAG, `setResizeMode displayWidth:${displayWidth},displayHeight=${displayHeight}`)
    let previewSize = this.previewProfile.size
    let screenAspect = displayWidth / displayHeight;
    let previewAspect = previewSize.height / previewSize.width;
    Logger.info(TAG, `setResizeMode previewSize:${previewSize.height},${previewSize.width}`)
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
    callback(componentWidth, componentHeight);
  }

  //开始预览 isActive:true
  async activeChange(isActive: boolean): Promise<void> {
    const targetSession = this.photoSession ? this.photoSession : this.videoSession;
    try {
      Logger.info(TAG, `activeChange isActive:${isActive}`);
      if (isActive) {
        await targetSession.start();
        Logger.info(TAG, `activeChange session start success.`);
      } else {
        await targetSession.stop();
        Logger.info(TAG, `activeChange session stop success.`);
      }
    } catch (error) {
      Logger.error(TAG, `The activeChange targetSession start call failed. error code: ${error.code}`);
    }
  }


  //设置曝光补偿
  setExposure(exposure: number): void {
    Logger.info(TAG, `setExposure: ${exposure}`)
    try {
      //[-4,4]
      const [min, max]: Array<number> = this.photoSession?.getExposureBiasRange();
      if (exposure >= min && exposure <= max) {
        let value = this.photoSession?.getExposureValue();
        Logger.info(TAG, `getExposureValue value:${value}.`);
        this.photoSession?.setExposureBias(exposure);
        Logger.info(TAG, 'setExposureBias success.');
      } else {
        Logger.info(TAG, `exposure must be greater than ${min} and less than ${max}.`);
      }
    } catch (error) {
      Logger.error(TAG, `The setExposureBias call failed. error code: ${error.code}`);
    }
  }

  //设置缩放[0.49,50]
  setSmoothZoom(zoom: number): void {
    Logger.info(TAG, `setSmoothZoom: ${zoom}`)
    try {
      const [min, max]: Array<number> = this.getZoomRange();
      if (zoom <= min) {
        zoom = min;
      } else if (zoom >= max) {
        zoom = max;
      }
      this.photoSession?.setSmoothZoom(zoom, camera.SmoothZoomMode.NORMAL);
      this.photoPreviewScale = zoom;
      Logger.info(TAG, 'setSmoothZoom success.');
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
        Logger.info(TAG, `getZoomRatioRange success. min=${min}, max=${max}.`);
      }
      return this.ZoomRange;
    } catch (error) {
      Logger.error(TAG, `The getZoomRatioRange call failed. error code: ${error.code}.`);
    }
  }

  //设置手电筒模式
  setTorch(mode: string): void {
    Logger.info(TAG, `setTorch: ${mode}`)
    /*    try {
          const TORCH_MODE = {
            'on': camera.TorchMode.ON,
            'off': camera.TorchMode.OFF
          };
          let torchMode: number = TORCH_MODE[mode];
          const isSupport: boolean = this.cameraManager?.isTorchModeSupported(torchMode);
          Logger.info(TAG, `isSupport is :${isSupport}.`);
          if (torchMode === undefined || !isSupport) {
            Logger.info(TAG, `mode:${mode} is not supported.`);
            return;
          }
          Logger.info(TAG, `mode is :${mode}. torchMode is :${torchMode}`);
          this.cameraManager?.setTorchMode(torchMode);
          Logger.info(TAG, 'setTorchMode success.');
        } catch (error) {
          Logger.error(TAG, `The setTorchMode call failed. error code: ${error.code}.`);
        }*/
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
  setVideoStabilizationMode(mode: string): void {
    if (!this.videoSession) {
      return
    }
    let videoMode = camera.VideoStabilizationMode.OFF
    if (mode === 'auto') {
      videoMode = camera.VideoStabilizationMode.AUTO
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
    Logger.info(TAG, `setVideoStabilizationMode: videoMode: ${videoMode}`)
    let isSupported: boolean = false;
    try {
      isSupported = this.videoSession.isVideoStabilizationModeSupported(videoMode);
      Logger.info(TAG, `setVideoStabilizationMode: isSupported: ${isSupported}`)
    } catch (error) {
      let err = error as BusinessError;
      Logger.error(TAG, `The isVideoStabilizationModeSupported call failed. error code: ${err.code}`);
    }
    if (isSupported) {
      try {
        this.videoSession.setVideoStabilizationMode(videoMode);
        Logger.info(TAG, `setVideoStabilizationMode: setVideoStabilizationMode`)
      } catch (error) {
        let err = error as BusinessError;
        Logger.error(TAG, `The setVideoStabilizationMode call failed. error code: ${err.code}`);
      }
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
    Logger.info(TAG, 'releaseCamera');
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
      if (this.avRecorder) {
        await this.avRecorder.release();
      }
    } catch (error) {
      Logger.error(TAG, `releaseCamera end error: ${JSON.stringify(error)}`);
    }
    Logger.info(TAG, 'releaseCamera end');
  }

  async savePicture(buffer: ArrayBuffer, img: image.Image): Promise<void> {
    Logger.info(TAG, 'savePicture start');
    let photoAccessHelper: PhotoAccessHelper.PhotoAccessHelper = PhotoAccessHelper.getPhotoAccessHelper(this.context);
    let options: PhotoAccessHelper.CreateOptions = {
      title: Date.now().toString()
    };
    let photoUri: string = await photoAccessHelper.createAsset(PhotoAccessHelper.PhotoType.IMAGE, 'jpg', options);
    Logger.info(TAG, `savePicture photoUri: ${photoUri}`);
    //createAsset的调用需要ohos.permission.READ_IMAGEVIDEO和ohos.permission.WRITE_IMAGEVIDEO的权限
    let file: fs.File = fs.openSync(photoUri, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE);
    await fs.write(file.fd, buffer);
    try {
      let fileInfo = fs.statSync(file.fd);
      Logger.info(TAG, `savePicture statSync,fileInfo:${JSON.stringify(fileInfo.size)}`);
    } catch (error) {
      Logger.error(TAG, `savePicture statSync failed,code:${error?.code}.`);
    }
    fs.closeSync(file);
    img.release();

    Logger.info(TAG, 'savePicture end');
    this.photoPath = photoUri;
    this.takingPhoto = false;
  }

  setPhotoOutputCb(photoOutput: camera.PhotoOutput): void {
    Logger.info(TAG, 'setPhotoOutputCb end');
    //设置回调之后，调用photoOutput的capture方法，就会将拍照的buffer回传到回调中
    photoOutput.on('photoAvailable', (errCode: BusinessError, photo: camera.Photo): void => {
      Logger.info(TAG, 'setPhotoOutputCb getPhoto start');
      Logger.info(`err: ${JSON.stringify(errCode)}`);
      if (errCode || photo === undefined) {
        Logger.error(TAG, 'setPhotoOutputCb getPhoto failed');
        return;
      }
      let imageObj = photo.main;
      imageObj.getComponent(image.ComponentType.JPEG, (errCode: BusinessError, component: image.Component): void => {
        Logger.info(TAG, 'setPhotoOutputCb getComponent start');
        if (errCode || component === undefined) {
          Logger.error(TAG, 'setPhotoOutputCb getComponent failed');
          return;
        }
        let buffer: ArrayBuffer;
        if (component.byteBuffer) {
          buffer = component.byteBuffer;
        } else {
          Logger.error(TAG, 'setPhotoOutputCb byteBuffer is null');
          return;
        }
        this.savePicture(buffer, imageObj);
      });
    });
  }

  /**
   * 参数配置
   */
  focus(rnPoint: Point) {
    let status: boolean = false;
    Logger.info(TAG, `The focus method start`);
    const targetSession = this.photoSession ? this.photoSession : this.videoSession;
    try {
      status = targetSession.isFocusModeSupported(camera.FocusMode.FOCUS_MODE_AUTO);
    } catch (error) {
      Logger.error(TAG, `The focus isFocusModeSupported call failed. error code: ${JSON.stringify(error)}`);
      return;
    }
    if (status) {
      Logger.info(TAG, `The focus isFocusModeSupported status: ${status}`);
      // 指定焦点时设置焦点
      if (rnPoint) {
        Logger.info(TAG, `The focus rnPoint: ${JSON.stringify(rnPoint)}`);
        try {
          targetSession.setFocusMode(camera.FocusMode.FOCUS_MODE_AUTO);
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(TAG, `The setFocusMode call failed. error code: ${err.code}`);
          return;
        }
        let ohPoint = this.convertPoint(rnPoint);
        Logger.info(TAG, `The focus ohPoint: ${JSON.stringify(ohPoint)}`);
        try {
          targetSession.setFocusPoint(ohPoint);
          Logger.info(TAG, `The focus ohPoint success`);
        } catch (error) {
          let err = error as BusinessError;
          Logger.error(TAG, `The setFocusPoint call failed. error code: ${err.code}`);
        }
      } else {
        // 没有指定焦点时设置自动对焦
        Logger.info(TAG, `The focus setFocusMode: auto`);
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
      ohPoint.x = rnPoint.x / this.rect.surfaceWidth;
      ohPoint.y = rnPoint.y / this.rect.surfaceHeight;
    }
    return ohPoint;
  }


  /**
   * 设置photoQuality
   * @param quality
   */
  setPhotoQualitySetting(quality: 'speed' | 'balanced' | 'quality' = 'speed'): void {
    Logger.info(TAG, `getQualityLevel, quality:${this.photoCaptureSetting.quality}`);
    this.photoCaptureSetting.quality = this.getQualityLevel(quality);
    Logger.info(TAG, `getQualityLevel, this.photoCaptureSetting.quality:${this.photoCaptureSetting.quality}`);
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
      Logger.info(TAG, `getCurrentLocation success.result=${JSON.stringify(result)}`);
      return result
    } catch (error) {
      if (error.code === '3301100') {
        Logger.error(TAG, `the switch for the location function is not turned on, error code: ${error?.code}.`);
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
  async taskPhoto(options: TakePhotoOptions): Promise<PhotoFile> {
    Logger.info(TAG, 'taskPhone to capture the photo ');
    if (this.takingPhoto) {
      Logger.error(TAG, 'taskPhone：Please do not repeat the operation while taking a photo ');
      return;
    }
    this.takingPhoto = true;
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
    Logger.info(TAG, `this.photoCaptureSetting: ${JSON.stringify(Object.keys(this.photoCaptureSetting))}.`)
    Logger.info(TAG, `this.photoCaptureSetting: ${JSON.stringify(this.photoCaptureSetting)}.`)
    try {
      await this.photoOutPut.capture(this.photoCaptureSetting);
    } catch (error) {
      this.takingPhoto = false;
      Logger.error(TAG, `Failed to capture error: ${error.message},code:${error.code}`);
      return;
    }
    Logger.info(TAG, `photoOutPut.capture success`);
    await this.waitForPathResult();
    let thumbnail = await this.getThumbnail();
    let photoFile: PhotoFile = {} as PhotoFile;
    photoFile.width = this.photoProfile?.size.width;
    photoFile.height = this.photoProfile?.size.height;
    photoFile.path = this.photoPath;
    photoFile.isRawPhoto = false;
    photoFile.thumbnail = thumbnail;
    Logger.info(TAG, `taskPhoto photoFile:${JSON.stringify(photoFile)}`);

    this.takingPhoto = false;
    this.photoPath = '';
    return photoFile;
  }

  /**
   * 获取缩略图
   * @returns
   */
  async getThumbnail(): Promise<Record<string, image.ImageInfo>> {
    Logger.info(TAG, `getThumbnail start`);
    Logger.info(TAG, `getThumbnail fileName: ${this.photoPath}`);
    let predicates: dataSharePredicates.DataSharePredicates = new dataSharePredicates.DataSharePredicates();
    let fetchOption: PhotoAccessHelper.FetchOptions = {
      fetchColumns: [PhotoAccessHelper.PhotoKeys.URI, PhotoAccessHelper.PhotoKeys.PHOTO_TYPE,
      PhotoAccessHelper.PhotoKeys.SIZE, PhotoAccessHelper.PhotoKeys.DATE_ADDED],
      predicates: predicates
    };
    let asset: PhotoAccessHelper.PhotoAsset;
    try {
      let photoAccessHelper: PhotoAccessHelper.PhotoAccessHelper = PhotoAccessHelper.getPhotoAccessHelper(this.context);
      let fetchResult: PhotoAccessHelper.FetchResult<PhotoAccessHelper.PhotoAsset> =
        await photoAccessHelper.getAssets(fetchOption);
      asset = await fetchResult.getFirstObject();
    } catch (error) {
      Logger.error(TAG, `getThumbnail getPhotoAccessHelper failed, code:${error?.code}.`)
    }
    Logger.info(TAG, `getThumbnail asset ${JSON.stringify(asset?.uri)}`);
    Logger.info(TAG, `getThumbnail asset ${JSON.stringify(asset?.displayName)}`);
    let size: image.Size = {
      width: 720, height: 720
    };
    let pixelMap = await asset?.getThumbnail(size);
    let imageInfo: image.ImageInfo = await pixelMap?.getImageInfo()
    let result: Record<string, image.ImageInfo> = {
      [asset.displayName]: imageInfo
    }
    Logger.info(TAG, `getThumbnail result ${JSON.stringify(result)}`);
    return result;
  }

  /**
   * 等待path的值被设置
   * @returns
   */
  private waitForPathResult(): Promise<void> {
    Logger.info(TAG, 'waitForPathResult start');
    return new Promise(resolve => {
      const intervalId = setInterval(() => {
        if (this.photoPath !== '') {
          clearInterval(intervalId);
          Logger.info(TAG, 'waitForPathResult clearInterval');
          resolve();
        }
      }, 100);
    })
  }


  /**
   * 获取可用设备
   */
  getAvailableCameraDevices(): Array<camera.CameraDevice> {
    Logger.info(TAG, 'getAvailableCameraDevices start');
    let camerasArray = this.cameraManager?.getSupportedCameras();
    if (!camerasArray) {
      Logger.error(TAG, 'getAvailableCameraDevices cannot get cameras');
      return;
    }
    this.camerasArray = camerasArray;
    Logger.info(TAG, `getAvailableCameraDevices get cameras ${camerasArray.length}`);
    return camerasArray;
  }

  async convertCameraDeviceInfo(): Promise<CameraDeviceInfo[]> {
    if (!this.camerasArray) {
      Logger.error(TAG, 'convertCameraDeviceInfo cameraDevices is null');
    }
    let cameraDevices = this.camerasArray
    Logger.info(TAG, `convertCameraDeviceInfo.start`);

    let cameraArray: Array<CameraDeviceInfo> = [];
    for await (const cameraDevice of cameraDevices) {
      Logger.info(TAG, `convertCameraDeviceInfo initVideoSession end ${cameraDevice.cameraId}`);
      await this.initVideoSession(cameraDevice, undefined, {} as VisionCameraViewSpec.RawProps);
      Logger.info(TAG, `convertCameraDeviceInfo initVideoSession end ${cameraDevice.cameraId}`);
      let cameraInfo: CameraDeviceInfo = {} as CameraDeviceInfo;
      cameraInfo.id = cameraDevice.cameraId;
      cameraInfo.supportsFocus = this.focusSupport(this.videoSession);
      Logger.info(TAG, `convertCameraDeviceInfo cameraId:${cameraInfo.id} supportsFocus: ${cameraInfo.supportsFocus}`);
      if (cameraDevice.cameraType === camera.CameraType.CAMERA_TYPE_WIDE_ANGLE) {
        cameraInfo.physicalDevices = [PhysicalCameraDeviceType.WIDE_ANGLE_CAMERA];
      } else if (cameraDevice.cameraType === camera.CameraType.CAMERA_TYPE_ULTRA_WIDE) {
        cameraInfo.physicalDevices = [PhysicalCameraDeviceType.ULTRA_WIDE_ANGLE_CAMERA];
      } else {
        Logger.info(TAG, `convertCameraDeviceInfo CameraType: ${cameraDevice.cameraType}`);
      }
      Logger.info(TAG,
        `convertCameraDeviceInfo cameraId:${cameraInfo.id},cameraType:${cameraDevice.cameraType},physicalDevices:${JSON.stringify(cameraInfo.physicalDevices)}`);

      if (cameraDevice.connectionType === camera.ConnectionType.CAMERA_CONNECTION_BUILT_IN) {
        if (cameraDevice.cameraPosition === camera.CameraPosition.CAMERA_POSITION_BACK) {
          cameraInfo.position = CameraPosition.BACK
          Logger.info(TAG, `convertCameraDeviceInfo cameraId:${cameraInfo.id} : cameraType position BACK`);
        } else if (cameraDevice.cameraPosition === camera.CameraPosition.CAMERA_POSITION_FRONT) {
          cameraInfo.position = CameraPosition.FRONT
          Logger.info(TAG, `convertCameraDeviceInfo cameraId:${cameraInfo.id} : cameraType position FRONT`);
        } else {
          Logger.info(TAG, `convertCameraDeviceInfo CameraPosition: ${cameraDevice.cameraPosition}`);
        }
      } else {
        cameraInfo.position = CameraPosition.EXTERNAL
        Logger.info(TAG, `convertCameraDeviceInfo cameraId:${cameraInfo.id} : cameraType position external`);
      }
      cameraInfo.hasFlash = this.cameraManager?.isTorchSupported();
      cameraInfo.hasTorch = this.cameraManager?.isTorchModeSupported(camera.TorchMode.ON);
      Logger.info(TAG,
        `convertCameraDeviceInfo cameraId:${cameraInfo.id} : hasFlash:${cameraInfo.hasFlash}, hasTorch:${cameraInfo.hasTorch}`);
      let zoomRatioRange: Array<number> = this.videoSession.getZoomRatioRange();
      let biasRangeArray: Array<number> = this.videoSession.getExposureBiasRange();
      // await this.cameraRelease();
      if (zoomRatioRange) {
        cameraInfo.minZoom = zoomRatioRange[0];
        cameraInfo.maxZoom = zoomRatioRange[1];
      }
      if (biasRangeArray) {
        cameraInfo.minExposure = biasRangeArray[0];
        cameraInfo.maxExposure = biasRangeArray[1];
      }
      let cameraDeviceFormats: Array<CameraDeviceFormat> = [];
      let capability =
        this.cameraManager.getSupportedOutputCapability(cameraDevice, camera.SceneMode.NORMAL_VIDEO);
      Logger.info(TAG,
        `convertCameraDeviceInfo cameraId:${cameraInfo.id} : photoCapability:${JSON.stringify(capability.photoProfiles)}`);
      for (const pProfile of capability.photoProfiles) {
        let cameraDeviceFormat = {} as CameraDeviceFormat;
        cameraDeviceFormat.photoHeight = pProfile.size.height;
        cameraDeviceFormat.photoWidth = pProfile.size.width;
        cameraDeviceFormats.push(cameraDeviceFormat);
      }
      Logger.info(TAG,
        `convertCameraDeviceInfo cameraId:${cameraInfo.id} : videoCapability:${JSON.stringify(capability.videoProfiles)}`);
      Logger.info(TAG, `initVideoSession end  cameraId:${cameraInfo.id}`);
      for (const vProfile of capability.videoProfiles) {
        let cameraDeviceFormat = {} as CameraDeviceFormat;
        cameraDeviceFormat.videoHeight = vProfile.size.height;
        cameraDeviceFormat.videoWidth = vProfile.size.width;
        cameraDeviceFormat.minFps = vProfile.frameRateRange.min;
        cameraDeviceFormat.maxFps = vProfile.frameRateRange.max;
        cameraDeviceFormat.videoStabilizationModes = this.getSupportedVideoStabilizationMode(this.videoSession);
        cameraDeviceFormats.push(cameraDeviceFormat);
      }
      Logger.info(TAG, `initVideoSession cameraDeviceFormat end`);
      cameraInfo.formats = cameraDeviceFormats;
      cameraArray.push(cameraInfo);
      await this.cameraRelease();
      Logger.info(TAG, `convertCameraDeviceInfo for end await  ${JSON.stringify(cameraDevices.map(e => e.cameraId))}`);
    }
    Logger.info(TAG, `convertCameraDeviceInfo end ${JSON.stringify(cameraArray)}`);
    return cameraArray;
  }

  convertCameraDevice(): CameraDeviceInfo[] {
    if (!this.camerasArray) {
      Logger.error(TAG, 'convertCameraDeviceInfo cameraDevices is null');
    }
    let cameraDevices = this.camerasArray
    Logger.info(TAG, `convertCameraDeviceInfo.start`);

    let cameraArray: Array<CameraDeviceInfo> = [];
    for (const cameraDevice of cameraDevices) {
      let cameraInfo: CameraDeviceInfo = {} as CameraDeviceInfo;
      cameraInfo.id = cameraDevice.cameraId;
      if (cameraDevice.cameraType === camera.CameraType.CAMERA_TYPE_WIDE_ANGLE) {
        cameraInfo.physicalDevices = [PhysicalCameraDeviceType.WIDE_ANGLE_CAMERA];
      } else if (cameraDevice.cameraType === camera.CameraType.CAMERA_TYPE_ULTRA_WIDE) {
        cameraInfo.physicalDevices = [PhysicalCameraDeviceType.ULTRA_WIDE_ANGLE_CAMERA];
      } else {
        Logger.info(TAG, `convertCameraDeviceInfo CameraType: ${cameraDevice.cameraType}`);
      }
      Logger.info(TAG,
        `convertCameraDeviceInfo cameraId:${cameraInfo.id},cameraType:${cameraDevice.cameraType},physicalDevices:${JSON.stringify(cameraInfo.physicalDevices)}`);

      if (cameraDevice.connectionType === camera.ConnectionType.CAMERA_CONNECTION_BUILT_IN) {
        if (cameraDevice.cameraPosition === camera.CameraPosition.CAMERA_POSITION_BACK) {
          cameraInfo.position = CameraPosition.BACK
          Logger.info(TAG, `convertCameraDeviceInfo cameraId:${cameraInfo.id} : cameraType position BACK`);
        } else if (cameraDevice.cameraPosition === camera.CameraPosition.CAMERA_POSITION_FRONT) {
          cameraInfo.position = CameraPosition.FRONT
          Logger.info(TAG, `convertCameraDeviceInfo cameraId:${cameraInfo.id} : cameraType position FRONT`);
        } else {
          Logger.info(TAG, `convertCameraDeviceInfo CameraPosition: ${cameraDevice.cameraPosition}`);
        }
      } else {
        cameraInfo.position = CameraPosition.EXTERNAL
        Logger.info(TAG, `convertCameraDeviceInfo cameraId:${cameraInfo.id} : cameraType position external`);
      }

      cameraInfo.hasFlash = this.cameraManager?.isTorchSupported();
      cameraInfo.hasTorch = this.cameraManager?.isTorchModeSupported(camera.TorchMode.ON);
      Logger.info(TAG,
        `convertCameraDeviceInfo cameraId:${cameraInfo.id} : hasFlash:${cameraInfo.hasFlash}, hasTorch:${cameraInfo.hasTorch}`);

      let cameraDeviceFormats: Array<CameraDeviceFormat> = [];
      let capability =
        this.cameraManager.getSupportedOutputCapability(cameraDevice, camera.SceneMode.NORMAL_VIDEO);
      Logger.info(TAG,
        `convertCameraDeviceInfo cameraId:${cameraInfo.id} : photoCapability:${JSON.stringify(capability.photoProfiles)}`);
      Logger.info(TAG,
        `convertCameraDeviceInfo cameraId:${cameraInfo.id} : videoCapability:${JSON.stringify(capability.videoProfiles)}`);
      Logger.info(TAG, `initVideoSession end  cameraId:${cameraInfo.id}`);
      for (const pProfile of capability.photoProfiles) {
        let cameraDeviceFormat = {} as CameraDeviceFormat;
        cameraDeviceFormat.photoHeight = pProfile.size.height;
        cameraDeviceFormat.photoWidth = pProfile.size.width;
        cameraDeviceFormats.push(cameraDeviceFormat);
      }
      Logger.info(TAG, `convertCameraDeviceInfo initVideoSession end ${cameraDevice.cameraId}`);
      let supportedVideoStabilizationMode: Array<VideoStabilizationMode> = this.getSupportedVideoStabilizationMode(this.videoSession);
      for (const vProfile of capability.videoProfiles) {
        let cameraDeviceFormat = {} as CameraDeviceFormat;
        cameraDeviceFormat.videoHeight = vProfile.size.height;
        cameraDeviceFormat.videoWidth = vProfile.size.width;
        cameraDeviceFormat.minFps = vProfile.frameRateRange.min;
        cameraDeviceFormat.maxFps = vProfile.frameRateRange.max;
        cameraDeviceFormat.videoStabilizationModes = supportedVideoStabilizationMode;
        cameraDeviceFormats.push(cameraDeviceFormat);
      }
      this.initVideoSession(cameraDevice, undefined, {} as VisionCameraViewSpec.RawProps).then(() => {
        Logger.info(TAG, `convertCameraDeviceInfo initVideoSession end ${cameraDevice.cameraId}`);
        cameraInfo.supportsFocus = this.focusSupport(this.videoSession);
        Logger.info(TAG,
          `convertCameraDeviceInfo cameraId:${cameraInfo.id} supportsFocus: ${cameraInfo.supportsFocus}`);

        let [minZoom, maxZoom]: number[] = this.videoSession.getZoomRatioRange();
        let biasRangeArray: Array<number> = this.videoSession.getExposureBiasRange();
        cameraInfo.minZoom = minZoom;
        cameraInfo.maxZoom = maxZoom;
        cameraInfo.minExposure = biasRangeArray[0];
        cameraInfo.maxExposure = biasRangeArray[1];
        Logger.info(TAG, `initVideoSession cameraDeviceFormat end`);
        this.cameraRelease();
        Logger.info(TAG,
          `convertCameraDeviceInfo for end await  ${JSON.stringify(cameraDevices.map(e => e.cameraId))}`);
      });
      cameraInfo.formats = cameraDeviceFormats;
      cameraArray.push(cameraInfo);
    }
    Logger.info(TAG, `convertCameraDeviceInfo end ${JSON.stringify(cameraArray)}`);
    return cameraArray;
  }

  initDeviceInfo(): CameraDeviceInfo[] {
    Logger.info(TAG, `initDeviceInfo start`);
    this.getAvailableCameraDevices();
    let cameraInfos = this.convertCameraDevice();
    Logger.info(TAG, `initDeviceInfo end CameraDeviceArray size:${cameraInfos?.length}`);
    return cameraInfos;
  }

  private getSupportedVideoStabilizationMode(videoSession: camera.VideoSession) {
    let supportedVideoStabilizationMode: Array<VideoStabilizationMode> = [];
    if (!videoSession) {
      Logger.error(TAG, `getSupportedVideoStabilizationMode params videoSession is empty`)
      return supportedVideoStabilizationMode;
    }
    Logger.info(TAG, `getSupportedVideoStabilizationMode start`)
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
    Logger.info(TAG, `getSupportedVideoStabilizationMode end mode size: ${supportedVideoStabilizationMode?.length}`)
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
    Logger.info(TAG,
      `startRecording.state:${this.avRecorder.state}, videoCodeC:${options.videoCodec}, this:${this.videoCodeC}`);
    if (this.avRecorder.state === 'prepared' || this.avRecorder.state === 'idle' || this.avRecorder.state === 'released') {

      if (options.videoCodec && options.videoCodec !== this.videoCodeC) {
        this.videoCodeC = options.videoCodec
        await this.avRecorder.release();
        Logger.info(TAG, `startRecording.changeCodeC`);
      }

      if (this.avRecorder.state === 'released') {
        this.avRecorder = await media.createAVRecorder();
      }

      if (this.avRecorder.state === 'idle' || this.avRecorder.state === 'released') {
        Logger.info(TAG, `startRecording.state: again recordPrepared`);
        // 重新 prepared
        let videoOutput: camera.VideoOutput = await this.recordPrepared(options, props)
        this.videoSession.beginConfig();
        if (this.videoOutput) {
          this.videoSession?.removeOutput(this.videoOutput);
        }
        this.videoOutput = videoOutput;
        this.videoSession.addOutput(this.videoOutput);
        await this.videoSession.commitConfig();
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

      try {
        await this.avRecorder.start();
      } catch (error) {
        let err = error as BusinessError;
        // options.onRecordingError(new CameraCaptureError('capture/recording-in-progress', 'Failed to start recording.'))
        this.ctx.rnInstance.emitDeviceEvent('onRecordingError',
          new CameraCaptureError('capture/recording-in-progress', 'Failed to start recording.'));
      }
      this.videoOutput.start((err: BusinessError) => {
        if (err) {
          // options.onRecordingError(new CameraCaptureError('capture/recording-in-progress', 'Failed to start recording.'))
          this.ctx.rnInstance.emitDeviceEvent('onRecordingError',
            new CameraCaptureError('capture/recording-in-progress', 'Failed to start recording.'));
          return;
        }
      });
      Logger.info(TAG, `startRecording.state end:${this.avRecorder.state}`);
    }
  }

  /**
   * 停止录制
   */
  async stopRecording() {
    Logger.info(TAG, `stopRecording.state1:${this.avRecorder.state}`);
    if (this.avRecorder.state === 'started' || this.avRecorder.state === 'paused') {
      Logger.info(TAG, `stopRecording.state.in if`);
      await this.avRecorder.stop();
      this.videoOutput.stop((err: BusinessError) => {
        if (err) {
          Logger.error(TAG, `stopRecording: Failed to stop the video output. error: ${JSON.stringify(err)}`);
          return;
        }

        Logger.info(TAG, `stopRecording.videoOutput stop`);
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
      fs.closeSync(this.videoFile);

      const videoResult = {
        height: parseInt(avMetadata.videoHeight),
        width: parseInt(avMetadata.videoWidth),
        path: this.videoUri,
        duration: Math.floor(duration)
      }
      Logger.info(TAG, `stopRecording.end.state :${this.avRecorder.state}, videoResult:${JSON.stringify(videoResult)}`);
      return videoResult
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
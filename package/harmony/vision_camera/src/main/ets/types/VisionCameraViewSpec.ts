// This file was generated.
import {
  Descriptor as ComponentDescriptor,
  ViewBaseProps,
  ViewRawProps,
  ViewDescriptorWrapperBase,
  RNInstance,
  Tag,
  RNComponentCommandReceiver,
  ViewPropsSelector,
} from "@rnoh/react-native-openharmony/ts"
import { Code, CodeScannerFrame, Point, TakePhotoOptions } from '../core/CameraConfig';
import { RecordVideoOptions } from './VideoFile';

type VideoStabilizationMode = 'off' | 'standard' | 'cinematic' | 'cinematic-extended' | 'auto';

export namespace VisionCameraViewSpec {
  export const NAME = "VisionCameraView" as const

  export interface DirectRawProps {
    codeScanner?: {
      codeTypes?: Array<'code-128' | 'code-39' | 'code-93' | 'codabar' | 'ean-13' | 'ean-8' | 'itf' | 'upc-e' | 'upc-a' | 'qr' | 'pdf-417' | 'aztec' | 'data-matrix'>,
      regionOfInterest?: {
        x: number,
        y: number,
        width: number,
        height: number
      },
      onCodeScanned: (codes: Code[], frame: CodeScannerFrame) => void
    };
    fps?: number;
    videoHdr?: boolean;
    isActive: boolean;
    preview?: boolean;
    device?: {
      id: string,
      physicalDevices?: Array<'ultra-wide-angle-camera' | 'wide-angle-camera' | 'telephoto-camera'>,
      position?: 'front' | 'back' | 'external',
      name: string,
      hasFlash: boolean,
      hasTorch: boolean,
      minFocusDistance: number,
      isMultiCam: boolean,
      minZoom: number,
      maxZoom: number,
      neutralZoom: number,
      minExposure: number,
      maxExposure: number,
      formats: {
        photoHeight: number,
        photoWidth: number,
        videoHeight: number,
        videoWidth: number,
        maxISO: number,
        minISO: number,
        fieldOfView: number,
        supportsVideoHdr: boolean,
        supportsPhotoHdr: boolean,
        supportsDepthCapture: boolean,
        minFps: number,
        maxFps: number,
        autoFocusSystem?: 'contrast-detection' | 'phase-detection' | 'none',
        videoStabilizationModes?: Array<'off' | 'standard' | 'cinematic' | 'cinematic-extended' | 'auto'>
      }[],
      supportsLowLightBoost: boolean,
      supportsRawCapture: boolean,
      supportsFocus: boolean,
      hardwareLevel?: 'legacy' | 'limited' | 'full',
      sensorOrientation?: 'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right'
    };
    resizeMode?: 'cover' | 'contain';
    enableZoomGesture?: boolean;
    exposure?: number;
    zoom?: number;
    audio?: boolean;
    video?: boolean;
    torch?: 'off' | 'on';
    photo?: boolean;
    videoStabilizationMode?: VideoStabilizationMode;
    androidPreviewViewType?: 'surface-view' | 'texture-view';
    enableLocation?: boolean;
    photoQualityBalance?: 'speed' | 'balanced' | 'quality';
  }

  export interface Props extends ViewBaseProps {}

  export interface State {}

  export interface RawProps extends ViewRawProps, DirectRawProps {}

  export class PropsSelector extends ViewPropsSelector<Props, RawProps> {
    get codeScanner() {
      return this.rawProps.codeScanner;
    }

    get fps() {
      return this.rawProps.fps ?? 30;
    }

    get videoHdr() {
      return this.rawProps.videoHdr ?? false;
    }

    get isActive() {
      return this.rawProps.isActive ?? false;
    }

    get preview() {
      return this.rawProps.preview ?? true;
    }

    get device() {
      return this.rawProps.device;
    }

    get resizeMode() {
      return this.rawProps.resizeMode ?? 'cover';
    }

    get enableZoomGesture() {
      return this.rawProps.enableZoomGesture ?? false;
    }

    get exposure() {
      return this.rawProps.exposure ?? 0;
    }

    get zoom() {
      return this.rawProps.zoom ?? 1;
    }

    get audio() {
      return this.rawProps.audio ?? false;
    }

    get video() {
      return this.rawProps.video ?? false;
    }

    get torch() {
      return this.rawProps.torch ?? 'off';
    }
  }

  export type Descriptor = ComponentDescriptor<typeof NAME,
  Props,
  State,
  RawProps>;

  export class DescriptorWrapper extends ViewDescriptorWrapperBase<typeof NAME,
  Props,
  State,
  RawProps,
  PropsSelector> {
    protected createPropsSelector() {
      return new PropsSelector(this.descriptor.props, this.descriptor.rawProps)
    }
  }

  export interface EventPayloadByName {
    "started": {}
    "stopped": {}
    "initialized": {}
    "error": { error: string }
  }

  export class EventEmitter {
    constructor(private rnInstance: RNInstance, private tag: Tag) {
    }

    emit<TEventName extends keyof EventPayloadByName>(eventName: TEventName, payload: EventPayloadByName[TEventName]) {
      this.rnInstance.emitComponentEvent(this.tag, eventName, payload)
    }
  }

  export interface CommandArgvByName {
    "requestLocationPermission": []
    "getLocationPermissionStatus": []
    "requestMicrophonePermission": []
    "getMicrophonePermissionStatus": []
    "requestCameraPermission": []
    "getCameraPermissionStatus": []
    "addCameraDevicesChangedListener": []
    "getAvailableCameraDevices": []
    "takePhoto": [options?: TakePhotoOptions]
    "focus": [point: Point]
    "startRecording": [options: RecordVideoOptions]
    "stopRecording": []
    "pauseRecording": []
    "resumeRecording": []
    "cancelRecording": []
  }

  export class CommandReceiver {
    private listenersByCommandName = new Map<string, Set<(...args: any[]) => void>>()
    private cleanUp: (() => void) | undefined = undefined

    constructor(private componentCommandReceiver: RNComponentCommandReceiver, private tag: Tag) {
    }

    subscribe<TCommandName extends keyof CommandArgvByName>(commandName: TCommandName,
      listener: (argv: CommandArgvByName[TCommandName]) => void) {
      if (!this.listenersByCommandName.has(commandName)) {
        this.listenersByCommandName.set(commandName, new Set())
      }
      this.listenersByCommandName.get(commandName)!.add(listener)
      const hasRegisteredCommandReceiver = !!this.cleanUp
      if (!hasRegisteredCommandReceiver) {
        this.cleanUp =
          this.componentCommandReceiver.registerCommandCallback(this.tag, (commandName: string, argv: any[]) => {
            if (this.listenersByCommandName.has(commandName)) {
              const listeners = this.listenersByCommandName.get(commandName)!
              listeners.forEach(listener => {
                listener(argv)
              })
            }
          })
      }

      return () => {
        this.listenersByCommandName.get(commandName)?.delete(listener)
        if (this.listenersByCommandName.get(commandName)?.size ?? 0 === 0) {
          this.listenersByCommandName.delete(commandName)
        }
        if (this.listenersByCommandName.size === 0) {
          this.cleanUp?.()
        }
      }
    }
  }

}
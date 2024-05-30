import { ViewProps } from "react-native";
import { CameraDevice, CameraDeviceFormat } from "./CameraDevice";
import { CodeScanner } from "./CodeScanner";

type VideoStabilizationMode = 'off' | 'standard' | 'cinematic' | 'cinematic-extended' | 'auto';

export interface VisionCameraProps extends ViewProps {
    /**
     * The Camera Device to use.
     *
     * See the [Camera Devices](https://react-native-vision-camera.com/docs/guides/devices) section in the documentation for more information about Camera Devices.
     *
     * @example
     * ```tsx
     * const device = useCameraDevice('back')
     *
     * if (device == null) return <NoCameraErrorView />
     * return (
     *   <Camera
     *     device={device}
     *     isActive={true}
     *     style={StyleSheet.absoluteFill}
     *   />
     * )
     * ```
     */
    device: CameraDevice
    /**
     * Whether the Camera should actively stream video frames, or not. See the [documentation about the `isActive` prop](https://react-native-vision-camera.com/docs/guides/lifecycle#the-isactive-prop) for more information.
     *
     * This can be compared to a Video component, where `isActive` specifies whether the video is paused or not.
     *
     * > Note: If you fully unmount the `<Camera>` component instead of using `isActive={false}`, the Camera will take a bit longer to start again. In return, it will use less resources since the Camera will be completely destroyed when unmounted.
     */
    isActive: boolean

    //#region Use-cases
    /**
     * Enables **preview** streaming.
     *
     * Preview is enabled by default, and disabled when using a Skia Frame Processor as
     * Skia will use the video stream as it's preview.
     * @default true
     */
    preview?: boolean
    /**
     * Enables **video capture** with the `startRecording` function (see ["Recording Videos"](https://react-native-vision-camera.com/docs/guides/recording-videos))
     */
    video?: boolean
    /**
     * Enables **audio capture** for video recordings (see ["Recording Videos"](https://react-native-vision-camera.com/docs/guides/recording-videos))
     *
     * Note: Requires audio permission.
     */
    audio?: boolean
    //#endregion

    //#region Common Props (torch, zoom)
    /**
     * Set the current torch mode.
     *
     * Make sure the given {@linkcode device} has a torch (see {@linkcode CameraDevice.hasTorch device.hasTorch}).
     *
     * @default "off"
     */
    torch?: 'off' | 'on'
    /**
     * Specifies the zoom factor of the current camera, in "factor"/scale.
     *
     * This value ranges from `minZoom` (e.g. `1`) to `maxZoom` (e.g. `128`). It is recommended to set this value
     * to the CameraDevice's `neutralZoom` per default and let the user zoom out to the fish-eye (ultra-wide) camera
     * on demand (if available)
     *
     * **Note:** Linearly increasing this value always appears logarithmic to the user.
     *
     * @default 1.0
     */
    zoom?: number
    /**
     * Enables or disables the native pinch to zoom gesture.
     *
     * If you want to implement a custom zoom gesture, see [the Zooming with Reanimated documentation](https://react-native-vision-camera.com/docs/guides/zooming).
     *
     * @default false
     */
    enableZoomGesture?: boolean
    //#endregion

    //#region Camera Controls
    /**
     * Specifies the Exposure bias of the current camera. A lower value means darker images, a higher value means brighter images.
     *
     * The Camera will still continue to auto-adjust exposure and focus, but will premultiply the exposure setting with the provided value here.
     *
     * This values ranges from {@linkcode CameraDevice.minExposure device.minExposure} to {@linkcode CameraDevice.maxExposure device.maxExposure}.
     *
     * The value between min- and max supported exposure is considered the default, neutral value.
     */
    exposure?: number
    //#endregion

    //#region Format/Preset selection
    /**
     * Selects a given format. By default, the best matching format is chosen. See {@linkcode CameraDeviceFormat}
     *
     * The format defines the possible values for properties like:
     * - {@linkcode fps}: `format.minFps`...`format.maxFps`
     * - {@linkcode videoHdr}: `format.supportsVideoHdr`
     * - {@linkcode photoHdr}: `format.supportsPhotoHdr`
     * - {@linkcode enableDepthData}: `format.supportsDepthCapture`
     * - {@linkcode videoStabilizationMode}: `format.videoStabilizationModes`
     *
     * In other words; {@linkcode enableDepthData} can only be set to true if {@linkcode CameraDeviceFormat.supportsDepthCapture format.supportsDepthCapture} is true.
     */
    format?: CameraDeviceFormat
    /**
     * Specifies the Preview's resize mode.
     * - `"cover"`: Keep aspect ratio and fill entire parent view (centered).
     * - `"contain"`: Keep aspect ratio and make sure the entire content is visible inside the parent view, even if it introduces additional blank areas (centered).
     *
     * @default "cover"
     */
    resizeMode?: 'cover' | 'contain'
    /**
     * Specify the frames per second this camera should stream frames at.
     *
     * Make sure the given {@linkcode format} can stream at the target {@linkcode fps} value (see {@linkcode CameraDeviceFormat.minFps format.minFps} and {@linkcode CameraDeviceFormat.maxFps format.maxFps}).
     */
    fps?: number
    videoHdr?: boolean
    photo?: boolean
    videoStabilizationMode?: VideoStabilizationMode
    androidPreviewViewType?: 'surface-view' | 'texture-view'
    enableLocation?:boolean
    photoQualityBalance?:'speed' | 'balanced' | 'quality'
    //#region Events
    /**
     * Called when any kind of runtime error occured.
     */
    onError?: (error: { error: string }) => void
    /**
     * Called when the camera session was successfully initialized. This will get called everytime a new device is set.
     */
    onInitialized?: () => void
    onShutter?: (shutterEvent: { type: 'photo' | 'snapshot' }) => void
    /**
     * Called when the camera started the session (`isActive={true}`)
     */
    onStarted?: () => void
    /**
     * Called when the camera stopped the session (`isActive={false}`)
     */
    onStopped?: () => void
    /**
     * A CodeScanner that can detect QR-Codes or Barcodes using platform-native APIs.
     *
     * > See [the Code Scanner documentation](https://react-native-vision-camera.com/docs/guides/code-scanning) for more information
     *
     * @example
     * ```tsx
     * const codeScanner = useCodeScanner({
     *   codeTypes: ['qr', 'ean-13'],
     *   onCodeScanned: (codes) => {
     *     console.log(`Scanned ${codes.length} codes!`)
     *   }
     * })
     *
     * return <Camera {...props} codeScanner={codeScanner} />
     */
    codeScanner?: CodeScanner
    //#endregion
}
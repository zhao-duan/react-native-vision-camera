import { ViewProps } from "react-native";
import { CameraDevice, CameraDeviceFormat } from "./CameraDevice";
import { CodeScanner } from "./CodeScanner";

type VideoStabilizationMode = 'off' | 'standard' | 'cinematic' | 'cinematic-extended' | 'auto';

export interface VisionCameraProps extends ViewProps {
    device: CameraDevice
    isActive: boolean
    preview?: boolean
    video?: boolean
    audio?: boolean
    torch?: 'off' | 'on'
    zoom?: number
    enableZoomGesture?: boolean
    exposure?: number
    format?: CameraDeviceFormat
    resizeMode?: 'cover' | 'contain'
    fps?: number
    videoHdr?: boolean
    photo?: boolean
    videoStabilizationMode?: VideoStabilizationMode
    androidPreviewViewType?: 'surface-view' | 'texture-view'
    enableLocation?: boolean
    photoQualityBalance?: 'speed' | 'balanced' | 'quality'
    onError?: (error: { error: string }) => void
    onInitialized?: () => void
    onShutter?: (shutterEvent: { type: 'photo' | 'snapshot' }) => void
    onStarted?: () => void
    onStopped?: () => void
    codeScanner?: CodeScanner
}
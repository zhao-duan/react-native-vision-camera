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
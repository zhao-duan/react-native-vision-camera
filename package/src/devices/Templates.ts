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
import { Dimensions } from 'react-native'
import type { FormatFilter } from './getCameraFormat'

type PredefinedTemplates =
  | 'Video'
  | 'Video60Fps'
  | 'VideoSlowMotion'
  | 'VideoStabilized'
  | 'Photo'
  | 'PhotoPortrait'
  | 'FrameProcessing'
  | 'Snapchat'
  | 'Instagram'

const SnapchatResolution = { width: 1920, height: 1080 }
const InstagramResolution = { width: 3840, height: 2160 }
const ScreenAspectRatio = Dimensions.get('window').height / Dimensions.get('window').width

export const Templates: Record<PredefinedTemplates, FormatFilter[]> = {
  Video: [{ videoResolution: 'max' }],
  Video60Fps: [{ fps: 60 }, { videoResolution: 'max' }],
  VideoSlowMotion: [{ fps: 240 }, { videoResolution: 'max' }],
  VideoStabilized: [{ videoResolution: 'max' }, { videoStabilizationMode: 'cinematic-extended' }],
  Photo: [{ photoResolution: 'max' }],
  PhotoPortrait: [{ photoResolution: 'max' }, { photoAspectRatio: ScreenAspectRatio }],
  FrameProcessing: [{ videoResolution: { width: 1080, height: 720 } }],
  Snapchat: [
    { videoAspectRatio: ScreenAspectRatio },
    { videoResolution: SnapchatResolution },
    { photoAspectRatio: ScreenAspectRatio },
    { photoResolution: SnapchatResolution },
  ],
  Instagram: [
    { videoAspectRatio: ScreenAspectRatio },
    { videoResolution: InstagramResolution },
    { photoAspectRatio: ScreenAspectRatio },
    { photoResolution: InstagramResolution },
  ],
}

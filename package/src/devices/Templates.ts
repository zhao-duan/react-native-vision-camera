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

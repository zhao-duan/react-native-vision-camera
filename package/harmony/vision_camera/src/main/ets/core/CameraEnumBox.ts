    /**
     * Represents Orientation. Depending on the context, this might be a sensor
     * orientation (relative to the phone's orentation), or view orientation.
     *
     * - `portrait`: **0°** (home-button at the bottom)
     * - `landscape-left`: **90°** (home-button on the left)
     * - `portrait-upside-down`: **180°** (home-button at the top)
     * - `landscape-right`: **270°** (home-button on the right)
     */
    export enum Orientation{
      PORTRAIT='portrait',
      LANDSCAPE_RIGHT='landscape-right',
      PORTRAIT_UPSIDE_DOWN='portrait-upside-down',
      LANDSCAPE_LEFT='landscape-left'
    }

  /**
   * Indicates a format's autofocus system.
   *
   * * `"none"`: Indicates that autofocus is not available
   * * `"contrast-detection"`: Indicates that autofocus is achieved by contrast detection. Contrast detection performs a focus scan to find the optimal position
   * * `"phase-detection"`: Indicates that autofocus is achieved by phase detection. Phase detection has the ability to achieve focus in many cases without a focus scan. Phase detection autofocus is typically less visually intrusive than contrast detection autofocus
   */
  export enum AutoFocusSystem{
      CONTRAST_DETECTION='contrast-detection',
      PHASE_DETECTION='phase-detection',
      NONE='none'
    }

  /**
   * Represents the camera device position.
   *
   * * `"back"`: Indicates that the device is physically located on the back of the phone
   * * `"front"`: Indicates that the device is physically located on the front of the phone
   * * `"external"`: The camera device is an external camera, and has no fixed facing relative to the phone. (e.g. USB or Continuity Cameras)
   */
  export enum CameraPosition{
      FRONT='front',
      BACK='back',
      EXTERNAL='external'
    }

  /**
   * Indicates a format's supported video stabilization mode. Enabling video stabilization may introduce additional latency into the video capture pipeline.
   *
   * * `"off"`: No video stabilization. Indicates that video should not be stabilized
   * * `"standard"`: Standard software-based video stabilization. Standard video stabilization reduces the field of view by about 10%.
   * * `"cinematic"`: Advanced software-based video stabilization. This applies more aggressive cropping or transformations than standard.
   * * `"cinematic-extended"`: Extended software- and hardware-based stabilization that aggressively crops and transforms the video to apply a smooth cinematic stabilization.
   * * `"auto"`: Indicates that the most appropriate video stabilization mode for the device and format should be chosen automatically
   */
  export enum VideoStabilizationMode{
      OFF='off',
      STANDARD='standard',
      CINEMATIC='cinematic',
      CINEMATIC_EXTENDED='cinematic-extended',
      AUTO='auto'
    }

  /**
   * Indentifiers for a physical camera (one that actually exists on the back/front of the device)
   *
   * * `"ultra-wide-angle-camera"`: A built-in camera with a shorter focal length than that of a wide-angle camera. (FOV of 94° or higher)
   * * `"wide-angle-camera"`: A built-in wide-angle camera. (FOV between 60° and 94°)
   * * `"telephoto-camera"`: A built-in camera device with a longer focal length than a wide-angle camera. (FOV of 60° or lower)
   *
   * Some Camera devices consist of multiple physical devices. They can be interpreted as _logical devices_, for example:
   *
   * * `"ultra-wide-angle-camera"` + `"wide-angle-camera"` = **dual wide-angle camera**.
   * * `"wide-angle-camera"` + `"telephoto-camera"` = **dual camera**.
   * * `"ultra-wide-angle-camera"` + `"wide-angle-camera"` + `"telephoto-camera"` = **triple camera**.
   */
  export enum PhysicalCameraDeviceType{
      ULTRA_WIDE_ANGLE_CAMERA='ultra-wide-angle-camera',
      WIDE_ANGLE_CAMERA='wide-angle-camera',
      TELEPHOTO_CAMERA='telephoto-camera'
    }

  export enum HardwareLevel{
      LEGACY='legacy',
      LIMITED='limited',
      FULL='full'
    }

  export enum cameraState{
      PHOTO,
      VIDEO,
      SCAN
    }

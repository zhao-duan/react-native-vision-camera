
#include "VisionCameraModule.h"

// This file was generated.

namespace rnoh {
using namespace facebook;

VisionCameraModule::VisionCameraModule(const ArkTSTurboModule::Context ctx, const std::string name) : ArkTSTurboModule(ctx, name) {
    methodMap_ = {
        ARK_METHOD_METADATA(getAvailableCameraDevices, 0),
        ARK_METHOD_METADATA(addCameraDevicesChangedListener, 1),
        ARK_METHOD_METADATA(getCameraPermissionStatus, 0),
        ARK_ASYNC_METHOD_METADATA(requestCameraPermission, 0),
        ARK_METHOD_METADATA(getMicrophonePermissionStatus, 0),
        ARK_ASYNC_METHOD_METADATA(requestMicrophonePermission, 0),
        ARK_METHOD_METADATA(getLocationPermissionStatus, 0),
        ARK_ASYNC_METHOD_METADATA(requestLocationPermission, 0),
    };
}

} // namespace rnoh

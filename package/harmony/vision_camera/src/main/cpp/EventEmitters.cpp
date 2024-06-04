#include "EventEmitters.h"

namespace facebook {
namespace react {

void VisionCameraViewEventEmitter::onInitialized(OnInitialized event) const {
    dispatchEvent("initialized", [event = std::move(event)](jsi::Runtime &runtime) {
        auto payload = jsi::Object(runtime);
        return payload;
    });
}

} // namespace react
} // namespace facebook

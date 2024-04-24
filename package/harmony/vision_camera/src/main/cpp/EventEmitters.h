#pragma once

#include <react/renderer/components/view/ViewEventEmitter.h>
#include <jsi/jsi.h>

namespace facebook {
namespace react {

class JSI_EXPORT VisionCameraViewEventEmitter : public ViewEventEmitter {
public:
    using ViewEventEmitter::ViewEventEmitter;

    struct OnInitialized{};

    void onInitialized(OnInitialized value) const;

};

} // namespace react
} // namespace facebook
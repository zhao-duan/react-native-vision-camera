
#pragma once

// This file was generated.

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include "EventEmitters.h"

namespace facebook {
namespace react {

extern const char VisionCameraViewComponentName[] = "VisionCameraView";

class VisionCameraViewProps : public ViewProps {
  public:
    VisionCameraViewProps() = default;

    VisionCameraViewProps(const PropsParserContext &context, const VisionCameraViewProps &sourceProps, const RawProps &rawProps)
        : ViewProps(context, sourceProps, rawProps) {}
};

using VisionCameraViewShadowNode = ConcreteViewShadowNode<
    VisionCameraViewComponentName,
    VisionCameraViewProps,
    VisionCameraViewEventEmitter>;

class VisionCameraViewComponentDescriptor final
    : public ConcreteComponentDescriptor<VisionCameraViewShadowNode> {
  public:
    VisionCameraViewComponentDescriptor(ComponentDescriptorParameters const &parameters)
        : ConcreteComponentDescriptor(parameters) {}
};

} // namespace react
} // namespace facebook

#pragma once

// This file was generated.

#include "RNOHCorePackage/ComponentBinders/ViewComponentJSIBinder.h"

namespace rnoh {
class VisionCameraViewJSIBinder : public ViewComponentJSIBinder {
protected:
    facebook::jsi::Object createNativeProps(facebook::jsi::Runtime &rt) override {
        auto object = ViewComponentJSIBinder::createNativeProps(rt);
        object.setProperty(rt, "codeScanner", "Object");
        object.setProperty(rt, "fps", true);
        object.setProperty(rt, "isActive", true);
        object.setProperty(rt, "preview", true);
        object.setProperty(rt, "device", "Object");
        object.setProperty(rt, "resizeMode", true);
        object.setProperty(rt, "enableZoomGesture", true);
        object.setProperty(rt, "exposure", true);
        object.setProperty(rt, "zoom", true);
        object.setProperty(rt, "audio", true);
        object.setProperty(rt, "video", true);
        object.setProperty(rt, "torch", true);
        object.setProperty(rt, "photo", true);
        object.setProperty(rt, "videoStabilizationMode", 'auto');
        object.setProperty(rt, "androidPreviewViewType", 'surface-view');
        object.setProperty(rt, "enableLocation", true);
        object.setProperty(rt, "photoQualityBalance", 'balanced');
        object.setProperty(rt, "videoHdr", false);

        return object;
    }

    facebook::jsi::Object createBubblingEventTypes(facebook::jsi::Runtime &rt) override {
        facebook::jsi::Object events(rt);
        events.setProperty(rt, "topStarted", createBubblingCapturedEvent(rt, "onStarted"));
        events.setProperty(rt, "topStopped", createBubblingCapturedEvent(rt, "onStopped"));
        events.setProperty(rt, "topInitialized", createBubblingCapturedEvent(rt, "onInitialized"));
        events.setProperty(rt, "topError", createBubblingCapturedEvent(rt, "onError"));
        events.setProperty(rt, "topCodeScan", createBubblingCapturedEvent(rt, "onCodeScan"));
        return events;
    }

    facebook::jsi::Object createDirectEventTypes(facebook::jsi::Runtime &rt) override {
        facebook::jsi::Object events(rt);
        return events;
    }
};
} // namespace rnoh

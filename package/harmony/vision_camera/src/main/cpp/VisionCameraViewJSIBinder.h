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
#ifndef VISION_CAMERA_VIEW_JSIBINDER_H
#define VISION_CAMERA_VIEW_JSIBINDER_H
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
#endif
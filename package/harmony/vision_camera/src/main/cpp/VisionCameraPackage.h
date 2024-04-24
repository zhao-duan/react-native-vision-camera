#include "RNOH/Package.h"
#include "RNOH/ArkTSTurboModule.h"
#include "./VisionCameraModule.h"
#include "./VisionCameraViewComponentDescriptor.h"
#include "./VisionCameraViewJSIBinder.h"

namespace rnoh {

class VisionCameraPackageTurboModuleFactoryDelegate : public TurboModuleFactoryDelegate {
public:
    SharedTurboModule createTurboModule(Context ctx, const std::string &name) const override {
        if (name == "VisionCameraModule") {
            return std::make_shared<VisionCameraModule>(ctx, name);
        }
        return nullptr;
    };
};

class VisionCameraEventEmitRequestHandler : public EventEmitRequestHandler {
public:
    void handleEvent(Context const &ctx) override {
        auto eventEmitter = ctx.shadowViewRegistry->getEventEmitter<facebook::react::VisionCameraViewEventEmitter>(ctx.tag);
        if (eventEmitter == nullptr) {
            return;
        }

        std::vector<std::string> supportedEventNames = {
            "started", "stopped", "onInitialized", "error", "directEvent", "bubblingEvent",
        };
        if (std::find(supportedEventNames.begin(), supportedEventNames.end(), ctx.eventName) !=
            supportedEventNames.end()) {
            eventEmitter->dispatchEvent(ctx.eventName, ArkJS(ctx.env).getDynamic(ctx.payload));
        }
    }
};

class VisionCameraPackage : public Package {
public:
    VisionCameraPackage(Package::Context ctx) : Package(ctx){};

    std::unique_ptr<TurboModuleFactoryDelegate> createTurboModuleFactoryDelegate() override {
        return std::make_unique<VisionCameraPackageTurboModuleFactoryDelegate>();
    }

    std::vector<facebook::react::ComponentDescriptorProvider> createComponentDescriptorProviders() override {
        return {
            facebook::react::concreteComponentDescriptorProvider<
                facebook::react::VisionCameraViewComponentDescriptor>(),
        };
    }

    ComponentJSIBinderByString createComponentJSIBinderByName() override {
        return {
            {"VisionCameraView", std::make_shared<VisionCameraViewJSIBinder>()},
        };
    };

    EventEmitRequestHandlers createEventEmitRequestHandlers() override {
        return {
            std::make_shared<VisionCameraEventEmitRequestHandler>(),
        };
    }
};

} // namespace rnoh

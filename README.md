# harmony使用说明

## 一、安装

### 1.1 rnoh项目安装

前往[releases](https://github.com/react-native-oh-library/react-native-vision-camera/releases) 页面下载最新的`tgz`包，注意版本号，本文中以`4.0.1-0.0.9`为例，移动到`rnoh/tester`目录下

在`tester`目录下安装`tgz`包

```shell
npm i @react-native-oh-tpl/react-native-vision-camera@file:./react-native-oh-tpl-react-native-vision-camera-4.0.1-0.0.9.tgz
```

### 1.2 harmony项目安装

`tester/harmony/entry/oh-package.json5` 添加以下内容，然后同步即可

```json
{
  "dependencies": {
    "@react-native-oh-tpl/react-native-vision-camera": "file:../../node_modules/@react-native-oh-tpl/react-native-vision-camera/harmony/vision_camera.har"
  }
}
```

> 调试时应当修改为本地目录路径，例如`"file:../vision_camera"`

### 1.3 框架依赖重定向

`tester/harmony/oh-package.json5`

```diff
{
  "dependencies": {},
+  "overrides": {
+    "@rnoh/react-native-openharmony": "file:./react_native_openharmony"
+  }
}
```

## 二、引入(已引入过可忽略该步骤)

`tester/harmony/entry/src/main/cpp/CMakeLists.txt`

```diff
project(rnapp)
cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_SKIP_BUILD_RPATH TRUE)
+set(VISION_CAMERA_DIR "../../../oh_modules/@react-native-oh-tpl/react-native-vision-camera/src/main/cpp")
add_compile_definitions(WITH_HITRACE_SYSTRACE)

# RNOH_BEGIN: manual_package_linking_1
add_subdirectory("../../../../sample_package/src/main/cpp" ./sample-package)
+add_subdirectory("${VISION_CAMERA_DIR}" ./vision-camera)
# RNOH_END: manual_package_linking_1

file(GLOB GENERATED_CPP_FILES "./generated/*.cpp")
+file(GLOB VISION_CAMERA_CPP_FILES "${VISION_CAMERA_DIR}/*.cpp")

add_library(rnoh_app SHARED
    ${GENERATED_CPP_FILES}
+    ${VISION_CAMERA_CPP_FILES}
    "./PackageProvider.cpp"
    "${RNOH_CPP_DIR}/RNOHAppNapiBridge.cpp"
)
target_link_libraries(rnoh_app PUBLIC rnoh)

# RNOH_BEGIN: manual_package_linking_2
target_link_libraries(rnoh_app PUBLIC rnoh_sample_package)
+target_link_libraries(rnoh_app PUBLIC rnoh_vision_camera)
# RNOH_END: manual_package_linking_2
```

`tester/harmony/entry/src/main/cpp/PackageProvider.cpp`

```diff
#include "RNOH/PackageProvider.h"
#include "generated/RNOHGeneratedPackage.h"
#include "SamplePackage.h"
+#include "VisionCameraPackage.h"

using namespace rnoh;

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<RNOHGeneratedPackage>(ctx), 
        std::make_shared<SamplePackage>(ctx),
+        std::make_shared<VisionCameraPackage>(ctx),
    };
}
```

`tester/harmony/entry/ets/pages/Index.ets `添加以下内容

```diff
import { GeneratedSampleView, PropsDisplayer, SampleView } from 'rnoh-sample-package';
+import { VisionCameraView } from "@react-native-oh-tpl/react-native-vision-camera";

@Builder
export function buildCustomRNComponent(ctx: ComponentBuilderContext) {
  Stack(){
    if (ctx.componentName === SampleView.NAME) {
      SampleView({
        ctx: ctx.rnComponentContext,
        tag: ctx.tag,
      })
    }
+    if (ctx.componentName === VisionCameraView.NAME) {
+      VisionCameraView({
+        ctx: ctx.rnComponentContext,
+        tag: ctx.tag,
+      })
    }
  }
  .position({x:0, y: 0})
}
```

`tester/harmony/entry/ets/RNPackagesFactory.ts `添加以下内容

```diff
import type { RNPackageContext, RNPackage } from 'rnoh/ts';
import { SamplePackage } from 'rnoh-sample-package/ts';
+import { VisionCameraModulePackage } from "@react-native-oh-tpl/react-native-vision-camera/ts";

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [new SamplePackage(ctx),
+    new VisionCameraModulePackage(ctx),
  ];
}
```




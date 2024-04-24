import { useEffect, useState } from 'react'
import { CameraDevice } from '../types/CameraDevice'
import NativeVisionCameraModule from '../NativeVisionCameraModule'
import { DeviceEventEmitter } from 'react-native';

export function useCameraDevices(): CameraDevice[] {
    const [devices, setDevices] = useState(() => NativeVisionCameraModule.getAvailableCameraDevices())

    useEffect(() => {
        const onCameraDevicesChangeListener = DeviceEventEmitter.addListener('onCameraDevicesChange', (newDevices: CameraDevice[]) => {
            setDevices(newDevices)
        });
        return () => onCameraDevicesChangeListener.remove()
    }, [])

    return devices
}
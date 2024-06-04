import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'
import NativeVisionCameraModule, { CameraPermissionRequestResult, CameraPermissionStatus } from '../NativeVisionCameraModule'

interface PermissionState {
  hasPermission: boolean
  requestPermission: () => Promise<boolean>
}


function usePermission(get: () => CameraPermissionStatus, request: () => Promise<CameraPermissionRequestResult>): PermissionState {
  const [hasPermission, setHasPermission] = useState(() => get() === 'granted')

  const requestPermission = useCallback(async () => {
    const result = await request()
    const hasPermissionNow = result === 'granted'
    setHasPermission(hasPermissionNow)
    return hasPermissionNow
  }, [request])

  useEffect(() => {
    const listener = AppState.addEventListener('change', () => {
      setHasPermission(get() === 'granted')
    })
    return () => listener.remove()
  }, [get])

  return useMemo(
    () => ({
      hasPermission,
      requestPermission,
    }),
    [hasPermission, requestPermission],
  )
}

export function useCameraPermission(): PermissionState {
  return usePermission(NativeVisionCameraModule.getCameraPermissionStatus, NativeVisionCameraModule.requestCameraPermission)
}

export function useMicrophonePermission(): PermissionState {
  return usePermission(NativeVisionCameraModule.getMicrophonePermissionStatus, NativeVisionCameraModule.requestMicrophonePermission)
}

export function useLocationPermission(): PermissionState {
  return usePermission(NativeVisionCameraModule.getLocationPermissionStatus, NativeVisionCameraModule.requestLocationPermission)
}

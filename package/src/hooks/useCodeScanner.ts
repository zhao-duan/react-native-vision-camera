import { useCallback, useMemo, useRef } from 'react'
import type { Code, CodeScanner, CodeScannerFrame } from '../types/CodeScanner'

export function useCodeScanner(codeScanner: CodeScanner): CodeScanner {
  const { onCodeScanned, ...codeScannerOptions } = codeScanner

  const ref = useRef(onCodeScanned)
  ref.current = onCodeScanned
  const callback = useCallback((codes: Code[], frame: CodeScannerFrame) => {
    ref.current(codes, frame)
  }, [])

  return useMemo(
    () => ({
      ...codeScannerOptions,
      onCodeScanned: callback,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(codeScannerOptions), callback],
  )
}

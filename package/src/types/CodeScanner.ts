import type { Point } from './Point'

export type CodeType =
  | 'code-128'
  | 'code-39'
  | 'code-93'
  | 'codabar'
  | 'ean-13'
  | 'ean-8'
  | 'itf'
  | 'upc-e'
  | 'upc-a'
  | 'qr'
  | 'pdf-417'
  | 'aztec'
  | 'data-matrix'

export interface CodeScannerFrame {

  width: number

  height: number
}

export interface Code {

  type: CodeType | 'unknown'

  value?: string

  frame?: {
    x: number
    y: number
    width: number
    height: number
  }

  corners?: Point[]
}

export interface CodeScanner {

  codeTypes: CodeType[]

  onCodeScanned: (codes: Code[], frame: CodeScannerFrame) => void

  regionOfInterest?: {
    x: number
    y: number
    width: number
    height: number
  }
}

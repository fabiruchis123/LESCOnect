import { NativeModule, requireOptionalNativeModule } from 'expo';

export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface HandDetectionResult {
  detected: boolean;
  landmarks?: HandLandmark[];
  handsCount?: number;
  rotationApplied?: number;
  error?: string;
}

declare class LescoHandDetectorNativeModule extends NativeModule<{}> {
  isAvailable(): boolean;
  getLastError(): string | null;
  detectHandFromBase64(base64Data: string, facingMode?: string): Promise<HandDetectionResult>;
}

const nativeModule = requireOptionalNativeModule<LescoHandDetectorNativeModule>('LescoHandDetector');

export default nativeModule;

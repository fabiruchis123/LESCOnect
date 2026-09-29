import LescoHandDetectorModule, { HandDetectionResult, HandLandmark } from './src/LescoHandDetectorModule';

export { HandDetectionResult, HandLandmark };

export function isNativeHandDetectorAvailable(): boolean {
  try {
    return Boolean(LescoHandDetectorModule && LescoHandDetectorModule.isAvailable?.());
  } catch {
    return false;
  }
}

export function getNativeHandDetectorLastError(): string | null {
  try {
    return LescoHandDetectorModule?.getLastError?.() ?? null;
  } catch {
    return null;
  }
}

export async function detectHandNative(base64Data: string, facingMode?: string): Promise<HandDetectionResult> {
  if (!LescoHandDetectorModule) {
    return {
      detected: false,
      error: 'Módulo nativo no cargado en este binario APK',
    };
  }
  try {
    return await LescoHandDetectorModule.detectHandFromBase64(base64Data, facingMode);
  } catch (error: any) {
    return {
      detected: false,
      error: error?.message ?? String(error),
    };
  }
}

export default LescoHandDetectorModule;

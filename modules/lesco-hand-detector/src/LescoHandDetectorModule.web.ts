import { registerWebModule, NativeModule } from 'expo';

// LescoHandDetectorModule is not available on the web platform.
class LescoHandDetectorModule extends NativeModule<{}> {}

export default registerWebModule(LescoHandDetectorModule, 'LescoHandDetectorModule');

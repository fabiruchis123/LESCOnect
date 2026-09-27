import React from 'react';
import { View } from 'react-native';

export type CameraType = 'front' | 'back';

export const CameraView = React.forwardRef<any, any>((props, ref) => {
  return <View {...props} ref={ref} />;
});

export function useCameraPermissions() {
  return [
    { granted: true, canAskAgain: true, status: 'granted', expires: 'never' },
    async () => ({ granted: true, canAskAgain: true, status: 'granted', expires: 'never' }),
  ] as const;
}

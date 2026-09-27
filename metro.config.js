const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-camera') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/expo-camera/build/index.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === '@expo/metro-runtime') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@expo/metro-runtime/src/index.ts'),
      type: 'sourceFile',
    };
  }
  if (moduleName === './ExpoCameraManager.web') {
    const filePath = path.resolve(path.dirname(context.originModulePath), 'ExpoCameraManager.web.js');
    if (fs.existsSync(filePath)) {
      return {
        filePath,
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;



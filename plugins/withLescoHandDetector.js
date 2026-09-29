const { withAppBuildGradle, withSettingsGradle } = require('@expo/config-plugins');

const withLescoHandDetector = (config) => {
  // 1. Asegurar inclusión del subproyecto en settings.gradle
  config = withSettingsGradle(config, (modConfig) => {
    if (!modConfig.modResults.contents.includes("':lesco-hand-detector'")) {
      modConfig.modResults.contents += `\ninclude ':lesco-hand-detector'\nproject(':lesco-hand-detector').projectDir = new File(rootProject.projectDir, '../modules/lesco-hand-detector/android')\n`;
    }
    return modConfig;
  });

  // 2. Asegurar dependencia del módulo en app/build.gradle
  config = withAppBuildGradle(config, (modConfig) => {
    if (!modConfig.modResults.contents.includes("project(':lesco-hand-detector')")) {
      modConfig.modResults.contents += `\ndependencies {\n    implementation project(':lesco-hand-detector')\n}\n`;
    }
    return modConfig;
  });

  return config;
};

module.exports = withLescoHandDetector;

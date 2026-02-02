module.exports = {
  name: "new-app",
  slug: "new-app",
  version: "1.0.0",
  scheme: "new-app",
  web: { bundler: "metro", output: "single", favicon: "./assets/images/favicon.png" },
  plugins: [
    "expo-font",
    "expo-asset",
    "expo-video",
    "expo-web-browser",
    [
      "expo-router",
      {
        origin: "https://096c88d5c0.sandbox.draftbit.dev:5101",
        headOrigin: "https://096c88d5c0.sandbox.draftbit.dev:5100",
      },
    ],

    ["./plugins/draftbit-auto-launch-url-plugin"],
  ],

  experiments: { typedRoutes: true, tsconfigPaths: true },
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: { supportsTablet: true, buildNumber: "1", bundleIdentifier: "com.draftbit.newapp" },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.draftbit.newapp",
    versionCode: 1,
  },
  platforms: ["ios", "android", "web"],
};

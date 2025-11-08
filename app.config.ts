import 'dotenv/config';
import { ExpoConfig, ConfigContext } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Quotament",
  slug: "quotament",

  // ✅ runtime version policy (disables fingerprint policy)
  runtimeVersion: { policy: "appVersion" },

  // ✅ keep this in sync and bump when you want a new runtime
  version: "1.0.0",

  orientation: "portrait",
  icon: "./assets/images/splash-icon.jpg",
  scheme: "qapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  extra: {
    ...config.extra,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    eas: { projectId: "23ecef94-e742-40b7-847a-55db106e8ac4" },
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.sohailforreal.quotament",
  },

  android: {
    jsEngine:"jsc",
    
    versionCode: 7,
    package: "com.sohailforreal.quotament",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },

  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
plugins: [
  "expo-router",
  [
    "react-native-android-widget",
    {
      widgets: [
        {
          name: "QuoteWidget",
          label: "Quotament Widget",
          description: "Generate and copy tiny quotes",
          minWidth: "220dp",
          minHeight: "120dp",
          previewImage: "./assets/widget-preview/quote.png",
          updatePeriodMillis: 0
        }
      ]
    }
  ],
  [
    "expo-splash-screen",
    {
      image: "./assets/images/splash-icon.png",
      imageWidth: 200,
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      dark: { backgroundColor: "#000000" }
    }
  ]
],
  

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
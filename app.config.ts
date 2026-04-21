import type { ExpoConfig, ConfigContext } from "expo/config";
import { withAndroidManifest } from "@expo/config-plugins";

export default ({ config }: ConfigContext): ExpoConfig => {
  const INVITE_HOST = process.env.EXPO_PUBLIC_INVITE_HOST ?? "example.com";
  const BUNDLE_ID = process.env.APP_BUNDLE_ID ?? "gg.pryzm.malgeum";
  const APP_GROUP = process.env.APP_GROUP_ID ?? "group.gg.pryzm.malgeum";

  const base: ExpoConfig = {
    ...config,
    name: "Malgeum",
    slug: "malgeum",
    version: "0.1.0",
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? "",
      },
    },
    orientation: "portrait",
    scheme: "malgeum",
    userInterfaceStyle: "light",
    icon: "./assets/images/icon.png",
    ios: {
      supportsTablet: false,
      bundleIdentifier: BUNDLE_ID,
      appleTeamId: process.env.APPLE_TEAM_ID ?? "",
      googleServicesFile:
        process.env.GOOGLE_SERVICE_INFO_PLIST ?? "./GoogleService-Info.plist",
      associatedDomains: [`applinks:${INVITE_HOST}`],
      entitlements: {
        "com.apple.security.application-groups": [APP_GROUP],
      },
      infoPlist: {
        CFBundleDisplayName: "맑음-내기분",
        CFBundleDevelopmentRegion: "en",
        CFBundleAllowMixedLocalizations: true,
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "현재 위치의 날씨와 맞춤 행동 가이드를 제공하기 위해 위치 정보가 필요합니다.",
        FirebaseAutomaticScreenReportingEnabled: false,
        NSSpeechRecognitionUsageDescription:
          "음성으로 날씨 질문을 입력하기 위해 음성 인식 권한이 필요합니다.",
        NSMicrophoneUsageDescription:
          "음성으로 날씨 질문을 입력하기 위해 마이크 권한이 필요합니다.",
        NSPhotoLibraryUsageDescription:
          "날씨 공유 카드를 사진 앨범에 저장하기 위해 사진 라이브러리 접근 권한이 필요합니다.",
      },
    },
    android: {
      package: BUNDLE_ID,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#0F172A",
      },
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "RECORD_AUDIO"],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { scheme: "https", host: INVITE_HOST, pathPrefix: "/n" },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      bundler: "metro",
    },
    plugins: [
      [
        "@sentry/react-native",
        {
          organization: process.env.SENTRY_ORG ?? "",
          project: process.env.SENTRY_PROJECT ?? "react-native-2u",
        },
      ],
      "@react-native-firebase/app",
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "@bacons/apple-targets",
      "./plugins/withWidgetAssets",
      [
        "react-native-android-widget",
        {
          widgets: [
            {
              name: "MalgeumSmall",
              label: "맑음-내기분",
              description: "날씨와 행동 추천",
              minWidth: "110dp",
              minHeight: "110dp",
              targetCellWidth: 2,
              targetCellHeight: 2,
              updatePeriodMillis: 1800000,
            },
            {
              name: "MalgeumMedium",
              label: "맑음-내기분 상세",
              description: "날씨 상세와 행동 추천",
              minWidth: "250dp",
              minHeight: "110dp",
              targetCellWidth: 4,
              targetCellHeight: 2,
              updatePeriodMillis: 1800000,
            },
          ],
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "현재 위치의 날씨와 맞춤 행동 가이드를 제공하기 위해 위치 정보가 필요합니다.",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#4A90D9",
        },
      ],
      [
        "expo-speech-recognition",
        {
          microphonePermission:
            "음성으로 날씨 질문을 입력하기 위해 마이크 권한이 필요합니다.",
          speechRecognitionPermission:
            "음성으로 날씨 질문을 입력하기 위해 음성 인식 권한이 필요합니다.",
        },
      ],
      [
        "expo-splash-screen",
        {
          ios: {
            image: "./assets/images/splash.png",
            resizeMode: "cover",
            backgroundColor: "#E8E0D4",
            enableFullScreenImage_legacy: true,
          },
          android: {
            image: "./assets/images/icon-rounded.png",
            resizeMode: "contain",
            backgroundColor: "#E8E0D4",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  };

  return withAndroidManifest(base, (c) => {
    const app = c.modResults.manifest.application?.[0];
    if (app) {
      app.$["android:label"] = "맑음-내기분";
      // Firebase 자동 screen_view 비활성화 — 수동 트래킹 사용
      // tools namespace 선언 (manifest merger용)
      const manifest = c.modResults.manifest;
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

      const metaData = app["meta-data"] ?? [];
      const screenKey = "google_analytics_automatic_screen_reporting_enabled";
      const existing = metaData.find((m) => m.$["android:name"] === screenKey);
      if (existing) {
        existing.$["android:value"] = "false";
        (existing.$ as Record<string, string>)["tools:replace"] = "android:value";
      } else {
        metaData.push({
          $: {
            "android:name": screenKey,
            "android:value": "false",
            "tools:replace": "android:value",
          } as any,
        });
      }
      app["meta-data"] = metaData;
    }
    const activity = app?.activity;
    const main = activity?.find(
      (a) => a.$["android:name"] === ".MainActivity"
    );
    if (main) {
      main.$["android:windowLayoutInDisplayCutoutMode"] = "shortEdges";
    }
    return c;
  });
};

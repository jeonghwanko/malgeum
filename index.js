import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./src/widgets/android/widgetTaskHandler";

registerWidgetTaskHandler(widgetTaskHandler);

// expo-router 진입점 (일반 앱 실행)
import "expo-router/entry";

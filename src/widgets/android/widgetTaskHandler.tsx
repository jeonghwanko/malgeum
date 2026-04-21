import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { SmallWidget } from "./SmallWidget";
import { MediumWidget } from "./MediumWidget";
import type { WidgetData } from "@/types/widget";

const SAMPLE_WIDGET_DATA: WidgetData = {
  temp: 22,
  feelsLike: 20,
  tempDisplay: "22°",
  feelsLikeDisplay: "20°",
  tempUnit: "C",
  condition: "clear",
  conditionLabel: "맑음",
  conditionEmoji: "☀️",
  locationName: "서울 강남구",
  district: "강남구",
  heroMessage: "외출하기 좋아요",
  textureKey: "sunny",
  updatedAt: Date.now(),
  cards: [],
  aiSummary: "",
  artStyle: "default",
};

async function readWidgetData(): Promise<WidgetData> {
  try {
    // Expo Module은 headless JS 태스크에서도 requireNativeModule로 접근
    const { requireNativeModule } = require("expo-modules-core");
    const bridge = requireNativeModule("WidgetBridge");
    const json = await bridge.getWidgetData();
    if (json) return JSON.parse(json) as WidgetData;
    return SAMPLE_WIDGET_DATA;
  } catch {
    return SAMPLE_WIDGET_DATA;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const data = await readWidgetData();

  switch (props.widgetInfo.widgetName) {
    case "MalgeumSmall":
      props.renderWidget(<SmallWidget data={data} />);
      break;
    case "MalgeumMedium":
      props.renderWidget(<MediumWidget data={data} />);
      break;
    default:
      props.renderWidget(<SmallWidget data={data} />);
  }
}

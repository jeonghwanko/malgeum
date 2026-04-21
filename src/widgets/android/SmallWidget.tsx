import React from "react";
import {
  FlexWidget,
  TextWidget,
  SvgWidget,
  ImageWidget,
  OverlapWidget,
} from "react-native-android-widget";
import type { WidgetData } from "@/types/widget";
import { getWidgetTheme, getWeatherIconSvg } from "./widgetTheme";
import { getArtworkImage } from "./widgetAssets";

interface Props {
  data: WidgetData | null;
}

export function SmallWidget({ data }: Props) {
  const theme = getWidgetTheme(data?.artStyle ?? "default");
  const glassMode = data?.glassMode ?? false;
  const artworkImage = (!glassMode && data)
    ? getArtworkImage(data.artStyle, data.textureKey)
    : null;

  if (!data) {
    return (
      <OverlapWidget style={{ height: "match_parent", width: "match_parent", borderRadius: 28, overflow: "hidden" }}>
        <FlexWidget style={{ width: "match_parent", height: "match_parent", backgroundColor: "#1E293BAA" }} />
        <FlexWidget
          style={{
            width: "match_parent",
            height: "match_parent",
            justifyContent: "center",
            alignItems: "center",
            padding: 14,
          }}
        >
          <TextWidget
            text="맑음"
            style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}
          />
          <TextWidget
            text="앱을 열어 설정하세요"
            style={{ fontSize: 10, color: "#FFFFFF88", marginTop: 4 }}
          />
        </FlexWidget>
      </OverlapWidget>
    );
  }

  const iconSvg = getWeatherIconSvg(data.condition, "#FFFFFF");
  const pillBg = theme.accent + "38"; // accent 22% opacity

  return (
    <OverlapWidget
      style={{ height: "match_parent", width: "match_parent", borderRadius: 28, overflow: "hidden" }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: "malgeum://home" }}
    >
      {/* 1. 배경 */}
      {glassMode ? (
        <FlexWidget style={{ width: "match_parent", height: "match_parent", backgroundColor: "#1E293BAA" }} />
      ) : artworkImage ? (
        <ImageWidget
          image={artworkImage}
          imageWidth={400}
          imageHeight={400}
          style={{ height: "match_parent", width: "match_parent" }}
        />
      ) : (
        <FlexWidget style={{ width: "match_parent", height: "match_parent", backgroundColor: theme.bg as `#${string}` }} />
      )}

      {/* 2. 스크림 */}
      {!glassMode && (
        <FlexWidget style={{ width: "match_parent", height: "match_parent" }}>
          <FlexWidget style={{ flex: 2, backgroundColor: "#00000010" }} />
          <FlexWidget style={{ flex: 3, backgroundColor: "#00000030" }} />
          <FlexWidget style={{ flex: 5, backgroundColor: "#00000070" }} />
        </FlexWidget>
      )}

      {/* 3. 콘텐츠 */}
      <FlexWidget
        style={{
          width: "match_parent",
          height: "match_parent",
          padding: 14,
          justifyContent: "space-between",
        }}
      >
        {/* 상단: 위치명 + streak 배지 */}
        <FlexWidget style={{ flexDirection: "row", alignItems: "center", width: "match_parent" }}>
          <FlexWidget style={{ flex: 1 }}>
            <TextWidget
              text={data.district}
              style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFFAA" }}
            />
          </FlexWidget>
          {(data.predictionStreak ?? 0) >= 2 ? (
            <TextWidget
              text={`🔥${data.predictionStreak}`}
              style={{ fontSize: 11, fontWeight: "700", color: "#FBBF24" }}
            />
          ) : null}
        </FlexWidget>

        {/* 중앙: 이모지 + 온도 */}
        <FlexWidget style={{ width: "match_parent" }}>
          <TextWidget
            text={data.conditionEmoji}
            style={{ fontSize: 28 }}
          />
          <TextWidget
            text={data.tempDisplay ?? `${data.temp}°`}
            style={{ fontSize: 42, fontWeight: "800", color: "#FFFFFF" }}
          />
        </FlexWidget>

        {/* 하단: hero pill + 한 마디 */}
        <FlexWidget style={{ width: "match_parent" }}>
          {data.heroMessage ? (
            <FlexWidget
              style={{
                backgroundColor: pillBg as `#${string}`,
                borderRadius: 20,
                paddingHorizontal: 9,
                paddingVertical: 4,
                width: "wrap_content",
              }}
            >
              <TextWidget
                text={data.heroMessage}
                style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFFEE" }}
              />
            </FlexWidget>
          ) : null}
          {data.aiSummary ? (
            <TextWidget
              text={data.aiSummary}
              style={{ fontSize: 11, color: "#FFFFFF77", marginTop: 3 }}
            />
          ) : null}
        </FlexWidget>
      </FlexWidget>
    </OverlapWidget>
  );
}

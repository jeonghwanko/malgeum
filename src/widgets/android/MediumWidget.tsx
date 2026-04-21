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

export function MediumWidget({ data }: Props) {
  const theme = getWidgetTheme(data?.artStyle ?? "default");
  const glassMode = data?.glassMode ?? false;
  const artworkImage = (!glassMode && data)
    ? getArtworkImage(data.artStyle, data.textureKey)
    : null;
  const iconSvg = getWeatherIconSvg(data?.condition ?? "clear", "#FFFFFF");

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
            padding: 16,
          }}
        >
          <TextWidget text="맑음" style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }} />
          <TextWidget text="앱을 열어 설정하세요" style={{ fontSize: 11, color: "#FFFFFF88", marginTop: 4 }} />
        </FlexWidget>
      </OverlapWidget>
    );
  }

  const pills = data.cards?.length > 0
    ? data.cards.slice(0, 3)
    : [{ id: "hero", title: data.heroMessage, description: "", icon: "" }];

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
        <ImageWidget image={artworkImage} imageWidth={800} imageHeight={400} style={{ height: "match_parent", width: "match_parent" }} />
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
      <FlexWidget style={{ width: "match_parent", height: "match_parent", padding: 16, justifyContent: "space-between" }}>
        {/* 상단: 이모지 + 위치 + hero pill */}
        <FlexWidget style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "match_parent" }}>
          <FlexWidget style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
            <TextWidget
              text={data.conditionEmoji}
              style={{ fontSize: 16, marginRight: 6 }}
            />
            <FlexWidget>
              <TextWidget text={data.locationName} style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFFCC" }} />
              <TextWidget
                text={`${data.conditionLabel} · 체감 ${data.feelsLikeDisplay}`}
                style={{ fontSize: 11, color: "#FFFFFF88", marginTop: 1 }}
              />
            </FlexWidget>
          </FlexWidget>
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
              <TextWidget text={data.heroMessage} style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFFEE" }} />
            </FlexWidget>
          ) : null}
        </FlexWidget>

        {/* 하단: 온도 + pill 스택 */}
        <FlexWidget style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", width: "match_parent" }}>
          <FlexWidget style={{ flex: 1 }}>
            <TextWidget
              text={data.tempDisplay ?? `${data.temp}°`}
              style={{ fontSize: 46, fontWeight: "800", color: "#FFFFFF" }}
            />
            {data.aiSummary ? (
              <TextWidget
                text={data.aiSummary}
                style={{ fontSize: 12, color: "#FFFFFF77", marginTop: 2 }}
              />
            ) : null}
          </FlexWidget>
          <FlexWidget style={{ alignItems: "flex-end" }}>
            {pills.map((card, i) => (
              <FlexWidget
                key={`${card.id}-${i}`}
                style={{
                  backgroundColor: "#FFFFFF14",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  marginTop: i > 0 ? 3 : 0,
                }}
              >
                <TextWidget
                  text={card.title}
                  style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFFDD" }}
                />
              </FlexWidget>
            ))}
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </OverlapWidget>
  );
}

import React from "react";
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity } from "react-native";
import type { ActionCard as ActionCardType } from "@/types/actions";
import { getActionIcon } from "@/constants/actionIcons";
import { hapticLight } from "@/hooks/useHaptics";
/** 포스트잇 배경색 — 밝고 불투명한 파스텔 */
const POSTIT_BG = [
  "#FFF176",   // 노랑
  "#A5D6A7",   // 민트
  "#FFCC80",   // 오렌지
  "#CE93D8",   // 라벤더
  "#F48FB1",   // 핑크
  "#80DEEA",   // 하늘
];

/** 테이프 스트립 색 (배경보다 약간 진하게) */
const TAPE_BG = [
  "#F9E835",
  "#81C784",
  "#FFA726",
  "#BA68C8",
  "#EC407A",
  "#26C6DA",
];

const ROTATIONS = ["-2deg", "1.5deg", "-1deg", "2deg", "-1.5deg", "0.8deg"] as const;

interface ActionGridProps {
  cards: ActionCardType[];
  onCardPress?: (cardId: string) => void;
}

function PostitCard({ card, index, onPress }: { card: ActionCardType; index: number; onPress: () => void }) {
  const bg = POSTIT_BG[index % POSTIT_BG.length];
  const tape = TAPE_BG[index % TAPE_BG.length];
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const Icon = getActionIcon(card.icon);

  return (
    <TouchableOpacity
      onPress={() => { hapticLight(); onPress(); }}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${card.title}. ${card.description}`}
    >
      <View
        style={[
          styles.postit,
          { backgroundColor: bg, transform: [{ rotate: rotation }] },
          Platform.OS === "android"
            ? { elevation: 8 }
            : {
                shadowColor: "#000",
                shadowOffset: { width: 2, height: 5 },
                shadowOpacity: 0.22,
                shadowRadius: 10,
              },
        ]}
      >
        <View style={[styles.tapeStrip, { backgroundColor: tape }]} />
        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <Icon size={30} weight="duotone" color="#1F2937" />
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {card.title}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {card.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ActionGrid({ cards, onCardPress }: ActionGridProps) {
  if (cards.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        {...{ delayContentTouches: false }}
      >
        {cards.map((card, i) => (
          <PostitCard
            key={card.id}
            card={card}
            index={i}
            onPress={() => onCardPress?.(card.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20, zIndex: 1 },
  scrollContent: { paddingHorizontal: 24, gap: 14, paddingVertical: 10 },

  postit: {
    width: 120,
    height: 148,
    borderRadius: 3,
    overflow: "hidden",
  },

  tapeStrip: {
    height: 18,
    width: "100%",
  },

  body: {
    padding: 10,
    paddingTop: 10,
    flex: 1,
    alignItems: "center",
  },

  iconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  title: {
    textAlign: "center",
    fontFamily: "NanumPen",
    fontSize: 17,
    lineHeight: 22,
    color: "#1E293B",
    marginBottom: 4,
  },

  desc: {
    fontSize: 11,
    lineHeight: 16,
    color: "#475569",
    textAlign: "center",
  },
});

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

interface SuggestedQuestion {
  emoji: string;
  text: string;
}

interface ChatSuggestedQuestionsProps {
  suggestions: SuggestedQuestion[];
  show: boolean;
  onSend: (text: string) => void;
}

export function ChatSuggestedQuestions({ suggestions, show, onSend }: ChatSuggestedQuestionsProps) {
  if (!show) return null;

  return (
    <View style={styles.suggestRow}>
      {suggestions.map((q, i) => (
        <Pressable
          key={i}
          style={styles.suggestChip}
          onPress={() => onSend(q.text)}
          accessibilityRole="button"
          accessibilityLabel={q.text}
        >
          <Text style={styles.suggestEmoji}>{q.emoji}</Text>
          <Text style={styles.suggestText}>{q.text}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  suggestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  suggestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  suggestEmoji: {
    fontSize: 16,
  },
  suggestText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textDark,
  },
});

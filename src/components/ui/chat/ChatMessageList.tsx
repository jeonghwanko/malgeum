import React, { type RefObject } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import type { ChatMessage, OnboardingStep, SettingsAction, WeatherIntent } from "@/types/chat";
import { ChatBubble, ChatBubbleLoading } from "../ChatBubble";
import { COLORS } from "@/constants/colors";
import { t } from "@/i18n";

interface ChatMessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  flatListRef: RefObject<FlatList<ChatMessage> | null>;
  inkColor?: string;
  paperBg?: string;
  onFollowUpPress: (question: { emoji: string; text: string }) => void;
  onRate: (messageId: string, rating: "up" | "down", intent?: WeatherIntent) => void;
  onShare: (text: string) => void;
  onNavigate?: (route: string) => void;
  onConfirmSettings?: (messageId: string, action: SettingsAction, summary: string, route: string) => void;
  onCancelSettings?: (messageId: string) => void;
  onOnboardingPick?: (messageId: string, step: OnboardingStep, optionId: string, isEscape: boolean) => void;
  onOnboardingSubmit?: (messageId: string, step: OnboardingStep) => void;
  onOnboardingTextInput?: () => void;
  onScrollEndDrag?: (e: any) => void;
}

export function ChatMessageList({
  messages,
  loading,
  flatListRef,
  inkColor,
  paperBg,
  onFollowUpPress,
  onRate,
  onShare,
  onNavigate,
  onConfirmSettings,
  onCancelSettings,
  onOnboardingPick,
  onOnboardingSubmit,
  onOnboardingTextInput,
  onScrollEndDrag,
}: ChatMessageListProps) {
  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      onScrollEndDrag={onScrollEndDrag}
      bounces
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => (
        <ChatBubble
          message={item}
          inkColor={inkColor}
          paperBg={paperBg}
          onFollowUpPress={onFollowUpPress}
          onRate={onRate}
          onShare={onShare}
          onNavigate={onNavigate}
          onConfirmSettings={onConfirmSettings}
          onCancelSettings={onCancelSettings}
          onOnboardingPick={onOnboardingPick}
          onOnboardingSubmit={onOnboardingSubmit}
          onOnboardingTextInput={onOnboardingTextInput}
        />
      )}
      ListFooterComponent={loading ? <ChatBubbleLoading paperBg={paperBg} /> : null}
      contentContainerStyle={styles.messageList}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      ListEmptyComponent={
        !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>{t("chatUI.emptyTitle")}</Text>
            <Text style={styles.emptyDesc}>
              {t("chatUI.emptyDesc")}
            </Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  messageList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});

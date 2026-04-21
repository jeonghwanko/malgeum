import React, { type RefObject } from "react";
import { View, TextInput, Pressable, StyleSheet, type TextInput as TextInputType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { PaperPlaneTilt, Microphone, Stop } from "phosphor-react-native";
import { COLORS } from "@/constants/colors";
import { t } from "@/i18n";
import type { AnimatedStyle } from "react-native-reanimated";
import type { ViewStyle } from "react-native";

interface VoiceState {
  isAvailable: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
}

interface ChatInputBarProps {
  input: string;
  setInput: (text: string) => void;
  loading: boolean;
  voice: VoiceState;
  micPulseStyle: AnimatedStyle<ViewStyle>;
  inputRef: RefObject<TextInputType | null>;
  onSend: (text: string) => void;
  cancelVoice: () => void;
}

export function ChatInputBar({
  input,
  setInput,
  loading,
  voice,
  micPulseStyle,
  inputRef,
  onSend,
  cancelVoice,
}: ChatInputBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
          onChangeText={(text) => {
            setInput(text);
            if (voice.isListening) cancelVoice();
          }}
          placeholder={
            voice.isListening
              ? t("chatUI.listening")
              : t("chatUI.placeholder")
          }
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="send"
          blurOnSubmit={false}
          autoCorrect={false}
          onSubmitEditing={() => onSend(input)}
          accessibilityLabel={t("chatUI.inputA11y")}
        />
        {voice.isAvailable && (
          <Pressable
            style={[
              styles.micBtn,
              voice.isListening && styles.micBtnActive,
            ]}
            onPress={() => {
              if (voice.isListening) {
                voice.stopListening();
              } else {
                voice.startListening();
              }
            }}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={voice.isListening ? t("chatUI.voiceStop") : t("chatUI.voiceStart")}
          >
            <Animated.View style={voice.isListening ? micPulseStyle : undefined}>
              {voice.isListening ? (
                <Stop size={18} color="#FFFFFF" weight="fill" />
              ) : (
                <Microphone size={18} color={COLORS.primary} weight="bold" />
              )}
            </Animated.View>
          </Pressable>
        )}
        <Pressable
          style={[
            styles.sendBtn,
            (!input.trim() || loading) && styles.sendBtnDisabled,
          ]}
          onPress={() => {
            onSend(input);
            inputRef.current?.focus();
          }}
          disabled={!input.trim() || loading}
          accessibilityRole="button"
          accessibilityLabel={t("chatUI.sendA11y")}
          accessibilityState={{ disabled: !input.trim() || loading }}
        >
          <PaperPlaneTilt
            size={18}
            color="#FFFFFF"
            weight="fill"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: "rgba(0,0,0,0.02)",
    fontSize: 14,
    color: COLORS.textDark,
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(74,144,217,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  micBtnActive: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});

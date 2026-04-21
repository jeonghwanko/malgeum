import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Heart, ChatCircle } from "phosphor-react-native";

interface Props {
  likeCount: number;
  commentCount: number;
}

export const SocialRow = memo(function SocialRow({ likeCount, commentCount }: Props) {
  if (likeCount <= 0 && commentCount <= 0) return null;
  return (
    <View style={styles.row}>
      {likeCount > 0 && (
        <>
          <Heart size={12} weight="fill" color="#EF4444" />
          <Text style={styles.text}>{likeCount}</Text>
        </>
      )}
      {commentCount > 0 && (
        <>
          <ChatCircle size={12} color="rgba(255,255,255,0.35)" />
          <Text style={styles.text}>{commentCount}</Text>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  text: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.35)" },
});

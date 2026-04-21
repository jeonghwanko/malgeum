import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, Image, ScrollView, TextInput, Pressable,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Heart, ChatCircle, PaperPlaneTilt, PencilSimple, Trash, MapPin } from "phosphor-react-native";
import {
  getDetailCache,
  fetchContentSocial,
  toggleLike,
  fetchComments,
  addComment,
  editComment,
  deleteComment,
} from "@/services/discoverSocialService";
import { getOrCreateDeviceId } from "@/utils/deviceId";
import { toHttps, decodeEntities } from "@/utils/url";
import { t } from "@/i18n";
import type { ContentSocial, DiscoverComment, DiscoverDetailData } from "@/services/discoverSocialService";

export default function DiscoverDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contentKey: paramKey } = useLocalSearchParams<{ contentKey?: string }>();

  const cache = useMemo(() => getDetailCache(), []);
  const contentKey = paramKey ?? cache?.contentKey ?? "";

  const [social, setSocial] = useState<ContentSocial>({ likeCount: 0, commentCount: 0, isLiked: false });
  const [comments, setComments] = useState<DiscoverComment[]>([]);
  const [myDeviceId, setMyDeviceId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // 데이터 로드
  useEffect(() => {
    if (!contentKey) return;
    getOrCreateDeviceId().then(setMyDeviceId);
    fetchContentSocial(contentKey).then(setSocial);
    fetchComments(contentKey).then(setComments);
  }, [contentKey]);

  // 좋아요 토글
  const handleLike = useCallback(async () => {
    if (liking || !contentKey) return;
    setLiking(true);
    // 낙관적 업데이트
    setSocial((prev) => ({
      ...prev,
      isLiked: !prev.isLiked,
      likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
    }));
    try {
      const result = await toggleLike(contentKey);
      setSocial((prev) => ({ ...prev, isLiked: result.isLiked, likeCount: result.likeCount }));
    } catch {
      // 롤백
      setSocial((prev) => ({
        ...prev,
        isLiked: !prev.isLiked,
        likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
      }));
    } finally {
      setLiking(false);
    }
  }, [contentKey, liking]);

  // 댓글 등록 / 수정
  const handleSubmitComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      if (editingId) {
        const ok = await editComment(editingId, text);
        if (ok) {
          setComments((prev) => prev.map((c) => c.id === editingId ? { ...c, text } : c));
        }
        setEditingId(null);
      } else {
        const newComment = await addComment(contentKey, text);
        if (newComment) {
          setComments((prev) => [newComment, ...prev]);
          setSocial((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }));
        }
      }
      setCommentText("");
    } finally {
      setSubmitting(false);
    }
  }, [contentKey, commentText, editingId, submitting]);

  // 댓글 수정 시작
  const handleEditStart = useCallback((comment: DiscoverComment) => {
    setEditingId(comment.id);
    setCommentText(comment.text);
    inputRef.current?.focus();
  }, []);

  // 댓글 삭제
  const handleDelete = useCallback((commentId: string) => {
    Alert.alert(t("discoverDetail.deleteComment"), t("discoverDetail.deleteCommentConfirm"), [
      { text: t("discoverDetail.cancel"), style: "cancel" },
      {
        text: t("discoverDetail.delete"), style: "destructive",
        onPress: async () => {
          const ok = await deleteComment(commentId);
          if (ok) {
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            setSocial((prev) => ({ ...prev, commentCount: Math.max(0, prev.commentCount - 1) }));
          }
        },
      },
    ]);
  }, []);

  // 시간 표시
  const timeAgo = useCallback((iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("discoverDetail.justNow");
    if (mins < 60) return t("discoverDetail.minsAgo", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("discoverDetail.hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    return t("discoverDetail.daysAgo", { count: days });
  }, []);

  if (!cache && !paramKey) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#333" />
        </Pressable>
      </View>
    );
  }

  const detail: DiscoverDetailData = cache ?? {
    contentKey, type: "festival", title: "", addr: "",
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{t("discoverDetail.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 이미지 */}
        {detail.image ? (
          <Image source={{ uri: toHttps(detail.image)! }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.placeholder]}>
            <Text style={{ fontSize: 48 }}>
              {detail.type === "festival" ? "🎪" : detail.type === "performance" ? "🎭" : "⛺"}
            </Text>
          </View>
        )}

        {/* 정보 */}
        <View style={styles.infoSection}>
          <Text style={styles.titleText}>{decodeEntities(detail.title)}</Text>
          {detail.addr ? (
            <View style={styles.metaRow}>
              <MapPin size={14} color="#94A3B8" />
              <Text style={styles.metaText}>{detail.addr}</Text>
            </View>
          ) : null}
          {detail.period ? (
            <Text style={styles.periodText}>{detail.period}</Text>
          ) : null}
          {detail.extra?.genre ? (
            <View style={styles.genreBadge}>
              <Text style={styles.genreText}>{detail.extra.genre}</Text>
            </View>
          ) : null}
          {detail.extra?.venue ? (
            <Text style={styles.venueText}>{detail.extra.venue}</Text>
          ) : null}
        </View>

        {/* 좋아요 / 댓글 카운트 */}
        <View style={styles.socialRow}>
          <Pressable style={styles.socialBtn} onPress={handleLike}>
            <Heart size={22} weight={social.isLiked ? "fill" : "regular"} color={social.isLiked ? "#EF4444" : "#94A3B8"} />
            <Text style={[styles.socialCount, social.isLiked && { color: "#EF4444" }]}>{social.likeCount}</Text>
          </Pressable>
          <View style={styles.socialBtn}>
            <ChatCircle size={22} color="#94A3B8" />
            <Text style={styles.socialCount}>{social.commentCount}</Text>
          </View>
        </View>

        {/* 댓글 목록 */}
        <View style={styles.commentSection}>
          <Text style={styles.commentHeader}>{t("discoverDetail.comments")}</Text>
          {comments.length === 0 ? (
            <Text style={styles.noComments}>{t("discoverDetail.noComments")}</Text>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <View style={styles.commentTop}>
                  <Text style={styles.commentNickname}>{c.nickname}</Text>
                  <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                </View>
                <Text style={styles.commentText}>{c.text}</Text>
                {c.deviceId === myDeviceId && (
                  <View style={styles.commentActions}>
                    <Pressable onPress={() => handleEditStart(c)} hitSlop={8}>
                      <PencilSimple size={14} color="#94A3B8" />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(c.id)} hitSlop={8}>
                      <Trash size={14} color="#94A3B8" />
                    </Pressable>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 댓글 입력 */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={commentText}
          onChangeText={setCommentText}
          placeholder={editingId ? t("discoverDetail.editPlaceholder") : t("discoverDetail.commentPlaceholder")}
          placeholderTextColor="#94A3B8"
          maxLength={200}
          returnKeyType="send"
          onSubmitEditing={handleSubmitComment}
        />
        {submitting ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : (
          <Pressable onPress={handleSubmitComment} hitSlop={8} disabled={!commentText.trim()}>
            <PaperPlaneTilt size={22} weight="fill" color={commentText.trim() ? "#3B82F6" : "#CBD5E1"} />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  backBtn: { padding: 8 },
  scroll: { flex: 1 },
  heroImage: { width: "100%", height: 220 },
  placeholder: { backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  infoSection: { padding: 20, gap: 8 },
  titleText: { fontSize: 22, fontWeight: "800", color: "#1E293B", letterSpacing: -0.3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, color: "#64748B" },
  periodText: { fontSize: 13, color: "#64748B" },
  genreBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(139,92,246,0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  genreText: { fontSize: 12, fontWeight: "700", color: "#8B5CF6" },
  venueText: { fontSize: 13, color: "#64748B" },
  socialRow: {
    flexDirection: "row",
    gap: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  socialBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  socialCount: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  commentSection: { padding: 20 },
  commentHeader: { fontSize: 15, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  noComments: { fontSize: 13, color: "#94A3B8", textAlign: "center", paddingVertical: 20 },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  commentTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentNickname: { fontSize: 13, fontWeight: "700", color: "#334155" },
  commentTime: { fontSize: 11, color: "#94A3B8" },
  commentText: { fontSize: 14, color: "#475569", lineHeight: 20 },
  commentActions: { flexDirection: "row", gap: 16, marginTop: 6 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#1E293B",
  },
});

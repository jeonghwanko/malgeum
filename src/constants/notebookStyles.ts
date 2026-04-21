/**
 * Notebook Styles — "아티스트의 날씨 노트"
 *
 * 각 아트 테마별로 고유한 노트 분위기를 정의.
 * 배경 = 예술작품, 카드 = 그 위에 놓인 노트 한 장, 텍스트 = 필기
 */
import type { AllArtStyleKey } from "@/types/settings";

export type NotebookFontFamily = "NanumPen" | "system";

export interface NotebookStyle {
  /** 필기 폰트 (메인 카피용) */
  fontFamily: NotebookFontFamily;
  /** 카피 폰트 사이즈 보정 (필기체는 약간 키워야 가독성 확보) */
  fontSizeScale: number;
  /** 노트 종이 배경색 */
  paperBg: string;
  /** 노트 종이 보더색 */
  paperBorder: string;
  /** 종이 위 텍스트 색상 (잉크색) */
  inkColor: string;
  /** 보조 텍스트 색상 (연필/연한 잉크) */
  inkLight: string;
  /** 종이 그림자 */
  paperShadowColor: string;
  /** 노트 스타일 설명 (디버그용) */
  label: string;
}

const NOTEBOOK_STYLES: Record<AllArtStyleKey, NotebookStyle> = {
  // ── 기본 ──
  default: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(255,255,255,0.88)",
    paperBorder: "rgba(200,200,200,0.4)",
    inkColor: "#1E293B",
    inkLight: "#64748B",
    paperShadowColor: "rgba(0,0,0,0.12)",
    label: "기본 메모지",
  },

  // ── 펜 필기 계열 ──
  vangogh: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(255,248,230,0.92)",    // 크라프트지
    paperBorder: "rgba(180,160,120,0.35)",
    inkColor: "#2C1810",                   // 진한 갈색 잉크
    inkLight: "#8B7355",
    paperShadowColor: "rgba(60,40,20,0.15)",
    label: "크라프트 노트",
  },
  gauguin: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(255,245,235,0.90)",    // 따뜻한 아이보리
    paperBorder: "rgba(200,150,100,0.30)",
    inkColor: "#3E2723",
    inkLight: "#8D6E63",
    paperShadowColor: "rgba(80,40,20,0.12)",
    label: "여행 스케치북",
  },
  poolside: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(240,248,255,0.90)",    // 밝은 풀사이드 블루
    paperBorder: "rgba(100,180,220,0.25)",
    inkColor: "#1A237E",                   // 진한 파랑 잉크
    inkLight: "#5C6BC0",
    paperShadowColor: "rgba(30,60,120,0.10)",
    label: "풀사이드 노트",
  },

  // ── 붓글씨 계열 ──
  ukiyo: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(255,252,245,0.93)",    // 화선지
    paperBorder: "rgba(160,140,110,0.25)",
    inkColor: "#1B1B1B",                   // 먹색
    inkLight: "#5D5D5D",
    paperShadowColor: "rgba(0,0,0,0.08)",
    label: "화선지",
  },
  neoexpress: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(255,250,240,0.88)",    // 거친 캔버스
    paperBorder: "rgba(120,100,80,0.35)",
    inkColor: "#1A1A1A",
    inkLight: "#555555",
    paperShadowColor: "rgba(0,0,0,0.15)",
    label: "스트리트 캔버스",
  },

  // ── 부드러운 둥근 필기 계열 ──
  monet: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(248,245,255,0.90)",    // 라벤더 종이
    paperBorder: "rgba(180,170,210,0.30)",
    inkColor: "#311B92",                   // 보라빛 잉크
    inkLight: "#7E57C2",
    paperShadowColor: "rgba(80,50,120,0.10)",
    label: "수채화 스케치북",
  },
  mucha: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(252,250,245,0.92)",    // 빈티지 크림
    paperBorder: "rgba(180,170,140,0.28)",
    inkColor: "#33691E",                   // 올리브 잉크
    inkLight: "#689F38",
    paperShadowColor: "rgba(40,60,20,0.10)",
    label: "아르누보 다이어리",
  },
  louiswain: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(245,255,245,0.90)",    // 연초록 종이
    paperBorder: "rgba(140,190,140,0.30)",
    inkColor: "#1B5E20",
    inkLight: "#4CAF50",
    paperShadowColor: "rgba(20,60,20,0.10)",
    label: "가든 노트",
  },

  // ── 볼드 마커 계열 ──
  popart: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(255,255,240,0.92)",    // 밝은 옐로우
    paperBorder: "rgba(220,50,50,0.30)",
    inkColor: "#B71C1C",                   // 빨간 마커
    inkLight: "#E53935",
    paperShadowColor: "rgba(180,20,20,0.12)",
    label: "팝 매거진 클리핑",
  },
  streetpop: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(240,248,255,0.90)",    // 쿨톤 화이트
    paperBorder: "rgba(66,165,245,0.30)",
    inkColor: "#0D47A1",
    inkLight: "#42A5F5",
    paperShadowColor: "rgba(13,71,161,0.12)",
    label: "아트토이 라벨",
  },

  // ── 클린/기하학 계열 → 필기체 없이 종이 텍스쳐만 ──
  klimt: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(255,250,230,0.92)",    // 금빛 노트
    paperBorder: "rgba(218,165,32,0.35)",
    inkColor: "#3E2723",
    inkLight: "#8D6E63",
    paperShadowColor: "rgba(100,80,20,0.12)",
    label: "금박 노트",
  },
  bauhaus: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(255,255,255,0.92)",    // 순백 그리드
    paperBorder: "rgba(229,57,53,0.25)",
    inkColor: "#212121",
    inkLight: "#616161",
    paperShadowColor: "rgba(0,0,0,0.10)",
    label: "그리드 노트",
  },
  synthwave: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(30,20,60,0.88)",       // 다크 네온 보드
    paperBorder: "rgba(255,64,129,0.35)",
    inkColor: "#E0E0FF",
    inkLight: "#FF4081",
    paperShadowColor: "rgba(255,64,129,0.15)",
    label: "네온 보드",
  },
  risograph: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(255,250,245,0.92)",    // 리소 용지
    paperBorder: "rgba(245,0,87,0.25)",
    inkColor: "#1A237E",                   // 리소 블루 잉크
    inkLight: "#F50057",
    paperShadowColor: "rgba(0,0,100,0.10)",
    label: "리소 프린트",
  },
  dblexposure: {
    fontFamily: "NanumPen",
    fontSizeScale: 1.15,
    paperBg: "rgba(240,240,240,0.85)",    // 필름 투명지
    paperBorder: "rgba(96,125,139,0.25)",
    inkColor: "#263238",
    inkLight: "#607D8B",
    paperShadowColor: "rgba(0,0,0,0.10)",
    label: "필름 노트",
  },
};

export function getNotebookStyle(artStyle: AllArtStyleKey): NotebookStyle {
  return NOTEBOOK_STYLES[artStyle] ?? NOTEBOOK_STYLES.default;
}

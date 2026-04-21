/**
 * AI 채팅 tool_use 로컬 실행기.
 *
 * 서버(app-gen /api/weather-ai)가 Claude에게 tool_use를 지시하면,
 * 클라이언트가 여기 정의된 executor로 로컬 데이터(AppState/WeatherBundle/recipients)를
 * 조회해 결과를 서버로 되돌려보냄.
 *
 * 모든 executor는 read-only. state-mutating은 기존 parseSettingsAction 플로우 유지.
 */

import type { AppState } from "@/context/WeatherContext";
import type { WeatherBundle } from "@/types/weather";
import type { Recipient } from "@/types/notify";
import type { AllArtStyleKey, AlertSettings } from "@/types/settings";
import type { SettingsAction } from "@/types/chat";
import { formatScheduleTime } from "@/types/notify";
import { getCommuteComparison } from "@/utils/recommendations";
import { getConditionLabel, getPm25Status, getUvStatus, getPollenStatus } from "@/utils/weather";
import { formatHour, formatDay } from "@/utils/date";
import { getYesterdayMax, getGameStats } from "@/services/predictionGameService";
import { getFeedbackStats } from "@/services/feedbackService";
import { ALL_STYLE_KEYS, FREE_STYLE_KEYS, PREMIUM_STYLE_KEYS, themeById } from "@/constants/themes";
import { logError } from "@/utils/logger";

export interface ProposedAction {
  action: SettingsAction;
  summary: string;
  route: string;
}

export interface ToolContext {
  state: AppState;
  bundle: WeatherBundle;
  recipients: Recipient[];
  artStyle: AllArtStyleKey;
  /** AI가 propose_settings_change로 제안한 설정 변경들. 대화 종료 후 cards로 렌더링. */
  proposedActions: ProposedAction[];
}

export type ToolExecutor = (input: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;

export const TOOL_EXECUTORS: Record<string, ToolExecutor> = {
  get_commute_comparison: async (_input, ctx) => {
    const c = getCommuteComparison(ctx.bundle.hourly, ctx.state.commuteTime.departure, ctx.state.commuteTime.return);
    if (!c) {
      return {
        available: false,
        departure: ctx.state.commuteTime.departure,
        return: ctx.state.commuteTime.return,
        note: "시간별 예보가 없어 비교 불가 — 시간 설정만 반환",
      };
    }
    return {
      departure: {
        time: ctx.state.commuteTime.departure,
        temp: c.departure.temp,
        feelsLike: c.departure.feelsLike,
        condition: getConditionLabel(c.departure.condition),
        precipitation: c.departure.precipitation,
      },
      return: {
        time: ctx.state.commuteTime.return,
        temp: c.returnTrip.temp,
        feelsLike: c.returnTrip.feelsLike,
        condition: getConditionLabel(c.returnTrip.condition),
        precipitation: c.returnTrip.precipitation,
      },
      tempDiff: c.tempDiff,
      needUmbrella: c.needUmbrella,
    };
  },

  get_hourly_forecast: async (input, ctx) => {
    const hours = Math.min(12, Math.max(1, Number(input.hours ?? 6)));
    return ctx.bundle.hourly.slice(0, hours).map((h) => ({
      time: formatHour(h.dt),
      temp: h.temp,
      feelsLike: h.feelsLike,
      condition: getConditionLabel(h.condition),
      precipitation: h.precipitation,
    }));
  },

  get_daily_forecast: async (input, ctx) => {
    const days = Math.min(7, Math.max(1, Number(input.days ?? 3)));
    return ctx.bundle.daily.slice(0, days).map((d) => {
      const { day, date } = formatDay(d.dt);
      return {
        day,
        date,
        tempMin: d.tempMin,
        tempMax: d.tempMax,
        condition: getConditionLabel(d.condition),
        precipitation: d.precipitation,
      };
    });
  },

  get_yesterday_comparison: async (_input, ctx) => {
    const yesterdayMax = await getYesterdayMax();
    const todayMax = ctx.bundle.daily[0]?.tempMax ?? null;
    if (yesterdayMax == null || todayMax == null) {
      return { available: false, note: "어제 데이터 없음" };
    }
    const diff = todayMax - yesterdayMax;
    return {
      yesterdayMax,
      todayMax,
      diff,
      description: diff > 0 ? `오늘이 ${Math.abs(diff)}° 따뜻` : diff < 0 ? `오늘이 ${Math.abs(diff)}° 추움` : "비슷",
    };
  },

  get_air_quality: async (_input, ctx) => {
    const { current, airQuality } = ctx.bundle;
    const uv = getUvStatus(current.uvIndex);
    const pollen = getPollenStatus(current.temp, current.humidity, current.windSpeed, current.condition);
    return {
      pm25: airQuality ? { value: airQuality.pm25, label: getPm25Status(airQuality.pm25).label } : null,
      pm10: airQuality?.pm10 ?? null,
      aqi: airQuality?.aqi ?? null,
      uv: { index: current.uvIndex, label: uv.label },
      pollen: { label: pollen.label, description: pollen.description },
    };
  },

  get_settings: async (_input, ctx) => {
    const { state } = ctx;
    return {
      alerts: state.alerts,
      commuteTime: state.commuteTime,
      tempUnit: state.tempUnit,
      clothingStyle: state.healthProfile.clothingStyle || null,
      exercisePreference: state.healthProfile.exercisePreference || null,
      allergens: state.healthProfile.allergens,
    };
  },

  get_recipients: async (_input, ctx) => {
    if (ctx.recipients.length === 0) return { count: 0, recipients: [] };
    return {
      count: ctx.recipients.length,
      recipients: ctx.recipients.map((r) => ({
        nickname: r.nickname,
        status: r.status,
        schedules: r.schedules.map(formatScheduleTime),
        inviteCode: r.status === "pending" ? r.inviteCode : null,
      })),
    };
  },

  get_game_stats: async () => {
    const stats = await getGameStats();
    return stats;
  },

  get_feedback_stats: async () => {
    return getFeedbackStats();
  },

  propose_settings_change: async (input, ctx) => {
    const actionType = input.action_type as string;
    const params = (input.params ?? {}) as Record<string, unknown>;
    const summary = (input.summary as string) ?? "설정 변경";

    const proposal = buildProposal(actionType, params, summary);
    if (!proposal) {
      return { recorded: false, error: `지원하지 않는 action_type: ${actionType}` };
    }
    ctx.proposedActions.push(proposal);
    return {
      recorded: true,
      summary: proposal.summary,
      note: "사용자에게 확인 카드가 표시됩니다. 짧은 안내 멘트와 함께 응답을 마무리하세요.",
    };
  },

  get_themes: async (input, ctx) => {
    const filter = (input.filter as string) ?? "all";
    const keys = filter === "free" ? FREE_STYLE_KEYS : filter === "premium" ? PREMIUM_STYLE_KEYS : ALL_STYLE_KEYS;
    const current = themeById(ctx.artStyle);
    return {
      current: current ? { id: current.id, name: current.name, isFree: current.isFree } : null,
      themes: keys.map((k) => {
        const t = themeById(k);
        return t ? { id: t.id, name: t.name, artist: t.artist, isFree: t.isFree } : null;
      }).filter(Boolean),
    };
  },
};

function buildProposal(
  actionType: string,
  params: Record<string, unknown>,
  summary: string,
): ProposedAction | null {
  switch (actionType) {
    case "SET_ALERT": {
      const key = params.key as keyof AlertSettings | undefined;
      const enabled = params.enabled;
      if (!key || typeof enabled !== "boolean") return null;
      return {
        action: { type: "SET_ALERT", key, enabled },
        summary,
        route: "/(tabs)/settings",
      };
    }
    case "SET_COMMUTE_TIME": {
      const departure = params.departure as string | undefined;
      const ret = params.return as string | undefined;
      if (!departure && !ret) return null;
      return {
        action: { type: "SET_COMMUTE_TIME", departure, return: ret },
        summary,
        route: "/edit-commute",
      };
    }
    case "SET_TEMP_UNIT": {
      const unit = params.unit;
      if (unit !== "C" && unit !== "F") return null;
      return {
        action: { type: "SET_TEMP_UNIT", unit },
        summary,
        route: "/edit-temp-unit",
      };
    }
    case "SET_LOCALE": {
      const locale = params.locale;
      if (locale !== "ko" && locale !== "en") return null;
      return {
        action: { type: "SET_LOCALE", locale },
        summary,
        route: "/edit-language",
      };
    }
    case "SET_CLOTHING_STYLE": {
      const style = params.style as string | undefined;
      if (!style) return null;
      return {
        action: { type: "SET_PROFILE", field: "clothingStyle", value: style },
        summary,
        route: "/edit-clothing",
      };
    }
    default:
      return null;
  }
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const exec = TOOL_EXECUTORS[name];
  if (!exec) return JSON.stringify({ error: `Unknown tool: ${name}` });
  try {
    const result = await exec(input, ctx);
    return JSON.stringify(result);
  } catch (e) {
    logError("ai-chat", e);
    return JSON.stringify({ error: e instanceof Error ? e.message : "execution failed" });
  }
}

/**
 * AI Service — 프록시 호출 + tool_use 루프 + 점진 공개
 *
 * 프록시: app-gen /api/weather-ai (Anthropic Claude Haiku 4.5)
 * 인증: API Key + Device ID + RevenueCat userId
 *
 * tool_use 플로우:
 *   1. 초기 메시지 전송 → 응답: stopReason === "tool_use" | "end_turn"
 *   2. tool_use면 aiTools.executeTool로 로컬 실행 → tool_result 블록으로 다음 턴 전송
 *   3. end_turn까지 최대 5회 반복
 */

import type { AIPrompt } from "@/types/chat";
import { logError } from "@/utils/logger";
import { t } from "@/i18n";
import { getOrCreateDeviceId } from "@/utils/deviceId";
import { executeTool, type ToolContext, type ProposedAction } from "./aiTools";

const API_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL ?? "";
const API_KEY = process.env.EXPO_PUBLIC_MALGEUM_AI_KEY ?? "";
const TIMEOUT_MS = 15_000;
const MAX_TOOL_TURNS = 5;

// ── Anthropic 스키마 (부분) ───────────────────────────────

type TextBlock = { type: "text"; text: string };
type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };
type AssistantBlock = TextBlock | ToolUseBlock;

type UserContent = string | ToolResultBlock[];
type Message =
  | { role: "user"; content: UserContent }
  | { role: "assistant"; content: AssistantBlock[] };

interface ProxyResponse {
  text: string;
  content: AssistantBlock[];
  stopReason: "end_turn" | "tool_use" | "max_tokens" | null;
  usage: { inputTokens: number; outputTokens: number };
}

type ProxyError = { error: string; status?: number };

function isProxyError(r: ProxyResponse | ProxyError): r is ProxyError {
  return (r as ProxyError).error !== undefined;
}

// ── 공통 fetch ────────────────────────────────────────────

async function callProxy(
  body: {
    system?: string;
    messages: Message[];
    intent?: string;
    useTools?: boolean;
  },
  rcUserId: string,
): Promise<ProxyResponse | ProxyError> {
  if (!API_URL) return { error: "API_URL not configured" };
  const deviceId = await getOrCreateDeviceId();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
        "X-Device-Id": deviceId,
        "X-RC-User-Id": rcUserId || "",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (res.status === 429) return { error: "rate_limit", status: 429 };
    if (!res.ok) return { error: `HTTP ${res.status}`, status: res.status };
    return (await res.json()) as ProxyResponse;
  } catch (e: unknown) {
    const isNetworkError = e instanceof TypeError && e.message === "Network request failed";
    const isAbort = e instanceof Error && e.name === "AbortError";
    if (!isNetworkError && !isAbort) logError("ai-chat", e);
    return { error: "network" };
  } finally {
    clearTimeout(timer);
  }
}

// ── AI 호출 ───────────────────────────────────────────────

export interface AskResult {
  text: string;
  fromFallback: boolean;
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>;
  proposedActions: ProposedAction[];
}

/**
 * tool_use 루프를 포함한 AI 호출. 사용자 질문 → AI가 필요시 tools 호출 →
 * 클라이언트가 로컬 실행 후 결과 반환 → 최종 텍스트.
 */
export async function askWeatherWithTools(
  prompt: AIPrompt,
  rcUserId: string,
  _isPremium: boolean,
  fallbackText: string,
  toolCtx: ToolContext,
): Promise<AskResult> {
  if (!API_URL) return { text: fallbackText, fromFallback: true, toolCalls: [], proposedActions: [] };

  // 멀티턴 유지: 이전 대화 히스토리 → 현재 질문 순으로 스택
  const historyMessages: Message[] = (prompt.history ?? [])
    .filter((h) => h.text.trim().length > 0)
    .map((h): Message =>
      h.role === "user"
        ? { role: "user", content: h.text }
        : { role: "assistant", content: [{ type: "text", text: h.text }] },
    );
  const messages: Message[] = [...historyMessages, { role: "user", content: prompt.userMessage }];
  const toolCalls: Array<{ name: string; input: Record<string, unknown> }> = [];

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await callProxy(
      { system: prompt.system, messages, intent: prompt.intent, useTools: true },
      rcUserId,
    );

    if (isProxyError(response)) {
      if (response.status === 429) return { text: t("ai.tryLater"), fromFallback: true, toolCalls, proposedActions: toolCtx.proposedActions };
      return { text: fallbackText, fromFallback: true, toolCalls, proposedActions: toolCtx.proposedActions };
    }

    if (response.stopReason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      const toolUses = response.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
      const results = await Promise.all(
        toolUses.map(async (block): Promise<ToolResultBlock> => {
          toolCalls.push({ name: block.name, input: block.input });
          const content = await executeTool(block.name, block.input, toolCtx);
          return { type: "tool_result", tool_use_id: block.id, content };
        }),
      );
      messages.push({ role: "user", content: results });
      continue;
    }

    // end_turn 또는 max_tokens
    return {
      text: response.text || fallbackText,
      fromFallback: !response.text,
      toolCalls,
      proposedActions: toolCtx.proposedActions,
    };
  }

  return { text: fallbackText, fromFallback: true, toolCalls, proposedActions: toolCtx.proposedActions };
}

// ── 점진 공개 (pseudo-streaming) ──────────────────────────────

interface RevealOptions {
  charsPerTick?: number;
  tickMs?: number;
}

export interface RevealHandle {
  cancel: () => void;
  done: Promise<void>;
}

export function revealProgressively(
  text: string,
  onChunk: (partial: string) => void,
  opts: RevealOptions = {},
): RevealHandle {
  const charsPerTick = opts.charsPerTick ?? 2;
  const tickMs = opts.tickMs ?? 22;
  let cancelled = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const done = new Promise<void>((resolve) => {
    if (text.length === 0) {
      onChunk("");
      resolve();
      return;
    }
    let i = 0;
    timer = setInterval(() => {
      if (cancelled) {
        if (timer) clearInterval(timer);
        resolve();
        return;
      }
      i = Math.min(i + charsPerTick, text.length);
      onChunk(text.slice(0, i));
      if (i >= text.length) {
        if (timer) clearInterval(timer);
        resolve();
      }
    }, tickMs);
  });

  return {
    cancel: () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    },
    done,
  };
}

export interface StreamCallbacks {
  onChunk: (partial: string) => void;
  onStart?: () => void;
}

export async function askWeatherStream(
  prompt: AIPrompt,
  rcUserId: string,
  isPremium: boolean,
  fallbackText: string,
  toolCtx: ToolContext,
  callbacks: StreamCallbacks,
): Promise<AskResult & { revealHandle: RevealHandle }> {
  const result = await askWeatherWithTools(prompt, rcUserId, isPremium, fallbackText, toolCtx);
  callbacks.onStart?.();
  const revealHandle = revealProgressively(result.text, callbacks.onChunk);
  return { ...result, revealHandle };
}

// ── 기능 활성화 여부 ──────────────────────────────────────

export function isAIChatEnabled(): boolean {
  return !!API_URL;
}

/**
 * 제휴 링크 유틸 — 유니클로 검색 URL + LinkPrice 클릭 래핑.
 *
 * LinkPrice 승인 후 대시보드에서 "클릭 URL"을 복사해
 * EXPO_PUBLIC_LINKPRICE_CLICK_TEMPLATE 에 넣는다. 타겟 URL 자리는 {url}.
 * 예: https://click.linkprice.com/click.php?m=abc&a=xyz&l=123&u={url}
 *
 * 템플릿이 없으면 유니클로 직접 URL로 동작 (개발/테스트 가능, 수익은 0).
 *
 * 열기 전략: in-app Safari View Controller (WebBrowser) 우선.
 * iOS 26+에서 Linking.openURL 이 유니버설링크 충돌로 실패하는 케이스 회피.
 */

import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { logError } from "@/utils/logger";

const UNIQLO_SEARCH_BASE = "https://www.uniqlo.com/kr/ko/search";
const LP_TEMPLATE = process.env.EXPO_PUBLIC_LINKPRICE_CLICK_TEMPLATE ?? "";

function buildUniqloSearchUrl(query: string): string {
  return `${UNIQLO_SEARCH_BASE}?q=${encodeURIComponent(query)}`;
}

function wrapWithLinkPrice(targetUrl: string): string {
  if (!LP_TEMPLATE.includes("{url}")) return targetUrl;
  return LP_TEMPLATE.replace("{url}", encodeURIComponent(targetUrl));
}

/** 유니클로 검색 제휴 URL 생성 */
export function buildAffiliateUrl(query: string): string {
  return wrapWithLinkPrice(buildUniqloSearchUrl(query));
}

/** 제휴 URL 열기 — in-app 브라우저 우선, 실패 시 시스템 브라우저 폴백 */
export async function openAffiliateLink(query: string): Promise<void> {
  const url = buildAffiliateUrl(query);
  try {
    await WebBrowser.openBrowserAsync(url, { toolbarColor: "#0F172A" });
  } catch (e) {
    try {
      await Linking.openURL(url);
    } catch (e2) {
      logError("general", e2);
    }
  }
}

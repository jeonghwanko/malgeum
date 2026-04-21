/** HTTP → HTTPS 변환 (iOS ATS 대응) */
export function toHttps(url?: string): string | undefined {
  return url?.replace(/^http:\/\//i, "https://");
}

/** XML/HTML 엔티티 디코딩 (캐시된 데이터 대응) */
export function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

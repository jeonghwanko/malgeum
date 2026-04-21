/**
 * festivalService 테스트
 * - formatFestivalPeriod 포맷
 * - 거리 필터/정렬 로직 (haversineKm 기반)
 * - API 응답 파싱
 */
import { formatFestivalPeriod } from "@/services/festivalService";
import { haversineKm, shortAddr, dateCompact } from "@/utils/geo";

describe("formatFestivalPeriod", () => {
  it("시작~종료 포맷", () => {
    expect(formatFestivalPeriod("20260412", "20260417")).toBe("4/12~4/17");
  });

  it("같은 날이면 시작만", () => {
    expect(formatFestivalPeriod("20260412", "20260412")).toBe("4/12");
  });

  it("종료 없으면 시작만", () => {
    expect(formatFestivalPeriod("20260412", "")).toBe("4/12");
  });

  it("시작 없으면 빈 문자열", () => {
    expect(formatFestivalPeriod("", "")).toBe("");
  });

  it("1월 앞자리 0 제거", () => {
    expect(formatFestivalPeriod("20260101", "20260103")).toBe("1/1~1/3");
  });
});

describe("haversineKm (거리 계산)", () => {
  it("서울 강남 → 서울 종로 (약 10km 이내)", () => {
    const dist = haversineKm(37.497, 127.028, 37.572, 126.977);
    expect(dist).toBeGreaterThan(5);
    expect(dist).toBeLessThan(15);
  });

  it("서울 → 부산 (약 325km)", () => {
    const dist = haversineKm(37.5, 127.0, 35.1, 129.0);
    expect(dist).toBeGreaterThan(300);
    expect(dist).toBeLessThan(400);
  });

  it("같은 좌표면 0", () => {
    expect(haversineKm(37.5, 127.0, 37.5, 127.0)).toBe(0);
  });
});

describe("shortAddr", () => {
  it("시/구까지만 잘라냄", () => {
    expect(shortAddr("서울특별시 종로구 사직로 161")).toBe("서울특별시 종로구");
  });

  it("짧은 주소는 그대로", () => {
    expect(shortAddr("서울특별시")).toBe("서울특별시");
  });

  it("빈 주소", () => {
    expect(shortAddr("")).toBe("");
  });
});

describe("dateCompact", () => {
  it("Date → YYYYMMDD", () => {
    expect(dateCompact(new Date(2026, 3, 18))).toBe("20260418");
  });

  it("1월은 01로 패딩", () => {
    expect(dateCompact(new Date(2026, 0, 5))).toBe("20260105");
  });
});

describe("축제 거리 필터 로직", () => {
  // festivalService 내부의 클라이언트 필터 로직을 재현
  const RADIUS_KM = 50;

  function filterByDistance(
    userLat: number,
    userLon: number,
    items: Array<{ mapx: string; mapy: string; title: string }>,
  ) {
    return items
      .map((item) => {
        const fmapX = Number(item.mapx);
        const fmapY = Number(item.mapy);
        const distKm = haversineKm(userLat, userLon, fmapY, fmapX);
        return { title: item.title, dist: Math.round(distKm * 1000) };
      })
      .filter((f) => f.dist <= RADIUS_KM * 1000)
      .sort((a, b) => a.dist - b.dist);
  }

  it("50km 이내 축제만 필터", () => {
    const items = [
      { mapx: "127.028", mapy: "37.497", title: "강남 축제" },       // ~0km
      { mapx: "126.977", mapy: "37.572", title: "종로 축제" },       // ~10km
      { mapx: "129.0", mapy: "35.1", title: "부산 축제" },          // ~325km
    ];
    const result = filterByDistance(37.497, 127.028, items);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("강남 축제");
    expect(result[1].title).toBe("종로 축제");
  });

  it("거리순 정렬", () => {
    const items = [
      { mapx: "127.5", mapy: "37.5", title: "먼 축제" },
      { mapx: "127.01", mapy: "37.5", title: "가까운 축제" },
    ];
    const result = filterByDistance(37.5, 127.0, items);
    expect(result[0].title).toBe("가까운 축제");
  });

  it("50km 밖은 제외", () => {
    const items = [
      { mapx: "129.0", mapy: "35.1", title: "부산" },
    ];
    const result = filterByDistance(37.5, 127.0, items);
    expect(result).toHaveLength(0);
  });
});

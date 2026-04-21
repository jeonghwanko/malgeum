import { todayKey, formatHour, formatDay, isNighttime, timeAgo, getGreeting, getTimeOfDay, isStaleData } from "../utils/date";

// ─── todayKey ───

describe("todayKey", () => {
  it("returns YYYY-MM-DD format", () => {
    const key = todayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches current date", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(todayKey()).toBe(expected);
  });
});

// ─── formatHour ───

describe("formatHour", () => {
  it("midnight → 자정", () => {
    // 2024-01-01 00:00 UTC+9
    const dt = new Date(2024, 0, 1, 0, 0).getTime() / 1000;
    expect(formatHour(dt)).toBe("자정");
  });

  it("noon → 정오", () => {
    const dt = new Date(2024, 0, 1, 12, 0).getTime() / 1000;
    expect(formatHour(dt)).toBe("정오");
  });

  it("other hours → N시", () => {
    const dt = new Date(2024, 0, 1, 15, 0).getTime() / 1000;
    expect(formatHour(dt)).toBe("15시");
  });

  it("morning hour", () => {
    const dt = new Date(2024, 0, 1, 8, 30).getTime() / 1000;
    expect(formatHour(dt)).toBe("8시");
  });
});

// ─── formatDay ───

describe("formatDay", () => {
  it("today returns 오늘", () => {
    const dt = Math.floor(Date.now() / 1000);
    const result = formatDay(dt);
    expect(result.day).toBe("오늘");
    expect(result.isToday).toBe(true);
  });

  it("tomorrow returns 내일", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const dt = Math.floor(tomorrow.getTime() / 1000);
    const result = formatDay(dt);
    expect(result.day).toBe("내일");
    expect(result.isToday).toBe(false);
  });

  it("other days return 요일", () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    future.setHours(12, 0, 0, 0);
    const dt = Math.floor(future.getTime() / 1000);
    const result = formatDay(dt);
    expect(["일", "월", "화", "수", "목", "금", "토"]).toContain(result.day);
    expect(result.isToday).toBe(false);
  });

  it("date field is M/D format", () => {
    const dt = Math.floor(Date.now() / 1000);
    const result = formatDay(dt);
    expect(result.date).toMatch(/^\d{1,2}\/\d{1,2}$/);
  });
});

// ─── isNighttime ───

describe("isNighttime", () => {
  it("returns true before sunrise", () => {
    const now = Math.floor(Date.now() / 1000);
    const sunrise = now + 3600; // 1시간 후 일출
    const sunset = now + 36000;
    expect(isNighttime(sunrise, sunset)).toBe(true);
  });

  it("returns true after sunset", () => {
    const now = Math.floor(Date.now() / 1000);
    const sunrise = now - 36000;
    const sunset = now - 3600; // 1시간 전 일몰
    expect(isNighttime(sunrise, sunset)).toBe(true);
  });

  it("returns false during daytime", () => {
    const now = Math.floor(Date.now() / 1000);
    const sunrise = now - 3600; // 1시간 전 일출
    const sunset = now + 3600; // 1시간 후 일몰
    expect(isNighttime(sunrise, sunset)).toBe(false);
  });
});

// ─── timeAgo ───

describe("timeAgo", () => {
  it("returns null for null input", () => {
    expect(timeAgo(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(timeAgo("")).toBeNull();
  });

  it("returns null for future timestamp", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(timeAgo(future)).toBeNull();
  });

  it("returns '방금 업데이트' for < 1 min ago", () => {
    const justNow = new Date(Date.now() - 30_000).toISOString(); // 30초 전
    expect(timeAgo(justNow)).toBe("방금 업데이트");
  });

  it("returns 'N분 전 업데이트' for minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5분 전 업데이트");
  });

  it("returns '59분 전 업데이트' at boundary", () => {
    const almostHour = new Date(Date.now() - 59 * 60_000).toISOString();
    expect(timeAgo(almostHour)).toBe("59분 전 업데이트");
  });

  it("returns 'N시간 전 업데이트' for hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600_000).toISOString();
    expect(timeAgo(twoHoursAgo)).toBe("2시간 전 업데이트");
  });

  it("returns '1시간 전 업데이트' at exactly 60 min", () => {
    const oneHour = new Date(Date.now() - 60 * 60_000).toISOString();
    expect(timeAgo(oneHour)).toBe("1시간 전 업데이트");
  });
});

// ─── getGreeting ───

describe("getGreeting", () => {
  it("returns an object with text and emoji", () => {
    const result = getGreeting();
    expect(result).toHaveProperty("text");
    expect(result).toHaveProperty("emoji");
    expect(typeof result.text).toBe("string");
    expect(typeof result.emoji).toBe("string");
  });

  it("text is non-empty string", () => {
    expect(getGreeting().text.length).toBeGreaterThan(0);
  });

  it("emoji is non-empty string", () => {
    expect(getGreeting().emoji.length).toBeGreaterThan(0);
  });
});

// ─── getTimeOfDay ───

describe("getTimeOfDay", () => {
  it("returns one of the valid time-of-day values", () => {
    const valid = ["dawn", "morning", "afternoon", "evening", "night"];
    expect(valid).toContain(getTimeOfDay());
  });
});

// ─── isStaleData ───

describe("isStaleData", () => {
  it("returns true for null (데이터 없음 = stale)", () => {
    expect(isStaleData(null)).toBe(true);
  });

  it("returns false for fresh data", () => {
    const now = new Date().toISOString();
    expect(isStaleData(now, 60_000)).toBe(false);
  });

  it("returns true for data older than threshold", () => {
    const old = new Date(Date.now() - 2 * 60_000).toISOString(); // 2분 전
    expect(isStaleData(old, 60_000)).toBe(true); // threshold 1분
  });

  it("uses 30min default threshold", () => {
    const fresh = new Date(Date.now() - 10 * 60_000).toISOString(); // 10분 전
    expect(isStaleData(fresh)).toBe(false);

    const old = new Date(Date.now() - 31 * 60_000).toISOString(); // 31분 전
    expect(isStaleData(old)).toBe(true);
  });
});

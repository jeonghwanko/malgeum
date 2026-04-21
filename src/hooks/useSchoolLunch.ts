/**
 * 급식 식단 훅
 * schoolSettings이 있을 때만 오늘 급식을 조회 — 하루 1회 캐시
 */
import { useCallback, useEffect, useState } from "react";
import { fetchSchoolLunch, type SchoolLunchMenu } from "@/services/kskillProxy";
import { loadJson, saveJson, STORAGE_KEYS } from "@/utils/storage";
import { todayKey } from "@/utils/date";
import type { SchoolSettings } from "@/types/settings";

interface CachedLunch {
  date: string;
  menus: SchoolLunchMenu[];
}

const CACHE_KEY = STORAGE_KEYS.SCHOOL_LUNCH ?? "@malgeum/school_lunch";

export function useSchoolLunch(school: SchoolSettings | null) {
  const [menus, setMenus] = useState<SchoolLunchMenu[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!school) {
      setMenus([]);
      return;
    }
    setLoading(true);
    try {
      const today = todayKey();
      // 캐시 확인
      const cached = await loadJson<CachedLunch | null>(CACHE_KEY, null);
      if (cached && cached.date === today && cached.menus.length > 0) {
        setMenus(cached.menus);
        setLoading(false);
        return;
      }
      // API 호출
      const mealDate = today.replace(/-/g, ""); // "YYYYMMDD"
      const data = await fetchSchoolLunch(
        school.educationOfficeCode,
        school.schoolCode,
        mealDate,
      );
      setMenus(data);
      await saveJson(CACHE_KEY, { date: today, menus: data });
    } finally {
      setLoading(false);
    }
  }, [school]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { menus, loading, refresh };
}

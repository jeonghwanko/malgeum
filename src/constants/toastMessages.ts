import { t } from "@/i18n";

export const TOAST = {
  // 테마
  THEME_CHANGED: (name: string) => t("toast.themeChanged", { name }),
  THEME_AUTO_RESTORED: t("toast.themeAutoRestored"),

  // 알림
  ALERT_ON: (title: string, time?: string) =>
    time ? t("toast.alertOnWithTime", { title, time }) : t("toast.alertOn", { title }),
  ALERT_OFF: (title: string) => t("toast.alertOff", { title }),

  // 위치
  LOCATION_ADDED: (name: string) => t("toast.locationAdded", { name }),
  LOCATION_SELECTED: (name: string) => t("toast.locationSelected", { name }),
  LOCATION_REMOVED: t("toast.locationRemoved"),

  // 출퇴근
  COMMUTE_SAVED: t("toast.commuteSaved"),

  // 온도 단위
  TEMP_UNIT_CHANGED: (unit: string) => t("toast.tempUnitChanged", { unit }),

  // 건강 프로필
  ALLERGEN_ADDED: (name: string) => t("toast.allergenAdded", { name }),
  ALLERGEN_REMOVED: (name: string) => t("toast.allergenRemoved", { name }),
  EXERCISE_CHANGED: (name: string) => t("toast.exerciseChanged", { name }),
  CLOTHING_CHANGED: (name: string) => t("toast.clothingChanged", { name }),

  // 지하철
  SUBWAY_SAVED: (name: string) => t("toast.subwaySaved", { name }),
  SUBWAY_CLEARED: t("toast.subwayCleared"),

  // 급식
  SCHOOL_SAVED: (name: string) => t("toast.schoolSaved", { name }),
  SCHOOL_CLEARED: t("toast.schoolCleared"),
} as const;

export type PredictionChoice = "higher" | "lower";
export type PredictionResult = "win" | "lose" | "tie";

export interface PredictionEntry {
  date: string;              // "2026-04-09" — 예측한 날
  targetDate: string;        // "2026-04-10" — 정답이 결정될 날
  baseMax: number;           // 예측 시점에 락된 오늘 최고기온
  choice: PredictionChoice;
  // 정산 후 채워짐
  actualMax?: number;        // targetDate의 실측 최고기온 (어제가 된 후 WEEKLY_MAX 조회)
  result?: PredictionResult;
  settledAt?: string;
}

export interface GameStats {
  weekWins: number;
  weekLosses: number;
  totalWins: number;
  totalLosses: number;
  totalTies: number;
  winRate: number;
  bestStreak: number;
  currentStreak: number;
  dailyStreak: number;
}

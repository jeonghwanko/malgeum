import type { StatusLevel } from "@/constants/colors";
import type { WeatherCondition } from "./weather";

export type CardCategory =
  | "umbrella"
  | "clothing"
  | "outdoor"
  | "health"
  | "commute"
  | "lifestyle";

export type CardTier = "urgent" | "action" | "info";

export interface ActionCard {
  id: string;
  category: CardCategory;
  icon: string;
  illustration?: string;
  title: string;
  description: string;
  badge?: string;
  status: StatusLevel;
  priority: number;
  tier: CardTier;
  condition?: WeatherCondition;
}

export interface AlertSettings {
  commute: boolean;
  rain: boolean;
  dust: boolean;
  uv: boolean;
  pollen: boolean;
  evening: boolean;
  game: boolean;
}

export type DiscoverInterest = "performance-festival" | "camping";

export interface HealthProfile {
  allergens: string[];
  exercisePreference: string;
  clothingStyle: string;
  discoverInterests?: DiscoverInterest[];
}

export interface CommuteSettings {
  departure: string; // "08:00"
  return: string; // "18:00"
  subwayStation?: string; // "강남" — 지하철 도착정보 조회용
}

export interface SchoolSettings {
  educationOfficeCode: string;
  schoolCode: string;
  schoolName: string;
}

export type TempUnit = "C" | "F";
export type ArtStyleKey =
  | "vangogh"
  | "monet"
  | "klimt"
  | "gauguin"
  | "popart"
  | "bauhaus"
  | "ukiyo";

export type PremiumArtStyleKey =
  | "mucha"
  | "synthwave"
  | "neoexpress"
  | "poolside"
  | "risograph"
  | "dblexposure"
  | "streetpop"
  | "louiswain";

export type AllArtStyleKey = ArtStyleKey | PremiumArtStyleKey | "default";

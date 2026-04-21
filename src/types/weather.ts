export type WeatherCondition =
  | "clear"
  | "clouds"
  | "rain"
  | "drizzle"
  | "thunderstorm"
  | "snow"
  | "fog"
  | "dust";

export type AirGrade =
  | "good"
  | "moderate"
  | "unhealthy"
  | "veryUnhealthy"
  | "hazardous";

export type TextureWeatherKey =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "dusty"
  | "stormy";

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
  uvIndex: number;
  precipitation: number;
  sunrise: number;
  sunset: number;
}

export interface HourlyWeather {
  dt: number;
  temp: number;
  feelsLike: number;
  condition: WeatherCondition;
  precipitation: number;
  icon: string;
}

export interface DailyWeather {
  dt: number;
  tempMin: number;
  tempMax: number;
  condition: WeatherCondition;
  precipitation: number;
}

export interface AirQuality {
  pm25: number;
  pm10: number;
  aqi: number;
  grade: AirGrade;
}

export interface HourlyAirQuality {
  dt: number;
  pm25: number;
  pm10: number;
}

export interface HourlyUv {
  dt: number;
  uvIndex: number;
}

export interface PollenData {
  score: number;         // 0~10
  label: string;         // "낮음" | "보통" | "높음" | "매우 높음"
  description: string;   // "안전", "알레르기 주의" 등
  grade: "low" | "moderate" | "high" | "veryHigh";
}

export interface WeatherBundle {
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  airQuality: AirQuality | null;
  hourlyAir: HourlyAirQuality[];
  hourlyUv: HourlyUv[];
  pollen: PollenData | null;
  fetchedAt: number;
  yesterdayActualMax?: number;
}

export interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  isGps: boolean;
}

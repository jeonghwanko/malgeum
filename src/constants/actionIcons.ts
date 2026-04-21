import type { ComponentType } from "react";
import {
  Barbell,
  Car,
  CoatHanger,
  Heart,
  IconProps,
  MaskHappy,
  PersonSimpleRun,
  PersonSimpleWalk,
  PicnicTable,
  Question,
  Sun,
  TShirt,
  Umbrella,
  Wind,
} from "phosphor-react-native";

/**
 * SSOT: ActionCard `icon` key → flat vector icon component.
 *
 * Uses Phosphor icons for consistent rendering across iOS/Android
 * (emojis vary by OS and don't match the minimal aesthetic).
 *
 * Keep this map in sync with the `icon` values returned by
 * `generateActionCards` in `src/utils/recommendations.ts`.
 */
export const ACTION_ICON_MAP: Record<string, ComponentType<IconProps>> = {
  tshirt: TShirt,
  laundry: TShirt,
  run: PersonSimpleRun,
  running: PersonSimpleRun,
  walk: PersonSimpleWalk,
  carwash: Car,
  sunscreen: Sun,
  umbrella: Umbrella,
  jacket: CoatHanger,
  padded: CoatHanger,
  dumbbell: Barbell,
  mask: MaskHappy,
  picnic: PicnicTable,
  ventilation: Wind,
  date: Heart,
};

/** Fallback icon component for unrecognized keys. */
export const ActionIconFallback: ComponentType<IconProps> = Question;

export function getActionIcon(iconKey: string): ComponentType<IconProps> {
  return ACTION_ICON_MAP[iconKey] ?? ActionIconFallback;
}

import {
  DEFAULT_COACH_MEDIA,
  parseCoachMedia,
  type CoachMedia,
} from "@/lib/coach-media";
import {
  DEFAULT_PAYMENT_SETTINGS,
  parsePaymentSettings,
  type PaymentSettings,
} from "@/lib/payment";
import { redis } from "./redis";

const COACH_MEDIA = "mf:site:coach-media";
const PAYMENT = "mf:site:payment";

export async function getCoachMedia(): Promise<CoachMedia> {
  const raw = await redis<unknown>("GET", COACH_MEDIA);

  if (typeof raw !== "string") return DEFAULT_COACH_MEDIA;

  try {
    const parsed = parseCoachMedia(JSON.parse(raw));

    // A stored value that no longer validates falls back to the photo
    // rather than breaking the section.
    return parsed.ok ? parsed.value : DEFAULT_COACH_MEDIA;
  } catch {
    return DEFAULT_COACH_MEDIA;
  }
}

export async function setCoachMedia(media: CoachMedia) {
  await redis("SET", COACH_MEDIA, JSON.stringify(media));

  return media;
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const raw = await redis<unknown>("GET", PAYMENT);

  if (typeof raw !== "string") return DEFAULT_PAYMENT_SETTINGS;

  try {
    const parsed = parsePaymentSettings(JSON.parse(raw));

    // A stored value that no longer validates switches payments off rather
    // than showing a visitor details that might be wrong.
    return parsed.ok ? parsed.value : DEFAULT_PAYMENT_SETTINGS;
  } catch {
    return DEFAULT_PAYMENT_SETTINGS;
  }
}

export async function setPaymentSettings(settings: PaymentSettings) {
  await redis("SET", PAYMENT, JSON.stringify(settings));

  return settings;
}

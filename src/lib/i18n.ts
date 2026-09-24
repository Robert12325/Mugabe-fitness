"use client";

import { useSyncExternalStore } from "react";

/**
 * English and Hindi for everything the site says in its own voice.
 *
 * What the coach types in the dashboard — program names, prices, features,
 * method steps — is shown exactly as entered and never translated here.
 *
 * The chosen language is remembered. With no choice saved, a phone set to
 * Hindi opens in Hindi.
 */

export type Lang = "en" | "hi";

const STORAGE_KEY = "mugabe-lang";

const EN = {
  "lang.switch": "Language",
  "lang.en": "EN",
  "lang.hi": "हिं",

  "nav.home": "Home",
  "nav.programs": "Programs",
  "nav.method": "Method",
  "nav.coach": "Coach",
  "nav.login": "Log in",
  "nav.account": "My account",
  "nav.start": "Start Training",
  "nav.open": "Open navigation",
  "nav.close": "Close navigation",

  "hero.become": "Become",
  "hero.stronger": "Stronger.",
  "hero.lede":
    "Personal coaching built to help you train with purpose, build strength, transform your physique, and become the strongest version of yourself.",
  "hero.cta": "Start Your Transformation",
  "hero.method": "Discover The Method",
  "hero.f1.top": "Personalized",
  "hero.f1.bottom": "Coaching",
  "hero.f2.top": "Real",
  "hero.f2.bottom": "Results",
  "hero.f3.top": "Sustainable",
  "hero.f3.bottom": "Progress",
  "hero.f4.top": "Stronger",
  "hero.f4.bottom": "You",
  "hero.photoAlt": "Your coach at Mugabe Fitness",

  "footer.explore": "Explore",
  "footer.getStarted": "Get started",
  "footer.reach": "Reach me",
  "footer.theMethod": "The Method",
  "footer.yourCoach": "Your Coach",
  "footer.howToStart": "How to start",
  "footer.book": "Book a program",
  "footer.whatsapp": "Message on WhatsApp",
  "footer.blurb":
    "Personal coaching built to help you train with purpose and become the strongest version of yourself.",
  "footer.rights": "All rights reserved.",
  "footer.motto": "Rise · Grind · Shine",
  "footer.admin": "Admin",

  "install.title": "Add Mugabe Fitness to your home screen",
  "install.ios": "Tap Share, then Add to Home Screen.",
  "install.android": "Opens full screen, like an app.",
  "install.action": "Install",
  "install.dismiss": "Not now",
} as const;

export type StringKey = keyof typeof EN;

const HI: Record<StringKey, string> = {
  "lang.switch": "भाषा",
  "lang.en": "EN",
  "lang.hi": "हिं",

  "nav.home": "होम",
  "nav.programs": "प्रोग्राम",
  "nav.method": "तरीका",
  "nav.coach": "कोच",
  "nav.login": "लॉग इन",
  "nav.account": "मेरा अकाउंट",
  "nav.start": "ट्रेनिंग शुरू करें",
  "nav.open": "मेन्यू खोलें",
  "nav.close": "मेन्यू बंद करें",

  "hero.become": "बनिए",
  "hero.stronger": "और मज़बूत।",
  "hero.lede":
    "ऐसी पर्सनल कोचिंग जो आपको सही तरीके से ट्रेनिंग करने, ताकत बढ़ाने, बॉडी बदलने और खुद का सबसे मज़बूत रूप बनने में मदद करती है।",
  "hero.cta": "अपना बदलाव शुरू करें",
  "hero.method": "तरीका जानिए",
  "hero.f1.top": "पर्सनल",
  "hero.f1.bottom": "कोचिंग",
  "hero.f2.top": "असली",
  "hero.f2.bottom": "नतीजे",
  "hero.f3.top": "टिकाऊ",
  "hero.f3.bottom": "प्रगति",
  "hero.f4.top": "मज़बूत",
  "hero.f4.bottom": "आप",
  "hero.photoAlt": "Mugabe Fitness में आपके कोच",

  "footer.explore": "देखें",
  "footer.getStarted": "शुरू करें",
  "footer.reach": "संपर्क करें",
  "footer.theMethod": "तरीका",
  "footer.yourCoach": "आपके कोच",
  "footer.howToStart": "कैसे शुरू करें",
  "footer.book": "प्रोग्राम बुक करें",
  "footer.whatsapp": "WhatsApp पर मैसेज करें",
  "footer.blurb":
    "पर्सनल कोचिंग, जो आपको सही तरीके से ट्रेनिंग करने और खुद का सबसे मज़बूत रूप बनने में मदद करे।",
  "footer.rights": "सर्वाधिकार सुरक्षित।",
  "footer.motto": "उठो · मेहनत करो · चमको",
  "footer.admin": "एडमिन",

  "install.title": "Mugabe Fitness को होम स्क्रीन पर जोड़ें",
  "install.ios": "Share दबाएँ, फिर Add to Home Screen चुनें।",
  "install.android": "ऐप की तरह पूरी स्क्रीन पर खुलता है।",
  "install.action": "इंस्टॉल करें",
  "install.dismiss": "अभी नहीं",
};

const DICTIONARIES: Record<Lang, Record<StringKey, string>> = {
  en: EN,
  hi: HI,
};

/* ------------------------------------------------------------------ */
/* Which language is in use                                            */
/* ------------------------------------------------------------------ */

let lang: Lang | null = null;
const listeners = new Set<() => void>();

function detect(): Lang {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved === "en" || saved === "hi") return saved;
  } catch {
    // Storage blocked: fall through to the phone setting.
  }

  const preferred = window.navigator.languages ?? [window.navigator.language];

  return preferred.some((tag) => tag?.toLowerCase().startsWith("hi"))
    ? "hi"
    : "en";
}

/** Cached, because useSyncExternalStore calls this on every render and needs
 *  the same answer each time. */
function readLang(): Lang {
  if (lang === null) lang = detect();

  return lang;
}

export function setLang(next: Lang) {
  lang = next;

  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // The choice simply will not survive a reload.
  }

  for (const listener of listeners) listener();
}

export function subscribeLang(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getLangOnServer(): Lang {
  // The server has no way to know, so it renders English and the browser
  // swaps to Hindi after hydration — same markup on both sides.
  return "en";
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, readLang, getLangOnServer);
}

/** `const t = useT()` then `t("nav.home")`. */
export function useT() {
  const current = useLang();

  return (key: StringKey) => DICTIONARIES[current][key] ?? EN[key];
}

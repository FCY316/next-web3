import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";
import zh from "./zh-CN.json";
import en from "./en.json";
import ko from "./ko.json";
import ja from "./ja.json";
const messages: Record<Locale, typeof zh> = { "zh-CN": zh, en, ko, ja };

// Store 中的提示也跟随当前页面语言，不依赖服务端翻译工具。
export function getWalletMessages(locale?: Locale) {
  const lang = locale ?? (typeof document === "undefined" ? defaultLocale : document.documentElement.lang);
  return messages[isLocale(lang) ? lang : defaultLocale];
}

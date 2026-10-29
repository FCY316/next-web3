// 语言代码同时用于 URL 和 HTML lang；新增语言时同步添加词典及加载器。
export const locales = ["zh-CN", "en", "ko", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh-CN";
export const languageNames: Record<Locale, string> = {
  "zh-CN": "中文", en: "English", ko: "한국어", ja: "日本語",
};

// 路由参数来自 URL，先校验再读取词典，避免访问不存在的语言。
export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale } from "./i18n";
import type { Locale } from "./i18n";
import type chinese from "@/messages/zh-CN.json";

// 所有词典遵循相同结构；按当前语言加载，不把全部文案传给浏览器。
type Dictionary = { [Key in keyof typeof chinese]: string };
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  "zh-CN": () => import("@/messages/zh-CN.json").then((m) => m.default),
  en: () => import("@/messages/en.json").then((m) => m.default),
  ko: () => import("@/messages/ko.json").then((m) => m.default),
  ja: () => import("@/messages/ja.json").then((m) => m.default),
};
// 从根路由参数统一读取并校验语言；页面无需重复写 notFound 校验。
// 仅供服务端组件及其渲染工具调用，客户端、Server Action 和接口路由不可使用。
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!isLocale(locale)) notFound();
  return locale;
}

// 按当前 URL 语言加载文案，页面直接 await getTranslations() 即可。
export async function getTranslations() {
  return dictionaries[await getLocale()]();
}

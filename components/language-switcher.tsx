"use client";

import { usePathname } from "next/navigation";
import Link from "@/components/link";
import { languageNames, locales, type Locale } from "@/lib/i18n";

/** 共用语言入口：替换当前语言前缀，切换后仍停留在当前业务页面。 */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const suffix = pathname.replace(/^\/[^/]+/, "");
  return (
    <nav aria-label={label} className="flex flex-wrap gap-4 text-sm">
      {locales.map((language) => (
        <Link key={language} href={`/${language}${suffix}`} hrefLang={language} prefetch={false}
          aria-current={language === locale ? "page" : undefined}
          className="underline underline-offset-4 aria-[current=page]:font-bold">
          {languageNames[language]}
        </Link>
      ))}
    </nav>
  );
}

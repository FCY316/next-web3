import Link from "@/components/link";
import { getLocale, getTranslations } from "@/lib/dictionaries";
import { languageNames, locales } from "@/lib/i18n";
export default async function MyPage() {
  // 工具函数已统一校验语言，不必在每个页面重复调用 notFound。
  const lang = await getLocale();
  const dict = await getTranslations();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-20">
      {/* 切换语言时保留 /my 路径；关闭预加载，避免影响语言偏好。 */}
      <nav aria-label={dict.switchLanguage} className="flex flex-wrap gap-4 text-sm">
        {locales.map((locale) => (
          <Link key={locale} href={`/${locale}/my`} hrefLang={locale} prefetch={false}
            aria-current={locale === lang ? "page" : undefined}
            className="underline underline-offset-4 aria-[current=page]:font-bold">
            {languageNames[locale]}
          </Link>
        ))}
      </nav>
      <h1 className="text-4xl font-semibold tracking-tight">{dict.myTitle}</h1>
      <p className="text-lg leading-8 text-zinc-500">{dict.myDescription}</p>
      {/* 站内链接携带当前语言，返回首页时保持语言一致。 */}
      <Link href="/" className="w-fit underline underline-offset-4">
        {dict.backHome}
      </Link>
    </main>
  );
}

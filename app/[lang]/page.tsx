import Link from "@/components/link";
import { getLocale, getTranslations } from "@/lib/dictionaries";
import { languageNames, locales } from "@/lib/i18n";

// 页面文案统一来自词典，业务开发时避免直接写入某一种语言。
export default async function Home() {
  const lang = await getLocale();
  const dict = await getTranslations();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-20">
      <nav aria-label={dict.switchLanguage} className="flex flex-wrap gap-4 text-sm">
        {locales.map((locale) => (
          <Link key={locale} href={`/${locale}`} hrefLang={locale} prefetch={false}
            aria-current={locale === lang ? "page" : undefined}
            className="underline underline-offset-4 aria-[current=page]:font-bold">
            {languageNames[locale]}
          </Link>
        ))}
      </nav>
      <p className="text-sm font-medium tracking-widest text-zinc-500">{dict.eyebrow}</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{dict.name}</h1>
      <p className="max-w-xl text-lg leading-8 text-zinc-500">{dict.description}</p>
      <Link href="/my" className="w-fit underline underline-offset-4">
        {dict.myLink}
      </Link>
      <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="font-medium">{dict.heading}</h2>
        <p className="mt-3 leading-7 text-zinc-500">{dict.instructions}</p>
      </div>
    </main>
  );
}

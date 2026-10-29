import type { Metadata } from "next";
import { getLocale, getTranslations } from "@/lib/dictionaries";
import { locales } from "@/lib/i18n";
import { Web3Provider } from "@/modules/web3/providers/web3-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "../globals.css";

// 预生成支持的语言；未知语言返回 404。
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getTranslations();
  return {
    title: { default: dict.name, template: `%s | ${dict.name}` },
    description: dict.description,
  };
}

// 根布局随语言设置 HTML lang，供浏览器、读屏工具识别。
export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await getLocale();
  return (
    <html lang={lang} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Web3Provider locale={lang}>
          <Header locale={lang} />
          {children}
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}

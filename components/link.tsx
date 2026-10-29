"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import type { ComponentProps } from "react";
import { defaultLocale, isLocale } from "@/lib/i18n";

type Props = Omit<ComponentProps<typeof NextLink>, "href"> & { href: string };

// 服务端页面和客户端组件均可引用：普通站内路径自动补当前语言。
// 使用根路径（例如 /my）；外链、锚点、查询串和已带语言的路径保持原样。
export default function Link({ href, ...props }: Props) {
  const params = useParams<{ lang: string }>();
  const locale = isLocale(params.lang) ? params.lang : defaultLocale;
  const firstSegment = href.split(/[/?#]/)[1];
  const shouldLocalize = href.startsWith("/") && !href.startsWith("//") &&
    !isLocale(firstSegment ?? "") && !/^\/api(?:[/?#]|$)/.test(href);
  const localizedHref = shouldLocalize
    ? `/${locale}${href === "/" ? "" : href}`
    : href;

  return <NextLink {...props} href={localizedHref} />;
}

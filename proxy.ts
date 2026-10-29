import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n";

const localeCookie = "preferred_locale";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLocale = pathname.split("/")[1];

  // 明确的语言路径优先于历史偏好，并保存一年；不依赖浏览器本地存储。
  if (isLocale(pathLocale)) {
    const response = NextResponse.next();
    // 预加载不是用户实际访问，不能让预加载的其他语言覆盖偏好。
    const isPrefetch = request.headers.has("next-router-prefetch") ||
      request.headers.get("purpose") === "prefetch" ||
      request.headers.get("sec-purpose")?.includes("prefetch");
    if (!isPrefetch && request.cookies.get(localeCookie)?.value !== pathLocale) {
      response.cookies.set(localeCookie, pathLocale, {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        // 本地 HTTP 开发可用，HTTPS 部署时仅通过安全连接发送。
        secure: request.nextUrl.protocol === "https:",
      });
    }
    return response;
  }

  // 无语言前缀时读取历史偏好；首次访问或无效 Cookie 回退中文。
  const savedLocale = request.cookies.get(localeCookie)?.value;
  const locale = savedLocale && isLocale(savedLocale) ? savedLocale : defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  // 跳转依赖个人 Cookie，避免共享缓存复用其他用户的语言。
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

// API、框架内部请求和静态文件不参与语言重定向。
export const config = {
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|.*\\.).*)"],
};

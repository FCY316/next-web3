# Next.js 日常开发模板

轻量起点：Next.js App Router + React + TypeScript（严格模式）+ Tailwind CSS + ESLint。
默认使用系统字体，无需在构建时下载 Google 字体。不预设数据库、登录或组件库。

## 启动

使用满足当前 Next.js 要求的 Node.js（最低 22.0）。推荐统一使用 Node.js 22 LTS 和 npm。

```bash
npm ci
npm run dev
```

打开 http://localhost:3007 。

## 开发命令

- `npm run dev`：本地开发。
- `npm run lint`：ESLint 检查。
- `npm run typecheck`：生成路由类型并运行 TypeScript 检查。
- `npm run check`：执行 lint 和类型检查。
- `npm run build`：生产构建。
- `npm start`：启动已经构建的生产应用。

提交前运行 `npm run check` 和 `npm run build`。

## 目录与约定

- `app/`：路由、布局和全局样式。默认使用 Server Components，需要浏览器交互时再添加 `"use client"`。
- `messages/`：四种语言的文案，供首页和 metadata 复用。
- `lib/`：通用逻辑；组件增多后建立 `components/`，业务模块按需组织。
- `public/`：放置静态资源（当前为空）；`app/favicon.ico` 是框架自动使用的网站图标，可按品牌需求替换。
- `@/*`：指向项目根目录的路径别名。
- `config/environments/`：开发、测试、正式三套环境配置。

只有允许公开到浏览器的变量才使用 `NEXT_PUBLIC_` 前缀。

## 用作新项目

1. 复制项目，排除 `.git`、`node_modules`、`.next` 和 `.env.local`，或通过 Git 仓库模板创建。
2. 修改 `package.json` 的项目名，并运行 `npm install --package-lock-only` 同步锁文件。
3. 修改 `messages/zh-CN.json`、首页和 favicon；按需添加环境变量。
4. 运行 `npm ci`、`npm run check`、`npm run build`，然后初始化新项目的 Git 仓库。

保留锁文件以便复现安装结果。升级框架后重新检查构建和类型。

## 给开发代理

遵循 `AGENTS.md`。本项目的 Next.js 版本可能存在 API 变化，编码前优先阅读
`node_modules/next/dist/docs/` 中对应文档。

## 运行环境

要求 Node.js 22 或更新版本。业务环境使用 APP_ENV 区分：

| 环境 | 配置 | 命令 |
| --- | --- | --- |
| 开发 | `config/environments/development.env` | `npm run dev` |
| 测试 | `config/environments/test.env` | `npm run build:test` 后 `npm run start:test` |
| 正式 | `config/environments/production.env` | `npm run build` 后 `npm start` |

三套配置均包含服务端 `APP_ENV` 和浏览器端 `NEXT_PUBLIC_APP_ENV`。
目前只配置环境标识，API 地址、数据库等按实际服务补充。
测试部署使用 NODE_ENV=production；它与测试框架使用的 NODE_ENV=test 不是同一概念。
测试产物输出至 `.next-test`，开发与正式产物输出至 `.next`。
切换开发与正式前请停止服务并重新构建；所有启动命令都使用 3007，不能同时占用。

私密配置放到同目录的 `development.local.env`、`test.local.env` 或
`production.local.env`，这些文件不会提交。优先级：部署平台变量 > 私密配置 > 默认配置。
统一使用此目录管理配置，避免另建根目录 `.env*` 文件造成 Next.js 额外加载。
不要在默认配置中提交真实密钥。NEXT_PUBLIC_ 变量会在构建时写入浏览器代码，
测试与正式环境必须各自构建；更改这些变量后需要重新构建。

## 国际化

支持中文（默认 `/zh-CN`）、英文（`/en`）、韩文（`/ko`）、日文（`/ja`）。
首次访问 `/` 自动跳转 `/zh-CN`，之后优先使用上次访问的语言。首页可切换语言，标题、描述和 HTML lang 随语言变化。

- `app/[lang]/`：所有多语言页面及根布局；新增页面放在此目录下。
- `lib/i18n.ts`：语言列表、默认语言、语言显示名称及参数校验。
- `lib/dictionaries.ts`：按语言加载词典，并检查词典字段类型一致。
- `messages/*.json`：翻译文案；新增字段时同步更新四种语言。
- `proxy.ts`：为无语言前缀的页面补历史语言（默认中文），跳过 API 和静态资源。

新增语言需要同步更新语言列表、显示名称、加载器和词典。
首页和 My 页面均提供语言切换；新增业务子页后，切换器需保留业务路径。

### 语言持久化

使用 `preferred_locale` Cookie 保存最后访问的语言，有效期一年，关闭浏览器后仍保留。
明确的 URL 语言优先于 Cookie；无语言前缀时使用 Cookie，无记录或无效时回退中文。
语言切换链接关闭预加载，代理也忽略预加载请求，防止提前覆盖偏好。
Cookie 使用 HttpOnly，由服务端维护；HTTPS 下启用 Secure。清除站点 Cookie 后恢复默认语言。
该偏好仅保存在当前浏览器，不会跨设备同步。

### 在服务端页面读取翻译

```tsx
import { getTranslations } from "@/lib/dictionaries";

export default async function Page() {
  const dict = await getTranslations();
  return <h1>{dict.name}</h1>;
}
```

需要当前语言时调用同模块的 `getLocale()`。两个函数统一校验语言，无效时返回 404。
它们使用 Next.js 根路由参数，仅用于服务端组件及其渲染工具，不可用于客户端组件、
Server Action 或接口路由。客户端所需文案可由服务端通过 props 传入。

My 示例页面位于 `app/[lang]/my/page.tsx`，可访问 `/zh-CN/my`、`/en/my`、`/ko/my`、`/ja/my`。
包含本地化标题、文案、保留当前页面的语言切换和返回首页链接。

### 跳转时自动携带语言

站内导航从 `@/components/link` 导入 Link，不必手动拼接语言：

```tsx
import Link from "@/components/link";

<Link href="/my">My</Link>
<Link href="/">Home</Link>
```

当前路径为 `/en` 时，`/my` 自动生成 `/en/my`。服务端页面与客户端组件均可引用。
请使用以 `/` 开头的站内页面路径；已带语言前缀的路径、外链、锚点、查询串和 `/api` 保持原样。
语言切换仍显式传入 `/ko/my` 等路径，并设置 `prefetch={false}`。
此封装只处理 Link，不改变 Next.js 原生 router.push 或 redirect 的行为。

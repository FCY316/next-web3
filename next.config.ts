import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 测试和正式构建分目录，防止启动时误用另一环境的产物。
  distDir: process.env.APP_ENV === "test" ? ".next-test" : ".next",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

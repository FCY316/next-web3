import { readFileSync, existsSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawnSync } from "node:child_process";

const [environment, command] = process.argv.slice(2);
if (!["development", "test", "production"].includes(environment) ||
    !["dev", "build", "start"].includes(command) ||
    (command === "dev" && environment !== "development")) {
  throw new Error("无效的环境或启动命令");
}

// 默认配置 < 本机私密配置 < 部署平台变量；不覆盖平台注入的密钥。
const basePath = `config/environments/${environment}`;
const defaults = parseEnv(readFileSync(`${basePath}.env`, "utf8"));
const localPath = `${basePath}.local.env`;
const local = existsSync(localPath) ? parseEnv(readFileSync(localPath, "utf8")) : {};
const env = { ...defaults, ...local, ...process.env,
  // 业务环境与框架运行模式分开：测试部署也使用生产优化。
  APP_ENV: environment,
  NEXT_PUBLIC_APP_ENV: environment,
  NODE_ENV: command === "dev" ? "development" : "production",
};
const args = ["node_modules/next/dist/bin/next", command];
if (command !== "build") args.push("--port", "3007");
const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);

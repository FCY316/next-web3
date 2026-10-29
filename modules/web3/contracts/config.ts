import type { InterfaceAbi } from "ethers";
import { erc20Abi } from "./abi/erc20";
import type { SupportedChainId } from "../config/chains";

export type AppEnvironment = "development" | "test" | "production";
export interface ContractDefinition {
  abi: InterfaceAbi;
  addresses: Partial<Record<AppEnvironment, Partial<Record<SupportedChainId, string>>>>;
}

/**
 * 合约注册表：配置结构为「合约名称 → ABI + 环境 → 链 ID → 部署地址」。
 * key 是项目自行定义的名称，与链上代币的 name、symbol 无关。
 * 例如 token 对应 getReadContract("token", 1677) / await getWriteContract("token")。
 * 新增代币可增加 rewardToken 等 key，标准 ERC-20 代币可共用 erc20Abi。
 * 同一业务合约的跨链部署放在同一 key 下；同链上的不同代币使用不同 key。
 * 未部署的环境或链直接省略，不要填写空地址，也不要借用其他链的地址。
 */
// ABI 文件放在同目录 abi/；此配置会进入浏览器，只存公开地址和接口。
export const contractDefinitions: Record<string, ContractDefinition> = {
  // 调用方传入的 "token" 必须与这里的 key 完全一致，拼错会报“未注册合约”。
  token: {
    abi: erc20Abi,
    // 当前三套业务环境共用项目提供的 1677 链代币地址。
    // BSC 尚未提供部署地址，读取时会明确报错，不会跨链复用此地址。
    addresses: {
      development: { 1677: "0x8AF5Da3DEA6eFe400Ddab5baE395eE3c818d325A" },
      test: { 1677: "0x8AF5Da3DEA6eFe400Ddab5baE395eE3c818d325A" },
      production: { 1677: "0x8AF5Da3DEA6eFe400Ddab5baE395eE3c818d325A" },
    },
  },
};

// 业务环境由启动命令设置；获取实例时无需手动传入，与钱包链 ID 相互独立。
export function getContractEnvironment(): AppEnvironment {
  const environment = process.env.NEXT_PUBLIC_APP_ENV;
  if (environment === "development" || environment === "test" || environment === "production") return environment;
  throw new Error("未配置有效的 NEXT_PUBLIC_APP_ENV");
}

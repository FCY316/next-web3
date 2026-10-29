import { BrowserProvider, getAddress, isAddress, JsonRpcSigner } from "ethers";
import type { Eip6963ProviderDetail } from "./eip6963";

/** 钱包返回值和事件都是外部输入；无效数据不能覆盖当前账户。 */
export function isWalletAccounts(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && isAddress(item));
}

/**
 * 用户点击连接时请求授权；刷新恢复和状态同步仅查询已授权账户。
 * 直接为已校验账户创建 Signer，避免 BrowserProvider.getSigner() 在账户失效时隐式请求授权。
 */
export default async function connectWallet(detail: Eip6963ProviderDetail, requestAccess = true) {
  const accounts = await detail.provider.request({
    method: requestAccess ? "eth_requestAccounts" : "eth_accounts",
  });
  if (!isWalletAccounts(accounts) || !accounts.length) return null;
  const address = getAddress(accounts[0]);
  const provider = new BrowserProvider(detail.provider, undefined, { cacheTimeout: -1 });
  return { address, provider, signer: new JsonRpcSigner(provider, address) };
}

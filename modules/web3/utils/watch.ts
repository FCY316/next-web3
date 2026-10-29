import { isWalletAccounts } from "./connect";
import type { Eip1193Provider } from "./eip6963";

/**
 * 监听当前选中 provider 的账户变更。
 *
 * @returns 仅移除本函数注册 handler 的清理函数；不使用 removeAllListeners，避免影响其他模块。
 */
export const watchAddress = (
  provider: Eip1193Provider,
  fun?: (accounts: string[]) => void
) => {
  // EIP-1193 约定第一个参数为账户数组，仍需在运行时验证扩展传入的数据。
  const handler = (...args: unknown[]) => {
    const accounts = args[0];
    // 非法事件不应被解释为账户清空，否则会错误断开当前钱包。
    if (isWalletAccounts(accounts)) {
      fun?.(accounts);
    }
  };

  // on/removeListener 是可选的：不支持事件的钱包仍可完成一次性连接。
  (provider.on ?? provider.addListener)?.call(provider, "accountsChanged", handler);
  return () => {
    (provider.removeListener ?? provider.off ?? provider.removeEventListener)?.call(
      provider,
      "accountsChanged",
      handler,
    );
  };
};

/**
 * 监听当前选中 provider 的链变更。
 *
 * @returns 仅移除本函数注册 handler 的清理函数；不影响其他订阅方。
 */
export const watchNetwork = (
  provider: Eip1193Provider,
  fun?: (chainId: string) => void
) => {
  // chainChanged 的第一个参数按 EIP-1193 为链 ID 字符串，通常形如 "0x1"。
  const handler = (...args: unknown[]) => {
    const chainId = args[0];
    if (typeof chainId === "string" || typeof chainId === "number" || typeof chainId === "bigint") {
      fun?.(String(chainId));
    }
  };

  (provider.on ?? provider.addListener)?.call(provider, "chainChanged", handler);
  return () => {
    (provider.removeListener ?? provider.off ?? provider.removeEventListener)?.call(
      provider,
      "chainChanged",
      handler,
    );
  };
};

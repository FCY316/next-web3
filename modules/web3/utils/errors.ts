/** ethers 可能包装原始 RPC 错误，统一读取钱包错误码。 */
export function getWalletErrorCode(error: unknown): unknown {
  if (!error || typeof error !== "object") return undefined;
  const value = error as { code?: unknown; info?: { error?: unknown }; cause?: unknown };
  return getWalletErrorCode(value.info?.error) ?? getWalletErrorCode(value.cause) ?? value.code;
}

export function isWalletRequestRejected(error: unknown): boolean {
  const code = getWalletErrorCode(error);
  return code === 4001 || code === "ACTION_REJECTED";
}

import type { BrowserProvider } from "ethers";
import { chainParams, isSupportedChainId } from "../config/chains";

import { getWalletErrorCode } from "./errors";

// 对齐参考项目：连接时请求默认支持链，拒绝后不继续弹出添加网络请求。
export async function changeChainID(provider: BrowserProvider, chainID: number): Promise<boolean> {
  if (!isSupportedChainId(chainID)) return false;
  const params = [{ chainId: `0x${chainID.toString(16)}` }];
  try { await provider.send("wallet_switchEthereumChain", params); return true; }
  catch (error) {
    // 仅“钱包未添加此链”时添加网络；拒绝、已有待处理请求或 RPC 失败都不重复弹窗。
    if (getWalletErrorCode(error) !== 4902) return false;
    const chain = chainParams[chainID];
    try {
      // 只传钱包规范需要的字段，WebSocket 地址不属于添加网络参数。
      await provider.send("wallet_addEthereumChain", [{
        chainId: params[0].chainId, chainName: chain.chainName,
        nativeCurrency: chain.nativeCurrency, rpcUrls: chain.rpcUrls,
        blockExplorerUrls: chain.blockExplorerUrls,
      }]);
      // 添加网络并不保证钱包已切换，必须再次明确请求切换。
      await provider.send("wallet_switchEthereumChain", params);
      return true;
    } catch { return false; }
  }
}

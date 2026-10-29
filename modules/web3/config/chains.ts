// 仅支持 EVM 链；这里保留十进制 chainId，调用钱包 RPC 时再转换为十六进制。
export interface ChainParams {
  chainId: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: readonly [string, ...string[]];
  webSocketUrls?: readonly [string, ...string[]];
  blockExplorerUrls: readonly [string, ...string[]];
}

// 统一维护业务支持的链，地址采用项目提供的配置；不在页面内重复定义。
export const chainParams = {
  1677: {
    chainId: 1677,
    chainName: "InterstellarChain",
    nativeCurrency: { name: "HUGE", symbol: "HUGE", decimals: 18 },
    rpcUrls: ["https://rpc.interstellarchain.org/"],
    // 供后续新区块、Transfer、Approval 等实时事件订阅使用。
    webSocketUrls: ["wss://rpc.interstellarchain.org"],
    blockExplorerUrls: ["https://scan.interstellarchain.org/"],
  },
  56: {
    chainId: 56,
    chainName: "BSC",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com"],
  },
} as const satisfies Record<number, ChainParams>;

export type SupportedChainId = keyof typeof chainParams;

// 钱包返回的网络可能不在支持列表中，校验后才能读取对应配置。
export function isSupportedChainId(chainId: number): chainId is SupportedChainId {
  return Object.prototype.hasOwnProperty.call(chainParams, chainId);
}

export function getChainParams(chainId: SupportedChainId): ChainParams {
  return chainParams[chainId];
}

// 连接或恢复会话时，如钱包网络不受支持，请求切换至此链。
export const defaultChainId: SupportedChainId = 1677;

"use client";

import { useConnectWalletStore } from "../store/wallet";
import { changeChainID } from "../utils/change-chain";
import { isSupportedChainId } from "../config/chains";

// 统一业务入口；连接参数与参考项目一致，不传 UUID 时仅打开全局选择弹窗。
export function useWallet() {
  const state = useConnectWalletStore();
  return {
    address: state.address,
    chainId: state.chainId,
    walletName: state.walletName,
    walletProviderUuid: state.walletProviderUuid,
    provider: state.provider,
    signer: state.signer,
    walletProviders: state.walletProviders,
    connectWalletStore: state.connectWalletStore,
    disconnectWalletStore: state.disconnectWalletStore,
    discoverWalletProviders: state.discoverWalletProviders,
    changeChainIDFun: (chainId: number) => state.provider
      ? changeChainID(state.provider, chainId) : Promise.resolve(false),
    // 不支持网络时保留连接以便显示提示，但禁止业务继续发送合约交易。
    canTransact: Boolean(state.signer && state.chainId !== null && isSupportedChainId(state.chainId)),
  };
}

"use client";

import { useEffect, useRef } from "react";
import { SELECTED_PROVIDER_STORAGE_KEY, useConnectWalletStore } from "../store/wallet";
import { subscribeEip6963Providers } from "../utils/eip6963";
import { getLocal } from "../utils/storage";

/** 全局仅挂载一次。先订阅发现结果，再按持久化 rdns 匹配本次会话的钱包。 */
export default function useWalletInit(onWalletChange?: () => void) {
  const { address, connectWalletStore, walletProviders } = useConnectWalletStore();
  const attemptedRdns = useRef<string | null>(null);

  useEffect(() => {
    // Store 创建时不访问浏览器；组件卸载时仅取消本应用订阅，保留协议发现监听。
    return subscribeEip6963Providers((providers) => {
      useConnectWalletStore.setState({ walletProviders: providers });
    });
  }, []);

  useEffect(() => {
    const rdns = getLocal(SELECTED_PROVIDER_STORAGE_KEY);
    const detail = walletProviders.find(({ info }) => info.rdns === rdns);
    if (!rdns || address || !detail || attemptedRdns.current === rdns) return;
    attemptedRdns.current = rdns;
    // 恢复不请求账户授权；网络不受支持时仍保留项目约定的默认切链行为。
    void connectWalletStore(detail.info.uuid, onWalletChange, true, false);
  }, [address, connectWalletStore, onWalletChange, walletProviders]);
}

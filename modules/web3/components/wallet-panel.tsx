"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/lib/i18n";
import { maskText } from "@/lib/mask";
import { useWallet } from "../hooks/use-wallet";
import useAddressConvert from "../hooks/use-address-convert";
import { getWalletMessages } from "../locales";
import { Button } from "@/components/ui/button";

const subscribeToMount = () => () => {};

export function WalletPanel({ locale }: { locale: Locale }) {
  const dict = getWalletMessages(locale);
  const wallet = useWallet();
  const { addressConvert } = useAddressConvert();
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);
  const address = mounted ? addressConvert(wallet.address) : "";

  return (
    <section aria-label={dict.title} className="space-y-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {/* 未连接时选择钱包；已连接时全局弹窗展示账户详情。 */}
        <Button className="min-h-11 min-w-0 max-w-full" onClick={() => { void wallet.connectWalletStore(); }}>
          <span className="truncate">{address ? maskText(address) : dict.connect}</span>
        </Button>
      </div>
    </section>
  );
}

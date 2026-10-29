"use client";

import { useRef, useState } from "react";
import { LoaderCircle, SearchX } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useWallet } from "../hooks/use-wallet";
import { useWalletModal } from "../store/modal";
import { getWalletMessages } from "../locales";
import { AccountDetails } from "./account-details";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

// 全局仅挂载一次：任意页面调用 connectWalletStore() 打开此弹窗。
export function WalletModal({ locale }: { locale: Locale }) {
  const dict = getWalletMessages(locale);
  const { open, session, setOpen } = useWalletModal();
  const wallet = useWallet();
  const [connecting, setConnecting] = useState<{ session: number; uuid: string }>();
  const [failedSession, setFailedSession] = useState<number>();
  const connectingUuid = connecting?.session === session ? connecting.uuid : undefined;
  const failed = failedSession === session;
  const attempt = useRef(0);

  async function connect(uuid: string) {
    const revision = ++attempt.current;
    setConnecting({ session, uuid });
    setFailedSession(undefined);
    const connected = await wallet.connectWalletStore(uuid);
    const modal = useWalletModal.getState();
    if (revision !== attempt.current || !modal.open || modal.session !== session) return;
    setConnecting(undefined);
    if (connected) setOpen(false);
    else setFailedSession(session);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent closeLabel={dict.close} className={wallet.address ? "max-w-sm rounded-3xl" : undefined}>
        <header className="space-y-2 pr-6">
          <DialogTitle className="text-lg font-semibold">{wallet.address ? dict.manageWallet : dict.selectWallet}</DialogTitle>
          <DialogDescription className="sr-only">{wallet.address ? dict.manageDescription : dict.selectDescription}</DialogDescription>
        </header>
        {wallet.address ? <AccountDetails locale={locale} /> : wallet.walletProviders.length ? (
          <div className="flex flex-col gap-2">
            {wallet.walletProviders.map(({ info }) => (
              <Button className="h-14 w-full justify-start" variant="outline" key={info.uuid}
                disabled={connectingUuid === info.uuid} onClick={() => { void connect(info.uuid); }}>
                {connectingUuid === info.uuid && <LoaderCircle className="size-4 shrink-0 animate-spin" aria-label={dict.pending} />}
                {/* 钱包图标由扩展提供，只作为图片渲染，绝不执行其 SVG 标记。 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="size-6 shrink-0 rounded" src={info.icon} />
                <span className="min-w-0 truncate">{info.name}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-5 text-center">
            <SearchX aria-hidden="true" className="size-10 text-zinc-400" />
            <p className="text-sm leading-6 text-zinc-500">{dict.noWallet}</p>
            <Button onClick={wallet.discoverWalletProviders}>{dict.rescan}</Button>
          </div>
        )}
        {!wallet.address && failed && <p role="alert" className="text-sm text-red-600">{dict.failed}</p>}

      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ethereumAddressImage } from "../utils/address-image";
import { LogOut, Wallet } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { maskText } from "@/lib/mask";
import { Button } from "@/components/ui/button";
import { chainParams, isSupportedChainId } from "../config/chains";
import { getWalletMessages } from "../locales";
import { useWallet } from "../hooks/use-wallet";
import useAddressConvert from "../hooks/use-address-convert";
import { useWalletModal } from "../store/modal";
import { CopyText } from "@/components/copy-text";

const subscribeToMount = () => () => {};

// 已连接账户面板：展示当前连接快照；切换账户或网络时跟随 Store 即时更新。
export function AccountDetails({ locale }: { locale: Locale }) {
  const wallet = useWallet();
  // Canvas 仅在客户端挂载后生成，保持服务端 HTML 与首次水合一致。
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);
  // 始终使用原始地址作为种子，切换 hg / 0x 展示类型不会改变头像。
  const avatar = useMemo(
    () => mounted ? ethereumAddressImage(wallet.address) : "",
    [mounted, wallet.address],
  );
  const dict = getWalletMessages(locale);
  const { addressConvert, addressType, changeAddressType } = useAddressConvert();
  const address = addressConvert(wallet.address);
  const chainId = wallet.chainId;
  const chainName = chainId !== null && isSupportedChainId(chainId)
    ? chainParams[chainId].chainName : dict.unknownNetwork;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-6 dark:bg-zinc-900">
        <span className="flex size-14 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
          {avatar ? (
            // 本地 Canvas 生成的 Data URL，无需 Next.js 图片优化。
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" width={56} height={56} className="size-14 rounded-full" />
          ) : <Wallet className="size-6" aria-hidden="true" />}
        </span>
        <p className="text-sm text-zinc-500">{wallet.walletName}</p>
        <p className="font-mono text-xl font-semibold" aria-label={dict.address} aria-live="polite">{maskText(address)}</p>
        {/* 脱敏仅用于显示；复制的是当前格式的完整地址。 */}
        <div className="flex flex-wrap justify-center gap-2">
          <CopyText text={address} labels={dict} className="min-h-11" showLabel />
          {/* 只切换展示编码并保存偏好，钱包账户及合约使用的原始地址保持不变。 */}
          <div role="group" aria-label={dict.changeAddress}
            className="inline-flex self-center rounded-full border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
            {(["hg", "0x"] as const).map((type) => (
              <button key={type} type="button" aria-pressed={addressType === type}
                onClick={() => { if (addressType !== type) changeAddressType(); }}
                className="min-h-8 min-w-10 rounded-full px-2.5 font-mono text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 aria-pressed:bg-white aria-pressed:text-zinc-950 aria-pressed:shadow-sm dark:text-zinc-400 dark:hover:text-zinc-100 dark:aria-pressed:bg-zinc-600 dark:aria-pressed:text-white">
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
      <dl className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        <dt className="text-zinc-500">{dict.network}</dt>
        <dd className="text-right font-medium" aria-live="polite">{chainName}{chainId !== null && <span className="ml-2 text-xs text-zinc-500">#{chainId}</span>}</dd>
      </dl>
      <Button variant="outline" className="w-full min-h-11" onClick={() => {
        wallet.disconnectWalletStore();
        useWalletModal.getState().setOpen(false);
      }}><LogOut className="size-4" aria-hidden="true" />{dict.disconnect}</Button>
    </div>
  );
}

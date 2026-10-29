"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import type { Locale } from "@/lib/i18n";
import useWalletInit from "../hooks/use-wallet-init";
import { WalletModal } from "../components/wallet-modal";

// 对齐参考项目的 ethers + Zustand 实现，初始化和选择弹窗只挂载一份。
export function Web3Provider({ children, locale }: { children: ReactNode; locale: Locale }) {
  useWalletInit();
  return <>{children}<WalletModal locale={locale} /><Toaster position="top-right" richColors closeButton /></>;
}

import type { Locale } from "@/lib/i18n";
import { WalletPanel } from "@/modules/web3/components/wallet-panel";

// 全站共用的钱包入口，沿用参考项目的顶部间距与地址、复制、地址格式切换交互。
export function Header({ locale }: { locale: Locale }) {
  return (
    <header className="min-w-0 px-4 py-3">
      <WalletPanel locale={locale} />
    </header>
  );
}

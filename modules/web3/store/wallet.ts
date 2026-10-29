import { BrowserProvider, getAddress, JsonRpcSigner } from "ethers";
import { getWalletMessages } from "../locales";
import { toast } from "sonner";
import { create } from "zustand";

import { defaultChainId, isSupportedChainId } from "../config/chains";
import { useWalletModal } from "./modal";

import connectWallet, { isWalletAccounts } from "../utils/connect";
import {
  type Eip6963ProviderDetail,
  findEip6963Provider,
  getEip6963Providers,
  requestEip6963Providers,
} from "../utils/eip6963";
import { isWalletRequestRejected } from "../utils/errors";
import { changeChainID } from "../utils/change-chain";
import { removeLocal, setLocal } from "../utils/storage";
import {
  watchAddress,
  watchNetwork,
} from "../utils/watch";

/**
 * 持久化用户上一次选择的钱包 rdns。
 * EIP-6963 uuid 只在当前页面会话内唯一，刷新页面后钱包会公告新的 uuid，因此不能用于恢复会话。
 * rdns 虽然不可作为安全验证依据，但适合作为“用户偏好哪个钱包”的跨页面匹配键。
 */
const SELECTED_PROVIDER_STORAGE_KEY = "walletEvmProviderRdns";

/** EVM 钱包连接状态和对外操作。 */
interface ConnectWalletState {
  /**
   * 连接指定 UUID 的 provider。
   * 不传 UUID 时只打开选择弹窗；requestAccess=false 时采用静默 eth_accounts 恢复。
   */
  connectWalletStore: (
    providerUuid?: string,
    watchChangeFun?: () => void,
    changeChain?: boolean,
    requestAccess?: boolean,
  ) => Promise<boolean>;
  /** 仅重置 DApp 内连接状态和本地偏好；注入钱包不能被网页强制登出。 */
  disconnectWalletStore: () => void;
  /** 主动重新派发 requestProvider，用于再次扫描晚注入的钱包。 */
  discoverWalletProviders: () => void;
  /** 所有已公告的 EIP-6963 provider，供钱包选择 UI 展示。 */
  walletProviders: Eip6963ProviderDetail[];
  /** 当前 provider 所在的 EVM chain ID。 */
  chainId: number | null;
  /** 当前 provider 的展示名称。 */
  walletName: string | null;
  /** 当前页面会话中 provider 的 UUID，仅用于当前连接，不用于跨页面持久化。 */
  walletProviderUuid: string | null;
  /** 当前第一个已授权账户地址。 */
  address: string;
  /** ethers 对 EIP-1193 provider 的封装。 */
  provider: BrowserProvider | null;
  /** 当前账户的 signer，用于发送交易与签名。 */
  signer: JsonRpcSigner | null;
}

/**
 * 当前连接只应有一组账户/网络监听器。模块级引用使重连时能够先清理旧 provider 的监听器；
 * 不能使用 removeAllListeners，否则会误删其他业务或第三方库注册的监听器。
 */
let stopWatching: (() => void) | undefined;

/** ethers 网络 ID 为 bigint，而 chainChanged 通常传十六进制字符串；统一转为 number 供配置比对。 */
const toChainId = (chainId: bigint | number | string) => Number(chainId);

/**
 * EIP-6963 多钱包连接状态。
 *
 * 发现 provider、请求账户、切链、创建 signer 和监听账户变更均在此收敛，页面组件只通过
 * useWallet 使用稳定的地址、signer 和连接函数。
 */
export const useConnectWalletStore = create<ConnectWalletState>((set, get) => {
  let connectionRevision = 0;
  /** 清除上一轮连接留下的两个事件监听器，防止同一事件触发多次重连。 */
  const clearWatching = () => {
    stopWatching?.();
    stopWatching = undefined;
  };

  /**
   * 断开 DApp 与钱包的关联。
   * 注入钱包没有通用的 disconnect RPC，因此这里只清除本地状态、持久化 rdns 与本应用监听器。
   */
  const disconnectWalletStore = () => {
    connectionRevision++;
    clearWatching();
    removeLocal(SELECTED_PROVIDER_STORAGE_KEY);
    set({
      address: "",
      provider: null,
      walletName: null,
      walletProviderUuid: null,
      signer: null,
      chainId: null,
    });
  };

  /**
   * 连接指定的 EIP-6963 provider。
   *
   * @param providerUuid 用户在钱包弹窗选中的、仅当前页面有效的 UUID；缺失时仅打开弹窗，不擅自选择第一个钱包。
   * @param watchChangeFun 地址或网络变化后、状态重新同步完成时执行的业务回调。
   * @param changeChain 当前网络不受支持时是否请求切换到默认支持链。
   * @param requestAccess true 使用 eth_requestAccounts，false 使用无弹窗的 eth_accounts。
   */
  const connectWalletStore = async (
    providerUuid?: string,
    watchChangeFun?: () => void,
    changeChain = true,
    requestAccess = true,
  ) => {
    // 每次连接前再次请求公告，兼容钱包扩展比应用更晚完成注入的情形。
    requestEip6963Providers();

    if (!providerUuid) {
      // 多钱包环境必须由用户选择 provider，不能擅自选取列表中的任意钱包。
      useWalletModal.getState().setOpen(true);
      return false;
    }

    // UUID 是本次连接的唯一依据，名称和 rdns 都不参与 provider 的选择。
    const providerDetail = findEip6963Provider(providerUuid);
    if (!providerDetail) {
      console.warn(`未找到 EIP-6963 provider: ${providerUuid}`);
      return false;
    }

    const connection = ++connectionRevision;
    try {
      // 先取得账户、ethers BrowserProvider 与 signer；静默模式无授权账户会直接返回 null。
      let connectedWallet = await connectWallet(
        providerDetail,
        requestAccess,
      );
      if (!connectedWallet || connection !== connectionRevision) return false;

      // BrowserProvider 返回的 network.chainId 是 bigint，先统一为配置使用的 number。
      let chainId = Number(
        await providerDetail.provider.request({ method: "eth_chainId" }),
      );
      if (!Number.isSafeInteger(chainId) || chainId <= 0) return false;
      if (connection !== connectionRevision) return false;

      if (!isSupportedChainId(chainId) && changeChain) {
        // 保留现有行为：由 changeChain 决定是否请求切链；账户恢复本身只调用 eth_accounts。
        const switched = await changeChainID(
          connectedWallet.provider,
          defaultChainId,
        );
        if (!switched) return false;

        // 切链后创建新的 BrowserProvider，避免使用旧网络的 signer。
        connectedWallet = await connectWallet(providerDetail, false);
        if (!connectedWallet) return false;
        chainId = toChainId(
          (await connectedWallet.provider.getNetwork()).chainId,
        );
        if (chainId !== defaultChainId) return false;
      }

      if (connection !== connectionRevision) return false;
      clearWatching();
      // 每个连接仅保留一个同步入口。事件使在途查询失效，轮询不与同步并发。
      let stopped = false;
      let syncing = false;
      let revision = 0;
      let pendingChangeCallback = false;
      let pendingAccounts: string[] | undefined;
      let pendingChain: number | undefined;
      const active = () => !stopped && get().walletProviderUuid === providerUuid;
      const syncWallet = async () => {
        if (!active() || syncing || document.visibilityState === "hidden") return;
        syncing = true;
        const runRevision = revision;
        const observedAccounts = pendingAccounts;
        const observedChain = pendingChain;
        try {
          const [rawAccounts, rawChain] = await Promise.all([
            observedAccounts ?? providerDetail.provider.request({ method: "eth_accounts" }),
            observedChain ?? providerDetail.provider.request({ method: "eth_chainId" }),
          ]);
          if (!active() || runRevision !== revision) return;
          if (!isWalletAccounts(rawAccounts)) return;
          const nextChain = Number(rawChain);
          if (!Number.isSafeInteger(nextChain) || nextChain <= 0) return;
          if (!rawAccounts.length) {
            disconnectWalletStore();
            watchChangeFun?.();
            return;
          }
          const current = get();
          const changed = pendingChangeCallback || nextChain !== current.chainId ||
            rawAccounts[0].toLowerCase() !== current.address.toLowerCase();
          if (!changed && current.signer) {
            pendingAccounts = undefined;
            pendingChain = undefined;
            return;
          }
          if (nextChain !== current.chainId && !isSupportedChainId(nextChain)) {
            toast.warning(`${getWalletMessages().unsupported} (${nextChain})`);
          }
          // 更新公开快照后立即废弃旧 signer；始终使用已校验的当前账户重建。
          set({ address: rawAccounts[0], chainId: nextChain, signer: null });
          const provider = new BrowserProvider(providerDetail.provider, undefined, { cacheTimeout: -1 });
          const signer = new JsonRpcSigner(provider, getAddress(rawAccounts[0]));
          if (!active() || runRevision !== revision) return;
          pendingAccounts = undefined;
          pendingChain = undefined;
          set({ provider, signer });
          pendingChangeCallback = false;
          if (changed) watchChangeFun?.();
        } catch (error) {
          if (active()) console.warn("wallet-state-sync", error);
        } finally {
          syncing = false;
          if (active() && runRevision !== revision) void syncWallet();
        }
      };
      const stopAddressWatching = watchAddress(providerDetail.provider, (accounts) => {
        if (!active()) return;
        if (!accounts.length) {
          disconnectWalletStore();
          watchChangeFun?.();
          return;
        }
        pendingChangeCallback ||= accounts[0].toLowerCase() !== get().address.toLowerCase();
        pendingAccounts = accounts;
        revision++;
        set({ signer: null });
        void syncWallet();
      });
      const stopNetworkWatching = watchNetwork(providerDetail.provider, (chain) => {
        if (!active()) return;
        const nextChain = Number(chain);
        if (!Number.isSafeInteger(nextChain) || nextChain <= 0) return;
        // 公开快照会立即更新，单独记录变更，避免后续同步漏掉业务回调。
        pendingChangeCallback ||= nextChain !== get().chainId;
        pendingChain = nextChain;
        revision++;
        if (nextChain !== get().chainId && !isSupportedChainId(nextChain)) {
          toast.warning(`${getWalletMessages().unsupported} (${nextChain})`);
        }
        set({ chainId: nextChain, signer: null });
        void syncWallet();
      });
      const onResume = () => { void syncWallet(); };
      const syncInterval = window.setInterval(onResume, 1500);
      window.addEventListener("focus", onResume);
      document.addEventListener("visibilitychange", onResume);
      stopWatching = () => {
        stopped = true;
        window.clearInterval(syncInterval);
        window.removeEventListener("focus", onResume);
        document.removeEventListener("visibilitychange", onResume);
        stopAddressWatching();
        stopNetworkWatching();
      };

      // 仅提交最终 chainId 对应的 signer，避免切链前的 signer 被错误复用。
      // 仅在完整连接成功后保存 rdns，刷新页面后可用新公告的 uuid 重新定位该钱包。
      setLocal(SELECTED_PROVIDER_STORAGE_KEY, providerDetail.info.rdns);
      set({
        address: connectedWallet.address,
        provider: connectedWallet.provider,
        signer: connectedWallet.signer,
        walletName: providerDetail.info.name,
        walletProviderUuid: providerUuid,
        chainId,
      });
      return true;
    } catch (error) {
      // 已被新连接或断开操作取代的请求不再产生错误提示。
      if (connection !== connectionRevision) return false;
      // 用户拒绝授权、钱包 RPC 报错等都不污染已有连接状态，调用方根据 false 保持弹窗打开。
      if (requestAccess) {
        const messages = getWalletMessages();
        toast.error(isWalletRequestRejected(error) ? messages.rejected : messages.failed);
      }
      if (!isWalletRequestRejected(error)) console.error("wallet-connect", error);
      return false;
    }
  };

  /** 供钱包弹窗与初始化 Hook 调用的手动扫描入口。 */
  const discoverWalletProviders = () => requestEip6963Providers();

  return {
    connectWalletStore,
    disconnectWalletStore,
    discoverWalletProviders,
    walletProviders: getEip6963Providers(),
    address: "",
    walletName: null,
    walletProviderUuid: null,
    chainId: null,
    provider: null,
    signer: null,
  };
});

export { SELECTED_PROVIDER_STORAGE_KEY };

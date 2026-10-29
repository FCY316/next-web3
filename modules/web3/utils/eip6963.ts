/**
 * EIP-1193 provider 的最小运行时接口。
 *
 * EIP-6963 只负责“发现”钱包，真正请求账户、签名和监听账户变化仍由
 * EIP-1193 provider 完成。这里刻意不依赖某个钱包扩展的私有属性，
 * 这样 MetaMask、OKX、Rabby 等符合标准的钱包都能使用同一套连接逻辑。
 */
export interface Eip1193Provider {
  /** 向钱包发送 JSON-RPC 请求，例如 eth_requestAccounts。 */
  request: (args: {
    method: string;
    params?: readonly unknown[] | object;
  }) => Promise<unknown>;
  /** 注册钱包事件；部分 provider 不实现事件接口，所以该字段是可选的。 */
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  addListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  /** 移除本应用注册的事件监听器，避免重连后重复响应同一事件。 */
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => void;
  off?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeEventListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

/** EIP-6963 中用于展示和标识钱包的公开信息。 */
export interface Eip6963ProviderInfo {
  /** 当前页面会话内的钱包 provider 标识；跨刷新恢复使用 rdns，不持久化 UUID。 */
  uuid: string;
  /** 可直接展示给用户的钱包名称。 */
  name: string;
  /** 钱包提供的图标 URI；UI 必须用 img 标签渲染 SVG，不能内联 SVG。 */
  icon: string;
  /** 钱包声明的反向域名；仅作展示/标识，不能作为安全特征判断。 */
  rdns: string;
}

/** 一次 announceProvider 事件携带的钱包元数据和可交互 provider。 */
export interface Eip6963ProviderDetail {
  info: Eip6963ProviderInfo;
  provider: Eip1193Provider;
}

/** 发现列表发生变化时，通知 Zustand 等状态容器的回调类型。 */
type ProviderListener = (providers: Eip6963ProviderDetail[]) => void;

/**
 * 模块级注册表会在整个页面生命周期内保存公告结果。
 * key 使用 uuid 而不是 name，避免安装多个同名钱包时发生覆盖。
 */
const providers = new Map<string, Eip6963ProviderDetail>();
/** 已订阅发现结果的应用内监听器集合。 */
const listeners = new Set<ProviderListener>();
/** 确保 window 监听器只安装一次，避免热更新或多组件挂载造成重复注册。 */
let isDiscoveryStarted = false;

/**
 * provider 详情来自浏览器扩展，属于外部输入；写入注册表前先验证本应用会使用的字段。
 * 这里只做结构校验，不以 name 或 rdns 判断钱包真伪，因为这些字段均由扩展自行声明。
 */
const isProviderDetail = (value: unknown): value is Eip6963ProviderDetail => {
  if (!value || typeof value !== "object") return false;

  const detail = value as Partial<Eip6963ProviderDetail>;
  return Boolean(
    detail.info &&
    typeof detail.info.uuid === "string" &&
    typeof detail.info.name === "string" &&
    typeof detail.info.icon === "string" &&
    typeof detail.info.rdns === "string" &&
    detail.provider &&
    typeof detail.provider.request === "function",
  );
};

/** 将 Map 转为数组，防止调用方接触并修改内部注册表。 */
const getProviders = () => Array.from(providers.values());

/** 将最新快照推送给订阅者，而不是把可变 Map 直接暴露出去。 */
const notifyListeners = () => {
  const announcedProviders = getProviders();
  listeners.forEach((listener) => listener(announcedProviders));
};

/**
 * 处理钱包扩展发出的 eip6963:announceProvider 事件。
 * 同一钱包会在初始注入和收到 requestProvider 后多次公告，因此 UUID 已存在时直接忽略。
 */
const announceProvider = (event: Event) => {
  const detail = (event as CustomEvent<unknown>).detail;
  if (!isProviderDetail(detail) || providers.has(detail.info.uuid)) return;

  // TP 等钱包 WebView 可能针对同一钱包重复公告，且每次 UUID 不同。
  // 按 rdns 去重，避免钱包选择列表出现多个同一钱包。
  const hasSameRdns = Array.from(providers.values()).some(
    ({ info }) => info.rdns === detail.info.rdns,
  );
  if (hasSameRdns) return;

  providers.set(detail.info.uuid, detail);
  notifyListeners();
};

/**
 * 启动发现流程。
 *
 * EIP-6963 要求先监听 announceProvider，再派发 requestProvider：这样不论钱包扩展
 * 还是 DApp 先执行，都不会错过公告事件。规范要求 announceProvider 监听器保留到页面
 * 生命周期结束，因此本函数没有提供移除 window 监听器的能力。
 */
export const startEip6963Discovery = () => {
  if (typeof window === "undefined" || isDiscoveryStarted) return;

  window.addEventListener("eip6963:announceProvider", announceProvider);
  isDiscoveryStarted = true;
};

/**
 * 请求所有支持 EIP-6963 的扩展重新公告其 provider。
 * 可在打开钱包弹窗或恢复本地会话时再次调用，处理钱包晚于应用加载的情况。
 */
export const requestEip6963Providers = () => {
  if (typeof window === "undefined") return;

  startEip6963Discovery();
  window.dispatchEvent(new Event("eip6963:requestProvider"));
};

/**
 * 订阅发现结果。
 * 注册后立即回调一次当前快照，避免已公告的钱包需要等待下一次事件才显示；取消订阅
 * 仅影响应用内回调，不会移除 EIP-6963 要求长期存在的全局 window 监听器。
 */
export const subscribeEip6963Providers = (listener: ProviderListener) => {
  listeners.add(listener);
  requestEip6963Providers();
  listener(getProviders());

  return () => { listeners.delete(listener); };
};

/** 根据用户选择/本地存储的 UUID 获取精确的 provider，杜绝按名称猜测钱包。 */
export const findEip6963Provider = (uuid: string) => providers.get(uuid);

/** 获取当前发现结果的只读快照，主要用于 Zustand 初始化。 */
export const getEip6963Providers = () => getProviders();

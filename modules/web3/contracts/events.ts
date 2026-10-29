import type { Contract, ContractEventName, Listener } from "ethers";

type StopListening = () => Promise<void>;
const subscriptions = new WeakMap<Contract, Set<StopListening>>();

/**
 * 注册单个事件并返回取消函数，组件卸载时调用取消函数。
 * 只移除本函数注册的监听，不调用 removeAllListeners，避免影响其他组件。
 */
export async function subscribeContractEvent(contract: Contract, event: ContractEventName, listener: Listener) {
  let active = true;
  const guardedListener: Listener = (...args) => { if (active) listener(...args); };
  const ready = contract.on(event, guardedListener);
  let stopping: Promise<void> | undefined;
  const listeners = subscriptions.get(contract) ?? new Set<StopListening>();
  subscriptions.set(contract, listeners);
  // 注册过程中也记录取消入口，切链时不会遗漏尚未完成的订阅。
  const stop: StopListening = () => {
    if (!stopping) {
      active = false;
      listeners.delete(stop);
      stopping = ready.then(async () => { await contract.off(event, guardedListener); }, () => {});
    }
    return stopping;
  };
  listeners.add(stop);
  try { await ready; }
  catch (error) { listeners.delete(stop); throw error; }
  return stop;
}

// 同步使回调失效，返回 Promise 供调用方等待底层监听完全解除。
export async function stopContractEvents(contract: Contract): Promise<void> {
  const listeners = subscriptions.get(contract);
  if (!listeners) return;
  subscriptions.delete(contract);
  await Promise.all([...listeners].map((stop) => stop()));
}

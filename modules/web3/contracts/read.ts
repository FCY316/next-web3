import { Contract, JsonRpcProvider } from "ethers";
import { chainParams } from "../config/chains";
import { resolveContract } from "./resolve";
import { stopContractEvents } from "./events";

const providers = new Map<number, JsonRpcProvider>();
const contracts = new Map<string, Contract>();


/**
 * 获取只读合约，无需连接钱包，可用于查询余额、授权额度和合约状态。
 * @param name contractDefinitions 中的 key，例如 "token"，不是代币 symbol。
 * @param chainId 必须明确传入，例如 1677、56；当前不会自动读取钱包网络。
 * 若使用 useWallet().chainId，需先判断其不为 null；缺少该链部署地址时会报错。
 * 当前环境自动读取 NEXT_PUBLIC_APP_ENV；RPC 来自 config/chains.ts。
 * 同一部署复用缓存，创建实例本身不发送链上请求，调用方法时才发送请求。
 * @example
 * const token = getReadContract("token", 1677);
 * const balance = await token.balanceOf(address); // address 使用完整的 0x 地址
 */
export function getReadContract(name: string, chainId: number): Contract {
  const definition = resolveContract(name, chainId);
  const cached = contracts.get(definition.key);
  if (cached) return cached;
  let provider = providers.get(chainId);
  if (!provider) {
    provider = new JsonRpcProvider(chainParams[definition.chainId].rpcUrls[0], chainId);
    providers.set(chainId, provider);
  }
  const contract = new Contract(definition.address, definition.abi, provider);
  contracts.set(definition.key, contract);
  return contract;
}

/** 释放只读缓存：先等待自己的事件订阅解除，再销毁对应 Provider。 */
export async function clearReadContracts(): Promise<void> {
  const previousContracts = [...contracts.values()];
  const previousProviders = [...providers.values()];
  // 先清空映射，清理期间新获取的实例不复用即将销毁的 Provider。
  contracts.clear();
  providers.clear();
  try { await Promise.all(previousContracts.map(stopContractEvents)); }
  finally { previousProviders.forEach((provider) => provider.destroy()); }
}

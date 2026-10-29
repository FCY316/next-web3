"use client";

import { Contract, type ContractRunner } from "ethers";
import { useConnectWalletStore } from "../store/wallet";
import { isSupportedChainId } from "../config/chains";
import { resolveContract } from "./resolve";
import { stopContractEvents } from "./events";

let contracts = new Map<string, Contract>();
let generation = 0;

// 当前模块只有一份钱包订阅。账户、网络、Provider 或 Signer 变化均废弃旧实例。
useConnectWalletStore.subscribe((next, previous) => {
  if (next.address !== previous.address || next.chainId !== previous.chainId ||
      next.signer !== previous.signer || next.provider !== previous.provider) {
    generation++;
    for (const contract of contracts.values()) {
      void stopContractEvents(contract).catch((error: unknown) => {
        console.warn("contract-event-cleanup", error);
      });
    }
    contracts = new Map();
  }
});

/**
 * 获取可写合约，仅在客户端使用，并且必须先连接受支持链上的钱包。
 * @param name contractDefinitions 中的 key，例如 "token"、"rewardToken"。
 * 不传 chainId：自动使用当前钱包的账户、链和 Signer，业务环境自动读取配置。
 * 该名称未注册、当前环境或当前链没有部署地址时会明确报错，不会跨链兜底。
 * 适用于 approve、transfer 等签名操作；每次业务操作前重新获取，避免保存旧实例。
 * 金额使用 parseUnits 转换成 bigint；提交前模拟执行，提交后等待回执再判断成功。
 * @example
 * const token = await getWriteContract("token");
 * const decimals = await token.decimals();
 * // 后续根据业务调用具体方法，处理用户拒绝、失败和交易确认状态。
 */
export async function getWriteContract(name: string): Promise<Contract> {
  const snapshot = useConnectWalletStore.getState();
  const { signer, address, chainId, provider } = snapshot;
  if (!signer || !address || !provider || chainId === null) throw new Error("请先连接钱包");
  if (!isSupportedChainId(chainId)) throw new Error(`不支持的链：${chainId}`);
  const version = generation;
  const walletProvider = provider;

  async function assertCurrentWallet() {
    const current = useConnectWalletStore.getState();
    if (generation !== version || current.signer !== signer) throw new Error("钱包状态已变化，请重新获取合约");
    // 直接检查钱包 RPC，避免仅依赖可能尚未到达的 chainChanged/accountsChanged 事件。
    const [accounts, network] = await Promise.all([
      walletProvider.send("eth_accounts", []), walletProvider.send("eth_chainId", []),
    ]);
    if (generation !== version || !Array.isArray(accounts) ||
        typeof accounts[0] !== "string" || accounts[0].toLowerCase() !== address.toLowerCase() ||
        Number(network) !== chainId) throw new Error("钱包账户或网络已变化，请重新获取合约");
  }
  await assertCurrentWallet();
  const definition = resolveContract(name, chainId);
  const cached = contracts.get(definition.key);
  if (cached) return cached;

  // 即便调用方保留了旧 Contract 引用，发送、模拟和估算前仍校验当前钱包状态。
  const runner: ContractRunner = {
    provider,
    call: async (tx) => { await assertCurrentWallet(); return signer.call(tx); },
    estimateGas: async (tx) => { await assertCurrentWallet(); return signer.estimateGas(tx); },
    sendTransaction: async (tx) => { await assertCurrentWallet(); return signer.sendTransaction(tx); },
    resolveName: (name) => signer.resolveName(name),
  };
  const contract = new Contract(definition.address, definition.abi, runner);
  contracts.set(definition.key, contract);
  return contract;
}

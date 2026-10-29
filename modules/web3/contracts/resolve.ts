import { getAddress, Interface, ZeroAddress } from "ethers";
import { isSupportedChainId } from "../config/chains";
import { contractDefinitions, getContractEnvironment } from "./config";

// 地址、环境、ABI 都参与缓存键；缺少部署配置时直接报错，不会误用其他环境地址。
export function resolveContract(name: string, chainId: number) {
  if (!isSupportedChainId(chainId)) throw new Error(`不支持的链：${chainId}`);
  const environment = getContractEnvironment();
  const definition = Object.prototype.hasOwnProperty.call(contractDefinitions, name)
    ? contractDefinitions[name] : undefined;
  if (!definition) throw new Error(`未注册合约：${name}`);
  const configured = definition.addresses[environment]?.[chainId];
  if (!configured) throw new Error(`合约 ${name} 未配置 ${environment}/${chainId} 地址`);
  const address = getAddress(configured);
  if (address === ZeroAddress) throw new Error(`合约 ${name} 不能使用零地址`);
  const abi = new Interface(definition.abi);
  return { address, abi, chainId, key: JSON.stringify([environment, chainId, address, abi.formatJson()]) };
}


// 通用读取入口可供服务端和客户端使用；钱包写入单独从 ./wallet 导入。
export { getReadContract, clearReadContracts } from "./read";
export { subscribeContractEvent } from "./events";
export { contractDefinitions } from "./config";
export type { ContractDefinition, AppEnvironment } from "./config";
export { erc20Abi } from "./abi/erc20";

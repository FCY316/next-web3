// 标准 ERC-20 接口：https://eips.ethereum.org/EIPS/eip-20
// name、symbol、decimals 为可选元数据，调用方需要处理代币未实现这些方法的情况。
// 使用 ethers 支持的人类可读 ABI，便于其他 ERC-20 合约复用。
export const erc20Abi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  // 写入返回值可能为 false，业务不能仅凭交易已提交就判断操作成功。
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const;

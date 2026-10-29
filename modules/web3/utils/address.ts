import { bech32 } from "bech32";
import { getAddress, getBytes, hexlify, isAddress } from "ethers";

export type AddressType = "hg" | "0x";
const HG_PREFIX = "hg";
const ADDRESS_BYTES = 20;

/** 将同一个 EVM 账户的 20 字节编码为 hg Bech32 地址，不改变账户本身。 */
export function hexToHg(address: string): string {
  return bech32.encode(HG_PREFIX, bech32.toWords(getBytes(getAddress(address))));
}

/** 校验 Bech32 校验和、前缀及长度，返回带校验和的 EVM 地址。无效地址抛出异常。 */
export function hgToHex(address: string): string {
  // 先让解码器校验大小写，不能提前转小写而误接受混合大小写的无效地址。
  const decoded = bech32.decode(address);
  if (decoded.prefix !== HG_PREFIX) throw new Error("Expected an hg1 MOCIUS address");
  const bytes = Uint8Array.from(bech32.fromWords(decoded.words));
  if (bytes.length !== ADDRESS_BYTES) throw new Error("Invalid MOCIUS account address length");
  return getAddress(hexlify(bytes));
}

/** 校验 EVM 地址，包含长度与混合大小写地址的校验和。 */
export function validateAddress0x(address: string): boolean {
  return address.toLowerCase().startsWith("0x") && isAddress(address);
}

/** hg 地址必须具有正确前缀、校验和和 20 字节账户长度。 */
export function validateAddressHg(address: string): boolean {
  try { hgToHex(address); return true; }
  catch { return false; }
}

export function validateAddress(address: string): boolean {
  return validateAddress0x(address) || validateAddressHg(address);
}

/** 严格转换：适用于表单提交等业务逻辑，无效输入抛出异常。 */
export function convertAddress(address: string, target: AddressType): string {
  const hexAddress = address.toLowerCase().startsWith("0x") ? getAddress(address) : hgToHex(address);
  return target === "0x" ? hexAddress : hexToHg(hexAddress);
}

/** 展示转换：空值或无效输入原样返回；请求、签名时应使用严格转换或钱包原始地址。 */
export function formatAddress(address: string, target: AddressType): string {
  if (!address) return address;
  try { return convertAddress(address, target); }
  catch { return address; }
}

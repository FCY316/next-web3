"use client";

import { useCallback } from "react";
import useAddressType from "../store/address-type";
import {
  hexToHg, hgToHex, formatAddress,
  validateAddress, validateAddress0x, validateAddressHg,
} from "../utils/address";

// 兼容原有函数导入；非 React 代码推荐直接引用 utils/address。
export { hexToHg, hgToHex } from "../utils/address";

/** Hook 仅连接展示偏好，转换和校验统一交给无 React 依赖的工具函数。 */
export default function useAddressConvert() {
  const addressType = useAddressType((state) => state.addressType);
  const setAddressType = useAddressType((state) => state.setAddressType);
  const addressConvert = useCallback(
    (address: string) => formatAddress(address, addressType),
    [addressType],
  );
  return {
    addressType,
    addressConvert,
    changeAddressType: setAddressType,
    validateAddress, validateAddress0x, validateAddressHg,
    transition0x: hgToHex,
    transitionhg: hexToHg,
  };
}

import { create } from "zustand";
import { getLocal, setLocal } from "../utils/storage";

export const ADDRESS_TYPE_STORAGE_KEY = "addressType";
export const ADDRESS_TYPES = ["hg", "0x"] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];
export const DEFAULT_ADDRESS_TYPE: AddressType = "hg";

interface AddressTypeState {
  /** 当前界面展示的地址编码格式。 */
  addressType: AddressType;
  /** 在 hg（MOCIUS Bech32）和 0x（EVM）格式之间切换。 */
  setAddressType: () => void;
}

const isAddressType = (value: string | null): value is AddressType =>
  value !== null && ADDRESS_TYPES.includes(value as AddressType);

const getInitialAddressType = (): AddressType => {
  const savedAddressType = getLocal(ADDRESS_TYPE_STORAGE_KEY);
  return isAddressType(savedAddressType) ? savedAddressType : DEFAULT_ADDRESS_TYPE;
};

/**
 * 地址格式展示偏好。存储访问经由 getLocal/setLocal 包装，兼容构建阶段和禁用 localStorage 的 WebView。
 */
export const useAddressType = create<AddressTypeState>((set, get) => ({
  addressType: getInitialAddressType(),
  setAddressType: () => {
    const addressType: AddressType = get().addressType === "hg" ? "0x" : "hg";
    setLocal(ADDRESS_TYPE_STORAGE_KEY, addressType);
    set({ addressType });
  },
}));

export default useAddressType;

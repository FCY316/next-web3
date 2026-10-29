import { create } from "zustand";

// 每次打开分配会话编号，旧连接请求不能关闭后来重新打开的账户弹窗。
export const useWalletModal = create<{
  open: boolean;
  session: number;
  setOpen: (open: boolean) => void;
}>((set) => ({
  open: false,
  session: 0,
  setOpen: (open) => set((state) => ({
    open,
    session: open && !state.open ? state.session + 1 : state.session,
  })),
}));

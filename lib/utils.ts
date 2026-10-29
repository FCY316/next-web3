import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn 样式合并：调用方传入的 Tailwind 类可覆盖组件默认类。
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 本地偏好存储兼容 SPA 构建阶段和禁用存储的钱包 WebView。 */
export const setLocal = (key: string, value: string) => {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch { /* 存储不可用时允许本次连接，仅无法跨刷新保存偏好。 */ }
};

/** 未保存或存储不可访问时返回 null，调用方按默认配置运行。 */
export const getLocal = (key: string): string | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch { return null; }
};

/** 断开连接只清除本站偏好，不会撤销扩展授权。 */
export const removeLocal = (key: string) => {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  } catch { /* 浏览器禁用存储时仍继续清理内存中的会话。 */ }
};

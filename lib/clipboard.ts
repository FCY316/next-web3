/** 返回真实复制结果；调用方需要 await，避免把 Promise 当成成功状态。 */
export const handleCopyClick = async (
  data: string | number,
): Promise<boolean> => {
  const text = String(data);
  if (typeof document === "undefined") return false;

  // 记录触发位置，让降级输入框留在 Dialog 的焦点范围内。
  const activeElement = document.activeElement as HTMLElement | null;
  const container =
    activeElement?.closest('[role="dialog"], [role="alertdialog"], dialog') ||
    document.body;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // HTTP 或钱包浏览器可能限制 Clipboard API，继续尝试兼容方式。
    }
  }

  const textField = document.createElement("textarea");
  try {
    textField.value = text;
    textField.readOnly = true;
    textField.style.cssText =
      "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;";
    container.appendChild(textField);
    textField.focus({ preventScroll: true });
    textField.select();
    textField.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textField.remove();
    if (activeElement?.isConnected)
      activeElement.focus({ preventScroll: true });
  }
};


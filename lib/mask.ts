/**
 * 隐藏字符串中间部分，常用于地址、交易哈希等展示。
 * 默认保留前 6 位、后 4 位，例如 0x1234...abcd；可按场景调整位数和占位符。
 * 短字符串原样返回；此函数只处理展示，业务请求和复制应使用原始完整值。
 */
export function maskText(
  value: string,
  startLength = 6,
  endLength = 4,
  placeholder = "...",
): string {
  if (!Number.isInteger(startLength) || !Number.isInteger(endLength) ||
      startLength < 0 || endLength < 0) {
    throw new RangeError("保留位数必须是非负整数");
  }
  if (value.length <= startLength + endLength) return value;
  // endLength 为 0 时不调用 slice(-0)，否则会意外保留整个字符串。
  return `${value.slice(0, startLength)}${placeholder}${endLength ? value.slice(-endLength) : ""}`;
}

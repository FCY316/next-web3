import blockies from "ethereum-blockies";

// 缓存最近使用的地址头像，限制数量，避免长期使用时无限占用内存。
const MAX_CACHED_IMAGES = 200;
const addressImageCache = new Map<string, string>();
/**
 * 根据地址生成稳定的 64×64 圆形 Blockies 头像，返回 PNG Data URL。
 * 客户端挂载后调用；服务端、空地址或 Canvas 不可用时返回空字符串。
 * 同一地址大小写不同仍生成相同头像。建议传入钱包原始的 0x 地址。
 */
export const ethereumAddressImage = (address: string): string => {
  if (typeof document === "undefined") return "";

  // 同一地址无论校验大小写如何，都使用同一个缓存键和同一套 seed。
  const seed = address.trim().toLowerCase();
  if (!seed) return "";
  const cachedImage = addressImageCache.get(seed);
  if (cachedImage) return cachedImage;

  try {
    const canvasSize = 64;
    const blockiesCanvas = blockies.create({
      seed,
      size: 8,
      scale: 8,
      color: getBlockiesColor(seed, "foreground"),
      bgcolor: getBlockiesColor(seed, "background"),
      spotcolor: getBlockiesColor(seed, "spot"),
    });
    const circularCanvas = document.createElement("canvas");
    circularCanvas.width = canvasSize;
    circularCanvas.height = canvasSize;
  
    const context = circularCanvas.getContext("2d");
    if (!context) return "";
  
    context.beginPath();
    context.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, 2 * Math.PI);
    context.clip();
    context.drawImage(blockiesCanvas, 0, 0, canvasSize, canvasSize);
  
    const imageDataURL = circularCanvas.toDataURL("image/png");
    if (addressImageCache.size >= MAX_CACHED_IMAGES) {
      const oldest = addressImageCache.keys().next().value;
      if (oldest !== undefined) addressImageCache.delete(oldest);
    }
    addressImageCache.set(seed, imageDataURL);
    return imageDataURL;
  } catch {
    // 部分钱包 WebView 禁止 Canvas 读取，交由界面展示默认图标。
    return "";
  }
};
// 为 blockies 指定稳定颜色。ethereum-blockies 的默认颜色在 seed 生效前生成，
// 因此不手动传色时，同一个地址的颜色会随调用次数变化。
const getBlockiesColor = (seed: string, salt: string) => {
  let hash = 2166136261;
  const value = `${seed}:${salt}`;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const colorValue = hash >>> 0;
  const hue = colorValue % 360;
  const saturation = 45 + ((colorValue >>> 8) % 36);
  const lightness = 35 + ((colorValue >>> 16) % 26);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

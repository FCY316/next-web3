"use client";

import { useEffect, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleCopyClick } from "@/lib/clipboard";

// 通用文本复制组件：文案由调用方传入，适用于地址、哈希或其他文本。
// 即使页面展示的是脱敏内容，text 也应传入需要复制的完整值。
export function CopyText({ text, labels: dict, showLabel = false, className }: {
  text: string | number;
  labels: { copy: string; copied: string; copyFailed: string };
  showLabel?: boolean;
  className?: string;
}) {
  const value = String(text);
  const [result, setResult] = useState<{ value: string; success: boolean }>();
  const current = result?.value === value ? result : undefined;
  const label = current ? current.success ? dict.copied : dict.copyFailed : dict.copy;
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(undefined), 2000);
    return () => clearTimeout(timer);
  }, [result]);
  return <>
    <Button variant="outline" className={className} aria-label={label} type="button" onClick={async (event) => {
      event.stopPropagation(); event.currentTarget.focus();
      const success = await handleCopyClick(value);
      setResult({ value, success });
    }}>
      {current ? current.success ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      {showLabel && <span>{label}</span>}
    </Button>
    <span role="status" className="sr-only">{current ? label : ""}</span>
  </>;
}

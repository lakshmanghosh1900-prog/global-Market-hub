"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type SafeImageProps = ImageProps & { fallbackLabel?: string; fallbackClassName?: string };

export function SafeImage({ fallbackLabel = "Image unavailable", fallbackClassName = "", onError, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  if (!props.src || failed) {
    return <span className={`safe-image-fallback ${fallbackClassName}`.trim()} role="img" aria-label={fallbackLabel}>{fallbackLabel}</span>;
  }
  return <Image {...props} alt={props.alt ?? ""} onError={(event) => { setFailed(true); onError?.(event); }} />;
}

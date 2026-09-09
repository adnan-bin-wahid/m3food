"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "./utils";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  fallbackClassName?: string;
}

const DEFAULT_FALLBACK = "/niyamah/placeholder.png";

/** next/image wrapper that falls back to a placeholder on load error. */
export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  fallbackClassName,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [errored, setErrored] = useState(false);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      className={cn(className, errored && fallbackClassName)}
      onError={() => {
        if (!errored) {
          setErrored(true);
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
}

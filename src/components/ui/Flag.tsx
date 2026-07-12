"use client";

import { useState } from "react";
import { getFlagPath } from "@/lib/utils";

interface Props {
  team: string;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

// Thin <img> wrapper that swaps in the TBD placeholder if the intended
// flag PNG isn't present. Prevents the browser's broken-image glyph
// from ever showing on a country we haven't added assets for yet.
export function Flag({ team, className = "", alt, style }: Props) {
  const [src, setSrc] = useState(() => getFlagPath(team));
  return (
    <img
      src={src}
      alt={alt ?? team ?? ""}
      className={className}
      style={style}
      onError={() => {
        if (!src.endsWith("/flags/tbd.png")) setSrc("/flags/tbd.png");
      }}
    />
  );
}

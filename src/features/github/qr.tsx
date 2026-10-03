"use client";

import { encode } from "uqr";
import type { ReactElement } from "react";
import { strings } from "@/lib/strings";

/** QR on a solid high-contrast host — never place on translucent glass alone. */
export function QrSvg({ value, size = 96 }: { value: string; size?: number }) {
  const { size: n, data } = encode(value, { ecc: "L", border: 1 });
  const cells: ReactElement[] = [];
  for (let y = 0; y < n; y++) {
    const row = data[y]!;
    for (let x = 0; x < n; x++) {
      if (row[x]) {
        cells.push(
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#000" />,
        );
      }
    }
  }
  return (
    <div className="inline-flex shrink-0 rounded-[var(--radius-sm)] bg-white p-[0.35rem] shadow-[inset_0_0_0_1px_#e4e4e7]">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${n} ${n}`}
        className="block"
        aria-label={strings.github.qrAria}
      >
        {cells}
      </svg>
    </div>
  );
}

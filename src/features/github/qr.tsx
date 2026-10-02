"use client";

import { encode } from "uqr";
import type { ReactElement } from "react";

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
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${n} ${n}`}
      className="shrink-0 rounded bg-white p-1"
      aria-label="QR code for GitHub device login"
    >
      {cells}
    </svg>
  );
}

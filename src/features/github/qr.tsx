"use client";

import { encode } from "uqr";
import type { ReactElement } from "react";

/**
 * QR always renders on a solid high-contrast host (.qr-surface).
 * Never place this on a glass / translucent panel without the wrapper.
 */
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
    <div className="qr-surface">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${n} ${n}`}
        className="block"
        aria-label="QR code for GitHub device login"
      >
        {cells}
      </svg>
    </div>
  );
}

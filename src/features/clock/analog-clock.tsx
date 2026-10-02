"use client";

type Props = {
  hours: number;
  minutes: number;
  seconds: number;
  /** Fractional seconds 0–1 for smooth sweep (optional). */
  secondFraction?: number;
};

/**
 * Thin-hand analog, no numerals. Soft translucent face (no backdrop-filter).
 * Seconds hand is always accent-colored (StandBy Analog Minimal).
 */
export function AnalogClock({
  hours,
  minutes,
  seconds,
  secondFraction = 0,
}: Props) {
  const continuousSeconds = seconds + secondFraction;
  // 12h face: 30° per hour, +0.5° per minute
  const hAngle = ((hours % 12) + minutes / 60 + continuousSeconds / 3600) * 30;
  // 6° per minute, +0.1° per second
  const mAngle = (minutes + continuousSeconds / 60) * 6;
  // 6° per second
  const sAngle = continuousSeconds * 6;

  return (
    <div className="standby-analog" role="presentation">
      <svg
        className="standby-analog__face"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <circle className="standby-analog__disk" cx="50" cy="50" r="46" />

        {/* 12 hour ticks; longer marks at cardinals */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const cardinal = i % 3 === 0;
          const inner = cardinal ? 36 : 40;
          const outer = 44;
          return (
            <line
              key={i}
              className={
                cardinal
                  ? "standby-analog__tick standby-analog__tick--cardinal"
                  : "standby-analog__tick"
              }
              x1={50 + Math.sin(a) * inner}
              y1={50 - Math.cos(a) * inner}
              x2={50 + Math.sin(a) * outer}
              y2={50 - Math.cos(a) * outer}
            />
          );
        })}

        {/* Hands in <g> so rotation origin stays reliable across browsers */}
        <g transform={`rotate(${hAngle} 50 50)`}>
          <line
            className="standby-analog__hand standby-analog__hand--hour"
            x1="50"
            y1="54"
            x2="50"
            y2="28"
          />
        </g>
        <g transform={`rotate(${mAngle} 50 50)`}>
          <line
            className="standby-analog__hand standby-analog__hand--minute"
            x1="50"
            y1="56"
            x2="50"
            y2="18"
          />
        </g>
        <g transform={`rotate(${sAngle} 50 50)`}>
          <line
            className="standby-analog__hand standby-analog__hand--second"
            x1="50"
            y1="58"
            x2="50"
            y2="14"
          />
        </g>

        <circle className="standby-analog__hub" cx="50" cy="50" r="2" />
      </svg>
    </div>
  );
}

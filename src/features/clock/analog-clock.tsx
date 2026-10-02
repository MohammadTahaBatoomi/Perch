"use client";

type Props = {
  hours: number;
  minutes: number;
  seconds: number;
  showSeconds: boolean;
};

/**
 * Thin-hand analog, no numerals. Soft translucent face (no backdrop-filter).
 */
export function AnalogClock({ hours, minutes, seconds, showSeconds }: Props) {
  const hAngle = ((hours % 12) + minutes / 60) * 30;
  const mAngle = (minutes + seconds / 60) * 6;
  const sAngle = seconds * 6;

  return (
    <div className="standby-analog" role="presentation">
      <svg
        className="standby-analog__face"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <circle className="standby-analog__disk" cx="50" cy="50" r="46" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = 50 + Math.sin(a) * 40;
          const y1 = 50 - Math.cos(a) * 40;
          const x2 = 50 + Math.sin(a) * 44;
          const y2 = 50 - Math.cos(a) * 44;
          return (
            <line
              key={i}
              className="standby-analog__tick"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
            />
          );
        })}
        <line
          className="standby-analog__hand standby-analog__hand--hour"
          x1="50"
          y1="50"
          x2="50"
          y2="28"
          transform={`rotate(${hAngle} 50 50)`}
        />
        <line
          className="standby-analog__hand standby-analog__hand--minute"
          x1="50"
          y1="50"
          x2="50"
          y2="18"
          transform={`rotate(${mAngle} 50 50)`}
        />
        {showSeconds && (
          <line
            className="standby-analog__hand standby-analog__hand--second"
            x1="50"
            y1="54"
            x2="50"
            y2="14"
            transform={`rotate(${sAngle} 50 50)`}
          />
        )}
        <circle className="standby-analog__hub" cx="50" cy="50" r="1.8" />
      </svg>
    </div>
  );
}

/**
 * Ambient mesh for glass depth. Orbs animate transform only (≥60s).
 * No SVG refraction filters — battery/OLED friendly.
 */
export function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden>
      <div className="ambient__orb ambient__orb--1" />
      <div className="ambient__orb ambient__orb--2" />
      <div className="ambient__orb ambient__orb--3" />
      <div className="ambient__grain" />
    </div>
  );
}

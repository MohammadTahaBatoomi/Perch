# Perch design system — Liquid Glass + StandBy

Dark-first, English-only (`lang="en"` `dir="ltr"`) desk-phone dashboard. Tokens live in [`src/app/globals.css`](../src/app/globals.css). Copy lives in [`src/lib/strings.ts`](../src/lib/strings.ts).

## OLED / battery constraints

1. **Blur budget:** `backdrop-filter` only on `.glass-nav` and `.glass-elevated`.
2. **Cards:** translucent fill + dim specular + shadow — no blur.
3. **No SVG refraction filters.**
4. **Ambient:** transform-only, ≥60s periods; paused under `prefers-reduced-motion`.
5. **QR:** always on `.qr-surface` (solid white).
6. **Highlights** stay dim for burn-in compatibility.
7. Animate only `transform` / `opacity`.

## Clock styles (StandBy)

Selectable in Settings → Clock style (`settings.clockStyle`):

| Id | Label | Look |
|----|-------|------|
| `glass` | Glass Digital | Large clipped-gradient digits, soft drop-shadow, tabular nums |
| `solid` | Solid Bold | Opaque high-contrast digits (far reading / a11y) |
| `analog` | Analog Minimal | Thin hands, tick marks, accent seconds hand; soft face fill (no blur) |

Optional **Timer mode** (`settings.showTimer`): mm:ss with SVG progress ring + capsule controls.

### Typography

- Geist (`--font-sans`), weight ~200–300 for glass / 600 for solid
- `font-variant-numeric: tabular-nums`, letter-spacing `-0.04em`, line-height `0.9`
- Fluid size via `clamp()` + container query units (`cqmin` / `cqw`)
- Colon opacity pulse (1s); digit flip = translateY + opacity (250ms); both off under reduced motion

### Accessibility

- Clock: `role="img"` + `aria-label` updated at most once per minute
- `prefers-contrast: more` → force Solid Bold
- `prefers-reduced-transparency: reduce` → glass digits → solid

## Night mode (StandBy)

`settings.nightMode`: `off` | `auto` | `on`

- **Auto:** local hour in `[nightStartHour, nightEndHour)` (wraps midnight) **or** `AmbientLightSensor` illuminance &lt; 12 (progressive enhancement)
- When active (`html[data-night-mode="1"]`):
  - Pure OLED black `#000` background; ambient orbs hidden
  - Single warm red/amber palette — no white UI chrome
  - Digits dimmed; glass highlights removed; blur stripped
  - Animations stopped except the clock tick
  - 600ms color cross-fade

Legacy `nightDim` migrates to `nightMode: "on"` on load.

## Time format

`settings.hour12`: `system` (default) | `12` | `24`. Gregorian dates via `Intl.DateTimeFormat('en-US', …)`.

## Glass variants

| Class | Blur? | Use |
|-------|-------|-----|
| `.card` / `.glass*` soft | No | Content panels |
| `.glass-nav` | Yes | Header capsule |
| `.glass-elevated` | Yes | Drawer / sheet |
| `.qr-surface` | Solid | QR host |

## Strings

All user-facing English copy is centralized in `src/lib/strings.ts` for future locales. Do not hardcode UI labels in components.

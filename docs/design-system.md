# Perch design system — Liquid Glass

Dark-first visual language for the landscape desk-phone dashboard. Tokens and materials live in [`src/app/globals.css`](../src/app/globals.css).

## OLED / battery constraints (Phase 1)

1. **Blur budget:** real `backdrop-filter` only on `.glass-nav` (header) and `.glass-elevated` (settings drawer, repo sheet).
2. **Cards / soft panels:** translucent fill + dim specular inset + shadow — **no** `backdrop-filter`.
3. **No SVG refraction / displacement filters.**
4. **Ambient:** animate **only** `transform`, period ≥ 60s (`72s` / `84s` / `96s`); paused under `prefers-reduced-motion`.
5. **QR:** always on `.qr-surface` (solid white). Never on glass.
6. **Highlights** stay dim (`--glass-highlight` ≈ 18% white) for burn-in compatibility.
7. **Logical properties** for spacing/positioning on touched rules.

## Tokens

| Group | Examples |
|-------|----------|
| Color | `--background`, `--foreground`, `--muted`, `--accent`, `--success`, `--warning`, `--danger` |
| Glass | `--glass-bg`, `--glass-bg-strong`, `--glass-bg-clear`, `--glass-bg-tinted`, `--glass-border`, `--glass-highlight`, `--glass-blur`, `--glass-saturate`, `--glass-shadow-sm/md/lg` |
| Radius | `--radius-xs` … `--radius-2xl`, `--radius-pill` |
| Motion | `--ease-spring`, `--duration-*`, `--ambient-duration` |
| Z | `--z-ambient`, `--z-content`, `--z-nav`, `--z-night`, `--z-overlay` |

Accent is runtime-overridden via `--accent` on `documentElement`.

## Glass variants

| Class | Blur? | When to use |
|-------|-------|-------------|
| `.card` / `.glass` / `.glass-clear` / `.glass-tinted` | No | Content panels |
| `.glass-nav` | Yes | Floating capsule header |
| `.glass-elevated` | Yes | Settings drawer, repo sheet |
| `.qr-surface` | No (solid) | QR host only |

**Do not** put `backdrop-filter` on scrolling content, nested glass, buttons, scrims, or QR.

## Typography on glass

`.font-vazir` forces **weight 700** (Bold file) so Jalali labels stay readable on translucent panels. Pair with `text-foreground` (not muted) for primary Persian lines.

## Accessibility

- `prefers-reduced-motion` — ambient orbs stop; transitions/animations disabled
- `prefers-reduced-transparency` / `prefers-contrast: more` — near-opaque solids + stronger borders; blur stripped
- `@supports` fallback when `backdrop-filter` is missing (blur panels only)

## Usage rules

**Use blurred glass when** the surface is chrome floating above content (nav, modal/sheet).

**Use soft (no-blur) glass when** the surface is a content card.

**Avoid glass when** it would nest blur, cover a QR, or drop contrast below WCAG AA.

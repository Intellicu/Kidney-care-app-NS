CliniCals is a mobile-first, offline-capable bedside reference for pediatric nephrology: drug dosing, 40+ clinical engines, calculators and guidelines. The interface is dense, calm and clinical. Every screen has to be readable at a busy bedside on a phone, so clarity beats decoration.

## Content fundamentals

- Write like a senior colleague giving a bedside answer. Short, declarative, specific: "Dose adjusted for eGFR 38", "Enter weight in kg before calculating a mg/kg dose".
- Lead with the number and its unit, then the context: "64 mL/min/1.73m²", "CKD stage G2". Always show units; never assume mg.
- Name the source of a recommendation (KDIGO 2024, IPNA, IAP). The product promise is that every recommendation is traceable, and that it refuses to guess.
- Every calculated dose shows its calculation trail. Ranges stay ranges ("8-12 h"), per-day and per-dose are stated explicitly.
- Sentence case for buttons, titles and tabs ("Calculate eGFR", "Save to case"). Severity labels are the one exception and are uppercase: EMERGENCY, URGENT, WARNING, INFO.
- Address the clinician as "you" only when asking for input. Do not use "I" for the app.
- Emoji appear only as severity markers (🔴 🟠 🟡 🔵) in `SeverityBadge`. Do not use emoji anywhere else.

## Visual foundations

### Colour

- Two layers exist and both are real. The shadcn tokens (`background`, `foreground`, `card`, `primary`, `muted`, `border`, `ring` and their pairs) style every component in `components/`. The screens themselves are built with Tailwind's slate and blue palette, which is recorded here as `slate-*`, `blue-*` and the tint families.
- Page ground: `background` (a pale blue-grey) for components; the app shell paints a gradient from `bg-gradient-start` to `bg-gradient-end`. Content sits on `card` (white) surfaces.
- Text: `foreground` or `slate-700` for body, `slate-900` for titles, `slate-500`/`muted-foreground` for secondary text. Do not use `slate-400` for text that must be read; it is for icons and hints.
- Actions: shadcn `primary` is near-black and is the default Button. On screens, the primary action and link colour is `blue-600` with `blue-700` on hover.
- Brand: `brand-teal` is the identity colour (icon tile, PWA theme colour). Use it for the mark and sparing brand accents with `teal-50`/`teal-700`, not for every button.
- Status tints follow one recipe: a `-50` fill, a `-200` border, a `-600` icon and a `-800` text. Green means normal or safe, amber means caution, red means danger or out of range, blue means information, purple means AI features and Clinic Mode, indigo means research and education.
- Clinical severity uses its own fixed palette: `severity-emergency-*`, `severity-urgent-*`, `severity-warning-*`, `severity-info-*`. Use `SeverityBadge` rather than recolouring alerts by hand. Severity always carries a word and a coloured dot, never colour alone.
- Charts use `chart-1` to `chart-5` in order; the dark theme has its own set.
- Dark mode follows the shadcn `.dark` values and the shell's `prefers-color-scheme` values. Very few screens set `dark:` classes yet, so treat dark as partial.

### Type

- One family: the system sans stack (`sans`). There are no brand font files. Numbers, doses, lab values and formulas use `mono` (`mono-xs`).
- The scale is Tailwind's. `text-xs` is the workhorse (chips, table cells, engine output) and `text-sm` is body and controls. Titles use `text-lg` to `text-2xl` in bold; large results use `text-3xl` bold.
- Weight carries hierarchy more than size: bold for titles and values, semibold for labels, regular for prose. Inputs are forced to 16px on mobile to stop iOS zoom.

### Spacing and layout

- 4px grid. `space-2` (8px) is the default gap, `space-3` and `space-4` are panel padding, `space-6` is card padding.
- Touch targets are at least 48px on mobile (`space-12`); tab-bar buttons are 56px. The mobile tab bar is `tab-bar-height` plus the safe-area inset.
- Desktop: a floating sidebar (`radius-3xl`, `shadow-2xl`, `sidebar-bg`) sits 24px from the viewport edges, with content offset beside it. Header is 56px, sticky, `bg-white/90` with blur and `shadow-sm`.

### Shape, borders and depth

- Corners: `radius-md` for controls, `radius-lg` for alerts and dialogs, `radius-xl` for cards and tiles (the most used), `radius-2xl` for feature tiles, `radius-full` for pills and switches.
- Borders do most of the separating: 1px `border` (or `slate-200` on screens). Shadows stay light: `shadow-sm` or `shadow` on cards, `shadow-lg` and up only for floating layers.
- Focus: a solid 2px `focus-outline` ring with 2px offset on every focusable element; shadcn components use `ring`. Never remove focus styles.

### Motion

- Short and functional: 150 to 200ms colour transitions, fade and zoom for dialogs and menus, a slide-in drawer on mobile. No decorative motion.

## Iconography

- Icons come from `lucide-react` (0.475): 1.5 to 2px strokes, `w-4 h-4` inside controls and `w-5 h-5` in navigation, coloured with the surrounding text. There are no icon files in the repository, so no icon set is copied here; import from lucide by name.
- A small custom `GoogleIcon` component exists for sign-in only.
- The app mark is the "Cc" teal tile in Logos.

## Components

Thirteen components are bundled live from `src/components/ui` and `SeverityBadge`: Button, Badge, SeverityBadge, Alert, Card, Input, Checkbox, Switch, Select, Tabs, Progress, Table and Dialog. They read the shadcn colour tokens and the radius tokens, so token edits on this page change them. `SeverityBadge` is the exception: its colours are fixed in `severitySystem.js` and match the `severity-*` tokens.

## Not synced

- Not brought in: the other 32 shadcn primitives in `src/components/ui` (accordion, sheet, sidebar, toast and the rest) and the app-specific components (engines, hubs, calculators).
- Skipped values: `calc()`-based radii were converted to their literal results (`radius-md` 6px, `radius-sm` 4px); `--radius` itself is `radius-lg`. Safe-area variables (`env()`) were not tokenised. `mobile-optimization.css` hard-codes slate and blue hexes that are already covered by the palette tokens.
- Fonts: none to fetch; the app uses the system stack.
- Build route: built. The components were bundled from the repository's own source with its locked dependency versions, and the stylesheet was compiled with the repository's Tailwind configuration, reading complete colour values from these tokens instead of `hsl(var(--x))`.

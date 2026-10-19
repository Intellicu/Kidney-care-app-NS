# CliniCals design system: rules for any coding agent

This project uses the CliniCals design system (pediatric nephrology bedside reference, by Dr Swarnim). Follow these rules for every screen and component you create.

## Read first
- `design-system/brand-book.md`: tone, colour roles, type, spacing, iconography.
- `design-system/components/<Name>.md`: when and how to use each component.
- `design-system/tokens.json`: every token with its value and usage note.

## Stack
- React with Tailwind CSS and shadcn/ui-style components in `src/components/ui/`. Import them as `@/components/ui/button` etc.; `@` must resolve to `src/`.
- Styles: import `design-system/clinicals.css` once in the global stylesheet. Tailwind v4: also import `design-system/theme-v4.css` after it. Tailwind v3: use the root `tailwind.config.js`.
- Dependencies: `@radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-switch @radix-ui/react-checkbox @radix-ui/react-select @radix-ui/react-dialog @radix-ui/react-progress class-variance-authority clsx tailwind-merge lucide-react`, plus `tailwindcss-animate` (v3) or `tw-animate-css` (v4).
- Icons: `lucide-react` only. No emoji, except the severity dots inside `SeverityBadge`.

## Hard rules
1. Reuse the existing components (Button, Badge, SeverityBadge, Alert, Card, Input, Checkbox, Switch, Select, Tabs, Progress, Table, Dialog) before writing new ones. Do not restyle them with ad hoc colours.
2. Never hard-code hex values in components. Use token classes: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-brand-teal`, `bg-severity-emergency-bg`, or the Tailwind slate/blue/status shades listed in tokens.json.
3. Clinical severity is shown with `SeverityBadge` (emergency, urgent, warning, info), always with words, never colour alone.
4. Status tints: `-50` fill, `-200` border, `-600` icon, `-800` text. Green = normal, amber = caution, red = danger, blue = information, purple = AI features, indigo = research.
5. Type: system sans; `text-xs` and `text-sm` for most UI, bold titles, `font-mono` for doses and lab values. Inputs are 16px on mobile.
6. Layout: mobile-first, 4px spacing grid, `gap-2` default, cards `rounded-xl border bg-card shadow-sm p-4` (p-6 on desktop), touch targets at least 48px.
7. Copy: sentence case, number and unit first ("64 mL/min/1.73m²"), name the guideline source, show the calculation trail for every dose, never assume units.
8. Keep text contrast at least 4.5:1. Do not use `slate-400` for readable text.
9. App icon: `public/icons/icon-512.svg` and `icon-192.svg` (teal tile with "Cc"). Do not redraw it.

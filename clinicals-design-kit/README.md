# CliniCals design kit

Drop this folder's contents into the root of a new React + Tailwind app.

```
AGENTS.md                      rules every coding agent reads (Antigravity loads it automatically)
AI-STUDIO-PROMPT.md            the same rules as one message for Google AI Studio
tailwind.config.js             Tailwind v3 config (skip on Tailwind v4)
design-system/clinicals.css    all tokens as CSS variables, light + .dark
design-system/theme-v4.css     Tailwind v4 mapping of the tokens
design-system/tokens.json      tokens with usage notes
design-system/brand-book.md    the brand book
design-system/components/*.md  one guide per component
src/components/ui/*.jsx        the 12 shadcn components from the CliniCals app
src/components/SeverityBadge.jsx, src/lib/severitySystem.js, src/lib/utils.js
public/icons/*.svg             the app icons
```

## Wire it up (once per app)

1. Install: `npm i @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-switch @radix-ui/react-checkbox @radix-ui/react-select @radix-ui/react-dialog @radix-ui/react-progress class-variance-authority clsx tailwind-merge lucide-react`
2. Global CSS:
   - Tailwind v4: `@import "tailwindcss"; @import "tw-animate-css"; @import "../design-system/clinicals.css"; @import "../design-system/theme-v4.css";` (and `npm i tw-animate-css`).
   - Tailwind v3: `@tailwind base; @tailwind components; @tailwind utilities;` then `@import` clinicals.css, and keep the root `tailwind.config.js` (`npm i -D tailwindcss-animate`).
3. Path alias: make `@/` point to `src/` (Vite `resolve.alias`, plus `jsconfig.json`/`tsconfig.json` paths).
4. Dark mode: add `class="dark"` on `<html>`.

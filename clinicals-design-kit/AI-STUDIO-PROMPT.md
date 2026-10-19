Paste this as your first message in Google AI Studio Build mode (after attaching the kit files, or after importing the kit from GitHub), or save it in the app's custom instructions if your workspace has them.

---

Use the CliniCals design system for this whole app. The attached files are the source of truth:

- `AGENTS.md`: the rules. Follow every rule in it.
- `design-system/clinicals.css` and `design-system/theme-v4.css`: the design tokens. Put them in the global stylesheet. If this project loads Tailwind from a CDN script instead of a build step, keep `clinicals.css` as a normal stylesheet and add the colour names from `theme-v4.css` to the Tailwind config (`hsl(var(--name))` for the shadcn colours, `var(--name)` for the rest).
- `src/components/ui/*.jsx`, `src/components/SeverityBadge.jsx`, `src/lib/*.js`: the components. Keep their class names and variants exactly; if the project is TypeScript, convert them to `.tsx` without changing the styling.
- `design-system/brand-book.md` and `design-system/components/*.md`: tone, layout and usage.

Build mobile-first. Reuse these components instead of inventing new styles, use lucide-react icons, never hard-code hex colours, and show clinical severity with SeverityBadge. Before you finish each screen, check it against AGENTS.md.

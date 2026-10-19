# SeverityBadge

A clinical alert row that pairs a severity colour, a dot marker and a message.

Source: `src/components/SeverityBadge.jsx` with colours from `src/lib/severitySystem.js`.

- `severity`: `emergency`, `urgent`, `warning` or `info` (falls back to info). Colours are the `severity-*` tokens, fixed in code, so editing tokens here does not change this component.
- `text`: the finding, number first ("K+ 6.8 mmol/L: treat hyperkalemia now").
- `size`: `sm`, `md` (default) or `lg`. `dismissible` with `onDismiss` adds a close button; `onClick` makes the row clickable; `icon` replaces the emoji dot.
- Use one badge per finding, ordered from most to least severe. Never signal severity by colour alone; the dot and wording carry it too.
- Note: the source's urgent and warning text colours sit slightly under 4.5:1 on their fills.

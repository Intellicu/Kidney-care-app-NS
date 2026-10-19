# Button

The single action control, with six variants and four sizes.

Source: `src/components/ui/button.jsx` (shadcn, new-york).

- `variant="default"` (`primary` fill) for the one main action in a panel: "Calculate eGFR", "Add to orders".
- `secondary` and `outline` for supporting actions; `ghost` for toolbar and reset actions; `link` for inline navigation to a guideline.
- `destructive` only for actions that stop or remove something clinically meaningful ("Stop infusion", "Delete case").
- Sizes: `default` 36px, `sm` 32px, `lg` 40px, `icon` 36px square. On mobile the global stylesheet raises every button to a 48px touch target.
- `asChild` renders the styles on a child element, such as a router `Link`.
- The consumer supplies the label (sentence case) and an optional lucide icon as a child; icons are sized to 16px automatically.
- Do not put two `default` buttons side by side.

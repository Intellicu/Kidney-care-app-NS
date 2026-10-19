# Alert

An inline message block with a title and description.

Source: `src/components/ui/alert.jsx`.

- `variant="default"` for neutral guidance ("Dose adjusted for eGFR 38"); `destructive` for blocking problems ("Weight missing").
- Compose with `AlertTitle` and `AlertDescription`; an optional lucide icon as the first child is positioned automatically.
- For triaged clinical findings prefer `SeverityBadge`. In dark mode the destructive text colour from the source is low contrast; see the `destructive` token.

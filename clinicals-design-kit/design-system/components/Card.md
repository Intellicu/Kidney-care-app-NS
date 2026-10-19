# Card

The main content surface: a bordered white panel with header, content and footer parts.

Source: `src/components/ui/card.jsx`.

- Parts: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`. Padding is 24px (`space-6`), corners `radius-xl`, `shadow`.
- Use one card per calculator, engine result or guideline summary. Put the result number in `CardContent` in `text-3xl` bold with its unit beside it in `muted-foreground`.
- Footer holds small actions (`Button size="sm"`).
- The consumer supplies all content; the card adds no behaviour.

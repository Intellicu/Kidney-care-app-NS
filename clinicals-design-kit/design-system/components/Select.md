# Select

A Radix dropdown for choosing one option from a list.

Source: `src/components/ui/select.jsx`.

- Parts: `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectGroup`, `SelectLabel`, `SelectItem`, `SelectSeparator`.
- Use for 4 to 15 mutually exclusive options such as a phenotype or a dosing indication. For two or three options prefer `Tabs` or buttons.
- The consumer supplies items with `value` and visible text; group related items under a `SelectLabel`.

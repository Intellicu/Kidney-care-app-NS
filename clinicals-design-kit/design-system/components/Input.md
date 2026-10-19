# Input

A single-line text or number field.

Source: `src/components/ui/input.jsx`.

- Pass any native input props (`type`, `placeholder`, `value`, `onChange`, `disabled`). Use `type="number"` for measurements and put the unit in the label: "Weight (kg)".
- Wrap in a `label` with `text-sm font-medium`; the field is 36px tall with `radius-md` and an `input` border.
- On mobile the font is forced to 16px to stop iOS zoom.

---
sidebar_position: 3
---

# Design System Notes

The dashboard's look was iterated on directly against feedback (a Creative Tim "Soft UI" reference, then dialed back to be more restrained), rather than following a pre-written spec. This page documents where things landed and *why*, so the intent survives past whoever wrote it.

## Brand color: indigo/violet, single accent hue

Every color token in `index.css` — `--primary`, `--ring`, `--sidebar-primary`, `--accent` — uses the same OKLCH hue (`277`, indigo/violet) at different lightness/chroma. This is deliberate: one brand hue used consistently reads as "designed," not scattered accent colors.

```css title="admin-frontend/src/index.css"
--primary: oklch(0.511 0.234 277);
--ring: oklch(0.6 0.18 277);
--sidebar-primary: oklch(0.511 0.234 277);
```

Gradients (`bg-gradient-to-r from-indigo-500 to-violet-500`) show up on: the primary sign-in button, the active sidebar nav item, avatar fallback initials, and stat card icon badges — a small, consistent set of places, not applied indiscriminately.

## No dark mode

Dark mode was built, then explicitly removed at the user's request — there's no `ThemeContext`, no `.dark` class ever gets applied, and `Toaster`'s theme prop is hardcoded to `"light"` (it originally read from `next-themes`, which was uninstalled). If dark mode comes back later, note that most `dark:` utility variants are still present dormant inside the shadcn-generated `components/ui/*.jsx` files (harmless dead code — they just never activate since `.dark` is never set) — only the custom `index.css` tokens and the sidebar/login-page hand-written classes were actually cleaned up.

## Glassmorphism: used in exactly two places, deliberately restrained

Early iterations applied a translucent/blurred "glass" treatment broadly (sidebar, cards). After comparing against the Soft UI reference (which turned out to be mostly solid white cards with soft *shadows*, not blur) and explicit "don't overdo it" feedback, glassmorphism was scoped down to just the **login page's form card** (`.glass-panel` class — `backdrop-filter: blur(16px)` over a translucent background). Everywhere else — the sidebar, stat cards, the responses table — uses solid backgrounds.

```css title="admin-frontend/src/index.css"
.glass-panel {
  background-color: oklch(1 0 0 / 55%);
  backdrop-filter: blur(16px);
  border: 1px solid oklch(1 0 0 / 40%);
}
```

## Soft shadows on cards, applied globally

Unlike glassmorphism, the soft-shadow treatment *is* applied broadly — every shadcn `Card` gets a faintly brand-tinted shadow instead of a flat/hard one, via a selector on the component's own `data-slot` attribute rather than editing every card usage:

```css
[data-slot="card"] {
  box-shadow: 0 6px 24px -10px oklch(0.2 0.05 277 / 12%);
}
```

## Border radius: one token controls everything

`--radius` (`1rem`) is the single source of truth; `--radius-sm/md/lg/xl/...` are all `calc()` multiples of it, defined once in the `@theme inline` block. Bumping roundedness app-wide (buttons, inputs, cards, sidebar) later is a one-line change, not a find-and-replace across components.

The sidebar's own nav links deliberately **override** this to a tighter `rounded-sm`, and force active-state text to white with `!text-white` — the sidebar's built-in `data-active:` variant styling (from shadcn's generated `sidebar.jsx`) otherwise wins the CSS specificity fight against a plain unconditional `text-white` class, since an attribute-selector-qualified rule beats a plain class selector at equal source order. This is the same category of "modifier vs. plain utility" gotcha as the dark-mode variants above — worth knowing if a similar "my override isn't applying" issue shows up elsewhere in the shadcn components.

## Buttons and inputs: no fixed height, cursor-pointer added

shadcn's default `Button`/`Input` use a fixed `h-8`/`h-9` Tailwind height class, which read as cramped. Both were changed to size themselves from **padding** instead (`py-2.5`, `py-3` depending on size variant) so they're visually taller and less rigid. Native `<button>` elements don't get `cursor: pointer` by default in most browsers — shadcn's generated component doesn't add it either — so `cursor-pointer` (and `cursor-not-allowed` when `disabled`) was added to the shared `buttonVariants` base class, covering every button in the app from one place.

## Typography

Poppins, self-hosted via `@fontsource/poppins` (weights 300–700), replacing the scaffolded default (Geist). Set once as `--font-sans` in the `@theme inline` block and applied globally via `html { @apply font-sans; }` — no per-component font classes anywhere.

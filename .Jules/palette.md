## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2023-10-25 - Skip to Content Pattern
**Learning:** Adding a skip-to-content link correctly requires targeting a focusable container. By default, `<main>` is not focusable.
**Action:** Always ensure the target `<main>` element has `tabindex="-1"` and apply `#content:focus { outline: none; }` to prevent visually jarring generic browser outlines when the programmatic jump occurs.

## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2026-09-06 - Programmatic Focus for Skip Links
**Learning:** Adding a `skip-link` targeting an `id` is insufficient for some screen readers; the target element itself (e.g. `<main>`) must have `tabindex="-1"` so it can be programmatically focused when the skip link is activated.
**Action:** When creating skip links, ensure the target element receives `tabindex="-1"` to properly capture keyboard focus.

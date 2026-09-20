## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2024-05-24 - Skip-to-Content Link Focus States
**Learning:** Adding a skip-to-content link requires the target (`<main id="content">`) to have `tabindex="-1"` so it can receive programmatic focus without entering the natural tab order. However, browsers often apply an ugly default outline when it receives focus, which confuses mouse users who might click there, or keyboard users jumping there.
**Action:** When implementing skip-to-content links targeting main elements, always retain `tabindex="-1"` on the target and explicitly add `#content:focus { outline: none; }` in global CSS (like `base.css`) to prevent unwanted visual outlines, while maintaining the screen reader jump capability.

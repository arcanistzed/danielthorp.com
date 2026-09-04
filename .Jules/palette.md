## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2026-09-04 - Skip-to-Content Link Mechanics
**Learning:** A skip-to-content link only correctly manages focus if the target container (e.g. `<main id="content">`) has `tabindex="-1"`. Without this, subsequent keyboard navigation won't reliably start from the new position in all browsers. Additionally, removing the default focus outline from the container (`#content:focus { outline: none; }`) is required to avoid a jarring visual ring around the entire page content.
**Action:** Always pair skip-to-content links with `tabindex="-1"` and `outline: none` on their target container.

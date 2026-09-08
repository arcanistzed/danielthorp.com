## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.
## 2026-09-08 - Programmatic Focus for Skip Links
**Learning:** Skip-to-content links that target anchors without a `tabindex="-1"` may scroll the page visually but fail to transfer programmatic focus for screen readers and keyboard users in some browsers, meaning subsequent tabs restart from the top.
**Action:** Always add `tabindex="-1"` to the target container (e.g., `<main id="content">`) of a skip-to-content link to ensure programmatic focus correctly follows the visual scroll.

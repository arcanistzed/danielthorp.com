## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2024-09-21 - Skip-to-content Jump Targets
**Learning:** When creating a skip-to-content link, jumping to an `<main id="content">` element without `tabindex="-1"` fails to programmatically move focus in some browsers. However, adding `tabindex="-1"` can cause the browser to visually draw a default focus outline ring around the entire main content area on jump, which is visually jarring and unintended.
**Action:** Always pair `tabindex="-1"` on the target container with `#target-id:focus { outline: none; }` in CSS to preserve programmatic accessibility focus without degrading visual UX.

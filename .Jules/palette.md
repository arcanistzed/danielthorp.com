## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.
## 2024-05-18 - Skip-to-Content Focus Issue
**Learning:** The skip-to-content link targeted `<main id="content">`, but some browsers and screen readers fail to move programmatic focus if the target element isn't inherently focusable.
**Action:** When creating skip-to-content links, ensure the target element has `tabindex="-1"` so it can receive programmatic focus without altering the normal tab order.

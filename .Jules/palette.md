## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2026-09-02 - Keyboard Focus and Skip Links
**Learning:** A standard "Skip to content" anchor link (`<a href="#content">`) will scroll the viewport visually, but it won't actually move the underlying keyboard focus to the target container unless the target is focusable. If the user tabs again, focus will jump back to the top of the page.
**Action:** Always add `tabindex="-1"` to the target of a skip link (e.g. `<main id="content" tabindex="-1">`) so that keyboard focus properly shifts when the link is activated, while keeping it out of the normal tab order. Also, ensure the target element has an `outline: none` rule in CSS so it doesn't show an unsightly focus ring when programmatically focused.

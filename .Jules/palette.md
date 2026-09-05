## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.
## 2026-09-05 - Skip-link target programmatic focus
**Learning:** Skip-to-content links that target a container without naturally focusable elements (like `<main>`) might fail to move the screen reader's virtual focus cursor to that new location in some browsers/screen-readers unless the target has `tabindex="-1"`.
**Action:** Always add `tabindex="-1"` to the skip-to-content target container (e.g. `<main id="content" tabindex="-1">`) to ensure reliable programmatic focus.

## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2026-10-11 - Skip Link Focus Accessibility
**Learning:** When implementing a skip-to-content link, using a generic `.sr-only:focus` to reveal it can unintentionally expose other screen-reader-only elements when they receive focus. Additionally, the target element needs `tabindex="-1"` and `outline: none` to allow programmatic focus without visual jank.
**Action:** Always use a specific class like `.skip-link` for focus visibility styles, and ensure the jump target (`<main>`) is explicitly focusable without default browser outlines.

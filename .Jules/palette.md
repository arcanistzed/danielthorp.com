## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2026-08-25 - Skip Link Accessibility
**Learning:** For a skip link to function correctly and shift keyboard focus for screen readers, the target container must have `tabindex="-1"`. When applying programmatic focus this way, the browser's default outline should be suppressed with `:focus { outline: none; }` to avoid an unsightly flash when jumping.
**Action:** Ensure that skip-to-content targets always have `tabindex="-1"` and an `outline: none` style on focus.

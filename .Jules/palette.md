## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2026-08-26 - Keyboard Focus on Rounded Containers
**Learning:** When styling anchor links (`<a>`) that wrap entire list items (`<li>`) or cards, if the parent has rounded corners (`border-radius`), the child link will have a sharp rectangular focus ring inside the rounded border unless `border-radius: inherit` is applied.
**Action:** Always verify keyboard focus states on block-level links wrapping rounded containers, and add `border-radius: inherit` to ensure the focus ring wraps the corners correctly.
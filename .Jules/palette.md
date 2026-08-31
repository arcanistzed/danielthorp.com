## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2026-08-23 - Focus Rings on Clickable Cards
**Learning:** When turning a whole card (like an `<li>`) into a clickable area using a block-level `<a>` tag, the focus outline on the `<a>` tag will look sharp and unpolished if the container has rounded corners.
**Action:** Always add `border-radius: inherit;` to the full-width `<a>` tag so that the `:focus-visible` ring gracefully traces the rounded corners of its container.

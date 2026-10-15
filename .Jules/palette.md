## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2026-08-25 - Skip to Content Target Focus Management
**Learning:** When implementing a Skip to Content link, pointing `href` to a structural container like `<main>` will not guarantee focus transfer in some browsers unless the container is explicitly made focusable. Furthermore, focusing `<main>` can create an unexpected outline ring around the entire page.
**Action:** Always add `tabindex="-1"` to the target element (e.g. `<main id="content" tabindex="-1">`) to allow programmatic focus without interrupting natural tab order. Additionally, apply `#content:focus { outline: none; }` to prevent visual noise while still maintaining proper accessibility context. For the skip link itself, use a dedicated class (`.skip-link`) for focus styles to avoid inadvertently revealing all visually hidden `.sr-only` elements during focus navigation.

## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.
## 2026-08-23 - Skip to Content Target Keyboard Accessibility
**Learning:** Adding a "skip to content" link that targets `<main id="content">` requires the `<main>` tag to maintain programmatic focus for screen readers to correctly jump to the section and read its contents. Without `tabindex="-1"`, standard anchor links just scroll without updating focus accurately.
**Action:** Always add `tabindex="-1"` to the target element (like `<main id="content" tabindex="-1">`) of skip-links.

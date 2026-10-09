## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.
## 2024-11-09 - Accessible Skip Link Targeting
**Learning:** When building skip-to-content links that target a container like `<main>`, giving the target `tabindex="-1"` is essential for allowing programmatic focus. However, some browsers apply an unsightly default outline to `tabindex="-1"` elements when focused programmatically, even though it's not interactive.
**Action:** Always pair `tabindex="-1"` on skip link targets with `[id]:focus { outline: none; }` to maintain a clean visual experience while preserving accessibility semantics.

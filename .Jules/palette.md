## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.
## 2024-05-18 - Skip Link Focus Management
**Learning:** Skip-to-content links that target generic layout wrappers (like `<main>`) require programmatic focus management (`tabindex="-1"`) to ensure the accessibility tree reliably updates for screen readers. This ensures keyboard flow continues from the `<main>` tag, rather than restarting at the top of the page.
**Action:** When implementing skip links to non-interactive layout containers, always pair the target with `tabindex="-1"` and outline suppression (`#content:focus { outline: none; }`) to maintain semantic flow without introducing ugly visual artifacts.

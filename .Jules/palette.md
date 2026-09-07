## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2024-05-20 - Skip-to-Content Link Target Focus
**Learning:** Skip-to-content links require the target element (e.g., `<main>`) to have `tabindex="-1"`. Without this, programmatic focus may not shift correctly in some screen readers, rendering the skip link ineffective. Furthermore, removing the default focus outline on this specific programmatic focus (`main:focus { outline: none; }`) prevents visual artifacts for non-interactive elements while retaining screen reader context.
**Action:** Always ensure skip-to-content link targets receive `tabindex="-1"` to guarantee focus transitions for screen readers, and suppress visual focus outlines on structural elements like `<main>` to preserve aesthetic polish.

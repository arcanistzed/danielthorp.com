## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2024-05-24 - Safe Skip-to-Content Patterns
**Learning:** Globally modifying `.sr-only:focus` to reveal hidden elements can unintentionally expose other screen-reader-only elements when they receive focus. Additionally, programmatic jump targets like `<main id="content">` require `tabindex="-1"` and `outline: none` on focus to avoid jarring visual browser outlines while supporting correct screen reader flow.
**Action:** Use specific classes (e.g., `.skip-link`) for focusable visually hidden elements, and always ensure destination targets have `tabindex="-1"` combined with `:focus { outline: none; }` to reset the programmatic focus ring without visual side effects.

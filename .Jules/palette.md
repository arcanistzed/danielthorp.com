## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2024-05-18 - Astro Global Focus Reset
**Learning:** When implementing a global skip-to-content link in Astro targeting a `tabindex="-1"` element, browser default outlines will apply upon jump.
**Action:** Always include a specific outline override for the target element (e.g., `#content:focus { outline: none; }`) in the global stylesheet (`src/styles/base.css`) to prevent unwanted visual focus rings when programmatically shifted, without compromising regular focus styles.

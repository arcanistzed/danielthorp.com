## 2024-08-24 - Screen Reader Fallbacks for Block-Level Links
**Learning:** Using `aria-label` on block-level links containing rich semantic children (like `<h3>`, `<time>`) completely overrides the inner accessibility tree for screen readers. The headings and dates inside the link become invisible to the screen reader.
**Action:** Use visually hidden text (`.sr-only` if available) appended inside the link instead of `aria-label` when the link contains semantic children that need to be read. Otherwise, for purely inline links, `aria-label` is safe.

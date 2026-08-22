## 2025-01-28 - Block-level Link Accessibility
**Learning:** Adding `aria-label` to block-level links with rich semantic children (e.g., `<h3>`, `<time>`) overrides their inner accessibility tree, hiding important semantic context from screen readers.
**Action:** Instead of `aria-label`, use visually hidden text (`<span class="sr-only">`) inside the link for supplemental context (like "opens in new tab"). Reserve `aria-label` for simple inline text or icon-only links.

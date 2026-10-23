## 2024-05-18 - Skip-to-content links and tabindex
**Learning:** To ensure screen readers correctly process a jump from a skip-to-content link, the target element (e.g., `<main>`) must have `tabindex="-1"` so it can receive programmatic focus.
**Action:** Always add `tabindex="-1"` to the target of a skip-link and pair it with `outline: none;` on focus to prevent unwanted visual browser outlines on the jump.

## 2024-10-18 - Avoid modifying global .sr-only:focus
**Learning:** Adding `:focus` styles directly to the generic `.sr-only` class can unintentionally reveal screen-reader-only elements that should never be visually exposed when focused (such as dynamically focused aria-live regions or off-screen focusable elements).
**Action:** Always create a specific class like `.skip-link` with its own hidden state and visible `:focus`/`:focus-visible` styles for elements like skip-to-content links that *should* become visible on focus.

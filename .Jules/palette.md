## 2024-10-19 - Added skip-to-content link

**Learning:** When adding skip-to-content links that target programmatic focusable elements (`tabindex="-1"`), standard `sr-only` classes require custom focus overrides (`:focus`, `:focus-visible`) specifically targeting the skip link (e.g. `.skip-link:focus`) to make them visible and reset styles to place them predictably.

**Action:** Continue utilizing `.skip-link` with targeted focus resets for screen reader visually hidden skip-to elements to prevent unhiding all `sr-only` instances on the page unintentionally.

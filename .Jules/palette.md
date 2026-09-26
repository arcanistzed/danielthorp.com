## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2024-11-20 - Leveraging existing visually hidden utility classes
**Learning:** Adding custom CSS classes for accessibility utilities (like `.skip-to-content`) violates the constraint to use existing classes where available. A visually hidden class with focus states (`.sr-only` extended with `:focus`) works better and conforms to the project's styling boundaries.
**Action:** Always inspect the global CSS file (like `src/styles/base.css`) for existing utility patterns before adding new ones, and prefer extending classes like `.sr-only` to handle focusable hidden elements.

## 2026-08-23 - Accessibility for Rich External Links
**Learning:** Adding `aria-label` to block-level links containing rich semantic children (like `<h3>`, `<time>`, `<p>`) overrides the inner accessibility tree for screen readers, hiding important structural information.
**Action:** For simple inline/icon links opening externally, use `aria-label="[Name] (opens in new tab)"`. For rich semantic external links, append `<span class="sr-only"> (opens in new tab)</span>` instead.

## 2026-09-14 - Skip-to-content Target Focus Styles
**Learning:** When navigating via a skip link to a main content container, programmatic focus is required (`tabindex="-1"`) for screen readers to recognize the jump, but it causes a visually jarring browser outline around the entire content area for sighted keyboard users.
**Action:** Always include `#content:focus { outline: none; }` when implementing skip links targeting a main container, to balance visual polish with programmatic accessibility.

## 2024-05-18 - Skip Link Focus Management
**Learning:** Skip links targeting non-focusable elements (like `<main>`) require `tabindex="-1"` and `outline: none` on the target to ensure keyboard focus actually moves to the content area in all browsers without showing a distracting outline.
**Action:** Always verify that skip link targets can receive programmatic focus, especially on single-page layouts.

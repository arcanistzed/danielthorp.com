## 2024-10-21 - Programmatic Focus Outline Mitigation for Skip Links
**Learning:** When directing focus to a structural container like `<main tabindex="-1">` via a skip link, browsers often apply their default focus outline to the entire element, which is visually jarring and breaks the design since it's just meant for internal jumping.
**Action:** Always pair `tabindex="-1"` on programmatic target containers with `#id:focus { outline: none; }` to maintain a clean visual experience while retaining accessibility for screen readers.

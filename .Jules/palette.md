## 2024-05-18 - Added aria-label to complex block link

**Learning:** When a list item uses a block link `<a>` element containing multiple sub-elements like a title (`<h3>`), a date (`<time>`), and description (`<p>`), screen readers may read the text contents sequentially without providing clear context, especially if the link opens in a new tab.

**Action:** Add an explicit `aria-label` to block links that contain multiple sub-elements and open in new tabs to provide concise, screen reader friendly descriptions of the link's purpose and destination.
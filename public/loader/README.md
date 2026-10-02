# Groupal loader

Looping 2.6s loading animation. The smile wipes in, the eyes pop and hop, the bag grows from its center, and then both jump together and fade out. Below them, four colored progress dots (gray, gold, orange, green) pop in and out twice per loop. Pure SVG with SMIL animation, with no CSS, JS or dependencies. If the user prefers reduced motion, hide it or swap in the static isotipo with a `prefers-reduced-motion` media query.

## Files
- `GroupalLoader.tsx`: the animated loader as a React component, with the bag color taken from text color. Use this in the app.
- `groupal-loader.html`: the same animated SVG as a paste-in inline snippet.
- `groupal-mark-on-white.svg` / `groupal-mark-on-navy.svg`: static final-frame marks (no animation), for reduced-motion or fallback use.

The animation must be rendered inline (React or pasted markup), not via `<img src="*.svg">`.

## Use in the web app
```tsx
import { GroupalLoader } from "@/components/GroupalLoader";
<GroupalLoader size={56} className="text-[#002356]" />   // light surfaces
<GroupalLoader size={56} className="text-white" />       // navy surfaces
```
Reduced motion: `@media (prefers-reduced-motion: reduce)` → render `groupal-mark-*.svg` instead.

Note: clip-path ids are fixed (`gl-smile-clip`). The ids are identical across instances, so several inline copies on one page all work.

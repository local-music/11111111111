PhotoBook Studio V7 — geometry export correction

Upload index.html, app.js, viewer.js, style.css to GitHub Pages root.
The viewer needs internet to load Three.js via CDN.

WHAT CHANGED
- 3MF exports are derived from the same 3D meshes used by the live viewer, rather than unrelated cubes.
- Page frames include an open insertion edge, three retaining rails and a backing panel.
- Output is split into individual build-plate 3MF files within a ZIP when needed, to avoid exceeding the 256 x 256 mm P1S build area.
- Cover/page colour materials are included in 3MF resources; Bambu Studio may still require assigning actual filament slots.

IMPORTANT LIMITATIONS
This is a NON-PRINT-READY engineering prototype. The hinges, physical page-to-spine attachment, reliable paper retention, snap joints, printable artwork and tolerances have NOT been validated or completed. The rail/backing meshes are separate solids, not a validated single manifold part. Do not print a whole book yet. Test one page, and do not assume the model is functional. Some photo sizes may need additional plates. This file is a standard 3MF package, not a native Bambu Studio project.

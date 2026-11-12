# Compass adoption

Registry 1.0.17. Official mobile template: https://compass.designcompass.org/compass-mobile-web.md
Sources: https://compass.designcompass.org/r/1.0.17/mobile-app-shell.json and version-matched foundations, input, checkbox, radio-group, progress, badge and sheet Registry entries.

Official source files were imported from the pinned Registry payloads. Foundations CSS was generated from cssVars/css payloads. Actual MobileAppShell, GlassTabBar, Button, Card, RadioGroup, Checkbox, Input, Progress and Sheet are used. No private saved brand exists; Compass defaults apply. Fonts: Pretendard Variable; icons: Lucide.

This version is a single-browser interactive prototype. Family role switching is explicit; no invitations, messaging, real-time presence, real disaster alerts, routing or multi-user synchronization is implied. Meetings and member data are editable examples, not verified shelters. Changed plans invalidate all understanding acknowledgements. Planning/quiz/practice state persists in localStorage. It does not guarantee physical safety or delivery of information.

## Dashboard and offline map revision

- Home lists per-person one-line actions and missing input state.
- Manually enabled incident mode separates self-reported safety from acknowledgement of the current plan revision; timestamps and unknown states remain distinct.
- No cross-device backend is connected. Local status must not be represented as an actual message receipt, emergency service call or real-time family location.
- Personal action may be to stay at home. Understanding questions and rehearsal use each person's action instead of forcing all members to move to one location.
- The bundled map is an actual small-area OpenStreetMap vector extract around Seoul Forest, retrieved 2026-11-12. A prototype meeting marker is explicitly marked as an example, not a verified shelter/entrance or route.
- Source: https://api.openstreetmap.org/api/0.6/map?bbox=127.0385,37.5420,127.0450,37.5475 . Attribution/license: https://www.openstreetmap.org/copyright (ODbL).
- Only this fixed area is supported at present; changing the plan's text to another place does not silently relabel the map. A mismatch is shown until the user deliberately chooses the example place.
- Service worker precaches versioned static app resources and this local map dataset. Save validates cached HTML and map, then stores a local copy of the vector extract. Clearing browser storage removes it. Navigations use the installed app shell; the worker checks for an updated bundle on subsequent online loads.
- Offline restart tested by stopping the local production-preview origin, then reloading and opening/zooming the map. This verifies network-independent app/map loading for that browser origin; no claim about all phone browsers or persistence after browser storage eviction.

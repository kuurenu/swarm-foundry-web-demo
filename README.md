# Swarm Foundry v0.9.0 — Chromebook browser build

This repository contains the compiled Unity WebGL build used for the private playtest link.

## Play

1. Open the GitHub Pages URL in Chrome.
2. Wait for the first download to finish (about 25 MB).
3. Click **出撃する**.
4. Drag left and right to aim the launcher. The same input works with a Chromebook touchpad or touchscreen.
5. Click the pause button at the top right to pause.

Progress is stored in that browser's local site storage. Clearing site data or using Guest/Incognito mode removes the saved progress.

Build: `0.9.0`

## Browser fullscreen compatibility (2026-09-22)

The expand button uses native fullscreen only when available. Browsers without
the API (including the reported iPhone browser), or browsers that reject the
request, expand within the page instead. Browser address/navigation bars may
remain visible. The same button restores the original layout without reloading
the game. Portrait aspect ratio and the exit control are retained in both modes.

Run regression checks with `node --test tests/viewport.test.cjs`.
The nine checks cover missing/disabled APIs, synchronous and asynchronous
failures, standard/WebKit entry and exit, repeated clicks, and viewport changes.
A local browser run with both fullscreen entry APIs removed confirmed continued
combat and repeated expand/restore at phone-sized viewport, with no console errors.
Physical iPhone verification remains separate from desktop emulation.

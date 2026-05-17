# Scenes

This folder is organized for independent 3D story scenes with a shared visual style.

## Canonical structure

- `living-room/`: the current stable first scene, available at `/living-room`.
- `park-chess/`: the second independent park chess scene, available at `/park-chess`.
- `home-dispatch/`: the third independent home dispatch scene, available at `/home-dispatch`.
- `_shared/`: place reusable helpers here only after at least two scenes need the same code.

## Add a new scene

1. Create a new folder, for example `src/scenes/chess/`.
2. Add `ChessExperience.tsx` that exports one top-level React component.
3. Add `index.ts` that re-exports the component.
4. Add that component to the `scenes` list in `src/App.tsx` so it appears on the home page.

## Notes

- Keep each scene independent: its camera, clock, 3D objects, and overlays should live inside its own folder.
- Keep shared style in `src/App.css` while the visual language remains consistent.
- `src/App.tsx` owns only page selection and navigation; it should not contain scene-specific 3D logic.

## TODO

- Revisit and further improve the person model's arm/shoulder connection for more anatomical accuracy and visual appeal.
# AI Development Notes

## Overall Goal

The primary objective is to create a web-based VR real-time strategy (RTS) game. The game will leverage modern web technologies (Vite, TypeScript, and a VR framework) to deliver an immersive RTS experience playable directly in the browser.

This file contains human-readable notes about the development of the web-based VR game project. All notes are written in English and formatted using Markdown for clarity.

---

## Getting Started
- Project uses Vite with TypeScript for fast development and type safety.
- VR framework (e.g., Three.js or A-Frame) will be integrated for immersive experiences.

## How to Use This File
- Add any important information, decisions, or reminders related to AI, game logic, or general development here.
- Use Markdown formatting for sections, lists, and code blocks.

## Example Note
```
- [2025-08-23] Initialized project structure and set up this notes file.
- Always update this file with major changes or design decisions.
```

---


## VR/WebXR Setup
- The project uses Three.js's VRButton for WebXR support. If VR is not available, a fallback message is shown and standard controls are used.
- VR and non-VR modes are both supported and tested.
- TODO: Request WebXR optional feature `hand-tracking` when starting XR session so devices like Quest 3 provide joint data reliably. Consider custom session request instead of VRButton default.

## Camera Naming
- The main camera is named `userCamera` to allow for future support of multiple cameras (e.g., cinematic, minimap, or AI cameras).

## Deployment
- Automated deployment is set up using GitHub Actions. The workflow builds the project and pushes the output to the `gh-pages` branch.
- The repository must be public for GitHub Pages to work. Pages source is set to `gh-pages` branch, root folder.

## Person Model Design
- The person model is built from basic Three.js shapes for simplicity and performance.
- The arm/shoulder connection is a known area for improvement and is tracked in the TODO section above.

## Recent Repo housekeeping

- [2025-08-24] Added `src/commit.ts` to `.gitignore` so build-time writes won't appear in `git status`.
- Note: if `src/commit.ts` was already tracked by git, it will still show as changed until the file is removed from the index (git rm --cached). No git commands were run by the assistant; please untrack the file locally if desired.


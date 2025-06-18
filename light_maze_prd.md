# Light Maze – Product Requirements Document (PRD)

**Version:** 0.1   **Author:** ChatGPT   **Date:** 18 June 2025

---

## 1 Purpose & Scope

Deliver a browser‑based, single‑player 2‑D puzzle game in which the player positions mirrors to steer a continuous neon light‑beam through a maze and activate all crystals. The game must run in any evergreen desktop or mobile browser and be built with vanilla JavaScript, HTML 5 Canvas, and CSS. No external game engines or frameworks are permitted. This PRD will be handed to **Claude Code** for implementation.

## 2 Background & Motivation

Puzzle gamers enjoy short, mentally stimulating challenges they can play anywhere. Simpler codebases attract open‑source contributors and allow easy embedding on educational sites. A minimal vanilla‑JS stack also serves as a learning reference for devs investigating ray‑casting and interactive‑canvas techniques.

## 3 Goals & Success Metrics

| Goal          | KPI                         | Target          |
| ------------- | --------------------------- | --------------- |
| Engagement    | Median session length       |  ≥ 5 minutes    |
| Retention     | Return players after 7 days |  ≥ 25 %         |
| Performance   | FPS on 2018‑era phones      |  ≥ 55 fps       |
| Accessibility | WCAG 2.1 AA criteria        | 100 % compliant |

## 4 Target Audience & Personas

- **Casual puzzle players** aged 14‑40
- **STEM students** exploring light physics concepts
- **Web‑dev learners** seeking clean vanilla‑JS examples

## 5 User Stories

1. *As a player*, I can drag a mirror onto the board so the beam changes direction.
2. *As a player*, I can rotate a mirror with a right‑click/tap so I can fine‑tune the path.
3. *As a player*, I want visual feedback when the beam hits a crystal to know I’m progressing.
4. *As a returning player*, I can resume from the last unlocked level via local storage.
5. *As a speed‑runner*, I can view my move count and elapsed time to optimize my solution.

## 6 Gameplay Overview

- **Initial State** – A single light source emits a continuous beam horizontally.
- **Objective** – Activate (hit) every crystal in the maze.
- **Pieces** – Fixed walls, draggable mirrors (45°/135°), light splitters (optional later milestone), one‑way prisms (stretch goal).
- **Win Condition** – All crystals lit simultaneously.
- **Loss/Retry** – Unlimited undos; a “Reset Level” button.

## 7 Core Loop

1. Player drags or rotates a mirror.
2. Game engine re‑casts the beam in real time (≤ 16 ms per frame).
3. UI updates crystal states, move counter, timer.
4. On success, display a celebratory animation and auto‑advance or return to level‑select.

## 8 Feature Requirements

### 8.1 Level System

- **Data format** – JSON files stored in `/levels/` directory.
- **Fields** : gridSize, walls[], crystals[], mirrorsStartPos[], parMoves.
- Minimum 25 handcrafted levels across 3 difficulty worlds.
- (Stretch) Built‑in level editor gated behind `?editor` query flag.

### 8.2 Mirror Interaction

- Drag‑and‑drop with pointer events.
- Rotate 90° clockwise per right‑click / long‑press.
- Snap to underlying 40 × 40 px grid.

### 8.3 Ray‑Casting Engine

- Incremental step algorithm with vector reflection formula `r = d – 2(d·n)n`.
- Tile‑based collision for walls; angular check for mirror surfaces.
- Support splitting into ≤ 3 child rays (for splitters milestone).

### 8.4 UI / HUD

- Canvas area centered, letter‑boxed.
- Move counter, timer, restart, next‑level CTA.
- Colour‑blind mode: alternate crystal shapes.

### 8.5 Persistence

- `localStorage` keys: `unlockedLevel`, `bestMoves[levelId]`, `bestTime[levelId]`.
- Cloud sync out of scope for v1.

### 8.6 Audio / Visual Polish

- Neon glow via layered canvas strokes + blur filter.
- Optional chiptune soundtrack, SFX for beam contact.
- Respect user’s reduced‑motion preference (prefers‑reduced‑motion CSS query).

## 9 Technical Architecture

```
/public
  index.html
  css/
    styles.css
  js/
    main.js          // entry, game loop
    engine.js        // ray‑casting & collision
    entities.js      // Mirror, Crystal, Wall classes
    ui.js            // HUD & DOM interactions
    levels.js        // loader & registry
  assets/
    sprites.png
    sfx/
  levels/
    world1‑01.json
```

### 9.1 Code Style

- ES2022 modules, strict mode, ESLint Airbnb base.
- Single global `Game` object exported for debugging.

### 9.2 Performance Targets

- 60 fps on desktop Chrome/Firefox, 55 fps on iPhone 11 Safari.
- Memory < 50 MB peak.
- No main‑thread long tasks ≥ 50 ms.

### 9.3 Browser Support Matrix

| Browser       | Min Version |
| ------------- | ----------- |
| Chrome        | 95          |
| Firefox       | 94          |
| Safari        | 15          |
| Edge          | 95          |
| Mobile Safari | 15          |

## 10 Analytics & Telemetry

- Event queue posted to `window.analytics?.track()` stub (null‑safe for sites without analytics).
- Events: `level_start`, `level_complete`, `move_made`, `toggle_colorblind_mode`.

## 11 Accessibility

- Keyboard‑only play: WSAD / arrow keys cycle mirrors, R rotates.
- High‑contrast toggle.
- All controls ARIA‑labeled.

## 12 Dependencies & Constraints

- Must run entirely client‑side; no server component required.
- No third‑party libs except **esbuild** dev dependency for bundling.
- All assets ≥ 70 % Lighthouse performance scores.

## 13 Milestones & Timeline (Proposed)

| Date   | Milestone             | Deliverables                                  |
| ------ | --------------------- | --------------------------------------------- |
| Week 0 | Kick‑off              | Project repo, linting, CI pipeline            |
| Week 1 | Vertical Slice        | One playable level, mirror drag + ray visible |
| Week 3 | Core Feature Complete | 25 levels, level‑select, mobile layout        |
| Week 4 | Polish & QA           | Audio, FX, accessibility pass                 |
| Week 5 | Launch v1             | Deploy to GitHub Pages & itch.io              |

## 14 Acceptance Criteria (per level)

- All crystals activated simultaneously.
- Beam visibly continuous; no flicker with mirror spam.
- Under par moves and < 30 s render stalls.

## 15 Risks & Mitigation

| Risk                                       | Impact | Likelihood | Mitigation                                        |
| ------------------------------------------ | ------ | ---------- | ------------------------------------------------- |
| Ray‑casting performance on low‑end mobiles | Medium | Medium     | Tile‑step cache, requestAnimationFrame throttling |
| Puzzle difficulty curve too steep          | High   | Low        | Play‑test at Week 3 and reorder levels            |
| Drag‑and‑drop UX on touch                  | Medium | High       | Add generous hit‑boxes + snap‑assist              |

## 16 Out‑of‑Scope for v1

- Multiplayer or shared solutions
- Procedural level generator
- Cloud save / account system
- VR / AR mode

## 17 Appendix A – Key Pseudocode Snippets

```js
// engine.js – castRay( origin, dir )
function castRay(o, d, depth = 0) {
  if (depth > 10) return; // recursion guard
  const hit = gridTrace(o, d);
  if (!hit) return;
  renderBeam(o, hit.point);
  if (hit.type === 'mirror') {
    const n = hit.normal; // unit normal
    const r = d.subtract(n.multiply(2 * d.dot(n)));
    castRay(hit.point, r, depth + 1);
  }
}
```

## 18 Appendix B – Asset Checklist

- 3 mirror sprites (45°, 135°, splitter)
- Crystal idle & lit frames (4‑frame loop)
- Beam glow sprite (8 × 8 px)
- UI icons: reset, next, settings
- SFX: beam hum (loop), mirror rotate, crystal ping

---

**End of PRD**


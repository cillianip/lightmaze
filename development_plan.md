# Light Maze - Development Plan

## Overview
A browser-based puzzle game where players position mirrors to direct light beams through mazes to activate crystals. Built with vanilla JavaScript, HTML5 Canvas, and CSS.

## Phase 0: Project Foundation (Week 0)
**Key Focus**: Establish a solid development environment with proper tooling and structure.

### Tasks:
1. **Directory Structure**: Follow the PRD's architecture precisely
2. **Build System**: Use esbuild for fast bundling and hot reload
3. **Code Quality**: ESLint with Airbnb config for consistent code style
4. **Version Control**: Git with conventional commits

## Phase 1: Ray-Casting Engine (Week 1, Days 1-3)
**Key Focus**: The heart of the game - a performant ray-casting system.

### Technical Approach:
- Implement incremental ray stepping with configurable precision
- Use vector math for reflection calculations: `r = d - 2(d·n)n`
- Tile-based spatial partitioning for efficient collision detection
- Maximum recursion depth of 10 to prevent infinite loops
- Cache ray paths for static elements to optimize performance

## Phase 2: Game Entities (Week 1, Days 4-5)
**Key Focus**: Object-oriented design for game elements.

### Core Classes:
- `LightSource`: Emits initial beam with position and direction
- `Mirror`: 45°/135° angles, handles rotation and reflection
- `Crystal`: State management (lit/unlit), activation animations
- `Wall`: Static collision boundaries
- `Splitter` (stretch goal): Divides beam into multiple rays

## Phase 3: Interactive UI (Week 2, Days 1-3)
**Key Focus**: Intuitive controls for both desktop and mobile.

### Implementation Details:
- Pointer events API for unified touch/mouse handling
- Grid snapping (40x40px) with visual feedback
- Right-click/long-press for rotation
- Smooth drag with ghost preview
- Canvas letterboxing for responsive design

## Phase 4: Level System (Week 2, Days 4-5 + Week 3, Days 1-2)
**Key Focus**: Content pipeline and progression.

### Level Design Principles:
- Tutorial levels (1-5): Single mirror solutions
- Intermediate (6-15): Multiple mirrors, timing considerations
- Advanced (16-25): Complex paths, optional splitters
- JSON schema validation for level files
- Par move/time tracking for replayability

## Phase 5: Visual Polish (Week 3, Days 3-4)
**Key Focus**: The "juice" that makes the game feel alive.

### Effects Pipeline:
- Layered canvas rendering for glow effects
- Particle systems for crystal activation
- Smooth beam animation with trail effect
- CSS filters for accessibility modes
- RequestAnimationFrame throttling for consistent 60fps

## Phase 6: Accessibility (Week 3, Day 5 + Week 4, Day 1)
**Key Focus**: Inclusive design for all players.

### Features:
- Full keyboard navigation (WASD/arrows + R for rotate)
- High contrast mode toggle
- Color-blind friendly crystal shapes
- Screen reader support with ARIA live regions
- Reduced motion mode respecting user preferences

## Phase 7: Deployment (Week 4, Days 2-3)
**Key Focus**: Making the game available to players.

### Distribution:
- GitHub Actions for CI/CD
- Automated Lighthouse testing
- GitHub Pages for free hosting
- itch.io release with analytics integration

## Technical Considerations

### Performance Optimization:
- Object pooling for ray segments
- Dirty rectangle rendering
- Web Workers for level preprocessing
- Progressive enhancement for older devices

### Code Architecture:
- Separation of concerns: rendering, logic, input
- Event-driven communication between modules
- Singleton Game object for debugging
- Pure functions for ray calculations

### Risk Mitigation:
- Early mobile testing to catch performance issues
- Automated playtesting for difficulty balancing
- Progressive feature degradation for older browsers

## Development Priorities:
1. Get a playable vertical slice by end of Week 1
2. Validate core mechanics early
3. Iterate on features while maintaining 60fps target
4. Test on mobile devices throughout development
5. Keep accessibility in mind from the start
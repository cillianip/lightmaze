# Light Maze

A browser-based puzzle game where players position mirrors to guide light beams through mazes and activate crystals. Built with vanilla JavaScript, HTML5 Canvas, and CSS.

🎮 **Play now**: https://cillianip.github.io/lightmaze/game.html

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:8080 in your browser

## Game Controls

- **Drag mirrors** - Click and drag to move mirrors
- **Rotate mirrors** - Right-click or long-press on touch devices
- **Reset level** - R key or Reset button
- **Undo move** - Ctrl/Cmd + Z or Undo button
- **Mute music** - M key
- **Mute sound** - S key

## Project Structure

```
public/
├── game.html         # Main game file
├── css/             # Stylesheets
├── js/              # Game source code
│   ├── game-main.js # Entry point
│   ├── engine.js    # Ray-casting engine
│   ├── entities.js  # Game objects
│   ├── game.js      # Core game logic
│   ├── ui.js        # User interface
│   ├── levels.js    # Level management
│   ├── levelSelector.js # Level selection UI
│   ├── audio.js     # Sound and music system
│   ├── particles.js # Particle effects
│   ├── transitions.js # Level transitions
│   ├── performance.js # FPS monitoring
│   └── settings.js  # Settings management
├── assets/          # Game assets
└── levels/          # Level definitions (JSON)
```

## Features

- 🌟 25 handcrafted levels across 3 difficulty worlds
- 🎨 Particle effects and smooth animations
- 🎵 Ambient background music and sound effects
- 📱 Responsive design for desktop and mobile
- ♿ Accessibility features (colorblind mode, high contrast)
- 💾 Progress saving with best time/moves tracking
- ⚡ Performance monitoring (?debug mode)

## Development

- **Lint code**: `npm run lint`
- **Fix linting issues**: `npm run lint:fix`
- **Build for production**: `npm run build`

## Browser Support

- Chrome 95+
- Firefox 94+
- Safari 15+
- Edge 95+
- Mobile Safari 15+

## License

MIT
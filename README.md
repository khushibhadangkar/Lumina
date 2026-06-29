# Lumina
**A 3D Interactive Global Intelligence Engine**

Lumina is an advanced, cinematic 3D web application designed to visualize, analyze, and narrate complex global supply chains, trade routes, and geopolitical tech data. By leveraging high-performance WebGL and a beautifully crafted glassmorphism user interface, Lumina transforms raw macro-economic data into highly interactive, documentary-style experiences.

---

## 🌍 Core Features

### 1. Cinematic Story Mode (Documentary HUD)
Lumina features a completely bespoke "Story Mode" that takes users on guided, animated tours around the globe.
- **Dynamic Camera Telemetry**: Automatically calculates the optimal distance, orbital arc, and angles to frame countries perfectly.
- **Cinematic Subtitles**: Typewriter text effects with gold-highlighted tech terminologies and blinking cursors.
- **Drone-Style Camera Drift**: When the auto-camera reaches its destination, it begins a subtle, slow orbital drift to mimic satellite/drone footage.
- **Generative Audio Engine**: Utilizes the Web Audio API to generate deep, cinematic ambient drone soundscapes that react dynamically.

### 2. High-Fidelity 3D WebGL Globe
Powered by Three.js and React Three Fiber, the 3D environment is built to be both performant and visually stunning.
- **High-Res Earth Maps**: Uses high-definition satellite imagery for the Earth map topology and specular lighting.
- **Interactive Hotspots & Arcs**: Renders massive data flows using glowing bezier curves that connect coordinates across the globe.
- **Atmospheric Post-Processing**: Includes subtle atmospheric halos, starfields, and realistic lighting to anchor the 3D realism.

### 3. Spatial Intelligence Overlays
- **Real-Time Telemetry Data**: The Data Overlay displays simulated orbital data (Axial Tilt, Rotation Velocity, Solar Distance).
- **Interactive Search Engine**: Users can search for key commodities (e.g., *Semiconductors, Lithium, AI Engineers*) and the engine dynamically fetches intel and plots it on the 3D globe.
- **Heatmap Visualization**: Instantly toggle between visual data modes: *Production, Demand, Growth, Exports, Imports,* and *Opportunity*. 

---

## 🏗️ Technical Specifications & Architecture

### Technology Stack
- **Framework**: React 19 + TypeScript + Vite
- **3D Graphics Engine**: Three.js (`three`)
- **React 3D Integrations**: React Three Fiber (`@react-three/fiber`), React Three Drei (`@react-three/drei`)
- **Globe Visualization**: React Globe GL (`react-globe.gl`)
- **Animations & Physics**: Framer Motion (`framer-motion`), GSAP (`gsap`)
- **Icons**: Lucide React (`lucide-react`)
- **Styling**: Pure CSS with advanced CSS Grid and Glassmorphism heuristics.

### System Architecture
Lumina's architecture is separated into stateful UI layers and pure data-driven service engines.

1. **`NarrativeEngine.ts`**: The core director. It contains the JSON structure for cinematic "Journeys" (e.g., *The Semiconductor Flow*, *Lithium Supply Chain*). It dictates the exact latitude, longitude, altitude, and text for every scene.
2. **`DataEngine.ts`**: Manages the mock geographic and supply chain datasets. It translates string queries (like "Coffee") into rich JSON payloads containing market sizes, coordinates, and trade arcs.
3. **`CountryIntelEngine.ts`**: Handles the boundary coordinates and contextual profiles for specific geopolitical entities.
4. **`GlobeScene.tsx`**: The heavy-lifting rendering layer. It parses the current active state (Story Mode vs Free Explore vs Search) and commands the `react-globe.gl` instance to update textures, polygons, and point-of-view animations.

---

## 🎨 UI/UX Design System

Lumina avoids standard UI frameworks (like Tailwind or Bootstrap) to maintain complete artistic control over its signature look:
- **Glassmorphism**: Panels use deep, translucent blacks (`rgba(6, 6, 8, 0.88)`) with `backdrop-filter: blur()`, subtle white borders, and intense drop shadows to float elegantly above the 3D canvas.
- **Typography**: Strictly uses monospace fonts for technical telemetry and clean sans-serifs for narrative text, creating an aesthetic blend of "military intel interface" and "premium documentary."
- **Color Palette**: 
  - **Backgrounds**: Obsidian and deep space blacks.
  - **Accents**: High-contrast Gold (`#cfa864`), Neon Cyber-Red, and stark Whites.

---

## 📂 Repository Structure

```
Lumina/
├── public/                 # Static assets (Earth textures, etc.)
├── src/
│   ├── components/
│   │   ├── Globe/          # 3D Globe components and Scene manager
│   │   └── UI/             # React overlays (HUD, Search Panel, Data Overlay)
│   ├── services/           # Data mock engines (Narrative, DB, Intel)
│   ├── App.tsx             # Main application orchestrator
│   ├── index.css           # Global design system & animations
│   └── main.tsx            # React entry point
├── index.html              # HTML template
├── package.json            # Dependencies
└── vite.config.ts          # Vite configuration
```

---

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/khushibhadangkar/Lumina.git
   cd Lumina
   ```

2. **Install dependencies:**
   Make sure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The application will launch on your localhost (typically `http://localhost:5173`).*

4. **Build for production:**
   ```bash
   npm run build
   ```

---

*Lumina was built to push the boundaries of what is possible with React and WebGL in the browser, merging big data visualization with storytelling.*

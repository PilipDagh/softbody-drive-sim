# BeamNG Web: Ultra-Realistic Soft-Body Vehicle Simulation Engine

A zero-lag, real-time soft-body vehicle physics driving engine running natively in the browser via WebGL2/Three.js. Features dynamic mass-spring-damper structural networks, plastic frame warping, beam snapping, multi-car crash testing, procedural Web Audio engine sound synthesis, 10 fully specced vehicles, 5 rich environment maps, and complete 1:1 BeamNG.drive keybinding controls.

---

## 🌟 Key Features

### 1. Sub-Stepping Soft-Body Physics Pipeline (`src/physics.js`)
* **Mass-Spring-Damper Network:** Spatial mass nodes integrated using high-stability Verlet algorithms.
* **Viscoelastic Beams:** Real-time Hooke's restoring force with kinetic damping dissipation.
* **Plastic Yielding & Warping:** Permanent frame crumpling and structural deformation when strain exceeds yield limit ($\epsilon_{yield}$).
* **Structural Break Limits:** High-energy impacts snap beams, detaching bumpers, hoods, doors, and shattering glass.
* **Configurable Sub-Stepping:** 500Hz to 2000Hz (configurable via presets: Low, Medium, High, Ultra) eliminating high-speed tunneling.
* **Interactive Node Grabber:** Hold `Left Ctrl` + Left Click & Drag to grab, pluck, and toss soft-body vehicle nodes with real-time neon force vector physics!
* **Active Hydraulic Car Crusher Press:** Cyclical heavy industrial crushing slab in the Proving Grounds map that crushes soft-body chassis against the steel floor.
* **Inter-Vehicle Soft-Body Collisions:** Multi-car penalty spring contact resolution enabling authentic car-to-car crashes!

### 2. Comprehensive 10-Vehicle Roster (`src/vehicles.js`)
1. **Hirochi Apex NS-98:** MR Layout, 3.2L V6 (290hp), pop-up lights, driver cockpit, aluminum monocoque frame.
2. **Bruckell Venom VX-10:** FR Layout, 8.4L V10 (645hp), clamshell hood, massive rear steam-roller tires.
3. **Solis EcoWagon V:** FF Layout, 1.8L Hybrid (134hp), extended roofline, vertical LED taillights.
4. **Hirochi CrossStar HV:** e-AWD, 2.5L Hybrid (219hp), modern crossover SUV, chrome grille, full light bar.
5. **Bruckell Executive V8:** FR Layout, 5.0L V8 (180hp), 1980s American full-size boxy luxury sedan.
6. **Hirochi Surge Turbo Rally:** AWD, 2.0L Turbo (276hp), compact rally hatch with wide fenders and roof scoop.
7. **Scintilla Velocita V12:** MR Layout, 6.5L V12 (780hp), exotic hypercar with active aero wing and scissor doors.
8. **Gavril D15 Heavy-Duty:** 4x4, 6.7L Turbo-Diesel V8 (475hp / 1,050 lb-ft), heavy-duty boxed ladder frame.
9. **Gavril Barricade 429:** FR Layout, 7.0L Big-Block V8 (375hp), classic 1970 muscle car with shaker hood.
10. **ETK 856 tdb SportWagon:** Intelligent AWD, 3.0L Twin-Turbo I6 (503hp), German luxury high-performance estate.

### 3. Five Detailed Simulation Maps (`src/environment.js`)
* **Map 1: Physics Proving Grounds & Crusher:** 4km grid, 100m drop tower, 15°/30°/45° launch ramps, step-bumps, steel poles, concrete barriers, and active hydraulic crusher.
* **Map 2: Metro City Center:** Multi-lane avenues, skyscrapers, elevated highway overpass, subterranean illuminated tunnel, curbs, and breakable fire hydrants with water geysers.
* **Map 3: Highland Trails & Mud:** Rolling mountain heightfield, dynamic mud trenches with viscous drag, rocky paths, river basin, and a physical flexing wooden suspension bridge.
* **Map 4: Mount Akina Touge Pass:** Winding asphalt mountain pass, hairpin switchbacks, steep elevation drops, drainage gutters, and deformable steel guardrails.
* **Map 5: Industrial Container Harbor:** Seaport with stacked shipping containers, warehouses, gantry crane tracks, and deep water hazards causing engine hydrolock.

### 4. Procedural Web Audio API Engine (`src/audio.js`)
* Real-time harmonic oscillator synthesis tuned to engine cylinder configs (V6, V8, V10, V12, I4, Hybrid whine) tracking RPM and throttle.
* Turbocharger spool frequency and blow-off valve (BOV) pop on throttle release.
* Band-pass filtered tire squeal noise modulated by lateral tire slip.
* Procedural FM metallic crunch & crumple audio triggered by beam plastic deformation.
* Glass shattering and undercarriage spark scraping audio.

### 5. BeamNG-Accurate HUD & Keybindings (`src/ui.js`)
* Real-time tachometer canvas dial with redline arc, digital speedometer (MPH/KPH toggle), and gear readout.
* Boost pressure gauge (PSI), engine coolant temperature (°C), and G-force meter.
* Damage Schematic App: Top-down vehicle wireframe overlay displaying color-coded health for Engine, Radiator, Suspension, Tires, and Frame.
* Physics Debug Skeleton Overlay (`Ctrl+B`) showing springs colored by tension/compression strain.

---

## 🎮 BeamNG 1:1 Keybinding Matrix

| Category | Action Description | Keybinding |
| :--- | :--- | :--- |
| **Vehicle Controls** | Throttle / Accelerate | `W` or `Up Arrow` |
| | Brake / Reverse | `S` or `Down Arrow` |
| | Steering Left / Right | `A` / `D` or `Left` / `Right` |
| | Parking Brake (Toggle / Hold) | `P` (Toggle) / `Spacebar` (Hold) |
| | Gearbox Mode Toggle | `Q` |
| | Gear Up / Gear Down | `X` / `Z` |
| | Clutch | `Left Shift` |
| | Headlights Toggle | `N` |
| | Hazard Lights | `/` |
| | Horn | `H` |
| **Powertrain** | ESC / Traction Control Toggle | `Ctrl + Q` |
| | Differential Lock Toggle | `Alt + D` |
| | 4WD / Transfer Case Toggle | `Alt + S` |
| **Physics & Gameplay**| Reset Vehicle Physics | `R` or `I` |
| | Recover Vehicle | `Insert` |
| | Switch Active Vehicle | `Tab` |
| | Pause / Resume Simulation | `J` |
| | Slow Motion Decrease / Increase | `Alt + Down` / `Alt + Up` |
| | **Node Grabber** | **`Left Ctrl` (Hold) + `Mouse Left Click & Drag`** |
| **Camera & System** | Cycle Camera Views (1-7) | `C` or Keys `1` - `7` |
| | Free Camera Mode | `Shift + C` (WASD to fly) |
| | Teleport Vehicle to Free Cam | `F7` |
| | Open ESC Pause Menu | `Esc` |
| | Open Vehicle Selector Grid | `Ctrl + E` |
| | Open Parts & Tuning Menu | `Ctrl + W` |
| | Toggle Physics Skeleton Overlay| `Ctrl + B` |

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Production build
npm run build
```

Open `http://localhost:5173` in your browser.

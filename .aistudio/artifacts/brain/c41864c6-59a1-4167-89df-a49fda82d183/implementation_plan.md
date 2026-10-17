# Tesla Roadster SpaceX Thruster Stunt Arena

An arcade 3D vehicular stunt simulator and free-roam proving ground featuring the new Tesla Roadster equipped with SpaceX cold-gas thrusters. Players execute vertical hover maneuvers, high-speed launches, barrel rolls, backflips, and aerial target rings across a nocturnal SpaceX launch complex and desert test facility.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters have been confirmed based on your preferences:

- **Confirmed Mode**: Free-roam open stunt test arena with varied ramps (kickers, quarter-pipes, loop-the-loops, launch pads) and floating target rings.
- **Confirmed Physics Model**: Arcade handling with responsive vertical cold-gas thrusters (4 underbody nozzles), forward rocket boost, mid-air barrel rolls (Q/E or A/D in air), pitch flips (W/S in air), and ground magnetic stabilization.
- **Confirmed Environment & Visuals**: SpaceX launch complex & desert test facility at night—complete with launch mount structures, orbital towers, floodlights, runway neon tarmac markings, exhaust smoke simulation, and desert horizon silhouette.
- **Audio & Sound**: Procedural Web Audio API sound synthesis generating realistic high-pressure cold-gas thruster hiss, electric motor whine, tire screech, and aerodynamic wind rushing (zero external audio files).

---

## 1. Overview & Core Concept

### What It Does
The game drops the player behind the wheel of the ultra-high performance Tesla Roadster on a vast proving ground. Players can floor the electric powertrain to reach speeds upwards of 250+ MPH, ignite the underbody SpaceX cold-gas thrusters (`Spacebar`) to lift vertically into the air or leap over mega obstacles, trigger rear cold-gas boost (`Shift`) for instantaneous acceleration, and execute aerial acrobatic stunts (barrel rolls, front/back flips, 360 flat spins) before sticking smooth landings.

Floating checkpoint rings, stunt score multipliers, airtime meters, and thruster tank pressure mechanics turn the proving ground into a thrilling skill playground.

### Target Audience & Experience
- Car enthusiasts, space fans, and gamers who want to experience the sensation of the real-world SpaceX Roadster thruster package in an engaging, responsive 3D simulator.
- Immediate "pick up and drive" controls on keyboard or on-screen mobile touch triggers, with depth for technical stunt combos.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Launch & Proving Ground**: Immediate start onto the asphalt of the launch facility staging pad. The Roadster's headlights illuminate the tarmac while towering rocket structures and floodlights frame the night sky.
2. **High-Speed Driving & Thruster Takeoff**: Accelerate smoothly with realistic acceleration curves. Pressing `Space` fires four vertical cold-gas thruster plumes that eject dense white vapor downwards, lifting the vehicle skyward with realistic recoil and balance.
3. **Aerial Stunt Maneuvers**: While airborne, directional keys shift into roll/pitch/yaw stunt control. An **Airtime Bonus** and **Stunt Combo** meter dynamically tracks tricks (e.g., "Vertical Hover", "360 Barrel Roll", "Inverted Airtime", "Ring Bullseye").
4. **Targets & Obstacle Challenges**: Ring arches suspended between launch gantry cranes and giant parabolic launch ramps reward thruster precision and timing.
5. **HUD & Telemetry**: Minimalist, high-tech aerospace telemetry showing digital speedometer (0–250+ MPH), Cold-Gas Nitrogen Tank Pressure (Fuel Bar with auto-recharge/cryo-fill stations), Thruster G-Force, and Stunt Combo score ticker.

### Visual Identity & Theme
- **Aesthetic Direction**: High-tech SpaceX test complex at night. Moody industrial nocturne with intense floodlights, volumetric thruster smoke plumes, and glowing vehicle light bars matching the real unveil event.
- **Color Palette & Atmospheric Lighting**:
  - Deep space midnight navy (`#0B0F19`) background with dense low-altitude horizon fog (`#0E1726`).
  - Warm floodlights (3200K tungsten / halogens) casting authentic industrial shadows against cool blue/white LED floodlights (5600K).
  - Roadster body: Cyber white with carbon fiber aero diffuser, active glass canopy, glowing LED headlights and continuous rear taillight bar.
  - Thruster exhaust: Dense white-hot vapor plumes with particle sparks and lighting glow.
  - HUD Accents: Electric cyan (`#06B6D4`) and hyper-orange (`#F97316`) inspired by SpaceX Dragon flight telemetry screens.
- **Typography**:
  - Display & Telemetry: `Space Mono` / `Chakra Petch` for tabular speedometer readings, altitude, and nitrogen tank pressure.
  - Interface Labels: `Plus Jakarta Sans` for clean, unboxed navigation and helper hints.
- **Viewport Layout**: 100% unobstructed central 3D viewport with collapsible bottom dock for camera modes (Chase Cam, Cockpit/Hood Cam, Orbit Drone, Cinematic Action Cam), sound mute toggle, and arena reset buttons.

---

## 3. Key Product Decisions & Trade-Offs

### Arcade Stunt Physics vs. Strict Aerodynamic Simulation
- **Chosen Approach**: Responsive hybrid arcade physics with realistic vertical thruster impulses and raycast suspension.
- **Rationale**: Strict ragdoll physics often results in frustrating rollovers on flat ground. Arcade stabilization automatically levels the vehicle upright when nearing the ground, while giving full acrobatic pitch/roll authority while high in the air.
- **Stunt System**: Detects rotation degrees around X, Y, and Z axes during flight to award named stunts (*Double Barrel Roll*, *Sky Crane Hover*, *Launchpad Leap*, *Apex Dive*).

### Procedural Particle & Cold-Gas Smoke System
- **Chosen Approach**: GPU-accelerated Three.js instanced smoke sprite quad emitters attached to the four underbody nozzles and single rear rocket nozzle.
- **Rationale**: Matches the unveiling event photos where billowing white cold-gas clouds erupt underneath the wheels, giving substantial physical presence to the vertical lift.

### Arena Level Design
- **Chosen Approach**: Modular test arena featuring:
  - *Main Drag Strip & Staging Pad* for top speed tests.
  - *Starship Launch Mount & Flame Trench* with climbable spiral ramps.
  - *Super Ramps & Mega Kicker* for astronomical jumps.
  - *Suspended Neon Stunt Rings* at varying altitudes requiring calibrated thruster pulses.
  - *Cryo-Refuel Pads* that flash-refill nitrogen pressure in 1 second.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React Root UI                                 │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Top Telemetry Bar   │  │         Stunt & Combo Banner          │  │
│  │   Speed | Alt | Fuel  │  │  "DOUBLE BARREL ROLL +850 PTS"        │  │
│  └───────────────────────┘  └───────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                       Three.js Canvas Layer                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Three.js Scene:                                                  │  │
│  │  ├─ Roadster Procedural Group (Body, Wheels, Interior, Lights)   │  │
│  │  ├─ 4x Cold-Gas Underbody Thrusters + Rear Boost Thruster        │  │
│  │  ├─ Particle Smoke & Sparks Emitter (Instanced Buffer)           │  │
│  │  ├─ SpaceX Launch Complex (Tower, Gantries, Ramps, Rings)        │  │
│  │  ├─ Dynamic 3-Point Lighting + Spotlights + Studio Environment    │  │
│  │  └─ Dynamic Chase / Cockpit / Drone Camera Controller            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                     Arcade Physics & Audio Engine                      │
│  ├─ Raycast Ground Suspension & Tire Traction Model                     │
│  ├─ Cold-Gas Thruster Force Vectors (Vertical Lift & Forward Boost)    │
│  ├─ Aerial Angular Kinematics (Roll, Pitch, Yaw Rotation In Air)       │
│  ├─ Stunt & Ring Collision Detector                                    │
│  └─ Web Audio Procedural Sound Synthesizer (Pneumatic Hiss & Motors)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown
- `App.tsx`: Main game container, WebGL canvas lifecycle, HUD overlay, and state synchronization.
- `src/game/RoadsterModel.ts`: High-detail procedural 3D model of the Tesla Roadster assembled from engineered geometric parts (chassis, aerodynamic cockpit glass, alloy wheels with brake calipers, quad thruster pods, LED light bars).
- `src/game/PhysicsEngine.ts`: Vehicle dynamics, acceleration curves, nitrogen cold-gas thruster thrust, gravity, ground raycasting, and aerial stunt rotations.
- `src/game/Environment.ts`: Proving ground terrain, Starship launch mount, launch tower, curved stunt ramps, suspension arches, and floating target rings.
- `src/game/ParticleSystem.ts`: Billowing cold-gas nitrogen smoke clouds and ground dust effects.
- `src/game/AudioEngine.ts`: Web Audio API sound generator for dual electric motors, nitrogen valve releases, tire friction, and wind rush.
- `src/components/HUD.tsx`: Zero-pill, responsive flight and speed telemetry with thruster pressure meter, speedometer, stunt combo popups, and mini-map.
- `src/components/ControlsDock.tsx`: Collapsible bottom dock for view modes, sound toggle, control guide, and respawn.

---

## 5. Verification & Review Steps

1. **Procedural Vehicle Assembly**: Verify detailed 3D Tesla Roadster model with distinct materials, functional spinning wheels, and realistic underbody thruster ports.
2. **Thruster Physics**: Test vertical lift (`Space`), boost acceleration (`Shift`), and stunt rotations (`W/A/S/D/Q/E`) with fluid momentum.
3. **Launch Facility World**: Confirm smooth navigation over ramps, through aerial target rings, and around the launch complex with high frame rate.
4. **Telemetry & Audio**: Validate realistic HUD feedback, real-time stunt scoring, and dynamic procedural audio response without external assets.

import * as THREE from 'three';

export interface RoadsterMeshComponents {
  group: THREE.Group;
  wheels: {
    frontLeft: THREE.Group;
    frontRight: THREE.Group;
    rearLeft: THREE.Group;
    rearRight: THREE.Group;
  };
  thrusterPivots: {
    fl: THREE.Group;
    fr: THREE.Group;
    rl: THREE.Group;
    rr: THREE.Group;
    rearBoost: THREE.Group;
  };
  thrusterNozzles: {
    fl: THREE.Vector3;
    fr: THREE.Vector3;
    rl: THREE.Vector3;
    rr: THREE.Vector3;
    rearBoost: THREE.Vector3;
  };
  thrusterPlumes: {
    fl: THREE.Mesh;
    fr: THREE.Mesh;
    rl: THREE.Mesh;
    rr: THREE.Mesh;
    rearBoost: THREE.Mesh;
  };
  thrusterGlowLights: {
    fl: THREE.PointLight;
    fr: THREE.PointLight;
    rl: THREE.PointLight;
    rr: THREE.PointLight;
    rearBoost: THREE.PointLight;
  };
  rcsPlumes: {
    left: THREE.Mesh;
    right: THREE.Mesh;
  };
  rcsGlowLights: {
    left: THREE.PointLight;
    right: THREE.PointLight;
  };
  brakeLights: THREE.MeshBasicMaterial;
  headlightGlow: THREE.PointLight;
  taillightGlow: THREE.PointLight;
}

/**
 * Creates the authentic Tesla Roadster 2020+ SpaceX Package 3D Model:
 * - Ultra Red / Midnight Cherry Red multi-coat metallic body
 * - Sculpted front nose cone with aero hood pass-through channel
 * - Horizontal razor-thin LED headlights and daytime running light blades
 * - Panoramic tinted glass canopy and targa top
 * - Flared muscular rear fenders with active swan-neck aerodynamic rear wing
 * - 5-spoke aeroblade turbine wheels with red Brembo performance calipers
 * - Accurate front-wheel steering (-Z) and fixed rear wheels (+Z)
 * - SpaceX cold-gas thruster nozzles & side RCS attitude ports
 */
export function createRoadsterModel(): RoadsterMeshComponents {
  const root = new THREE.Group();
  root.name = 'TeslaRoadsterSpaceX';

  // --- 1. PREMIUM PBR SHADERS & MATERIALS ---
  // Iconic multi-coat metallic Ultra Red / Midnight Cherry paint
  const bodyPaintMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xba181b,
    metalness: 0.88,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    reflectivity: 0.95,
  });

  // Exposed aerospace-grade matte carbon fiber
  const carbonTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    metalness: 0.45,
    roughness: 0.72,
  });

  // Aerodynamic tinted panoramic glass canopy
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0c1017,
    metalness: 0.15,
    roughness: 0.04,
    transmission: 0.75,
    thickness: 0.85,
    transparent: true,
    opacity: 0.92,
  });

  // High performance rubber tires
  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x161618,
    roughness: 0.92,
    metalness: 0.08,
  });

  // Machined silver aeroblade rim face
  const alloyRimMaterial = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.92,
    roughness: 0.18,
  });

  // Inner black aero wheel turbine spokes
  const innerWheelDarkMaterial = new THREE.MeshStandardMaterial({
    color: 0x181a20,
    metalness: 0.75,
    roughness: 0.35,
  });

  // Red Brembo performance brake caliper
  const caliperMaterial = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.4,
    roughness: 0.25,
  });

  // SpaceX Inconel Thruster Alloy
  const thrusterMetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.95,
    roughness: 0.28,
  });

  // LED Blade Headlight Material (Crisp cool white)
  const headlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xf0f9ff,
  });

  // LED Taillight Ribbon Material (Vibrant neon red)
  const taillightMaterial = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });

  // --- 2. LOWER CHASSIS & AERODYNAMIC TRAY ---
  // Vehicle points forward into -Z; Rear is at +Z
  const chassisGeom = new THREE.BoxGeometry(1.88, 0.2, 4.35);
  const chassis = new THREE.Mesh(chassisGeom, carbonTrimMaterial);
  chassis.position.set(0, 0.26, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  root.add(chassis);

  const bodyGroup = new THREE.Group();

  // --- 3. MAIN WEDGE SCULPTED BODY ---
  // Mid-fuselage cockpit base
  const midTorsoGeom = new THREE.BoxGeometry(1.84, 0.44, 2.5);
  const midTorso = new THREE.Mesh(midTorsoGeom, bodyPaintMaterial);
  midTorso.position.set(0, 0.48, -0.05);
  midTorso.castShadow = true;
  midTorso.receiveShadow = true;
  bodyGroup.add(midTorso);

  // Aerodynamic sharp side skirts
  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 2.5), carbonTrimMaterial);
  skirtL.position.set(-0.92, 0.25, -0.05);
  bodyGroup.add(skirtL);

  const skirtR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 2.5), carbonTrimMaterial);
  skirtR.position.set(0.92, 0.25, -0.05);
  bodyGroup.add(skirtR);

  // Side intake vents in front of rear wheels
  const ventGeom = new THREE.BoxGeometry(0.14, 0.22, 0.45);
  const ventL = new THREE.Mesh(ventGeom, carbonTrimMaterial);
  ventL.position.set(-0.92, 0.42, 0.65);
  bodyGroup.add(ventL);

  const ventR = new THREE.Mesh(ventGeom, carbonTrimMaterial);
  ventR.position.set(0.92, 0.42, 0.65);
  bodyGroup.add(ventR);

  // --- 4. SCULPTED FRONT HOOD & NOSE CONE (-Z DIRECTION) ---
  // Sloping low-drag wedge front hood
  const hoodShape = new THREE.Shape();
  hoodShape.moveTo(-0.9, 0);
  hoodShape.lineTo(0.9, 0);
  hoodShape.lineTo(0.8, -1.45);
  hoodShape.lineTo(-0.8, -1.45);
  hoodShape.closePath();

  const hoodExtrudeSettings = {
    depth: 0.36,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.05,
    bevelThickness: 0.05,
  };
  const hoodGeom = new THREE.ExtrudeGeometry(hoodShape, hoodExtrudeSettings);
  const hood = new THREE.Mesh(hoodGeom, bodyPaintMaterial);
  hood.rotation.x = -Math.PI / 2 + 0.14;
  hood.position.set(0, 0.62, -0.65);
  hood.castShadow = true;
  bodyGroup.add(hood);

  // Distinctive sunken horizontal hood air extraction scoop
  const scoopGeom = new THREE.BoxGeometry(1.15, 0.06, 0.45);
  const scoop = new THREE.Mesh(scoopGeom, carbonTrimMaterial);
  scoop.rotation.x = 0.14;
  scoop.position.set(0, 0.58, -1.4);
  bodyGroup.add(scoop);

  // Front chisel nose-cone fascia
  const noseConeGeom = new THREE.BoxGeometry(1.76, 0.28, 0.42);
  const noseCone = new THREE.Mesh(noseConeGeom, bodyPaintMaterial);
  noseCone.position.set(0, 0.42, -1.98);
  bodyGroup.add(noseCone);

  // Front carbon aero splitter extending forward
  const splitterGeom = new THREE.BoxGeometry(1.82, 0.06, 0.48);
  const splitter = new THREE.Mesh(splitterGeom, carbonTrimMaterial);
  splitter.position.set(0, 0.16, -2.12);
  bodyGroup.add(splitter);

  // Front splitter side endplates
  const splitterEndL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.24), carbonTrimMaterial);
  splitterEndL.position.set(-0.92, 0.21, -2.12);
  bodyGroup.add(splitterEndL);

  const splitterEndR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.24), carbonTrimMaterial);
  splitterEndR.position.set(0.92, 0.21, -2.12);
  bodyGroup.add(splitterEndR);

  // --- 5. REAR HAUNCHES & ACTIVE REAR SPOILER WING (+Z DIRECTION) ---
  // Muscular sculpted rear fastback deck
  const rearDeckGeom = new THREE.BoxGeometry(1.82, 0.42, 1.25);
  const rearDeck = new THREE.Mesh(rearDeckGeom, bodyPaintMaterial);
  rearDeck.position.set(0, 0.54, 1.5);
  rearDeck.castShadow = true;
  bodyGroup.add(rearDeck);

  // Rear active aerodynamic diffuser with vertical strakes
  const diffuserGeom = new THREE.BoxGeometry(1.74, 0.18, 0.48);
  const diffuser = new THREE.Mesh(diffuserGeom, carbonTrimMaterial);
  diffuser.position.set(0, 0.2, 2.15);
  bodyGroup.add(diffuser);

  for (let sx = -0.6; sx <= 0.6; sx += 0.4) {
    const strake = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.36), carbonTrimMaterial);
    strake.position.set(sx, 0.18, 2.16);
    bodyGroup.add(strake);
  }

  // Deployable swan-neck high-angle rear wing spoiler
  const wingGroup = new THREE.Group();
  wingGroup.name = 'SwanNeckActiveWing';

  const strutGeom = new THREE.BoxGeometry(0.06, 0.46, 0.22);
  const strutL = new THREE.Mesh(strutGeom, carbonTrimMaterial);
  strutL.position.set(-0.55, 0.88, 1.7);
  strutL.rotation.x = 0.25;
  wingGroup.add(strutL);

  const strutR = new THREE.Mesh(strutGeom, carbonTrimMaterial);
  strutR.position.set(0.55, 0.88, 1.7);
  strutR.rotation.x = 0.25;
  wingGroup.add(strutR);

  const wingBladeGeom = new THREE.BoxGeometry(1.84, 0.05, 0.48);
  const wingBlade = new THREE.Mesh(wingBladeGeom, bodyPaintMaterial);
  wingBlade.position.set(0, 1.08, 1.82);
  wingBlade.rotation.x = -0.16;
  wingBlade.castShadow = true;
  wingGroup.add(wingBlade);

  const endplateGeom = new THREE.BoxGeometry(0.04, 0.32, 0.52);
  const endplateL = new THREE.Mesh(endplateGeom, bodyPaintMaterial);
  endplateL.position.set(-0.92, 1.05, 1.82);
  endplateL.rotation.z = -0.12;
  wingGroup.add(endplateL);

  const endplateR = new THREE.Mesh(endplateGeom, bodyPaintMaterial);
  endplateR.position.set(0.92, 1.05, 1.82);
  endplateR.rotation.z = 0.12;
  wingGroup.add(endplateR);

  bodyGroup.add(wingGroup);

  // --- 6. GEOMETRIC A-PILLAR CANOPY & INTERIOR ---
  const canopyGeom = new THREE.BoxGeometry(1.44, 0.44, 1.8);
  const canopy = new THREE.Mesh(canopyGeom, glassMaterial);
  canopy.position.set(0, 0.84, 0.2);
  canopy.castShadow = true;
  bodyGroup.add(canopy);

  const windshieldGeom = new THREE.BoxGeometry(1.36, 0.06, 1.1);
  const windshield = new THREE.Mesh(windshieldGeom, glassMaterial);
  windshield.rotation.x = -0.58;
  windshield.position.set(0, 0.78, -0.42);
  bodyGroup.add(windshield);

  // Minimalist Cyber Interior (Dashboard & Yoke)
  const dashGeom = new THREE.BoxGeometry(1.22, 0.12, 0.36);
  const dash = new THREE.Mesh(dashGeom, carbonTrimMaterial);
  dash.position.set(0, 0.72, -0.42);
  bodyGroup.add(dash);

  const yokeGeom = new THREE.TorusGeometry(0.12, 0.02, 8, 16, Math.PI * 1.5);
  const yoke = new THREE.Mesh(yokeGeom, alloyRimMaterial);
  yoke.position.set(-0.32, 0.74, -0.28);
  yoke.rotation.x = -Math.PI / 4;
  bodyGroup.add(yoke);

  const seatGeom = new THREE.BoxGeometry(0.42, 0.55, 0.38);
  const seatLeft = new THREE.Mesh(seatGeom, carbonTrimMaterial);
  seatLeft.position.set(-0.35, 0.65, 0.2);
  const seatRight = new THREE.Mesh(seatGeom, carbonTrimMaterial);
  seatRight.position.set(0.35, 0.65, 0.2);
  bodyGroup.add(seatLeft);
  bodyGroup.add(seatRight);

  // --- 7. LIGHTING STRIPS & ACCENTS ---
  // Front razor-thin continuous LED blade headlight (facing -Z)
  const frontBladeGeom = new THREE.BoxGeometry(1.68, 0.04, 0.06);
  const frontBlade = new THREE.Mesh(frontBladeGeom, headlightMaterial);
  frontBlade.position.set(0, 0.44, -2.14);
  bodyGroup.add(frontBlade);

  // Front corner LED vertical accent fangs
  const fangL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.08), headlightMaterial);
  fangL.position.set(-0.82, 0.4, -2.12);
  bodyGroup.add(fangL);

  const fangR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.08), headlightMaterial);
  fangR.position.set(0.82, 0.4, -2.12);
  bodyGroup.add(fangR);

  // Rear full-width LED taillight ribbon (facing +Z)
  const rearRibbonGeom = new THREE.BoxGeometry(1.7, 0.04, 0.06);
  const rearRibbon = new THREE.Mesh(rearRibbonGeom, taillightMaterial);
  rearRibbon.position.set(0, 0.56, 2.14);
  bodyGroup.add(rearRibbon);

  root.add(bodyGroup);

  // --- 8. SPACEX COLD-GAS THRUSTER ASSEMBLIES ---
  // Vertical nozzles: fl & fr at FRONT (-1.25), rl & rr at REAR (+1.25)
  const nozzlePositions = {
    fl: new THREE.Vector3(-0.65, 0.16, -1.25),
    fr: new THREE.Vector3(0.65, 0.16, -1.25),
    rl: new THREE.Vector3(-0.65, 0.16, 1.25),
    rr: new THREE.Vector3(0.65, 0.16, 1.25),
    rearBoost: new THREE.Vector3(0, 0.38, 2.18),
  };

  const thrusterPivots: Record<string, THREE.Group> = {};
  const thrusterPlumes: Record<string, THREE.Mesh> = {};
  const thrusterGlowLights: Record<string, THREE.PointLight> = {};

  const createThrusterAssembly = (pos: THREE.Vector3, isVertical: boolean, key: string) => {
    const nozzleGroup = new THREE.Group();
    nozzleGroup.position.copy(pos);
    thrusterPivots[key] = nozzleGroup;

    // Inconel Bell Nozzle
    const bellGeom = new THREE.ConeGeometry(0.12, 0.22, 16, 1, true);
    const bell = new THREE.Mesh(bellGeom, thrusterMetalMaterial);
    if (isVertical) {
      bell.rotation.x = Math.PI; // Pointing downwards (-Y)
    } else {
      bell.rotation.x = Math.PI / 2; // Pointing backwards (+Z)
    }
    nozzleGroup.add(bell);

    // Dynamic cold-gas plume
    const plumeGeom = new THREE.ConeGeometry(isVertical ? 0.32 : 0.45, isVertical ? 2.4 : 3.4, 16);
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const plume = new THREE.Mesh(plumeGeom, plumeMat);
    if (isVertical) {
      plume.position.y = -1.2;
    } else {
      plume.rotation.x = -Math.PI / 2;
      plume.position.z = 1.7; // Shooting backwards (+Z) to propel car forward (-Z)
    }
    nozzleGroup.add(plume);
    thrusterPlumes[key] = plume;

    // Lightweight glow reference sharing central ground light
    thrusterGlowLights[key] = centralUnderbodyLight;

    root.add(nozzleGroup);
  };

  // 1 single central underbody thruster light for ground illumination
  const centralUnderbodyLight = new THREE.PointLight(0x38bdf8, 0, 8, 2);
  centralUnderbodyLight.position.set(0, 0.15, 0);
  root.add(centralUnderbodyLight);

  createThrusterAssembly(nozzlePositions.fl, true, 'fl');
  createThrusterAssembly(nozzlePositions.fr, true, 'fr');
  createThrusterAssembly(nozzlePositions.rl, true, 'rl');
  createThrusterAssembly(nozzlePositions.rr, true, 'rr');
  createThrusterAssembly(nozzlePositions.rearBoost, false, 'rearBoost');

  // Side RCS Attitude Thrusters (On rocker panels at z = -0.1)
  const createSideRcs = (isLeft: boolean) => {
    const rcsGroup = new THREE.Group();
    rcsGroup.position.set(isLeft ? -0.94 : 0.94, 0.4, -0.1);

    const portGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.05, 10);
    const port = new THREE.Mesh(portGeom, thrusterMetalMaterial);
    port.rotation.z = isLeft ? Math.PI / 2 : -Math.PI / 2;
    rcsGroup.add(port);

    const plumeGeom = new THREE.ConeGeometry(0.24, 1.6, 10);
    const plumeMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const plume = new THREE.Mesh(plumeGeom, plumeMat);
    plume.rotation.z = isLeft ? Math.PI / 2 : -Math.PI / 2;
    plume.position.x = isLeft ? -0.8 : 0.8;
    rcsGroup.add(plume);

    root.add(rcsGroup);
    return { plume, glow: centralUnderbodyLight };
  };

  const rcsLeft = createSideRcs(true);
  const rcsRight = createSideRcs(false);

  // Headlight Projector Glow (Facing forward into -Z!)
  const headlightGlow = new THREE.PointLight(0xf0f9ff, 1.2, 16, 2);
  headlightGlow.position.set(0, 0.55, -2.5);
  root.add(headlightGlow);

  // Taillight glow (Facing backward into +Z!)
  const taillightGlow = new THREE.PointLight(0xef4444, 0.6, 8, 2);
  taillightGlow.position.set(0, 0.58, 2.5);
  root.add(taillightGlow);

  // --- 9. 5-SPOKE AEROBLADE WHEELS ---
  // High detail wheels with silver aero blades and red Brembo calipers
  const createWheel = (isLeft: boolean): THREE.Group => {
    const wheelGroup = new THREE.Group();

    // Rotating assembly: hub, tire, drum and spokes
    const spinHub = new THREE.Group();

    // Tire outer rubber
    const tireGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 28);
    const tire = new THREE.Mesh(tireGeom, tireMaterial);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    spinHub.add(tire);

    // Inner dark wheel drum
    const drumGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.29, 20);
    const drum = new THREE.Mesh(drumGeom, innerWheelDarkMaterial);
    drum.rotation.z = Math.PI / 2;
    spinHub.add(drum);

    // 5-Spoke Aeroblade face (facing outward from car)
    const outerX = isLeft ? -0.15 : 0.15;
    const spokeGroup = new THREE.Group();
    spokeGroup.position.set(outerX, 0, 0);

    for (let s = 0; s < 5; s++) {
      const angle = (s / 5) * Math.PI * 2;
      const bladeGeom = new THREE.BoxGeometry(0.04, 0.18, 0.08);
      const blade = new THREE.Mesh(bladeGeom, alloyRimMaterial);
      blade.position.set(0, Math.sin(angle) * 0.16, Math.cos(angle) * 0.16);
      blade.rotation.x = angle + 0.15;
      spokeGroup.add(blade);
    }

    // Center hubcap
    const capGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16);
    const cap = new THREE.Mesh(capGeom, alloyRimMaterial);
    cap.rotation.z = Math.PI / 2;
    spokeGroup.add(cap);

    spinHub.add(spokeGroup);
    wheelGroup.add(spinHub); // Child 0: spins with wheelSpinAngle

    // Non-rotating assembly: Red Brembo performance brake caliper on the INSIDE
    const caliperGeom = new THREE.BoxGeometry(0.08, 0.18, 0.12);
    const caliper = new THREE.Mesh(caliperGeom, caliperMaterial);
    caliper.position.set(isLeft ? 0.06 : -0.06, 0.18, 0);
    wheelGroup.add(caliper); // Child 1: fixed with wheel steering

    return wheelGroup;
  };

  // ACCURATE WHEEL PLACEMENT:
  // Front Wheels: at z = -1.35 (FRONT of car in forward -Z direction)
  // Rear Wheels: at z = +1.35 (REAR of car in +Z direction)
  // Left: x = -0.92 / -0.94
  // Right: x = +0.92 / +0.94
  const frontLeftWheel = createWheel(true);
  frontLeftWheel.position.set(-0.92, 0.38, -1.35);

  const frontRightWheel = createWheel(false);
  frontRightWheel.position.set(0.92, 0.38, -1.35);

  const rearLeftWheel = createWheel(true);
  rearLeftWheel.position.set(-0.94, 0.38, 1.35);

  const rearRightWheel = createWheel(false);
  rearRightWheel.position.set(0.94, 0.38, 1.35);

  root.add(frontLeftWheel);
  root.add(frontRightWheel);
  root.add(rearLeftWheel);
  root.add(rearRightWheel);

  return {
    group: root,
    wheels: {
      frontLeft: frontLeftWheel,
      frontRight: frontRightWheel,
      rearLeft: rearLeftWheel,
      rearRight: rearRightWheel,
    },
    thrusterPivots: thrusterPivots as unknown as RoadsterMeshComponents['thrusterPivots'],
    thrusterNozzles: nozzlePositions,
    thrusterPlumes: thrusterPlumes as unknown as RoadsterMeshComponents['thrusterPlumes'],
    thrusterGlowLights: thrusterGlowLights as unknown as RoadsterMeshComponents['thrusterGlowLights'],
    rcsPlumes: {
      left: rcsLeft.plume,
      right: rcsRight.plume,
    },
    rcsGlowLights: {
      left: rcsLeft.glow,
      right: rcsRight.glow,
    },
    brakeLights: taillightMaterial,
    headlightGlow,
    taillightGlow,
  };
}

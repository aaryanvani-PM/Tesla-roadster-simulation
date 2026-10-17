import * as THREE from 'three';

export interface StuntRing {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  radius: number;
  collected: boolean;
  points: number;
  label: string;
}

export interface CollectibleToken {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  radius: number;
  collected: boolean;
  points: number;
  label: string;
}

export interface BouncePad {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  radius: number;
}

export class SpaceXTestArena {
  public group: THREE.Group = new THREE.Group();

  public rings: StuntRing[] = [];
  public tokens: CollectibleToken[] = [];
  public bouncePads: BouncePad[] = [];
  public refuelPads: { position: THREE.Vector3; radius: number }[] = [];

  // Authentic Hot Wheels Track Geometry
  public readonly trackWidth = 4.5;
  public readonly loopRadius = 13.5;
  public readonly loopCenterY = 13.5 + 0.15;
  public readonly loopCenterZ = -25.0;
  public readonly loopEntryX = -1.8;
  public readonly loopExitX = 1.8;
  public readonly loopStartZ = -11.5;
  public readonly loopEndZ = -38.5;

  private animatedMeshes: { mesh: THREE.Object3D; rotSpeed: number; isBobbing?: boolean; baseY?: number }[] = [];
  private boosterChevrons: THREE.Mesh[] = [];
  private finishFlagMesh?: THREE.Group;

  // Shared high-performance materials (Zero duplicate shaders)
  private hwOrangeMat: THREE.MeshStandardMaterial;
  private hwBlueMat: THREE.MeshStandardMaterial;
  private hwYellowMat: THREE.MeshBasicMaterial;
  private boostArrowMat: THREE.MeshBasicMaterial;
  private sandMat: THREE.MeshStandardMaterial;
  private tokenMat: THREE.MeshStandardMaterial;
  private ringMat: THREE.MeshBasicMaterial;

  constructor() {
    this.hwOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xff3b00,
      metalness: 0.25,
      roughness: 0.35,
    });
    this.hwBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.65,
      roughness: 0.28,
    });
    this.hwYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.boostArrowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });
    this.sandMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.92,
      metalness: 0.05,
    });
    this.tokenMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.9,
      roughness: 0.18,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
    });
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    this.buildCompactArenaBase();
    this.buildUnifiedHotWheelsCircuit();
    this.buildStuntPropsAndDunes();
    this.buildStarshipBackdrop();
    this.buildCryoChargingStations();
    this.buildStuntRingsAndTokens();
    this.buildOptimizedLighting();
  }

  private buildCompactArenaBase() {
    // 256x256 low-memory procedural tarmac texture
    const tarmacCanvas = document.createElement('canvas');
    tarmacCanvas.width = 128;
    tarmacCanvas.height = 128;
    const ctx = tarmacCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#161a22';
      ctx.fillRect(0, 0, 128, 128);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < 300; i++) {
        ctx.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
      }

      ctx.strokeStyle = '#27303f';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 128; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 128);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(128, i);
        ctx.stroke();
      }

      ctx.fillStyle = '#f59e0b';
      for (let y = 6; y < 128; y += 32) {
        ctx.fillRect(60, y, 6, 18);
      }
    }
    const tarmacTex = new THREE.CanvasTexture(tarmacCanvas);
    tarmacTex.wrapS = THREE.RepeatWrapping;
    tarmacTex.wrapT = THREE.RepeatWrapping;
    tarmacTex.repeat.set(12, 12);
    tarmacTex.colorSpace = THREE.SRGBColorSpace;

    const groundGeom = new THREE.PlaneGeometry(186, 210);
    const groundMat = new THREE.MeshStandardMaterial({
      map: tarmacTex,
      roughness: 0.88,
      metalness: 0.12,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Glowing stadium arena boundary perimeter at +/- 88m X, +/- 96m Z
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    const createBorder = (x: number, z: number, w: number, d: number) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, d), barrierMat);
      b.position.set(x, 0.6, z);
      b.receiveShadow = true;
      this.group.add(b);

      const n = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.15, d + 0.05), neonMat);
      n.position.set(x, 1.0, z);
      this.group.add(n);
    };

    createBorder(0, -96, 178, 1.2);
    createBorder(0, 96, 178, 1.2);
    createBorder(-88, 0, 1.2, 194);
    createBorder(88, 0, 1.2, 194);
  }

  /**
   * High Performance Unified Hot Wheels Circuit:
   * Merges loop geometry into a single continuous track strip, reducing draw calls by 120+!
   */
  private buildUnifiedHotWheelsCircuit() {
    const trackGroup = new THREE.Group();
    trackGroup.name = 'HotWheelsCircuit';

    const w = this.trackWidth;
    const railH = 0.35;
    const railT = 0.2;

    // 1. FLARED ENTRY TRUMPET
    const flareLen = 10;
    const flareGeom = new THREE.PlaneGeometry(11, flareLen);
    const flareFloor = new THREE.Mesh(flareGeom, this.hwOrangeMat);
    flareFloor.rotation.x = -Math.PI / 2;
    flareFloor.position.set(this.loopEntryX, 0.06, 63);
    flareFloor.receiveShadow = true;
    trackGroup.add(flareFloor);

    // Flared entry curbs
    const curbL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, flareLen), this.hwBlueMat);
    curbL.position.set(this.loopEntryX - 4.5, 0.09, 63);
    curbL.rotation.y = 0.22;
    trackGroup.add(curbL);

    const curbR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, flareLen), this.hwBlueMat);
    curbR.position.set(this.loopEntryX + 4.5, 0.09, 63);
    curbR.rotation.y = -0.22;
    trackGroup.add(curbR);

    // 2. MAIN LAUNCHER RUNWAY (z = 58 down to -11.5)
    const entryLength = 69.5;
    const entryCenterZ = 58 - entryLength / 2;

    const entryFloor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, entryLength), this.hwOrangeMat);
    entryFloor.position.set(this.loopEntryX, 0.09, entryCenterZ);
    entryFloor.receiveShadow = true;
    trackGroup.add(entryFloor);

    // Continuous blue side rails
    const railL = new THREE.Mesh(new THREE.BoxGeometry(railT, railH, entryLength), this.hwBlueMat);
    railL.position.set(this.loopEntryX - w / 2 + railT / 2, railH / 2, entryCenterZ);
    trackGroup.add(railL);

    const railR = new THREE.Mesh(new THREE.BoxGeometry(railT, railH, entryLength), this.hwBlueMat);
    railR.position.set(this.loopEntryX + w / 2 - railT / 2, railH / 2, entryCenterZ);
    trackGroup.add(railR);

    // Side Drive-On Ramps (z = 32 and z = 6)
    const createSideDriveOn = (zPos: number) => {
      const rampGeom = new THREE.BoxGeometry(3.5, 0.14, 5.0);
      const sideRampL = new THREE.Mesh(rampGeom, this.hwOrangeMat);
      sideRampL.position.set(this.loopEntryX - w / 2 - 1.7, 0.07, zPos);
      sideRampL.rotation.z = -0.05;
      trackGroup.add(sideRampL);

      const sideRampR = new THREE.Mesh(rampGeom, this.hwOrangeMat);
      sideRampR.position.set(this.loopEntryX + w / 2 + 1.7, 0.07, zPos);
      sideRampR.rotation.z = 0.05;
      trackGroup.add(sideRampR);
    };
    createSideDriveOn(32);
    createSideDriveOn(6);

    // Speed Booster Pads
    for (let pz = 50; pz >= -2; pz -= 16) {
      const clip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.22, 1.8), this.hwBlueMat);
      clip.position.set(this.loopEntryX, 0.11, pz);
      trackGroup.add(clip);

      const arrow = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.02, 2.2), this.boostArrowMat);
      arrow.position.set(this.loopEntryX, 0.22, pz);
      trackGroup.add(arrow);
      this.boosterChevrons.push(arrow);
    }

    // 3. CONTINUOUS BUFFERGEOMETRY 360° LOOP (Ultra-lightweight: 1 single draw call!)
    const loopSegs = 36;
    const r = this.loopRadius;
    const cy = this.loopCenterY;
    const cz = this.loopCenterZ;
    const xEntry = this.loopEntryX;
    const xExit = this.loopExitX;

    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfW = w / 2;

    for (let i = 0; i <= loopSegs; i++) {
      const a = (i / loopSegs) * Math.PI * 2;
      const progress = i / loopSegs;

      const px = xEntry + progress * (xExit - xEntry);
      const py = cy - Math.cos(a) * r;
      const pz = cz - Math.sin(a) * r;

      // Normal pointing inward toward center of loop
      const ny = Math.cos(a);
      const nz = Math.sin(a);

      // Left edge vertex
      vertices.push(px - halfW, py, pz);
      normals.push(0, ny, nz);
      uvs.push(0, progress * 8);

      // Right edge vertex
      vertices.push(px + halfW, py, pz);
      normals.push(0, ny, nz);
      uvs.push(1, progress * 8);

      if (i < loopSegs) {
        const base = i * 2;
        // Two triangles for quad
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const loopGeom = new THREE.BufferGeometry();
    loopGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    loopGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    loopGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    loopGeom.setIndex(indices);

    const loopMesh = new THREE.Mesh(loopGeom, this.hwOrangeMat);
    loopMesh.receiveShadow = true;
    trackGroup.add(loopMesh);

    // Loop Base Support Cradle
    const baseCradle = new THREE.Mesh(new THREE.BoxGeometry(w * 2.2, 1.2, 5.5), this.hwBlueMat);
    baseCradle.position.set(0, 0.6, cz);
    trackGroup.add(baseCradle);

    // Apex Hot Wheels Logo Badge
    const apexGroup = new THREE.Group();
    apexGroup.position.set((xEntry + xExit) / 2, cy + r + 0.3, cz);

    const emblem = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.6, 0.25), this.hwOrangeMat);
    emblem.position.set(0, 1.1, 0);
    apexGroup.add(emblem);

    const flameAccent = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.45, 0.35), this.hwYellowMat);
    flameAccent.position.set(0, 1.1, 0);
    apexGroup.add(flameAccent);

    // 1 single ambient apex light for dramatic night glow
    const apexLight = new THREE.PointLight(0xff7700, 1.5, 22);
    apexLight.position.set(0, 1.2, 0);
    apexGroup.add(apexLight);

    trackGroup.add(apexGroup);

    // 4. STRAIGHT EXIT RUNWAY (z = -11.5 down to -65)
    const exitLength = 53.5;
    const exitCenterZ = -11.5 - exitLength / 2;

    const exitFloor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, exitLength), this.hwOrangeMat);
    exitFloor.position.set(this.loopExitX, 0.09, exitCenterZ);
    exitFloor.receiveShadow = true;
    trackGroup.add(exitFloor);

    const exitRailL = new THREE.Mesh(new THREE.BoxGeometry(railT, railH, exitLength), this.hwBlueMat);
    exitRailL.position.set(this.loopExitX - w / 2 + railT / 2, railH / 2, exitCenterZ);
    trackGroup.add(exitRailL);

    const exitRailR = new THREE.Mesh(new THREE.BoxGeometry(railT, railH, exitLength), this.hwBlueMat);
    exitRailR.position.set(this.loopExitX + w / 2 - railT / 2, railH / 2, exitCenterZ);
    trackGroup.add(exitRailR);

    // Finish Gate Gantry (At z = -46)
    const finishGateGroup = new THREE.Group();
    finishGateGroup.position.set(this.loopExitX, 0, -46);

    const gantryCross = new THREE.Mesh(new THREE.BoxGeometry(w + 1.6, 0.8, 0.5), this.hwBlueMat);
    gantryCross.position.set(0, 5.0, 0);
    finishGateGroup.add(gantryCross);

    const flagGroup = new THREE.Group();
    flagGroup.position.set(0, 3.8, 0);
    const flagMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.15), this.hwYellowMat);
    flagGroup.add(flagMesh);
    finishGateGroup.add(flagGroup);
    this.finishFlagMesh = flagGroup;

    trackGroup.add(finishGateGroup);

    // 5. STUNT JUMP KICKER AT TERMINUS (z = -65 to -75)
    const kickerLen = 10;
    const kicker = new THREE.Mesh(new THREE.BoxGeometry(w, 0.35, kickerLen), this.hwOrangeMat);
    const kAngle = Math.atan2(3.6, kickerLen);
    kicker.rotation.x = kAngle;
    kicker.position.set(this.loopExitX, 1.8 + 0.09, -70);
    kicker.receiveShadow = true;
    trackGroup.add(kicker);

    // 6. DOWNWARD SLOPED WIDE LANDING RAMP (z = -78 to -92)
    const landLen = 14;
    const landRamp = new THREE.Mesh(new THREE.BoxGeometry(w * 1.6, 0.35, landLen), this.hwOrangeMat);
    const landAngle = Math.atan2(3.6, landLen);
    landRamp.rotation.x = -landAngle;
    landRamp.position.set(this.loopExitX, 1.8 + 0.09, -85);
    landRamp.receiveShadow = true;
    trackGroup.add(landRamp);

    this.group.add(trackGroup);
  }

  private buildStuntPropsAndDunes() {
    const propsGroup = new THREE.Group();
    propsGroup.name = 'StuntProps';

    // 1. HOT WHEELS QUARTER-PIPE WALL RIDE (At x = -65, z = -10)
    const qpGroup = new THREE.Group();
    qpGroup.position.set(-65, 0, -10);

    const qpSegCount = 10;
    const qpRadius = 9.0;
    const qpWidth = 16.0;

    for (let i = 0; i < qpSegCount; i++) {
      const a = (i / qpSegCount) * (Math.PI / 2.2);
      const py = qpRadius - Math.cos(a) * qpRadius;
      const px = Math.sin(a) * qpRadius;
      const segLen = (qpRadius * (Math.PI / 2.2)) / qpSegCount;

      const seg = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.08, 0.25, qpWidth), this.hwOrangeMat);
      seg.position.set(px, py + 0.1, 0);
      seg.rotation.z = -a;
      seg.receiveShadow = true;
      qpGroup.add(seg);
    }
    propsGroup.add(qpGroup);

    // 2. KINETIC GRAVITY BOUNCE PAD (At x: 45, z: 25)
    const bouncePos = new THREE.Vector3(45, 0.1, 25);
    const bounceGeom = new THREE.CylinderGeometry(5.5, 6.2, 0.25, 16);
    const bounceMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const bounceMesh = new THREE.Mesh(bounceGeom, bounceMat);
    bounceMesh.position.copy(bouncePos);
    propsGroup.add(bounceMesh);

    const ringGeom = new THREE.RingGeometry(5.8, 6.6, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide });
    const bounceRing = new THREE.Mesh(ringGeom, ringMat);
    bounceRing.rotation.x = -Math.PI / 2;
    bounceRing.position.set(bouncePos.x, 0.2, bouncePos.z);
    propsGroup.add(bounceRing);

    this.bouncePads.push({
      mesh: bounceMesh,
      position: bouncePos,
      radius: 6.2,
    });

    // 3. SPACEX FLAME TRENCH SUPER JUMP (At x: 55, centered at z: -40)
    const trenchGroup = new THREE.Group();
    trenchGroup.position.set(55, 0, 0);

    const rampMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.25 });
    const trAngle = Math.atan2(4.2, 14.0);

    const trenchApproach = new THREE.Mesh(new THREE.BoxGeometry(8, 0.35, 14), rampMat);
    trenchApproach.rotation.x = trAngle;
    trenchApproach.position.set(0, 2.1 + 0.18, -33);
    trenchApproach.receiveShadow = true;
    trenchGroup.add(trenchApproach);

    // Fiery Pit Mesh (Emissive glow)
    const pitMat = new THREE.MeshStandardMaterial({
      color: 0xff3b00,
      emissive: 0xff4400,
      emissiveIntensity: 1.6,
    });
    const trenchPit = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 12), pitMat);
    trenchPit.position.set(0, 0.05, -46);
    trenchGroup.add(trenchPit);

    // 1 localized fiery point light
    const trenchLight = new THREE.PointLight(0xff5500, 2.0, 16);
    trenchLight.position.set(0, 1.2, -46);
    trenchGroup.add(trenchLight);

    const tlAngle = Math.atan2(4.2, 16.0);
    const trenchLanding = new THREE.Mesh(new THREE.BoxGeometry(10, 0.35, 16), rampMat);
    trenchLanding.rotation.x = -tlAngle;
    trenchLanding.position.set(0, 2.1 + 0.18, -60);
    trenchLanding.receiveShadow = true;
    trenchGroup.add(trenchLanding);

    propsGroup.add(trenchGroup);

    // 4. SPACEX DRONE SHIP "Of Course I Still Love You" (At x: -52, z: 55)
    const droneShipGroup = new THREE.Group();
    droneShipGroup.position.set(-52, 0, 55);

    const poolGeom = new THREE.BoxGeometry(26, 0.15, 28);
    const poolMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.2, metalness: 0.7 });
    const pool = new THREE.Mesh(poolGeom, poolMat);
    pool.position.y = 0.08;
    droneShipGroup.add(pool);

    const bargeDeck = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.85, 20),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.4 })
    );
    bargeDeck.position.y = 0.425;
    bargeDeck.receiveShadow = true;
    droneShipGroup.add(bargeDeck);

    // Ride-on ramps
    const bargeRampMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const bRampFront = new THREE.Mesh(new THREE.BoxGeometry(18, 0.15, 4.0), bargeRampMat);
    bRampFront.rotation.x = Math.atan2(0.85, 4.0);
    bRampFront.position.set(0, 0.425, 12.0);
    droneShipGroup.add(bRampFront);

    const bRampBack = new THREE.Mesh(new THREE.BoxGeometry(18, 0.15, 4.0), bargeRampMat);
    bRampBack.rotation.x = -Math.atan2(0.85, 4.0);
    bRampBack.position.set(0, 0.425, -12.0);
    droneShipGroup.add(bRampBack);

    // Yellow SpaceX bullseye
    const xRing = new THREE.Mesh(new THREE.RingGeometry(3.5, 4.2, 20), this.hwYellowMat);
    xRing.rotation.x = -Math.PI / 2;
    xRing.position.set(0, 0.86, 0);
    droneShipGroup.add(xRing);

    propsGroup.add(droneShipGroup);

    // 5. MATHEMATICALLY SCULPTED DESERT SAND DUNES
    const createSculptedDune = (cx: number, cz: number, rx: number, rz: number, maxH: number) => {
      const segX = 20;
      const segZ = 20;
      const geom = new THREE.PlaneGeometry(rx * 2, rz * 2, segX, segZ);
      geom.rotateX(-Math.PI / 2);

      const posAttr = geom.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const lx = posAttr.getX(i);
        const lz = posAttr.getZ(i);

        const dx = lx / rx;
        const dz = lz / rz;
        const d2 = dx * dx + dz * dz;

        let y = 0;
        if (d2 < 1.0) {
          y = maxH * 0.5 * (1 + Math.cos(Math.PI * Math.sqrt(d2)));
        }
        posAttr.setY(i, y);
      }
      geom.computeVertexNormals();

      const duneMesh = new THREE.Mesh(geom, this.sandMat);
      duneMesh.position.set(cx, 0.02, cz);
      duneMesh.receiveShadow = true;
      propsGroup.add(duneMesh);
    };

    // East Dune & West Dune
    createSculptedDune(65, -10, 28, 32, 6.8);
    createSculptedDune(-65, 25, 26, 30, 6.4);

    this.group.add(propsGroup);
  }

  private buildStarshipBackdrop() {
    const starshipGroup = new THREE.Group();
    starshipGroup.position.set(0, 0, -95);

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.35 });
    const stainlessMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.15 });

    const mount = new THREE.Mesh(new THREE.CylinderGeometry(10, 13, 6, 12), steelMat);
    mount.position.y = 3;
    starshipGroup.add(mount);

    // Super Heavy Booster
    const booster = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 42, 14), stainlessMat);
    booster.position.y = 27;
    starshipGroup.add(booster);

    // Starship Upper Stage
    const ship = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 26, 14), stainlessMat);
    ship.position.y = 61;
    starshipGroup.add(ship);

    const nosecone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 12, 14), stainlessMat);
    nosecone.position.y = 80;
    starshipGroup.add(nosecone);

    // Launch Tower Gantry
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.4 });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(6, 105, 6), towerMat);
    tower.position.set(12, 52.5, 0);
    starshipGroup.add(tower);

    this.group.add(starshipGroup);
  }

  private buildCryoChargingStations() {
    const padLocations = [
      new THREE.Vector3(-1.8, 0, 52),
      new THREE.Vector3(1.8, 0, -42),
      new THREE.Vector3(-45, 0, -25),
      new THREE.Vector3(45, 0, -15),
    ];

    const padGeom = new THREE.CylinderGeometry(4.5, 4.8, 0.15, 14);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.8,
      roughness: 0.25,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
    });

    padLocations.forEach((pos) => {
      const pad = new THREE.Mesh(padGeom, padMat);
      pad.position.copy(pos);
      pad.position.y = 0.08;
      this.group.add(pad);

      this.refuelPads.push({
        position: pos,
        radius: 4.8,
      });
    });
  }

  private buildStuntRingsAndTokens() {
    const ringConfigs = [
      { id: 'ring_loop_entry', pos: new THREE.Vector3(this.loopEntryX, 3.2, 5), r: 4.0, pts: 250, label: 'LOOP APPROACH' },
      { id: 'ring_loop_apex', pos: new THREE.Vector3(0, 27.2, this.loopCenterZ), r: 4.5, pts: 1000, label: 'APEX ZENITH' },
      { id: 'ring_exit_gate', pos: new THREE.Vector3(this.loopExitX, 4.0, -46), r: 4.2, pts: 350, label: 'FINISH ARCH' },
      { id: 'ring_kicker_leap', pos: new THREE.Vector3(this.loopExitX, 7.5, -76), r: 4.5, pts: 750, label: 'MEGA JUMP' },
      { id: 'ring_high_orbit', pos: new THREE.Vector3(45, 24.0, 25), r: 5.0, pts: 800, label: 'STRATOSPHERE' },
      { id: 'ring_trench_super', pos: new THREE.Vector3(55, 7.2, -46), r: 4.5, pts: 600, label: 'FLAME TRENCH' },
      { id: 'ring_qp_peak', pos: new THREE.Vector3(-62, 11.0, -10), r: 4.2, pts: 500, label: 'WALL RIDE' },
      { id: 'ring_drone_deck', pos: new THREE.Vector3(-52, 4.5, 55), r: 4.0, pts: 400, label: 'ASDS APPROACH' },
    ];

    const torusGeom = new THREE.TorusGeometry(3.8, 0.22, 6, 16);

    ringConfigs.forEach((cfg) => {
      const rGroup = new THREE.Group();
      rGroup.position.copy(cfg.pos);

      const torus = new THREE.Mesh(torusGeom, this.ringMat);
      rGroup.add(torus);
      this.group.add(rGroup);

      this.rings.push({
        id: cfg.id,
        mesh: rGroup,
        position: cfg.pos,
        radius: cfg.r,
        collected: false,
        points: cfg.pts,
        label: cfg.label,
      });

      this.animatedMeshes.push({ mesh: rGroup, rotSpeed: 1.2 });
    });

    // 10 Collectible Star Tokens
    const tokenConfigs = [
      { id: 'tok_start_gate', pos: new THREE.Vector3(this.loopEntryX, 1.2, 45), pts: 250, label: 'HOT WHEELS BOOST' },
      { id: 'tok_loop_entry', pos: new THREE.Vector3(this.loopEntryX, 1.2, 15), pts: 300, label: 'SPEED ENTRY' },
      { id: 'tok_loop_crest', pos: new THREE.Vector3(0, 18.0, this.loopCenterZ), pts: 1000, label: 'LOOP ZENITH' },
      { id: 'tok_finish_arch', pos: new THREE.Vector3(this.loopExitX, 3.8, -46), pts: 500, label: 'FINISH ARCH' },
      { id: 'tok_kicker_lip', pos: new THREE.Vector3(this.loopExitX, 6.0, -74), pts: 600, label: 'MEGA KICKER' },
      { id: 'tok_landing_deck', pos: new THREE.Vector3(this.loopExitX, 1.5, -88), pts: 400, label: 'CLEAN LANDING' },
      { id: 'tok_bounce_high', pos: new THREE.Vector3(45, 18.0, 25), pts: 800, label: 'ORBITAL CATAPULT' },
      { id: 'tok_trench_jump', pos: new THREE.Vector3(55, 6.5, -46), pts: 750, label: 'FLAME LEAP' },
      { id: 'tok_qp_vert', pos: new THREE.Vector3(-59, 10.0, -10), pts: 700, label: 'VERTICAL WALL RIDE' },
      { id: 'tok_drone_bullseye', pos: new THREE.Vector3(-52, 1.8, 55), pts: 1500, label: 'DRONE SHIP BULLSEYE' },
    ];

    const coinGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.25, 14);

    tokenConfigs.forEach((cfg) => {
      const tokGroup = new THREE.Group();
      tokGroup.position.copy(cfg.pos);

      const coin = new THREE.Mesh(coinGeom, this.tokenMat);
      coin.rotation.x = Math.PI / 2;
      tokGroup.add(coin);

      this.group.add(tokGroup);

      this.tokens.push({
        id: cfg.id,
        mesh: tokGroup,
        position: cfg.pos,
        radius: 2.0,
        collected: false,
        points: cfg.pts,
        label: cfg.label,
      });

      this.animatedMeshes.push({ mesh: tokGroup, rotSpeed: 2.2, isBobbing: true, baseY: cfg.pos.y });
    });
  }

  private buildOptimizedLighting() {
    // 1 single ambient fill light for night visibility
    const fillLight = new THREE.PointLight(0x38bdf8, 0.8, 60);
    fillLight.position.set(0, 14, this.loopCenterZ);
    this.group.add(fillLight);
  }

  public update(delta: number) {
    const time = performance.now() * 0.001;
    for (let i = 0; i < this.animatedMeshes.length; i++) {
      const item = this.animatedMeshes[i];
      item.mesh.rotation.y += item.rotSpeed * delta;
      if (item.isBobbing && item.baseY !== undefined) {
        item.mesh.position.y = item.baseY + Math.sin(time * 3.5 + item.mesh.position.x) * 0.25;
      }
    }

    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      if (token.collected && token.mesh.visible) {
        token.mesh.visible = false;
      }
    }
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      if (ring.collected && ring.mesh.visible) {
        ring.mesh.visible = false;
      }
    }

    if (this.finishFlagMesh) {
      this.finishFlagMesh.rotation.x = Math.sin(time * 4) * 0.12;
    }

    // Pulse booster arrows
    const boostPulse = 0.6 + Math.sin(time * 8.0) * 0.4;
    for (let i = 0; i < this.boosterChevrons.length; i++) {
      (this.boosterChevrons[i].material as THREE.MeshBasicMaterial).opacity = boostPulse;
    }
  }

  /**
   * Exact physical height calculation for ALL arena props and sculpted dunes.
   */
  public getGroundHeightAt(x: number, z: number): number {
    const halfTrack = this.trackWidth / 2 + 0.5;

    // 1. Hot Wheels Runway Floors
    if (Math.abs(x - this.loopEntryX) <= halfTrack && z <= 68 && z >= -11.5) {
      return 0.18;
    }
    if (Math.abs(x - this.loopExitX) <= halfTrack && z <= -11.5 && z >= -65) {
      return 0.18;
    }
    if ((Math.abs(z - 32) <= 2.6 || Math.abs(z - 6) <= 2.6) && Math.abs(x - this.loopEntryX) <= halfTrack + 3.8) {
      return 0.18;
    }

    // 2. Hot Wheels Exit Jump Kicker (z = -65 to -75 at x = loopExitX)
    if (Math.abs(x - this.loopExitX) <= halfTrack && z <= -65 && z >= -75) {
      const t = (-65 - z) / 10.0;
      return 0.18 + t * 3.6;
    }

    // 3. Hot Wheels Downward Landing Ramp (z = -78 to -92 at x = loopExitX)
    if (Math.abs(x - this.loopExitX) <= halfTrack * 1.6 && z <= -78 && z >= -92) {
      const t = (z - (-92)) / 14.0;
      return 0.18 + t * 3.6;
    }

    // 4. Hot Wheels Quarter-Pipe Wall Ride (West: x = -65 to -56, z = -10 ± 8.5)
    if (Math.abs(z - (-10)) <= 8.5 && x <= -56.0 && x >= -65.0) {
      const dx = (-56.0 - x) / 9.0;
      return Math.min(9.2, 0.18 + dx * dx * 8.8);
    }

    // 5. SpaceX Rocket Flame Trench Super Jump (East: x = 55)
    if (Math.abs(x - 55) <= 4.5 && z <= -26 && z >= -40) {
      const t = (-26 - z) / 14.0;
      return 0.18 + t * 4.2;
    }
    if (Math.abs(x - 55) <= 5.5 && z <= -52 && z >= -68) {
      const t = (z - (-68)) / 16.0;
      return 0.18 + t * 4.2;
    }

    // 6. SpaceX Drone Ship "Of Course I Still Love You" (x = -52, z = 55)
    if (Math.abs(x - (-52)) <= 9.5 && Math.abs(z - 55) <= 10.5) {
      return 0.85;
    }
    if (Math.abs(x - (-52)) <= 9.5) {
      if (z > 65.5 && z <= 69.5) {
        const t = (69.5 - z) / 4.0;
        return t * 0.85;
      }
      if (z < 44.5 && z >= 40.5) {
        const t = (z - 40.5) / 4.0;
        return t * 0.85;
      }
    }

    // 7. Kinetic Gravity Bounce Pad (x = 45, z = 25)
    if (Math.hypot(x - 45, z - 25) <= 6.2) {
      return 0.25;
    }

    // 8. Sculpted Desert Sand Dunes
    const dxEast = (x - 65) / 28.0;
    const dzEast = (z - (-10)) / 32.0;
    const d2East = dxEast * dxEast + dzEast * dzEast;
    let hEast = 0;
    if (d2East < 1.0) {
      hEast = 6.8 * 0.5 * (1 + Math.cos(Math.PI * Math.sqrt(d2East)));
    }

    const dxWest = (x - (-65)) / 26.0;
    const dzWest = (z - 25) / 30.0;
    const d2West = dxWest * dxWest + dzWest * dzWest;
    let hWest = 0;
    if (d2West < 1.0) {
      hWest = 6.4 * 0.5 * (1 + Math.cos(Math.PI * Math.sqrt(d2West)));
    }

    const duneHeight = Math.max(hEast, hWest);
    if (duneHeight > 0.05) {
      return duneHeight;
    }

    return 0;
  }
}

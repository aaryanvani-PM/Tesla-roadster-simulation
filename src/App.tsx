import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createRoadsterModel } from './game/RoadsterModel';
import { SpaceXTestArena } from './game/Environment';
import { ParticleSystem } from './game/ParticleSystem';
import { PhysicsEngine, PlayerControls, StuntEvent, VehicleTuning } from './game/PhysicsEngine';
import { CameraController, CameraMode } from './game/CameraController';
import { audioEngine } from './game/AudioEngine';
import { HUD } from './components/HUD';
import { ControlsDock } from './components/ControlsDock';
import { ElonThumbsUpModal } from './components/ElonThumbsUpModal';
import { IntroScreen } from './components/IntroScreen';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // React State for HUD & UI
  const [speedMph, setSpeedMph] = useState<number>(0);
  const [altitudeMeters, setAltitudeMeters] = useState<number>(0);
  const [nitrogenFuel, setNitrogenFuel] = useState<number>(100);
  const [airtime, setAirtime] = useState<number>(0);
  const [stuntScore, setStuntScore] = useState<number>(0);
  const [recentStunt, setRecentStunt] = useState<StuntEvent | null>(null);
  const [ringsCollected, setRingsCollected] = useState<number>(0);
  const [totalRings, setTotalRings] = useState<number>(8);
  const [tokensCollected, setTokensCollected] = useState<number>(0);
  const [totalTokens, setTotalTokens] = useState<number>(10);
  const [dawnProgress, setDawnProgress] = useState<number>(0);
  const [outOfBoundsNotice, setOutOfBoundsNotice] = useState<boolean>(false);
  const [lastTokenEvent, setLastTokenEvent] = useState<{ id: string; points: number; label: string; timestamp: number } | null>(null);
  const [isGrounded, setIsGrounded] = useState<boolean>(true);
  const [carX, setCarX] = useState<number>(0);
  const [carZ, setCarZ] = useState<number>(10);
  const [carHeading, setCarHeading] = useState<number>(0);
  const [ringPositions, setRingPositions] = useState<{ x: number; z: number; collected: boolean }[]>([]);
  const [tokenPositions, setTokenPositions] = useState<{ x: number; z: number; collected: boolean }[]>([]);
  const [qualityMode, setQualityMode] = useState<'perf' | 'high'>('perf');

  // Camera, Audio & Tuning states
  const [cameraMode, setCameraMode] = useState<CameraMode>('intro');
  const [isIntroActive, setIsIntroActive] = useState<boolean>(true);
  const isIntroActiveRef = useRef<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [tuning, setTuning] = useState<VehicleTuning>({
    brakeSensitivity: 1.0,
    steeringResponse: 1.0,
    boostPower: 1.0,
  });
  const [isTuningOpen, setIsTuningOpen] = useState<boolean>(false);

  // References to running game singletons
  const physicsRef = useRef<PhysicsEngine | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<PlayerControls>({
    forward: false,
    backward: false,
    steerLeft: false,
    steerRight: false,
    thrusterLift: false,
    rocketBoost: false,
    rollLeft: false,
    rollRight: false,
    pitchUp: false,
    pitchDown: false,
    handbrake: false,
  });

  // Handle virtual button triggers (mobile & dock buttons)
  const handleVirtualControlStart = (code: string) => {
    audioEngine.init();
    const ctrl = controlsRef.current;
    if (code === 'Space') ctrl.thrusterLift = true;
    if (code === 'Shift') ctrl.rocketBoost = true;
    if (code === 'KeyW') ctrl.forward = true;
    if (code === 'KeyS') ctrl.backward = true;
    if (code === 'KeyA') ctrl.steerLeft = true;
    if (code === 'KeyD') ctrl.steerRight = true;
  };

  const handleVirtualControlEnd = (code: string) => {
    const ctrl = controlsRef.current;
    if (code === 'Space') ctrl.thrusterLift = false;
    if (code === 'Shift') ctrl.rocketBoost = false;
    if (code === 'KeyW') ctrl.forward = false;
    if (code === 'KeyS') ctrl.backward = false;
    if (code === 'KeyA') ctrl.steerLeft = false;
    if (code === 'KeyD') ctrl.steerRight = false;
  };

  const handleRespawn = () => {
    if (physicsRef.current) {
      physicsRef.current.reset(-1.8, 55);
    }
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleUpdateTuning = (newTuning: Partial<VehicleTuning>) => {
    setTuning((prev) => {
      const updated = { ...prev, ...newTuning };
      if (physicsRef.current) {
        physicsRef.current.setTuning(updated);
      }
      return updated;
    });
  };

  const handleToggleTuning = () => {
    setIsTuningOpen((prev) => !prev);
  };

  const handleStartGame = () => {
    setIsIntroActive(false);
    isIntroActiveRef.current = false;
    setCameraMode('chase');
    if (cameraControllerRef.current) {
      cameraControllerRef.current.setMode('chase');
    }
  };

  const handleCameraModeChange = (mode: CameraMode) => {
    setCameraMode(mode);
    if (cameraControllerRef.current) {
      cameraControllerRef.current.setMode(mode);
    }
  };

  const handleToggleQuality = () => {
    const next = qualityMode === 'perf' ? 'high' : 'perf';
    setQualityMode(next);
    if (rendererRef.current) {
      const pr = next === 'high' ? Math.min(window.devicePixelRatio, 1.25) : 1.0;
      rendererRef.current.setPixelRatio(pr);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    const initialSkyColor = new THREE.Color(0x050814);
    scene.background = initialSkyColor;
    const fog = new THREE.FogExp2(0x050814, 0.0035);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 450);
    camera.position.set(-1.8, 4, 62);

    // High performance WebGLRenderer with PCF shadows and 1.0 pixel ratio default for 60 FPS
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'mediump',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(1.0); // 1.0 provides butter-smooth 60 FPS on any browser/GPU
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // Much faster than PCFSoftShadowMap

    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 2. Procedural Studio Reflection Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Dynamic Night-to-Dawn Lighting Systems
    const hemiLight = new THREE.HemisphereLight(0x1e1b4b, 0x09090b, 0.45);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const mainDirectional = new THREE.DirectionalLight(0xc7d2fe, 0.65);
    mainDirectional.position.set(35, 75, 45);
    mainDirectional.castShadow = true;
    mainDirectional.shadow.mapSize.width = 1024;
    mainDirectional.shadow.mapSize.height = 1024;
    mainDirectional.shadow.camera.near = 0.5;
    mainDirectional.shadow.camera.far = 220;
    const d = 75;
    mainDirectional.shadow.camera.left = -d;
    mainDirectional.shadow.camera.right = d;
    mainDirectional.shadow.camera.top = d;
    mainDirectional.shadow.camera.bottom = -d;
    mainDirectional.shadow.bias = -0.0006;
    scene.add(mainDirectional);

    // 4. Night Sky Starfield (1,200 twinkling stars)
    const starGeom = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.92 + 0.08);
      const r = 240;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.4,
      transparent: true,
      opacity: 0.95,
    });
    const starfield = new THREE.Points(starGeom, starMat);
    scene.add(starfield);

    // 5. Rising SpaceX Launch Sun & Corona Halo
    const sunGroup = new THREE.Group();
    sunGroup.position.set(-45, -6, -135);

    const sunDiscGeom = new THREE.CircleGeometry(16, 24);
    const sunDiscMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const sunDisc = new THREE.Mesh(sunDiscGeom, sunDiscMat);
    sunDisc.lookAt(0, 5, 0);
    sunGroup.add(sunDisc);

    const sunHaloGeom = new THREE.RingGeometry(15, 42, 24);
    const sunHaloMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sunHalo = new THREE.Mesh(sunHaloGeom, sunHaloMat);
    sunHalo.position.z = 0.1;
    sunHalo.lookAt(0, 5, 0);
    sunGroup.add(sunHalo);
    scene.add(sunGroup);

    // 6. Instantiating World Modules
    const arena = new SpaceXTestArena();
    scene.add(arena.group);

    const roadster = createRoadsterModel();
    scene.add(roadster.group);

    const particleSystem = new ParticleSystem();
    scene.add(particleSystem.group);

    const physics = new PhysicsEngine();
    physicsRef.current = physics;

    const camController = new CameraController(camera);
    cameraControllerRef.current = camController;
    camController.setMode(isIntroActiveRef.current ? 'intro' : 'chase');

    // Callbacks for stunts, rings, tokens and out of bounds
    physics.onStuntTriggered = (event) => {
      setRecentStunt(event);
      setStuntScore(physics.totalScore);
    };

    physics.onRingCollected = (ring) => {
      particleSystem.emitRingSparks(ring.position);
      setStuntScore(physics.totalScore);
      setRingsCollected(physics.ringsCollectedCount);
      // Update ring radar positions ONLY when collected (saves 20 array allocations/sec!)
      setRingPositions(
        arena.rings.map((r) => ({ x: r.position.x, z: r.position.z, collected: r.collected }))
      );
    };

    physics.onTokenCollected = (token) => {
      particleSystem.emitRingSparks(token.position);
      setStuntScore(physics.totalScore);
      const count = arena.tokens.filter((t) => t.collected).length;
      setTokensCollected(count);
      setLastTokenEvent({
        id: token.id,
        points: token.points,
        label: token.label,
        timestamp: Date.now(),
      });
      // Update token radar positions ONLY when collected
      setTokenPositions(
        arena.tokens.map((t) => ({ x: t.position.x, z: t.position.z, collected: t.collected }))
      );
    };

    physics.onOutOfBounds = () => {
      setOutOfBoundsNotice(true);
      setTimeout(() => setOutOfBoundsNotice(false), 2400);
    };

    setTotalRings(arena.rings.length);
    setRingPositions(
      arena.rings.map((r) => ({ x: r.position.x, z: r.position.z, collected: r.collected }))
    );

    setTotalTokens(arena.tokens.length);
    setTokenPositions(
      arena.tokens.map((t) => ({ x: t.position.x, z: t.position.z, collected: t.collected }))
    );

    // 7. Input Handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isIntroActiveRef.current) return;
      audioEngine.init();

      if (e.repeat) return;
      const ctrl = controlsRef.current;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          ctrl.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          ctrl.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          ctrl.steerLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          ctrl.steerRight = true;
          break;
        case 'Space':
          ctrl.thrusterLift = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          ctrl.rocketBoost = true;
          break;
        case 'KeyQ':
          ctrl.rollLeft = true;
          break;
        case 'KeyE':
          ctrl.rollRight = true;
          break;
        case 'KeyR':
          handleRespawn();
          break;
        case 'KeyC':
          setCameraMode((prev) => {
            const nextMode: CameraMode = prev === 'chase' ? 'cockpit' : prev === 'cockpit' ? 'action' : prev === 'action' ? 'drone' : 'chase';
            camController.setMode(nextMode);
            return nextMode;
          });
          break;
        case 'KeyM':
          handleToggleMute();
          break;
        case 'KeyT':
          handleToggleTuning();
          break;
        case 'Escape':
          setIsTuningOpen(false);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const ctrl = controlsRef.current;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          ctrl.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          ctrl.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          ctrl.steerLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          ctrl.steerRight = false;
          break;
        case 'Space':
          ctrl.thrusterLift = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          ctrl.rocketBoost = false;
          break;
        case 'KeyQ':
          ctrl.rollLeft = false;
          break;
        case 'KeyE':
          ctrl.rollRight = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation & Render Loop with Zero Per-Frame Allocations
    let lastTime = performance.now();
    let animFrameId: number;
    let hudTimer = 0;
    const carHeadingEuler = new THREE.Euler(0, 0, 0, 'YXZ');

    // Reusable vectors for particle positions (Zero GC!)
    const _pfl = new THREE.Vector3();
    const _pfr = new THREE.Vector3();
    const _prl = new THREE.Vector3();
    const _prr = new THREE.Vector3();
    const _pBoost = new THREE.Vector3();

    // Dynamic Time-of-Day smooth transition state
    let currentDawnFactor = 0.0;
    const nightSky = new THREE.Color(0x050814);
    const midSky = new THREE.Color(0x4a1236);
    const dawnSky = new THREE.Color(0xd9480f);
    const currentSkyColor = new THREE.Color();

    const nightDirColor = new THREE.Color(0xc7d2fe);
    const dawnDirColor = new THREE.Color(0xffaa44);

    const nightHemiSky = new THREE.Color(0x1e1b4b);
    const dawnHemiSky = new THREE.Color(0xfdba74);
    const nightHemiGround = new THREE.Color(0x09090b);
    const dawnHemiGround = new THREE.Color(0x451a03);

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;

      const controls = controlsRef.current;

      // Update Physics
      physics.update(delta, controls, arena);

      // Sync 3D Roadster Model
      roadster.group.position.copy(physics.position);
      roadster.group.quaternion.copy(physics.quaternion);

      // Front Wheels Turn To Steer, Rear Wheels Remain Aligned
      roadster.wheels.frontLeft.rotation.y = physics.steerAngle;
      roadster.wheels.frontRight.rotation.y = physics.steerAngle;
      roadster.wheels.rearLeft.rotation.y = 0;
      roadster.wheels.rearRight.rotation.y = 0;

      // Wheel Spin
      roadster.wheels.frontLeft.children[0].rotation.x = -physics.wheelSpinAngle;
      roadster.wheels.frontRight.children[0].rotation.x = -physics.wheelSpinAngle;
      roadster.wheels.rearLeft.children[0].rotation.x = -physics.wheelSpinAngle;
      roadster.wheels.rearRight.children[0].rotation.x = -physics.wheelSpinAngle;

      // Thruster Visual Effects
      const isThrusterActive = controls.thrusterLift && physics.nitrogenFuel > 0;
      const isBoostActive = controls.rocketBoost && physics.nitrogenFuel > 0;

      // Gimbal Nozzle Physical Tilt Animation
      const gimbalZ = physics.thrusterGimbalZ;
      const gimbalX = physics.thrusterGimbalX;

      roadster.thrusterPivots.fl.rotation.z = gimbalZ;
      roadster.thrusterPivots.fr.rotation.z = gimbalZ;
      roadster.thrusterPivots.rl.rotation.z = gimbalZ;
      roadster.thrusterPivots.rr.rotation.z = gimbalZ;

      roadster.thrusterPivots.fl.rotation.x = gimbalX;
      roadster.thrusterPivots.fr.rotation.x = gimbalX;
      roadster.thrusterPivots.rl.rotation.x = gimbalX;
      roadster.thrusterPivots.rr.rotation.x = gimbalX;

      // 4 Underbody Vertical Thrusters
      const isAirborne = !physics.isGrounded;
      const hasFuel = physics.nitrogenFuel > 0;
      const isAirStunting = isAirborne && (controls.steerLeft || controls.steerRight || controls.rollLeft || controls.rollRight);
      const isVerticalThrusting = isThrusterActive || (isAirStunting && hasFuel);

      const verticalNozzles = [
        { key: 'fl' as const, plume: roadster.thrusterPlumes.fl, bias: physics.thrusterBiases.fl },
        { key: 'fr' as const, plume: roadster.thrusterPlumes.fr, bias: physics.thrusterBiases.fr },
        { key: 'rl' as const, plume: roadster.thrusterPlumes.rl, bias: physics.thrusterBiases.rl },
        { key: 'rr' as const, plume: roadster.thrusterPlumes.rr, bias: physics.thrusterBiases.rr },
      ];

      for (let i = 0; i < verticalNozzles.length; i++) {
        const { plume, bias } = verticalNozzles[i];
        if (isVerticalThrusting) {
          const baseScale = isThrusterActive ? 1.0 : 0.6;
          plume.scale.y = THREE.MathUtils.damp(plume.scale.y, baseScale * bias, 16, delta);
          (plume.material as THREE.MeshBasicMaterial).opacity = 0.85;
        } else {
          plume.scale.y = THREE.MathUtils.damp(plume.scale.y, 0.05, 12, delta);
          (plume.material as THREE.MeshBasicMaterial).opacity = 0.0;
        }
      }

      // Side RCS Attitude Thruster Plumes
      const isRcsLeft = physics.rcsActive.left && isAirborne && hasFuel;
      const isRcsRight = physics.rcsActive.right && isAirborne && hasFuel;

      (roadster.rcsPlumes.left.material as THREE.MeshBasicMaterial).opacity = isRcsLeft ? 0.95 : 0.0;
      (roadster.rcsPlumes.right.material as THREE.MeshBasicMaterial).opacity = isRcsRight ? 0.95 : 0.0;

      // Rear SpaceX Rocket Thruster
      if (isBoostActive) {
        roadster.thrusterPlumes.rearBoost.scale.z = THREE.MathUtils.damp(
          roadster.thrusterPlumes.rearBoost.scale.z,
          1.8,
          20,
          delta
        );
        (roadster.thrusterPlumes.rearBoost.material as THREE.MeshBasicMaterial).opacity = 0.95;
      } else {
        roadster.thrusterPlumes.rearBoost.scale.z = 0.05;
        (roadster.thrusterPlumes.rearBoost.material as THREE.MeshBasicMaterial).opacity = 0.0;
      }

      // Brake lights activation
      if (controls.backward) {
        roadster.brakeLights.color.setHex(0xff0000);
        roadster.taillightGlow.intensity = 1.8;
      } else {
        roadster.brakeLights.color.setHex(0x991b1b);
        roadster.taillightGlow.intensity = 0.5;
      }

      // Emit Particle Exhaust (Zero Object Allocations)
      if (isVerticalThrusting) {
        _pfl.copy(roadster.thrusterNozzles.fl).applyQuaternion(physics.quaternion).add(physics.position);
        _pfr.copy(roadster.thrusterNozzles.fr).applyQuaternion(physics.quaternion).add(physics.position);
        _prl.copy(roadster.thrusterNozzles.rl).applyQuaternion(physics.quaternion).add(physics.position);
        _prr.copy(roadster.thrusterNozzles.rr).applyQuaternion(physics.quaternion).add(physics.position);

        particleSystem.emitThrusterSmoke(_pfl, 4 * physics.thrusterBiases.fl);
        particleSystem.emitThrusterSmoke(_pfr, 4 * physics.thrusterBiases.fr);
        particleSystem.emitThrusterSmoke(_prl, 4 * physics.thrusterBiases.rl);
        particleSystem.emitThrusterSmoke(_prr, 4 * physics.thrusterBiases.rr);
      }

      if (isBoostActive) {
        _pBoost.copy(roadster.thrusterNozzles.rearBoost).applyQuaternion(physics.quaternion).add(physics.position);
        particleSystem.emitBoostSmoke(_pBoost, physics.velocity);
      }

      // Tire smoke on hard sliding / turning at speed
      if (physics.isGrounded && Math.abs(physics.steerAngle) > 0.22 && physics.speedMph > 35) {
        particleSystem.emitTireSmoke(physics.position, physics.velocity);
      }

      // Update Subsystems
      arena.update(delta);
      particleSystem.update(delta, camera);

      // DYNAMIC TIME-OF-DAY CYCLE
      const collectedCount = arena.tokens.filter((t) => t.collected).length;
      const targetDawn = Math.min(1.0, collectedCount / Math.max(1, arena.tokens.length));
      currentDawnFactor = THREE.MathUtils.damp(currentDawnFactor, targetDawn, 2.5, delta);

      // Sky and Fog Color Interpolation
      if (currentDawnFactor < 0.5) {
        const t = currentDawnFactor / 0.5;
        currentSkyColor.lerpColors(nightSky, midSky, t);
      } else {
        const t = (currentDawnFactor - 0.5) / 0.5;
        currentSkyColor.lerpColors(midSky, dawnSky, t);
      }
      scene.background = currentSkyColor;
      fog.color.copy(currentSkyColor);

      // Starfield fades as dawn brightens
      starMat.opacity = Math.max(0.04, 0.95 * (1.0 - currentDawnFactor * 1.15));

      // Sun rises from horizon behind Starship
      const sunY = -6 + currentDawnFactor * 32;
      sunGroup.position.y = sunY;
      sunDiscMat.opacity = Math.min(0.95, Math.max(0, (currentDawnFactor - 0.15) * 1.35));
      sunHaloMat.opacity = Math.min(0.85, Math.max(0, (currentDawnFactor - 0.1) * 1.25));

      // Directional Light tilts to dramatic low-angle sunrise casting long golden shadows
      mainDirectional.position.x = THREE.MathUtils.lerp(35, -45, currentDawnFactor);
      mainDirectional.position.y = THREE.MathUtils.lerp(75, 26, currentDawnFactor);
      mainDirectional.position.z = THREE.MathUtils.lerp(45, -95, currentDawnFactor);
      mainDirectional.color.lerpColors(nightDirColor, dawnDirColor, currentDawnFactor);
      mainDirectional.intensity = THREE.MathUtils.lerp(0.65, 2.3, currentDawnFactor);

      // Hemisphere Light warms from night indigo to golden morning sky & warm earth
      hemiLight.color.lerpColors(nightHemiSky, dawnHemiSky, currentDawnFactor);
      hemiLight.groundColor.lerpColors(nightHemiGround, dawnHemiGround, currentDawnFactor);
      hemiLight.intensity = THREE.MathUtils.lerp(0.45, 1.1, currentDawnFactor);

      // Camera Controller Update
      camController.update(
        delta,
        physics.position,
        physics.quaternion,
        physics.speedMph,
        isBoostActive,
        isThrusterActive
      );

      // Audio Engine Update
      audioEngine.update(
        physics.speedMph,
        controls.forward || controls.backward,
        isThrusterActive,
        isBoostActive,
        controls.backward && physics.speedMph > 35
      );

      // Render Three.js Scene
      renderer.render(scene, camera);

      // Throttle React State updates to ~15Hz (saves CPU for solid 60 FPS)
      hudTimer += delta;
      if (hudTimer > 0.066) {
        hudTimer = 0;
        setSpeedMph(physics.speedMph);
        setAltitudeMeters(physics.position.y);
        setNitrogenFuel(physics.nitrogenFuel);
        setAirtime(physics.airtime);
        setIsGrounded(physics.isGrounded);
        setCarX(physics.position.x);
        setCarZ(physics.position.z);
        setDawnProgress(currentDawnFactor);

        carHeadingEuler.setFromQuaternion(physics.quaternion, 'YXZ');
        setCarHeading(carHeadingEuler.y);
      }
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particleSystem.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Flight Telemetry HUD & Dock Overlay (Fades in smoothly when intro completes) */}
      <div className={`transition-opacity duration-1000 ${isIntroActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <HUD
          speedMph={speedMph}
          altitudeMeters={altitudeMeters}
          nitrogenFuel={nitrogenFuel}
          airtime={airtime}
          stuntScore={stuntScore}
          recentStunt={recentStunt}
          ringsCollected={ringsCollected}
          totalRings={totalRings}
          tokensCollected={tokensCollected}
          totalTokens={totalTokens}
          dawnProgress={dawnProgress}
          outOfBoundsNotice={outOfBoundsNotice}
          isGrounded={isGrounded}
          carX={carX}
          carZ={carZ}
          carHeading={carHeading}
          ringPositions={ringPositions}
          tokenPositions={tokenPositions}
          qualityMode={qualityMode}
          onToggleQuality={handleToggleQuality}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          tuning={tuning}
          onUpdateTuning={handleUpdateTuning}
          isTuningOpen={isTuningOpen}
          onToggleTuning={handleToggleTuning}
        />

        {/* Celebratory Elon Musk Thumbs Up Animation Overlay */}
        <ElonThumbsUpModal tokenEvent={lastTokenEvent} />

        {/* Unified Ergonomic Bottom Control Dock */}
        <ControlsDock
          cameraMode={cameraMode}
          onCameraModeChange={handleCameraModeChange}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onRespawn={handleRespawn}
          onTriggerControlStart={handleVirtualControlStart}
          onTriggerControlEnd={handleVirtualControlEnd}
          isTuningOpen={isTuningOpen}
          onToggleTuning={handleToggleTuning}
        />
      </div>

      {/* Cinematic Opening Black Screen Intro Animation */}
      {isIntroActive && <IntroScreen onStartGame={handleStartGame} />}
    </div>
  );
}

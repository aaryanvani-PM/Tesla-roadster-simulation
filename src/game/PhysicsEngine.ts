import * as THREE from 'three';
import { SpaceXTestArena, StuntRing, CollectibleToken } from './Environment';
import { audioEngine } from './AudioEngine';

export interface PlayerControls {
  forward: boolean;
  backward: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  thrusterLift: boolean;
  rocketBoost: boolean;
  rollLeft: boolean;
  rollRight: boolean;
  pitchUp: boolean;
  pitchDown: boolean;
  handbrake: boolean;
}

export interface StuntEvent {
  name: string;
  points: number;
  multiplier: number;
  timestamp: number;
}

export interface VehicleTuning {
  brakeSensitivity: number; // multiplier, default 1.0 (0.5x - 2.5x)
  steeringResponse: number; // multiplier, default 1.0 (0.5x - 2.5x)
  boostPower: number;       // multiplier, default 1.0 (0.5x - 3.0x)
}

export class PhysicsEngine {
  // Spawns centered directly in the Hot Wheels launcher runway lane (x = -1.8)
  public position: THREE.Vector3 = new THREE.Vector3(-1.8, 0.45, 55);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public quaternion: THREE.Quaternion = new THREE.Quaternion();
  public angularVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  public speedMph: number = 0;
  public isGrounded: boolean = true;
  public isInLoop: boolean = false;
  public loopAngle: number = 0; // 0 to 2*PI radians around loop
  public loopCooldown: number = 0; // Prevents re-triggering loop immediately after exiting

  public nitrogenFuel: number = 100;
  public airtime: number = 0;
  public currentStuntCombo: string | null = null;
  public comboPoints: number = 0;
  public totalScore: number = 0;
  public ringsCollectedCount: number = 0;

  // Real-time Vehicle Dynamic Tuning parameters
  public tuning: VehicleTuning = {
    brakeSensitivity: 1.0,
    steeringResponse: 1.0,
    boostPower: 1.0,
  };

  public setTuning(tuning: Partial<VehicleTuning>) {
    this.tuning = {
      ...this.tuning,
      ...tuning,
    };
  }

  // Stunt accumulators
  private accumulatedRoll: number = 0;
  private accumulatedPitch: number = 0;
  private accumulatedYaw: number = 0;

  // Physics constants - Responsive, controllable, progressive, and agile
  private readonly GRAVITY = 19.6;
  private readonly MAX_SPEED_FORWARD = 46.0; // ~103 MPH cruising speed (stable & easy to steer)
  private readonly MAX_SPEED_BOOST = 80.0; // ~179 MPH rocket boost
  private readonly ACCELERATION = 14.5; // Smooth progressive throttle response
  private readonly BOOST_ACCEL = 34.0; // High-velocity rocket boost
  private readonly BRAKE_DECEL = 36.0;
  private readonly WHEELBASE = 2.65; // Realistic Tesla Roadster wheelbase (2.65m)

  // Steering & wheel animation
  public steerAngle: number = 0;
  public wheelSpinAngle: number = 0;

  // In-air Thruster Vectoring & Gimbal Animation States
  public thrusterGimbalZ: number = 0; // Roll / lateral vector tilt (A/D)
  public thrusterGimbalX: number = 0; // Pitch / longitudinal vector tilt (W/S)
  public thrusterBiases: { fl: number; fr: number; rl: number; rr: number } = {
    fl: 1.0,
    fr: 1.0,
    rl: 1.0,
    rr: 1.0,
  };
  public rcsActive: { left: boolean; right: boolean } = {
    left: false,
    right: false,
  };

  // Reusable vectors and quaternions to completely avoid per-frame garbage collection
  private _forward: THREE.Vector3 = new THREE.Vector3();
  private _up: THREE.Vector3 = new THREE.Vector3();
  private _right: THREE.Vector3 = new THREE.Vector3();
  private _euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private _worldUp: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private _yawQuat: THREE.Quaternion = new THREE.Quaternion();
  private _rollQuat: THREE.Quaternion = new THREE.Quaternion();
  private _pitchQuat: THREE.Quaternion = new THREE.Quaternion();
  private _loopTangent: THREE.Vector3 = new THREE.Vector3();
  private _loopNormal: THREE.Vector3 = new THREE.Vector3();
  private _loopRight: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
  private _loopMatrix: THREE.Matrix4 = new THREE.Matrix4();

  // Callbacks
  public onStuntTriggered?: (stunt: StuntEvent) => void;
  public onRingCollected?: (ring: StuntRing) => void;
  public onTokenCollected?: (token: CollectibleToken) => void;
  public onOutOfBounds?: () => void;

  constructor() {
    this.reset();
  }

  public reset(spawnX: number = -1.8, spawnZ: number = 55) {
    this.position.set(spawnX, 0.45, spawnZ);
    this.velocity.set(0, 0, 0);
    this.quaternion.set(0, 0, 0, 1); // Facing along -Z toward loop
    this.angularVelocity.set(0, 0, 0);
    this.speedMph = 0;
    this.isGrounded = true;
    this.isInLoop = false;
    this.loopAngle = 0;
    this.loopCooldown = 0;
    this.steerAngle = 0;
    this.nitrogenFuel = 100;
    this.airtime = 0;
    this.accumulatedRoll = 0;
    this.accumulatedPitch = 0;
    this.accumulatedYaw = 0;
    this.thrusterGimbalZ = 0;
    this.thrusterGimbalX = 0;
    this.rcsActive.left = false;
    this.rcsActive.right = false;
    this.currentStuntCombo = null;
    this.comboPoints = 0;
  }

  public update(delta: number, controls: PlayerControls, arena: SpaceXTestArena) {
    // Cooldown decrement
    if (this.loopCooldown > 0) {
      this.loopCooldown = Math.max(0, this.loopCooldown - delta);
    }

    // 1. Compute Orientation Vectors
    this._forward.set(0, 0, -1).applyQuaternion(this.quaternion);
    this._up.set(0, 1, 0).applyQuaternion(this.quaternion);
    this._right.set(1, 0, 0).applyQuaternion(this.quaternion);

    // 2. CHECK OFFICIAL HOT WHEELS 360° LOOP ENTRY
    // Strict entry check: must be near entry lane (x = arena.loopEntryX ± 1.5m),
    // moving forward (-Z), loop cooldown expired, and inside the loop entry corridor.
    const inLoopX = Math.abs(this.position.x - arena.loopEntryX) <= 1.5;
    const inLoopZ = this.position.z <= arena.loopStartZ + 0.4 && this.position.z >= arena.loopEndZ - 0.4;

    if (this.isInLoop) {
      this.handleHotWheelsLoop(delta, controls, arena);
    } else if (this.loopCooldown <= 0 && inLoopX && inLoopZ && this.velocity.z < -4.0) {
      this.handleHotWheelsLoop(delta, controls, arena);
    } else {
      this.handleStandardPhysics(delta, controls, arena);
    }

    // 3. Nitrogen Fuel Dynamics & Cryo-Pads
    this.handleFuelAndRefuelPads(delta, controls, arena);

    // 4. Update Position from Velocity
    this.position.addScaledVector(this.velocity, delta);

    // 5. SOFT BOUNDARY DEFLECTION & FORGIVING BOUNCE BUMPERS
    const bounceLimitX = 88.0;
    const bounceLimitZ = 96.0;

    if (this.position.x > bounceLimitX) {
      this.position.x = bounceLimitX - 0.2;
      this.velocity.x = -Math.abs(this.velocity.x) * 0.4;
    } else if (this.position.x < -bounceLimitX) {
      this.position.x = -bounceLimitX + 0.2;
      this.velocity.x = Math.abs(this.velocity.x) * 0.4;
    }

    if (this.position.z > bounceLimitZ) {
      this.position.z = bounceLimitZ - 0.2;
      this.velocity.z = -Math.abs(this.velocity.z) * 0.4;
    } else if (this.position.z < -bounceLimitZ) {
      this.position.z = -bounceLimitZ + 0.2;
      this.velocity.z = Math.abs(this.velocity.z) * 0.4;
    }

    // Out-of-bounds safety repositioning
    if (
      Math.abs(this.position.x) > 105.0 ||
      Math.abs(this.position.z) > 115.0 ||
      this.position.y < -3.0 ||
      this.position.y > 120.0
    ) {
      this.reset(-1.8, 55);
      if (this.onOutOfBounds) {
        this.onOutOfBounds();
      }
      return;
    }

    // 6. Check Ring and Token Collisions
    this.checkRingCollisions(arena);
    this.checkTokenCollisions(arena);

    // 7. Calculate Speedometer (1 unit/sec ≈ 2.237 MPH)
    const totalSpeed = this.velocity.length();
    this.speedMph = Math.round(totalSpeed * 2.237);

    // 8. Wheel Rotation
    this.wheelSpinAngle += (totalSpeed / 0.38) * delta;
  }

  /**
   * Dedicated Authentic Hot Wheels 360° Inverted Loop Dynamics:
   * Smoothly corkscrews from x = -1.8 to x = +1.8 through a full 360° vertical loop,
   * then launches out cleanly onto the exit runway without getting trapped!
   */
  private handleHotWheelsLoop(delta: number, controls: PlayerControls, arena: SpaceXTestArena) {
    this.isInLoop = true;
    this.isGrounded = true;

    const cz = arena.loopCenterZ;
    const cy = arena.loopCenterY;
    const r = arena.loopRadius - 0.45;
    const xEntry = arena.loopEntryX;
    const xExit = arena.loopExitX;

    // Minimum thrilling speed around the loop
    let loopSpeed = Math.max(26.0, -this.velocity.z);
    if (controls.rocketBoost && this.nitrogenFuel > 0) {
      loopSpeed += 30 * delta;
    }

    // Angular progression around 360 circle
    const angularSpeed = loopSpeed / r;
    this.loopAngle += angularSpeed * delta;

    // Lateral corkscrew transition from entry lane (-1.8) to exit lane (+1.8)
    const progress = Math.min(1.0, this.loopAngle / (Math.PI * 2));
    this.position.x = xEntry + progress * (xExit - xEntry);

    // Circle coordinate mapping
    this.position.y = cy - Math.cos(this.loopAngle) * r;
    this.position.z = cz - Math.sin(this.loopAngle) * r;

    // Track tangent and normal vector calculation
    this._loopTangent.set(0, Math.sin(this.loopAngle), -Math.cos(this.loopAngle)).normalize();
    this._loopNormal.set(0, Math.cos(this.loopAngle), Math.sin(this.loopAngle)).normalize();

    this.velocity.copy(this._loopTangent).multiplyScalar(loopSpeed);

    // Set car orientation along tangent and normal
    this._loopMatrix.makeBasis(this._loopRight, this._loopNormal, this._loopTangent.clone().negate());
    this.quaternion.setFromRotationMatrix(this._loopMatrix);

    // Loop completed! Transition cleanly onto exit runway at x = loopExitX (+1.8)
    if (this.loopAngle >= Math.PI * 2) {
      this.isInLoop = false;
      this.loopAngle = 0;
      this.loopCooldown = 2.5; // 2.5s cooldown ensures it NEVER gets sucked back in!
      this.position.x = xExit;
      this.position.y = 0.55;
      this.position.z = arena.loopStartZ - 2.5; // Place cleanly past the entry threshold
      this.velocity.set(0, 0, -Math.max(34.0, loopSpeed)); // Fast launch down exit straightaway!
      this.quaternion.set(0, 0, 0, 1); // Pointing forward toward finish gate

      this.totalScore += 1000;
      this.currentStuntCombo = 'HOT WHEELS 360° LOOP! +1000';
      this.comboPoints = 1000;
      audioEngine.playStuntScore(true);

      if (this.onStuntTriggered) {
        this.onStuntTriggered({
          name: 'HOT WHEELS 360° LOOP',
          points: 1000,
          multiplier: 2.0,
          timestamp: Date.now(),
        });
      }
    }
  }

  private handleStandardPhysics(delta: number, controls: PlayerControls, arena: SpaceXTestArena) {
    const groundY = arena.getGroundHeightAt(this.position.x, this.position.z);
    const suspensionHeight = 0.45;
    const currentGroundClearance = this.position.y - groundY;

    const wasGrounded = this.isGrounded;
    this.isGrounded = currentGroundClearance <= suspensionHeight + 0.12;

    if (this.isGrounded) {
      if (!wasGrounded) {
        this.evaluateLandingStunt();
        this.airtime = 0;
        this.accumulatedRoll = 0;
        this.accumulatedPitch = 0;
        this.accumulatedYaw = 0;
      }

      this.position.y = THREE.MathUtils.damp(this.position.y, groundY + suspensionHeight, 18, delta);

      let forwardSpeed = this.velocity.dot(this._forward);

      // Check Hot Wheels Launcher Speed Booster Strips
      const onLauncherTrack =
        Math.abs(this.position.x - arena.loopEntryX) <= arena.trackWidth * 0.45 &&
        this.position.z >= arena.loopStartZ &&
        this.position.z <= 60;

      if (onLauncherTrack && forwardSpeed > 3.0) {
        // Automatic magnetic boost propulsion towards loop!
        forwardSpeed = Math.min(this.MAX_SPEED_FORWARD + 8.0, forwardSpeed + 22.0 * delta);
      }

      if (controls.forward) {
        const boostMultiplier = this.tuning.boostPower;
        const accel = controls.rocketBoost && this.nitrogenFuel > 0 ? this.BOOST_ACCEL * boostMultiplier : this.ACCELERATION;
        const maxSpd = controls.rocketBoost && this.nitrogenFuel > 0 ? this.MAX_SPEED_BOOST * Math.min(1.5, 0.7 + boostMultiplier * 0.3) : this.MAX_SPEED_FORWARD;
        forwardSpeed = Math.min(maxSpd, forwardSpeed + accel * delta);
      } else if (controls.backward) {
        if (forwardSpeed > 1.0) {
          forwardSpeed = Math.max(0, forwardSpeed - (this.BRAKE_DECEL * this.tuning.brakeSensitivity) * delta);
        } else {
          forwardSpeed = Math.max(-18.0, forwardSpeed - (this.ACCELERATION * 0.75) * delta);
        }
      } else {
        forwardSpeed = THREE.MathUtils.damp(forwardSpeed, 0, 1.4, delta);
      }

      if (controls.handbrake) {
        forwardSpeed = Math.max(0, forwardSpeed - (this.BRAKE_DECEL * 1.6 * this.tuning.brakeSensitivity) * delta);
      }

      // CRITICAL: SMOOTH, INTUITIVE, SPEED-SENSITIVE STEERING SYSTEM WITH TUNING RESPONSE
      // Scales with steeringResponse multiplier in real time
      const speed = Math.abs(forwardSpeed);
      const steerMulti = this.tuning.steeringResponse;

      // Speed-sensitive maximum steering lock:
      const maxSteer = (0.42 * Math.min(1.5, Math.max(0.6, 0.5 + steerMulti * 0.5))) / (1.0 + speed * 0.04);
      const targetSteer = (controls.steerLeft ? 1 : 0) - (controls.steerRight ? 1 : 0);

      // Smooth steering rate: progressive turn-in scaled by steering response
      const steerDampRate = (targetSteer !== 0 ? 5.5 : 11.0) * THREE.MathUtils.clamp(steerMulti, 0.5, 2.5);
      this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer * maxSteer, steerDampRate, delta);

      // True Ackermann steering yaw rate: proportional to speed & steering response multiplier
      if (speed > 0.4) {
        const effectiveSpeed = Math.sign(forwardSpeed || 1) * Math.min(speed, 26.0);
        const turnRate = (effectiveSpeed / this.WHEELBASE) * Math.tan(this.steerAngle) * Math.min(1.6, 0.5 + steerMulti * 0.5);
        this._yawQuat.setFromAxisAngle(this._worldUp, turnRate * delta);
        this.quaternion.multiply(this._yawQuat);
      } else if (targetSteer !== 0 && Math.abs(forwardSpeed) > 0.02) {
        const slowPivot = Math.sign(forwardSpeed) * targetSteer * 0.7 * steerMulti * delta;
        this._yawQuat.setFromAxisAngle(this._worldUp, slowPivot);
        this.quaternion.multiply(this._yawQuat);
      }

      // Level orientation with ground
      this._euler.setFromQuaternion(this.quaternion, 'YXZ');
      this._euler.z = THREE.MathUtils.damp(this._euler.z, 0, 16, delta);
      this._euler.x = THREE.MathUtils.damp(this._euler.x, 0, 16, delta);
      this.quaternion.setFromEuler(this._euler);

      this._forward.set(0, 0, -1).applyQuaternion(this.quaternion);
      this.velocity.copy(this._forward).multiplyScalar(forwardSpeed);

      // Cold-Gas Lift Initiation
      if (controls.thrusterLift && this.nitrogenFuel > 0) {
        this.velocity.y = 9.5;
        this.isGrounded = false;
      }

      // Reset in-air RCS and gimbals when grounded
      this.rcsActive.left = false;
      this.rcsActive.right = false;
      this.thrusterGimbalZ = THREE.MathUtils.damp(this.thrusterGimbalZ, 0, 14, delta);
      this.thrusterGimbalX = THREE.MathUtils.damp(this.thrusterGimbalX, 0, 14, delta);
    } else {
      // AIRBORNE & HOVER PHYSICS (Stunts & Cold-Gas Attitude Thruster Control)
      this.airtime += delta;
      this.velocity.y -= this.GRAVITY * delta;

      // Vertical Lift Thrusters
      if (controls.thrusterLift && this.nitrogenFuel > 0) {
        const hoverThrust = 25.5;
        this.velocity.y += hoverThrust * delta;

        if (this.velocity.y > 9.5) {
          this.velocity.y = THREE.MathUtils.damp(this.velocity.y, 7.5, 4, delta);
        }
      }

      // In-air Thruster Vectoring & Gimbal Adjustments with A and D keys
      this.rcsActive.left = false;
      this.rcsActive.right = false;

      const hasFuel = this.nitrogenFuel > 0;

      if (controls.steerLeft || controls.rollLeft) {
        // A Button: Tilt nozzles outward to the left, bias right thrusters, fire right RCS!
        this.thrusterGimbalZ = THREE.MathUtils.damp(this.thrusterGimbalZ, 0.45, 12, delta);
        this.thrusterBiases.fr = 1.8;
        this.thrusterBiases.rr = 1.8;
        this.thrusterBiases.fl = 0.35;
        this.thrusterBiases.rl = 0.35;
        this.rcsActive.right = true;

        // Mid-air leftward yaw turn + bank roll + lateral impulse (scaled by steeringResponse)
        const yawSpeed = 2.4 * this.tuning.steeringResponse;
        const rollSpeed = 2.2 * this.tuning.steeringResponse;
        this._yawQuat.setFromAxisAngle(this._worldUp, yawSpeed * delta);
        this.quaternion.multiply(this._yawQuat);
        this._rollQuat.setFromAxisAngle(this._forward, rollSpeed * delta);
        this.quaternion.multiply(this._rollQuat);

        this.velocity.addScaledVector(this._right, (-12.0 * this.tuning.steeringResponse) * delta);
        this.accumulatedYaw += yawSpeed * delta;
        this.accumulatedRoll += rollSpeed * delta;

        if (hasFuel) {
          this.nitrogenFuel = Math.max(0, this.nitrogenFuel - 3.5 * delta);
        }
      } else if (controls.steerRight || controls.rollRight) {
        // D Button: Tilt nozzles outward to the right, bias left thrusters, fire left RCS!
        this.thrusterGimbalZ = THREE.MathUtils.damp(this.thrusterGimbalZ, -0.45, 12, delta);
        this.thrusterBiases.fl = 1.8;
        this.thrusterBiases.rl = 1.8;
        this.thrusterBiases.fr = 0.35;
        this.thrusterBiases.rr = 0.35;
        this.rcsActive.left = true;

        // Mid-air rightward yaw turn + bank roll + lateral impulse (scaled by steeringResponse)
        const yawSpeed = 2.4 * this.tuning.steeringResponse;
        const rollSpeed = 2.2 * this.tuning.steeringResponse;
        this._yawQuat.setFromAxisAngle(this._worldUp, -yawSpeed * delta);
        this.quaternion.multiply(this._yawQuat);
        this._rollQuat.setFromAxisAngle(this._forward, -rollSpeed * delta);
        this.quaternion.multiply(this._rollQuat);

        this.velocity.addScaledVector(this._right, (12.0 * this.tuning.steeringResponse) * delta);
        this.accumulatedYaw += yawSpeed * delta;
        this.accumulatedRoll += rollSpeed * delta;

        if (hasFuel) {
          this.nitrogenFuel = Math.max(0, this.nitrogenFuel - 3.5 * delta);
        }
      } else {
        // Level nozzles and biases
        this.thrusterGimbalZ = THREE.MathUtils.damp(this.thrusterGimbalZ, 0, 8, delta);
        this.thrusterBiases.fl = THREE.MathUtils.damp(this.thrusterBiases.fl, 1.0, 8, delta);
        this.thrusterBiases.fr = THREE.MathUtils.damp(this.thrusterBiases.fr, 1.0, 8, delta);
        this.thrusterBiases.rl = THREE.MathUtils.damp(this.thrusterBiases.rl, 1.0, 8, delta);
        this.thrusterBiases.rr = THREE.MathUtils.damp(this.thrusterBiases.rr, 1.0, 8, delta);

        // Auto-level horizontal posture if no inputs close to ground
        if (this.position.y < groundY + 4.0) {
          this._euler.setFromQuaternion(this.quaternion, 'YXZ');
          this._euler.z = THREE.MathUtils.damp(this._euler.z, 0, 6, delta);
          this._euler.x = THREE.MathUtils.damp(this._euler.x, 0, 6, delta);
          this.quaternion.setFromEuler(this._euler);
        }
      }

      // W and S in air: Pitch thrust vectoring & somersaults
      if (controls.forward || controls.pitchDown) {
        this.thrusterGimbalX = THREE.MathUtils.damp(this.thrusterGimbalX, 0.4, 10, delta);
        this.velocity.addScaledVector(this._forward, 14.0 * delta);
        this._pitchQuat.setFromAxisAngle(this._right, 2.0 * delta);
        this.quaternion.multiply(this._pitchQuat);
        this.accumulatedPitch += 2.0 * delta;
      } else if (controls.backward || controls.pitchUp) {
        this.thrusterGimbalX = THREE.MathUtils.damp(this.thrusterGimbalX, -0.4, 10, delta);
        this.velocity.addScaledVector(this._forward, -12.0 * delta);
        this._pitchQuat.setFromAxisAngle(this._right, -2.0 * delta);
        this.quaternion.multiply(this._pitchQuat);
        this.accumulatedPitch += 2.0 * delta;
      } else {
        this.thrusterGimbalX = THREE.MathUtils.damp(this.thrusterGimbalX, 0, 7, delta);
      }

      // In-air rocket boost impulse scaled by boostPower multiplier
      if (controls.rocketBoost && hasFuel) {
        this.velocity.addScaledVector(this._forward, (24.0 * this.tuning.boostPower) * delta);
      }

      // Check Gravity Bounce Pad Catapult
      for (const pad of arena.bouncePads) {
        const dx = this.position.x - pad.position.x;
        const dz = this.position.z - pad.position.z;
        if (dx * dx + dz * dz <= pad.radius * pad.radius && this.position.y <= pad.position.y + 2.0) {
          this.velocity.y = 30.0;
          this.isGrounded = false;
          this.totalScore += 500;
          this.currentStuntCombo = 'GRAVITY CATAPULT BOUNCE! +500';
          this.comboPoints = 500;
          audioEngine.playBounceLaunch();
          audioEngine.playStuntScore(true);
          if (this.onStuntTriggered) {
            this.onStuntTriggered({
              name: 'GRAVITY CATAPULT BOUNCE',
              points: 500,
              multiplier: 1.8,
              timestamp: Date.now(),
            });
          }
          break;
        }
      }
    }
  }

  private handleFuelAndRefuelPads(delta: number, controls: PlayerControls, arena: SpaceXTestArena) {
    let isOnRefuelPad = false;
    for (const pad of arena.refuelPads) {
      const dx = this.position.x - pad.position.x;
      const dz = this.position.z - pad.position.z;
      if (dx * dx + dz * dz <= pad.radius * pad.radius && Math.abs(this.position.y - pad.position.y) < 1.5) {
        isOnRefuelPad = true;
        this.nitrogenFuel = Math.min(100, this.nitrogenFuel + 55 * delta);
        break;
      }
    }

    if (this.isGrounded && !isOnRefuelPad) {
      this.nitrogenFuel = Math.min(100, this.nitrogenFuel + 12 * delta);
    }

    if (controls.rocketBoost && this.nitrogenFuel > 0) {
      this.nitrogenFuel = Math.max(0, this.nitrogenFuel - 16 * delta);
    }
    if (controls.thrusterLift && this.nitrogenFuel > 0) {
      this.nitrogenFuel = Math.max(0, this.nitrogenFuel - 20 * delta);
    }
  }

  private evaluateLandingStunt() {
    let stuntName: string | null = null;
    let basePoints = 0;
    let multiplier = 1;

    const rollFullTurns = Math.floor(this.accumulatedRoll / (Math.PI * 1.8));
    const yawFullTurns = Math.floor(this.accumulatedYaw / (Math.PI * 1.8));
    const pitchFullTurns = Math.floor(this.accumulatedPitch / (Math.PI * 1.8));

    if (rollFullTurns >= 2) {
      stuntName = 'DOUBLE BARREL ROLL';
      basePoints = 1200;
      multiplier = 2.5;
    } else if (rollFullTurns >= 1) {
      stuntName = 'AERIAL BARREL ROLL 360';
      basePoints = 650;
      multiplier = 2.0;
    } else if (yawFullTurns >= 1) {
      stuntName = 'SPACEX 360° AIR YAW TURN';
      basePoints = 550;
      multiplier = 1.8;
    } else if (pitchFullTurns >= 1) {
      stuntName = 'SUB-ORBITAL BACKFLIP';
      basePoints = 700;
      multiplier = 2.0;
    } else if (this.airtime > 2.8) {
      stuntName = 'COLD-GAS HOVER MASTER';
      basePoints = 400;
      multiplier = 1.5;
    } else if (this.airtime > 0.9) {
      stuntName = 'HOT WHEELS JUMP';
      basePoints = 250;
      multiplier = 1.2;
    }

    if (stuntName) {
      const earned = Math.round(basePoints * multiplier);
      this.totalScore += earned;
      this.currentStuntCombo = `${stuntName} +${earned}`;
      this.comboPoints = earned;
      audioEngine.playStuntScore(multiplier >= 1.8);

      if (this.onStuntTriggered) {
        this.onStuntTriggered({
          name: stuntName,
          points: earned,
          multiplier,
          timestamp: Date.now(),
        });
      }
    }
  }

  private checkRingCollisions(arena: SpaceXTestArena) {
    for (const ring of arena.rings) {
      if (ring.collected) continue;

      const dist = this.position.distanceTo(ring.position);
      if (dist <= ring.radius + 1.2) {
        ring.collected = true;
        this.ringsCollectedCount++;
        const points = ring.points;
        this.totalScore += points;
        this.currentStuntCombo = `RING TARGET: ${ring.label} +${points}`;
        this.comboPoints = points;

        audioEngine.playRingCollect();

        if (this.onRingCollected) {
          this.onRingCollected(ring);
        }
      }
    }
  }

  private checkTokenCollisions(arena: SpaceXTestArena) {
    for (const token of arena.tokens) {
      if (token.collected) continue;

      const dist = this.position.distanceTo(token.position);
      if (dist <= token.radius + 1.5) {
        token.collected = true;
        const points = token.points;
        this.totalScore += points;
        this.currentStuntCombo = `STAR TOKEN: ${token.label} +${points}`;
        this.comboPoints = points;

        audioEngine.playRingCollect();

        if (this.onTokenCollected) {
          this.onTokenCollected(token);
        }
      }
    }
  }
}

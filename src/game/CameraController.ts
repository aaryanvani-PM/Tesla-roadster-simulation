import * as THREE from 'three';

export type CameraMode = 'chase' | 'cockpit' | 'action' | 'drone' | 'intro';

export class CameraController {
  public mode: CameraMode = 'intro';
  public camera: THREE.PerspectiveCamera;

  private currentTarget: THREE.Vector3 = new THREE.Vector3();
  private currentPosition: THREE.Vector3 = new THREE.Vector3(0, 5, 12);
  private baseFov: number = 65;
  private _introTimer: number = 0;

  // Reusable vectors
  private _idealOffset: THREE.Vector3 = new THREE.Vector3();
  private _idealLookat: THREE.Vector3 = new THREE.Vector3();
  private _carForward: THREE.Vector3 = new THREE.Vector3();
  private _carUp: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentPosition.copy(camera.position);
  }

  public setMode(mode: CameraMode) {
    this.mode = mode;
  }

  public update(
    delta: number,
    carPos: THREE.Vector3,
    carQuat: THREE.Quaternion,
    speedMph: number,
    isBoostActive: boolean,
    isThrusterActive: boolean
  ) {
    this._carForward.set(0, 0, -1).applyQuaternion(carQuat);
    this._carUp.set(0, 1, 0).applyQuaternion(carQuat);

    // Speed-based dynamic FOV widening
    const speedRatio = Math.min(1.0, Math.abs(speedMph) / 250);
    const targetFov = this.baseFov + speedRatio * 18 + (isBoostActive ? 10 : 0);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, delta);
    this.camera.updateProjectionMatrix();

    if (this.mode === 'chase') {
      // Dynamic third-person chase camera
      const distance = 7.5 + speedRatio * 2.5;
      const height = 2.8 + (isThrusterActive ? 1.0 : 0);

      this._idealOffset
        .copy(this._carForward)
        .multiplyScalar(-distance)
        .add(new THREE.Vector3(0, height, 0))
        .add(carPos);

      this._idealLookat.copy(carPos).add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(this._carForward, 6);

      // Frame-rate independent exponential damping
      this.currentPosition.x = THREE.MathUtils.damp(this.currentPosition.x, this._idealOffset.x, 7, delta);
      this.currentPosition.y = THREE.MathUtils.damp(this.currentPosition.y, this._idealOffset.y, 8, delta);
      this.currentPosition.z = THREE.MathUtils.damp(this.currentPosition.z, this._idealOffset.z, 7, delta);

      this.currentTarget.x = THREE.MathUtils.damp(this.currentTarget.x, this._idealLookat.x, 10, delta);
      this.currentTarget.y = THREE.MathUtils.damp(this.currentTarget.y, this._idealLookat.y, 10, delta);
      this.currentTarget.z = THREE.MathUtils.damp(this.currentTarget.z, this._idealLookat.z, 10, delta);

      // Subtle thruster vibration
      if (isBoostActive || isThrusterActive) {
        const shake = (Math.random() - 0.5) * 0.05;
        this.currentPosition.y += shake;
      }

      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentTarget);
    } else if (this.mode === 'cockpit') {
      // First-person driver / hood perspective (looking forward along -Z)
      const cockpitOffset = new THREE.Vector3(0.32, 0.84, -0.15).applyQuaternion(carQuat).add(carPos);
      const lookTarget = new THREE.Vector3(0.32, 0.78, -14).applyQuaternion(carQuat).add(carPos);

      this.camera.position.copy(cockpitOffset);
      this.camera.lookAt(lookTarget);
    } else if (this.mode === 'action') {
      // Low wide-angle dynamic cinematic stunt cam (behind rear quarter looking forward)
      const actionOffset = new THREE.Vector3(3.4, 0.9, 4.5).applyQuaternion(carQuat).add(carPos);
      const lookTarget = carPos.clone().add(new THREE.Vector3(0, 0.7, -3.0).applyQuaternion(carQuat));

      this.currentPosition.x = THREE.MathUtils.damp(this.currentPosition.x, actionOffset.x, 6, delta);
      this.currentPosition.y = THREE.MathUtils.damp(this.currentPosition.y, actionOffset.y, 6, delta);
      this.currentPosition.z = THREE.MathUtils.damp(this.currentPosition.z, actionOffset.z, 6, delta);

      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(lookTarget);
    } else if (this.mode === 'drone') {
      // High-angle surveillance drone view
      const dronePos = carPos.clone().add(new THREE.Vector3(0, 24, 18));
      this.currentPosition.x = THREE.MathUtils.damp(this.currentPosition.x, dronePos.x, 4, delta);
      this.currentPosition.y = THREE.MathUtils.damp(this.currentPosition.y, dronePos.y, 4, delta);
      this.currentPosition.z = THREE.MathUtils.damp(this.currentPosition.z, dronePos.z, 4, delta);

      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(carPos);
    } else if (this.mode === 'intro') {
      // Cinematic low front-quarter tracking hero sweep around the Roadster on the launchpad
      this._introTimer += delta;
      const sweepAngle = Math.PI * 0.78 + this._introTimer * 0.22;
      const radius = 6.2;
      const height = 1.35;
      const introOffset = new THREE.Vector3(
        Math.sin(sweepAngle) * radius,
        height,
        Math.cos(sweepAngle) * radius
      ).add(carPos);

      this.currentPosition.x = THREE.MathUtils.damp(this.currentPosition.x, introOffset.x, 3.5, delta);
      this.currentPosition.y = THREE.MathUtils.damp(this.currentPosition.y, introOffset.y, 3.5, delta);
      this.currentPosition.z = THREE.MathUtils.damp(this.currentPosition.z, introOffset.z, 3.5, delta);

      const lookTarget = carPos.clone().add(new THREE.Vector3(0, 0.65, 0));
      this.currentTarget.x = THREE.MathUtils.damp(this.currentTarget.x, lookTarget.x, 5, delta);
      this.currentTarget.y = THREE.MathUtils.damp(this.currentTarget.y, lookTarget.y, 5, delta);
      this.currentTarget.z = THREE.MathUtils.damp(this.currentTarget.z, lookTarget.z, 5, delta);

      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentTarget);
    }
  }
}

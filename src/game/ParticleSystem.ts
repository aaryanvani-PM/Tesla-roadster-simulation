import * as THREE from 'three';

interface Particle {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  maxLife: number;
  life: number;
  color: THREE.Color;
  type: 'thruster' | 'boost' | 'tire' | 'spark';
}

export class ParticleSystem {
  public group: THREE.Group;
  private readonly maxParticles: number = 100;
  private pool: Particle[] = [];
  private instancedMesh: THREE.InstancedMesh;
  private dummy: THREE.Object3D = new THREE.Object3D();
  private colorArray: Float32Array;
  private defaultForward: THREE.Vector3 = new THREE.Vector3(0, -1, 0);

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ParticleSystem';

    // Soft circular billboard geometry
    const particleGeometry = new THREE.PlaneGeometry(1, 1);

    // Procedural soft particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      gradient.addColorStop(0.4, 'rgba(235, 245, 255, 0.7)');
      gradient.addColorStop(0.8, 'rgba(200, 225, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(180, 210, 255, 0.0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const particleMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });

    this.instancedMesh = new THREE.InstancedMesh(particleGeometry, particleMaterial, this.maxParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.frustumCulled = false;

    this.colorArray = new Float32Array(this.maxParticles * 3);
    const instanceColorAttr = new THREE.InstancedBufferAttribute(this.colorArray, 3);
    this.instancedMesh.instanceColor = instanceColorAttr;

    // Pre-allocate fixed pool of particles - ZERO allocations during game!
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push({
        active: false,
        position: new THREE.Vector3(0, -9999, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        size: 0.4,
        maxLife: 0.6,
        life: 0,
        color: new THREE.Color(1, 1, 1),
        type: 'thruster',
      });

      this.dummy.position.set(0, -9999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      this.instancedMesh.setColorAt(i, new THREE.Color(1, 1, 1));
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;

    this.group.add(this.instancedMesh);
  }

  private getNextAvailable(): Particle | null {
    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    // If full, recycle oldest
    let oldest = this.pool[0];
    for (let i = 1; i < this.maxParticles; i++) {
      if (this.pool[i].life > oldest.life) {
        oldest = this.pool[i];
      }
    }
    return oldest;
  }

  public emitThrusterSmoke(position: THREE.Vector3, downwardForce: number, direction?: THREE.Vector3) {
    const baseDir = direction || this.defaultForward;
    const p = this.getNextAvailable();
    if (!p) return;

    p.active = true;
    p.type = 'thruster';
    p.life = 0;
    p.maxLife = 0.5 + Math.random() * 0.25;
    p.size = 0.35 + Math.random() * 0.25;
    p.color.setRGB(0.7, 0.88, 1.0);

    p.position.set(
      position.x + (Math.random() - 0.5) * 0.15,
      position.y - 0.08,
      position.z + (Math.random() - 0.5) * 0.15
    );

    p.velocity.set(
      baseDir.x * downwardForce + (Math.random() - 0.5) * 1.2,
      baseDir.y * downwardForce + (Math.random() - 0.5) * 0.8,
      baseDir.z * downwardForce + (Math.random() - 0.5) * 1.2
    );
  }

  public emitBoostSmoke(position: THREE.Vector3, carVelocity: THREE.Vector3) {
    const p = this.getNextAvailable();
    if (!p) return;

    p.active = true;
    p.type = 'boost';
    p.life = 0;
    p.maxLife = 0.45;
    p.size = 0.45 + Math.random() * 0.3;
    p.color.setRGB(0.4, 0.8, 1.0);

    p.position.set(
      position.x + (Math.random() - 0.5) * 0.12,
      position.y + (Math.random() - 0.5) * 0.12,
      position.z + (Math.random() - 0.5) * 0.12
    );

    p.velocity.set(
      -carVelocity.x * 0.4 + (Math.random() - 0.5) * 1.5,
      -carVelocity.y * 0.4 + (Math.random() - 0.5) * 1.0,
      -carVelocity.z * 0.4 + (Math.random() - 0.5) * 1.5
    );
  }

  public emitTireSmoke(position: THREE.Vector3, carVelocity: THREE.Vector3) {
    const p = this.getNextAvailable();
    if (!p) return;

    p.active = true;
    p.type = 'tire';
    p.life = 0;
    p.maxLife = 0.5;
    p.size = 0.3 + Math.random() * 0.25;
    p.color.setRGB(0.75, 0.78, 0.82);

    p.position.set(
      position.x + (Math.random() - 0.5) * 0.2,
      position.y + 0.1,
      position.z + (Math.random() - 0.5) * 0.2
    );

    p.velocity.set(
      carVelocity.x * 0.15 + (Math.random() - 0.5) * 0.8,
      0.6 + Math.random() * 0.6,
      carVelocity.z * 0.15 + (Math.random() - 0.5) * 0.8
    );
  }

  public emitRingSparks(position: THREE.Vector3) {
    const sparkCount = 10;
    for (let i = 0; i < sparkCount; i++) {
      const p = this.getNextAvailable();
      if (!p) break;

      p.active = true;
      p.type = 'spark';
      p.life = 0;
      p.maxLife = 0.65;
      p.size = 0.28 + Math.random() * 0.15;
      p.color.setRGB(0.2, 0.9, 1.0);

      const angle = (i / sparkCount) * Math.PI * 2;
      const speed = 4 + Math.random() * 5;

      p.position.copy(position);
      p.velocity.set(
        Math.cos(angle) * speed,
        (Math.random() - 0.5) * speed * 0.8,
        Math.sin(angle) * speed
      );
    }
  }

  public update(delta: number, camera: THREE.Camera) {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active) {
        continue;
      }

      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.dummy.position.set(0, -9999, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      // Progress physics
      p.position.addScaledVector(p.velocity, delta);

      // Fade out and grow
      const t = p.life / p.maxLife;
      const currentScale = p.size * (1.0 + t * 1.5);

      this.dummy.position.copy(p.position);
      this.dummy.scale.set(currentScale, currentScale, currentScale);
      this.dummy.quaternion.copy(camera.quaternion);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

      // Fade color intensity
      const fade = 1.0 - t;
      this.instancedMesh.setColorAt(
        i,
        new THREE.Color(p.color.r * fade, p.color.g * fade, p.color.b * fade)
      );
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  public dispose() {
    this.instancedMesh.geometry.dispose();
    if (Array.isArray(this.instancedMesh.material)) {
      this.instancedMesh.material.forEach((m) => m.dispose());
    } else {
      this.instancedMesh.material.dispose();
    }
  }
}

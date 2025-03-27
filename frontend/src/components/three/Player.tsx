// src/components/three/Player.ts

import * as THREE from 'three';

export class Player {
  private mesh: THREE.Mesh;
  private boundingBox: THREE.Box3;
  private worldWidth: number;

  constructor(scene: THREE.Scene, worldWidth: number = 60) {
    this.worldWidth = worldWidth;

    // Create player geometry and material
    const playerGeometry = new THREE.ConeGeometry(0.4, 1, 3);
    const playerMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x0033ff,
      emissiveIntensity: 0.8,
      shininess: 100,
    });

    // Initialize mesh
    this.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
    this.mesh.position.set(0, -0.5, 5);
    this.mesh.rotation.x = -Math.PI / 2;
    scene.add(this.mesh);

    // Initialize bounding box
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
  }

  /**
   * Updates the player's position and rotation based on input.
   * @param keys Object indicating which keys are pressed
   * @param speed Horizontal movement speed
   */
  update(keys: { left: boolean; right: boolean }, speed: number): void {
    if (keys.left) {
      this.mesh.position.x -= speed;
      this.mesh.rotation.z = Math.min(this.mesh.rotation.z + 0.1, 0.3);
    } else if (keys.right) {
      this.mesh.position.x += speed;
      this.mesh.rotation.z = Math.max(this.mesh.rotation.z - 0.1, -0.3);
    } else {
      this.mesh.rotation.z *= 0.9; // Smoothly return to neutral rotation
    }

    // Wrap position around the world boundaries
    this.mesh.position.x = this.wrapCoordinate(this.mesh.position.x);

    // Update bounding box after movement
    this.boundingBox.setFromObject(this.mesh);
  }

  /**
   * Gets the player's current position.
   * @returns THREE.Vector3 representing the player's position
   */
  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  /**
   * Gets the player's current rotation.
   * @returns THREE.Euler representing the player's rotation
   */
  getRotation(): THREE.Euler {
    return this.mesh.rotation.clone();
  }

  /**
   * Gets the player's bounding box for collision detection.
   * @returns THREE.Box3 representing the player's bounds
   */
  getBoundingBox(): THREE.Box3 {
    return this.boundingBox.clone();
  }

  /**
   * Resets the player to its initial state.
   */
  reset(): void {
    this.mesh.position.set(0, -0.5, 5);
    this.mesh.rotation.set(-Math.PI / 2, 0, 0);
    this.boundingBox.setFromObject(this.mesh);
  }

  /**
   * Wraps the x-coordinate around the world width.
   * @param x The x-coordinate to wrap
   * @returns The wrapped x-coordinate
   */
  private wrapCoordinate(x: number): number {
    const halfWidth = this.worldWidth / 2;
    return ((x + halfWidth) % this.worldWidth) - halfWidth;
  }
}
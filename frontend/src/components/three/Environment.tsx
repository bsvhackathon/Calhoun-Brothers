// src/components/three/Environment.ts

import * as THREE from 'three';

export class Environment {
  private grounds: THREE.Mesh[] = [];
  private worldWidth: number;
  private groundDepth: number = 2000; // Depth of each ground segment
  private segmentCount: number = 3; // Number of ground segments

  constructor(scene: THREE.Scene, worldWidth: number = 60) {
    this.worldWidth = worldWidth;

    // Create ground geometry and material
    const groundGeometry = new THREE.PlaneGeometry(this.worldWidth * 10, this.groundDepth);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.4,
      shininess: 0,
      side: THREE.DoubleSide,
    });

    // Create multiple ground segments for a seamless floor
    for (let i = 0; i < this.segmentCount; i++) {
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2; // Rotate to lie flat
      ground.position.z = 800 + (i * this.groundDepth); // Space segments along z-axis
      ground.position.y = -1; // Slightly below player
      scene.add(ground);
      this.grounds.push(ground);
    }
  }

  /**
   * Updates the environment (e.g., moves ground segments for infinite scrolling).
   * @param deltaTime Time elapsed since last frame (in seconds)
   * @param speed Speed at which the ground should move toward the player
   */
  update(deltaTime: number, speed: number): void {
    this.grounds.forEach(ground => {
      // Move ground toward player
      ground.position.z -= speed * deltaTime;

      // If ground moves too far forward (beyond player), reposition it to the back
      if (ground.position.z < -this.groundDepth / 2) {
        ground.position.z += this.groundDepth * this.segmentCount;
      }
    });
  }

  /**
   * Removes the environment from the scene and cleans up resources.
   * @param scene The Three.js scene to remove the environment from
   */
  remove(scene: THREE.Scene): void {
    this.grounds.forEach(ground => {
      scene.remove(ground);
      ground.geometry.dispose();
      (ground.material as THREE.MeshPhongMaterial).dispose();
    });
    this.grounds = [];
  }
}
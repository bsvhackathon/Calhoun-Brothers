// src/components/three/Obstacle.ts

import * as THREE from 'three';
import { ServerObstacle } from '../../core/types';

export class Obstacle {
  private mesh: THREE.Mesh;
  private velocity: THREE.Vector3;
  private serverPosition: THREE.Vector3 | null = null;
  private correctionTime: number = 0.2; // Time (in seconds) to interpolate to server position

  constructor(size: number, scene: THREE.Scene, initialX: number = 0, initialZ: number = 0) {
    // Create obstacle geometry and material
    const obstacleGeometry = new THREE.BoxGeometry(size, size, size);
    const obstacleMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
      shininess: 100,
    });

    // Initialize mesh
    this.mesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    this.mesh.position.set(initialX, 0, initialZ);
    scene.add(this.mesh);

    // Initialize velocity (default moving toward player along z-axis)
    this.velocity = new THREE.Vector3(0, 0, 60); // Default speed matches original GameClient
  }


  createObstacles(data: ServerObstacle) {
    const obstacleGeometry = new THREE.BoxGeometry(data.size, data.size, data.size);
    const obstacleMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
      shininess: 100
    });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(data.x, 0, data.z);
    return obstacle;
  }

  /**
   * Updates the obstacle's position based on velocity and server data.
   * @param speed The base speed from the game (may override default velocity)
   * @param deltaTime Time elapsed since last frame (in seconds)
   * @returns Boolean indicating if the obstacle is still active (not out of bounds)
   */
  update(speed: number, deltaTime: number): boolean {
    // Update velocity if speed changes
    this.velocity.z = speed;

    // Client-side prediction
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Smooth correction to server position if available
    if (this.serverPosition) {
      const currentPos = this.mesh.position.clone();
      const correctedPos = currentPos.lerp(this.serverPosition, deltaTime / this.correctionTime);
      this.mesh.position.copy(correctedPos);
    }

    // Check if obstacle is out of bounds (z > 15 as in original code)
    if (this.mesh.position.z > 15) {
      return false; // Indicate removal needed
    }
    return true; // Obstacle is still active
  }

  /**
   * Updates the obstacle's position based on server data.
   * @param x New x-coordinate from server
   * @param z New z-coordinate from server
   */
  updatePosition(x: number, z: number): void {
    this.serverPosition = new THREE.Vector3(x, 0, z);
  }

  /**
   * Removes the obstacle from the scene.
   * @param scene The Three.js scene to remove the obstacle from
   */
  remove(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    
    // Handle both single material and material array cases
    // if (Array.isArray(this.mesh.material)) {
    //   this.mesh.material.forEach(material => material.dispose());
    // } else {
    //   this.mesh.material.dispose();
    // }
  }

  /**
   * Gets the obstacle's current position.
   * @returns THREE.Vector3 representing the obstacle's position
   */
  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  /**
   * Gets the obstacle's bounding box for collision detection.
   * @returns THREE.Box3 representing the obstacle's bounds
   */
  getBoundingBox(): THREE.Box3 {
    return new THREE.Box3().setFromObject(this.mesh);
  }
}
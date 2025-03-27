// src/components/three/Starfield.ts

import * as THREE from 'three';

export class Starfield {
  private stars: THREE.Points;
  private starCount: number = 1000; // Number of stars, matching original
  private radius: number = 1000; // Radius of the starfield sphere

  constructor(scene: THREE.Scene) {
    // Create star positions and colors
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);

    const baseColor = new THREE.Color();
    baseColor.setHSL(0.5, 0.8, 0.8); // Cyan-ish color from original

    for (let i = 0; i < this.starCount; i++) {
      // Spherical coordinates for even distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      positions[i * 3] = this.radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = this.radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = this.radius * Math.cos(phi);

      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }

    // Create geometry and material
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });

    // Initialize starfield
    this.stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(this.stars);
  }

  /**
   * Updates the starfield (currently static, but could animate if desired).
   * @param deltaTime Time elapsed since last frame (in seconds)
   */
  update(deltaTime: number): void {
    // Optional animation (not in original, but could be added)
    // Example: Rotate the starfield slowly
    // this.stars.rotation.y += 0.05 * deltaTime;
  }

  /**
   * Removes the starfield from the scene and cleans up resources.
   * @param scene The Three.js scene to remove the starfield from
   */
  remove(scene: THREE.Scene): void {
    scene.remove(this.stars);
    this.stars.geometry.dispose();
    (this.stars.material as THREE.PointsMaterial).dispose();
  }
}
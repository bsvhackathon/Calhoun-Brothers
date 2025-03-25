
import * as THREE from 'three';

import {
  AuthFetch,
  WalletClient,
} from '@bsv/sdk'

interface ServerObstacle {
  x: number;
  z: number;
  size: number;
}

export class GameClient {
  private ws: WebSocket | null;
  private scene: THREE.Scene | null;
  private camera: THREE.PerspectiveCamera | null;
  private renderer: THREE.WebGLRenderer | null;
  private player: THREE.Mesh | null;
  private obstacles: THREE.Mesh[];
  private keys: { left: boolean; right: boolean };
  private gameStarted: boolean;
  private isUnlocked: boolean;
  private score: number;
  private isGameOver: boolean;
  private speed: number;
  private worldWidth: number;
  private playerBoundingBox: THREE.Box3;
  private lastUpdateTime: number;
  private gameContainer: HTMLDivElement | null;
  // Add these properties
  private obstacleVelocities: Map<THREE.Mesh, THREE.Vector3> = new Map(); // Store velocities for prediction
  private serverObstaclePositions: Map<THREE.Mesh, THREE.Vector3> = new Map(); // Store server-provided positions
  private correctionTime: number = 0.2; // Time (in seconds) to interpolate to server position
  private lastFrameTime: number = 0;
  private deltaTime: number = 0;
  private playerHorizontalSpeed: number;
  private wallet: WalletClient | null; // Add wallet property
  private connectButton: HTMLButtonElement | null; // Add connect button property
  
  constructor() {
    this.ws = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.obstacles = [];
    this.keys = { left: false, right: false };
    this.gameStarted = false;
    this.isUnlocked = false;
    this.score = 0;
    this.speed = 60;
    this.worldWidth = 60;
    this.isGameOver = false;
    this.playerBoundingBox = new THREE.Box3();
    this.lastUpdateTime = 0;
    this.gameContainer = null;
    this.playerHorizontalSpeed = 0.7;
    this.wallet = null; // Initialize wallet property
    this.connectButton = null; // Initialize connect button property
  }

  setupWebSocket() {
    this.ws = new WebSocket('ws://localhost:3001'); // Match backend port
    this.ws.onopen = () => console.log('Connected to server');
    this.ws.onmessage = (event) => {
      // console.log(event)
      const data = JSON.parse(event.data);
      this.updateFromServer(data);
    };
    this.ws.onerror = (err) => console.error('WebSocket error:', err);
    this.ws.onclose = () => console.log('Disconnected from server');
  }

  updateFromServer(data: any) {
    this.score = data.score || 0;
    const scoreElement = document.getElementById('scoreValue');
    if (scoreElement) {
      scoreElement.textContent = Math.floor(this.score).toString();
    }
    this.speed = data.speed;
    this.playerHorizontalSpeed = data.horizontalSpeed;
    if (data.obstacles) {
      this.createObstacles(data.obstacles);
    }

    this.isGameOver = data.isGameOver || false;
    if (this.isGameOver) {
      this.showGameOver();
    }
  }

  // Sync client obstacles with server data
  syncObstacles(serverObstacles: ServerObstacle[]) {
    const existingObstacles = new Set(this.obstacles);

    serverObstacles.forEach((data, index) => {
      let obstacle = this.obstacles[index];
      if (!obstacle) {
        // Create new obstacle if it doesn't exist
        const obstacleGeometry = new THREE.BoxGeometry(data.size, data.size, data.size);
        const obstacleMaterial = new THREE.MeshPhongMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9,
          shininess: 100
        });
        obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        this.scene!.add(obstacle);
        this.obstacles.push(obstacle);
        this.obstacleVelocities.set(obstacle, new THREE.Vector3(0, 0, this.speed)); // Assume constant velocity
      }

      // Store server position for correction
      const serverPos = new THREE.Vector3(data.x, 0, data.z);
      this.serverObstaclePositions.set(obstacle, serverPos);
      existingObstacles.delete(obstacle);
    });
  }

  createObstacles(obstacleData: ServerObstacle[]) {
    obstacleData.forEach(data => {
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
      this.scene!.add(obstacle);
      this.obstacles.push(obstacle);
    });
  }

  initializeScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Create a container for the game
    const gameContainer = document.createElement('div');
    gameContainer.id = 'gameContainer';
    gameContainer.style.position = 'fixed';
    gameContainer.style.top = '50%';
    gameContainer.style.left = '50%';
    gameContainer.style.transform = 'translate(-50%, -50%)';
    gameContainer.style.width = '1200px';
    gameContainer.style.height = '675px';
    gameContainer.style.backgroundColor = '#000';
    gameContainer.style.border = '2px solid #333';
    gameContainer.style.borderRadius = '10px';
    gameContainer.style.overflow = 'hidden';
    // Add blur effect initially
    gameContainer.style.filter = 'blur(5px)';
    gameContainer.style.pointerEvents = 'none'; // Disable interaction with blurred game
    document.body.appendChild(gameContainer);
    this.gameContainer = gameContainer;

    this.camera = new THREE.PerspectiveCamera(75, 1200 / 675, 0.1, 1000);
    this.camera.position.y = 6;
    this.camera.position.z = 12;
    this.camera.rotation.x = -0.5;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true
    });
    this.renderer.setSize(1200, 675);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    gameContainer.appendChild(this.renderer.domElement);

    this.createStarfield();
  }

  createStarfield() {
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const baseColor = new THREE.Color();
    baseColor.setHSL(0.5, 0.8, 0.8);

    for (let i = 0; i < starCount; i++) {
      const radius = 1000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    if (this.scene) {
      this.scene.add(starField);
    }
  }

  initializeLighting() {
    // Unchanged
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    if (this.scene) {
      this.scene.add(ambientLight);
    }
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(0, 10, -10);
    if (this.scene) {
      this.scene.add(directionalLight);
    }
    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight1.position.set(0, 5, -5);
    if (this.scene) {
      this.scene.add(pointLight1);
    }
    const pointLight2 = new THREE.PointLight(0xff0000, 1, 100);
    pointLight2.position.set(0, 5, 20);
    if (this.scene) {
      this.scene.add(pointLight2);
    }
  }

  initializePlayer() {
    const playerGeometry = new THREE.ConeGeometry(0.4, 1, 3);
    const playerMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x0033ff,
      emissiveIntensity: 0.8,
      shininess: 100
    });
    this.player = new THREE.Mesh(playerGeometry, playerMaterial);
    this.player.position.set(0, -0.5, 5);
    this.player.rotation.x = -Math.PI / 2;
    if (this.scene) {
      this.scene.add(this.player);
    }
    this.playerBoundingBox = new THREE.Box3().setFromObject(this.player);
  }

  initializeEnvironment() {
    const worldWidth = 60; // Hardcoded to match server
    const groundGeometry = new THREE.PlaneGeometry(worldWidth * 10, 2000);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.4,
      shininess: 0,
      side: THREE.DoubleSide
    });
    for (let i = 0; i < 3; i++) {
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.z = 800 + (i * 2000);
      ground.position.y = -1;
      if (this.scene) {
        this.scene.add(ground);
      }
    }
  }

  initializeUI() {
    // Create in-game start prompt (will be blurred with the game)
    const startPrompt = document.createElement('div');
    startPrompt.id = 'startPrompt';
    startPrompt.style.position = 'absolute';
    startPrompt.style.top = '50%';
    startPrompt.style.left = '50%';
    startPrompt.style.transform = 'translate(-50%, -50%)';
    startPrompt.style.color = 'white';
    startPrompt.style.fontSize = '24px';
    startPrompt.style.textAlign = 'center';
    startPrompt.style.zIndex = '1000';
    startPrompt.innerHTML = 'Game paused. Click START button to continue.';
    document.getElementById('gameContainer')!.appendChild(startPrompt);

    if (!document.getElementById('scoreValue')) {
      const scoreDiv = document.createElement('div');
      scoreDiv.id = 'scoreValue';
      scoreDiv.style.position = 'absolute';
      scoreDiv.style.top = '10px';
      scoreDiv.style.left = '10px';
      scoreDiv.style.color = 'white';
      scoreDiv.style.zIndex = '1000';
      scoreDiv.textContent = '0';
      document.getElementById('gameContainer')!.appendChild(scoreDiv);
    }

    // Create the connect button in the top right
    this.createConnectButton();
    
    // Create the start button outside of the game container
    this.createStartButton();
  }

  // Add new method to create connect button
  createConnectButton() {
    const connectButton = document.createElement('button');
    connectButton.id = 'connectWalletButton';
    connectButton.innerText = 'Connect Wallet';
    connectButton.style.position = 'fixed';
    connectButton.style.top = '20px';
    connectButton.style.right = '20px';
    connectButton.style.padding = '10px 20px';
    connectButton.style.fontSize = '16px';
    connectButton.style.backgroundColor = '#00aaff';
    connectButton.style.color = 'white';
    connectButton.style.border = 'none';
    connectButton.style.borderRadius = '8px';
    connectButton.style.cursor = 'pointer';
    connectButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    connectButton.style.zIndex = '2500'; // Higher than other elements
    
    // Hover effects
    connectButton.addEventListener('mouseover', () => {
      connectButton.style.backgroundColor = '#0088cc';
      connectButton.style.transform = 'scale(1.05)';
    });
    
    connectButton.addEventListener('mouseout', () => {
      connectButton.style.backgroundColor = '#00aaff';
      connectButton.style.transform = 'scale(1)';
    });
    
    // Click handler to connect to wallet
    connectButton.addEventListener('click', async () => {
      try {
        // Create and initialize the wallet client
        this.wallet = await new WalletClient('json-api', 'localhost');
        
        // Check if authenticated and get wallet info
        const isAuthenticated = await this.wallet.isAuthenticated();
        console.log('Wallet authenticated:', isAuthenticated);
        
        if (isAuthenticated) {
          // Update button text to indicate connected state
          connectButton.innerText = 'Wallet Connected';
          connectButton.style.backgroundColor = '#00cc66';
          
          // Get wallet details
          const publicKey = await this.wallet.getPublicKey({
            identityKey: true
          });
          console.log('Public key:', publicKey);
          
          const version = await this.wallet.getVersion();
          console.log('Wallet version:', version);
          
          // Create auth fetch instance
          const client = await new AuthFetch(this.wallet);
          console.log('Auth client initialized:', client);
          
          // Enable the start button now that wallet is connected
          const startButton = document.getElementById('startGameButton') as HTMLButtonElement;
          if (startButton) {
            startButton.disabled = false;
            startButton.style.opacity = '1';
            startButton.style.cursor = 'pointer';
            startButton.title = 'Click to start the game';
            
            // Update instruction text to indicate next step
            const instructionText = document.getElementById('gameInstructions');
            if (instructionText) {
              instructionText.innerHTML = 'Step 1: ✅ Wallet Connected<br>Step 2: Click Insert Coins to play';
              instructionText.style.color = '#00cc66';
            }
          }
        } else {
          console.log('Wallet not authenticated');
          connectButton.innerText = 'Authentication Failed';
          connectButton.style.backgroundColor = '#ff3333';
          
          // Reset after 2 seconds
          setTimeout(() => {
            connectButton.innerText = 'Connect Wallet';
            connectButton.style.backgroundColor = '#00aaff';
          }, 2000);
        }
      } catch (error) {
        console.error('[ERROR] Failed to connect to wallet:', error);
        connectButton.innerText = 'Connection Failed';
        connectButton.style.backgroundColor = '#ff3333';
        
        // Reset after 2 seconds
        setTimeout(() => {
          connectButton.innerText = 'Connect Wallet';
          connectButton.style.backgroundColor = '#00aaff';
        }, 2000);
      }
    });
    
    document.body.appendChild(connectButton);
    this.connectButton = connectButton;
  }

  createStartButton() {
    const startButton = document.createElement('button');
    startButton.id = 'startGameButton';
    startButton.innerText = 'Insert Coins';
    startButton.style.position = 'fixed';
    startButton.style.bottom = '50px';
    startButton.style.left = '50%';
    startButton.style.transform = 'translateX(-50%)';
    startButton.style.padding = '15px 40px';
    startButton.style.fontSize = '24px';
    startButton.style.backgroundColor = '#00aaff';
    startButton.style.color = 'white';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '8px';
    startButton.style.cursor = 'not-allowed'; // Show not-allowed cursor when disabled
    startButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    startButton.style.zIndex = '2000'; // Ensure it's above the game container
    startButton.style.opacity = '0.5'; // Make it look disabled
    startButton.disabled = true; // Actually disable the button
    startButton.title = 'Connect wallet first to enable'; // Add tooltip
    
    // Create instruction text above the button
    const instructionText = document.createElement('div');
    instructionText.id = 'gameInstructions'; // Add an ID for easy reference
    instructionText.style.position = 'fixed';
    instructionText.style.bottom = '110px';
    instructionText.style.left = '50%';
    instructionText.style.transform = 'translateX(-50%)';
    instructionText.style.color = '#ff9900'; // Orange color to indicate action needed
    instructionText.style.fontSize = '18px';
    instructionText.style.textAlign = 'center';
    instructionText.style.zIndex = '2000';
    instructionText.innerHTML = 'Step 1: Connect wallet in top right<br>Step 2: Insert coins to play';
    document.body.appendChild(instructionText);
    
    // Hover effect - only applied when button is enabled
    startButton.addEventListener('mouseover', () => {
      if (!startButton.disabled) {
        startButton.style.backgroundColor = '#0088cc';
        startButton.style.transform = 'translateX(-50%) scale(1.05)';
      }
    });
    
    startButton.addEventListener('mouseout', () => {
      if (!startButton.disabled) {
        startButton.style.backgroundColor = '#00aaff';
        startButton.style.transform = 'translateX(-50%)';
      }
    });
    
    // Click effect
    startButton.addEventListener('click', async () => {
      // Check if button is disabled - should not execute if disabled
      if (startButton.disabled) {
        return;
      }


      
      // PAY HERE
      // Check if we already have a wallet connection, if not try to connect
      if (!this.wallet) {
        try {
          // Create the wallet client and AuthFetch instance.
          this.wallet = await new WalletClient('json-api', 'localhost');
          console.log(await this.wallet.isAuthenticated());
          const test = await this.wallet.getPublicKey({
            identityKey: true
          });
          console.log(test);

          const test2 = await this.wallet.getVersion();
          console.log(test2);
          
          const client = await new AuthFetch(this.wallet);
          console.log(this.wallet);
          console.log(client);
          
          // Update connect button if it exists
          if (this.connectButton) {
            this.connectButton.innerText = 'Wallet Connected';
            this.connectButton.style.backgroundColor = '#00cc66';
          }
        } catch (error) {
          console.error('[ERROR] Failed to retrieve wallet data:', error);
          return; // Don't proceed if wallet connection fails
        }
      } else {

        const test2 = await this.wallet.getVersion();
        console.log(test2);
        
        const client = await new AuthFetch(this.wallet);
       // Fetch weather stats using AuthFetch.
        const response = await client.fetch('http://localhost:3002/test', {
          method: 'GET'
        })
        const data = await response.json()
        console.log('Result:', data)
      }


      if (await this.wallet?.isAuthenticated()) {
        this.setupWebSocket();
        this.startGame();
        startButton.remove(); // Remove the button after starting
        instructionText.remove(); // Also remove the instruction text
      }
    });
    
    document.body.appendChild(startButton);
  }
  
  startGame() {
    if (!this.isUnlocked) {
      // Remove blur and enable interaction
      if (this.gameContainer) {
        this.gameContainer.style.filter = 'none';
        this.gameContainer.style.pointerEvents = 'auto';
      }
      
      // Update start prompt to guide the user to the next step
      const startPrompt = document.getElementById('startPrompt');
      if (startPrompt) {
        startPrompt.innerHTML = 'Press LEFT or RIGHT arrow key to begin!';
        startPrompt.style.fontSize = '28px';
        startPrompt.style.color = '#00aaff';
      }
      
      // Set the game as unlocked, but not yet started
      this.isUnlocked = true;
    }
  }

  initializeEventHandlers() {
    window.addEventListener('resize', () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      if (this.camera) {
        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();
      }
      if (this.renderer) {
        this.renderer.setSize(newWidth, newHeight);
      }
    });

    window.addEventListener('keydown', (e) => {
      // Only process arrow keys if the game is unlocked but not yet started
      if (this.isUnlocked && !this.gameStarted && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        // This is the second step of starting the game - pressing an arrow key
        this.gameStarted = true;
        
        // Hide the start prompt
        const startPrompt = document.getElementById('startPrompt');
        if (startPrompt) {
          startPrompt.style.display = 'none';
        }
        
        // Notify server that game has started
        this.ws!.send(JSON.stringify({
          type: 'start',
        }));
        
        // Also register this first key press
        if (e.key === 'ArrowLeft') {
          this.keys.left = true;
        } else if (e.key === 'ArrowRight') {
          this.keys.right = true;
        }
      }
      // Process regular key input only if game has actually started
      else if (this.gameStarted) {
        switch (e.key) {
          case 'ArrowLeft':
            this.keys.left = true;
            break;
          case 'ArrowRight':
            this.keys.right = true;
            break;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      // Only process key up events if the game has started
      if (this.gameStarted) {
        switch (e.key) {
          case 'ArrowLeft':
            this.keys.left = false;
            break;
          case 'ArrowRight':
            this.keys.right = false;
            break;
        }
      }
    });
  }

  showGameOver() {
    const gameOverDiv = document.createElement('div');
    gameOverDiv.style.position = 'fixed';
    gameOverDiv.style.top = '50%';
    gameOverDiv.style.left = '50%';
    gameOverDiv.style.transform = 'translate(-50%, -50%)';
    gameOverDiv.style.background = 'rgba(0, 0, 0, 0.8)';
    gameOverDiv.style.color = 'white';
    gameOverDiv.style.padding = '20px';
    gameOverDiv.style.borderRadius = '10px';
    gameOverDiv.style.textAlign = 'center';
    gameOverDiv.style.zIndex = '3000'; // Ensure it's above everything
    gameOverDiv.innerHTML = `
                <h2>Game Over!</h2>
                <p>Score: ${Math.floor(this.score)}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">
                    Play Again
                </button>
            `;
    document.body.appendChild(gameOverDiv);
  }

  animate() {
    const currentTime = Date.now();
    this.deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;
    requestAnimationFrame(() => this.animate());

    // Update scene elements
    if (this.gameStarted && !this.isGameOver) {
      this.updateScene();
    }

    this.renderer!.render(this.scene!, this.camera!);
  }
  wrapCoordinate(x: number) {
    const halfWidth = this.worldWidth / 2;
    return ((x + halfWidth) % this.worldWidth) - halfWidth;
  }

  private updateScene() {
    const currentTime = Date.now();
    let player = this.player;
    if (this.keys.left) {
      player!.position.x -= this.playerHorizontalSpeed;
      player!.rotation.z = Math.min(this.player!.rotation.z + 0.1, 0.3);
    } else if (this.keys.right) {
      player!.position.x += this.playerHorizontalSpeed;
      player!.rotation.z = Math.max(this.player!.rotation.z - 0.1, -0.3);
    } else {
      player!.rotation.z *= 0.9;
    }
    // Validate and wrap position
    player!.position.x = this.wrapCoordinate(player!.position.x);

    this.player!.position.set(player!.position.x, player!.position.y, player!.position.z);
    this.player!.rotation.set(player!.rotation.x, player!.rotation.y, player!.rotation.z);
    this.playerBoundingBox.setFromObject(player!);
    if (this.camera) {
      this.camera.position.x = this.player!.position.x;
    }

    // Send player coordinates every 50ms - check that ws exists
    if (currentTime - this.lastUpdateTime >= 60 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'playerUpdate',
        position: {
          x: this.player!.position.x,
          y: this.player!.position.y,
          z: this.player!.position.z
        },
        rotation: {
          x: this.player!.rotation.x,
          y: this.player!.rotation.y,
          z: this.player!.rotation.z
        }
      }));
      this.lastUpdateTime = currentTime;
    }

    // Move obstacle updates here instead of updateFromServer

    // Client-side prediction for obstacles
    this.obstacles.forEach(obstacle => {
      const velocity = this.obstacleVelocities.get(obstacle) || new THREE.Vector3(0, 0, this.speed);
      obstacle.position.add(velocity.clone().multiplyScalar(this.deltaTime));

      // Smooth correction to server position
      const serverPos = this.serverObstaclePositions.get(obstacle);
      if (serverPos) {
        const currentPos = obstacle.position.clone();
        const correctedPos = currentPos.lerp(serverPos, this.deltaTime / this.correctionTime);
        obstacle.position.copy(correctedPos);
      }

      // Remove obstacles that go out of bounds
      if (obstacle.position.z > 15) {
        this.scene!.remove(obstacle);
        this.obstacles.splice(this.obstacles.indexOf(obstacle), 1);
        this.obstacleVelocities.delete(obstacle);
        this.serverObstaclePositions.delete(obstacle);
      }
    });
  }

  initializeGame() {
    this.initializeScene();
    this.initializeLighting();
    this.initializePlayer();
    this.initializeEnvironment();
    this.initializeUI();
    this.initializeEventHandlers();
    this.animate();
  }
}

const game = new GameClient();
game.initializeGame();
// public/client.js
import * as THREE from 'three';

interface ServerObstacle {
    x: number;
    z: number;
    size: number;
}

export class GameClient {
    private ws: WebSocket;
    private scene: THREE.Scene | null;
    private camera: THREE.PerspectiveCamera | null;
    private renderer: THREE.WebGLRenderer | null;
    private player: THREE.Mesh | null;
    private obstacles: THREE.Mesh[];
    private keys: { left: boolean; right: boolean };
    private gameStarted: boolean;
    private score: number;
    private isGameOver: boolean;
    private speed: number;
    private animationFrameId: number | null = null;
    private isAnimating: boolean = false;
    private playerBoundingBox: THREE.Box3;

    constructor() {
        this.ws = new WebSocket('ws://localhost:3001'); // Match backend port
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.obstacles = [];
        this.keys = { left: false, right: false };
        this.gameStarted = false;
        this.score = 0;
        this.speed = 0.3;
        this.isGameOver = false;
        this.playerBoundingBox = new THREE.Box3();
        this.setupWebSocket();
    }

    setupWebSocket() {
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
        if (this.player && data.player) {
            this.player.position.set(data.player.position.x, data.player.position.y, data.player.position.z);
            this.player.rotation.set(data.player.rotation.x, data.player.rotation.y, data.player.rotation.z);
            this.playerBoundingBox.setFromObject(this.player);
            if (this.camera) {
                this.camera.position.x = this.player.position.x;
            }
        }
        this.score = data.score || 0;
        const scoreElement = document.getElementById('scoreValue');
        if (scoreElement) {
            scoreElement.textContent = Math.floor(this.score).toString();
        }
        this.speed = data.speed;
        if (data.obstacles) {
            this.createObstacle(data.obstacles);
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.position.z += this.speed;
        }

        this.isGameOver = data.isGameOver || false;
        if (this.isGameOver) {
            this.showGameOver();
        }
    }

    createObstacle(obstacleData: ServerObstacle[]) {
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
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.y = 6;
        this.camera.position.z = 12;
        this.camera.rotation.x = -0.5;
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(this.renderer.domElement);
        }
        
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
        const startPrompt = document.createElement('div');
        startPrompt.id = 'startPrompt';
        startPrompt.style.position = 'fixed';
        startPrompt.style.top = '50%';
        startPrompt.style.left = '50%';
        startPrompt.style.transform = 'translate(-50%, -50%)';
        startPrompt.style.color = 'white';
        startPrompt.style.fontSize = '24px';
        startPrompt.style.textAlign = 'center';
        startPrompt.innerHTML = 'Press any arrow key to start!';
        document.body.appendChild(startPrompt);

        if (!document.getElementById('scoreValue')) {
            const scoreDiv = document.createElement('div');
            scoreDiv.id = 'scoreValue';
            scoreDiv.style.position = 'absolute';
            scoreDiv.style.top = '10px';
            scoreDiv.style.left = '10px';
            scoreDiv.style.color = 'white';
            scoreDiv.textContent = '0';
            document.body.appendChild(scoreDiv);
        }
    }

    private sendMovementUpdate() {
        // Always send the complete current state
        this.ws.send(JSON.stringify({ 
            type: 'moveUpdate',
            left: this.keys.left,
            right: this.keys.right 
        }));
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
            if (!this.gameStarted) {
                this.ws.send(JSON.stringify({ type: 'start' }));
                this.gameStarted = true;
                const startPrompt = document.getElementById('startPrompt');
                if (startPrompt) {
                    startPrompt.style.display = 'none';
                }
                return;
            }
    
            let stateChanged = false;
            switch (e.key) {
                case 'ArrowLeft':
                    if (!this.keys.left) {
                        this.keys.left = true;
                        stateChanged = true;
                    }
                    break;
                case 'ArrowRight':
                    if (!this.keys.right) {
                        this.keys.right = true;
                        stateChanged = true;
                    }
                    break;
            }
            if (stateChanged) {
                this.sendMovementUpdate();
            }
        });
    
        window.addEventListener('keyup', (e) => {
            let stateChanged = false;
            switch (e.key) {
                case 'ArrowLeft':
                    if (this.keys.left) {
                        this.keys.left = false;
                        stateChanged = true;
                    }
                    break;
                case 'ArrowRight':
                    if (this.keys.right) {
                        this.keys.right = false;
                        stateChanged = true;
                    }
                    break;
            }
            if (stateChanged) {
                this.sendMovementUpdate();
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
        if (!this.isAnimating) return;
    
        // Update only what's necessary
        if (this.gameStarted && !this.isGameOver) {
            // this.updateScene();
            this.renderer!.render(this.scene!, this.camera!);
        }
    
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    private updateScene() {
        // Move obstacle updates here instead of updateFromServer
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.position.z += this.speed;
            // if (obstacle.position.z > 15) {
            //     this.scene!.remove(obstacle);
            //     this.obstacles.splice(i, 1);
            // }
        }
    }

    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    initializeGame() {
        this.initializeScene();
        this.initializeLighting();
        this.initializePlayer();
        this.initializeEnvironment();
        this.initializeUI();
        this.initializeEventHandlers();
        this.startAnimation();
    }
}

const game = new GameClient();
game.initializeGame();
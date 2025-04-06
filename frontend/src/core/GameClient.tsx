// src/core/GameClient.ts

import * as THREE from 'three';
import { WebSocketService } from '../services/WebSocketService';
import { WalletService } from '../services/WalletService';
import { Player } from '../components/three/Player';
import { Obstacle } from '../components/three/Obstacle';
import { Starfield } from '../components/three/Starfield';
import { Environment } from '../components/three/Environment';
import { ConnectButton } from '../components/ui/ConnectButton';
import { CreditsDisplay } from '../components/ui/CreditsDisplay';
import { StartButton } from '../components/ui/StartButton';
import { GameOver } from '../components/ui/GameOver';
import { ServerObstacle } from './types';
import config from '../config/config';

export class GameClient {
  private ws: WebSocketService;
  private wallet: WalletService;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private player: Player | null = null;
  private obstacles: Obstacle[] = [];
  private starfield: Starfield | null = null;
  private environment: Environment | null = null;
  private connectButton: ConnectButton | null = null;
  private creditsDisplay: CreditsDisplay | null = null;
  private startButton: StartButton | null = null;
  private gameOver: GameOver | null = null;
  private keys: { left: boolean; right: boolean } = { left: false, right: false };
  private gameStarted: boolean = false;
  private isUnlocked: boolean = false;
  private score: number = 0;
  private speed: number = 60;
  private worldWidth: number = 60;
  private isGameOver: boolean = false;
  private lastUpdateTime: number = 0;
  private playerHorizontalSpeed: number = 0.7;
  private token: string | null = null;
  private lastFrameTime: number = 0;
  private deltaTime: number = 0;
  private gameContainer: HTMLDivElement | null = null;

  constructor() {
    this.player = null;
    this.starfield = null;
    this.ws = new WebSocketService();
    this.wallet = new WalletService();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.camera = new THREE.PerspectiveCamera(75, 1200 / 675, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
  }

  initializeGame() {
    this.initializeScene();
    this.initializeComponents();
    this.setupEventHandlers();
    this.animate();
  }

  private initializeScene() {
    this.renderer.setSize(1200, 675);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.set(0, 6, 12);
    this.camera.rotation.x = -0.5;

    this.gameContainer = document.createElement('div');
    this.gameContainer.id = 'gameContainer';
    this.gameContainer.style.position = 'absolute';
    this.gameContainer.style.top = '50%';
    this.gameContainer.style.left = '50%';
    this.gameContainer.style.transform = 'translate(-50%, -50%)';
    this.gameContainer.style.width = '1200px';
    this.gameContainer.style.height = '675px';
    this.gameContainer.style.backgroundColor = '#000';
    this.gameContainer.style.border = '2px solid #333';
    this.gameContainer.style.borderRadius = '10px';
    this.gameContainer.style.overflow = 'hidden';
    this.gameContainer.style.filter = 'blur(5px)';
    this.gameContainer.style.pointerEvents = 'none';
    
    // Find the game container in the DOM
    const container = document.querySelector('.game-container');
    if (container) {
      container.appendChild(this.gameContainer);
      this.gameContainer.appendChild(this.renderer.domElement);
    }
  }

  private initializeComponents() {
    this.player = new Player(this.scene);
    this.starfield = new Starfield(this.scene);
    this.environment = new Environment(this.scene, this.worldWidth);
    this.initializeLighting();

    this.connectButton = new ConnectButton(this.wallet, () => this.onWalletConnected());
    this.creditsDisplay = new CreditsDisplay();
    this.startButton = new StartButton(
      this.wallet,
      this.creditsDisplay,
      (token: string) => this.onStartGame(token)
    );
  }

  private initializeLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(0, 10, -10);
    this.scene.add(directionalLight);
  }

  private setupEventHandlers() {
    this.ws.onMessage((data: any) => this.updateFromServer(data));

    window.addEventListener('resize', () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      this.camera.aspect = newWidth / newHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(newWidth, newHeight);
    });

    window.addEventListener('keydown', (e) => {
      if (this.isUnlocked && !this.gameStarted && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        this.gameStarted = true;
        this.ws.send({ type: 'start' });
      }
      if (this.gameStarted) {
        if (e.key === 'ArrowLeft') this.keys.left = true;
        if (e.key === 'ArrowRight') this.keys.right = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.gameStarted) {
        if (e.key === 'ArrowLeft') this.keys.left = false;
        if (e.key === 'ArrowRight') this.keys.right = false;
      }
    });
  }

  private onWalletConnected() {
    this.startButton!.enable();
  }

  private onStartGame(token: string) {
    this.token = token;
    this.ws.connect(`${config.WEBSOCKET_URL}?token=${token}`);
    this.isUnlocked = true;
    if (this.gameContainer) {
      this.gameContainer.style.filter = 'none';
      this.gameContainer.style.pointerEvents = 'auto';
    }
  }

  private updateFromServer(data: any) {
    this.score = data.score || 0;
    this.speed = data.speed || this.speed;
    this.playerHorizontalSpeed = data.horizontalSpeed || this.playerHorizontalSpeed;
    if (data.obstacles) this.createObstacles(data.obstacles);
    if (data.credits !== undefined) this.creditsDisplay!.update(data.credits);
    if (data.isGameOver) this.showGameOver();
  }

  private createObstacles(serverObstacles: ServerObstacle[]) {
    serverObstacles.forEach((data) => {
      const tempObstacle = new Obstacle(data.size, this.scene, data.x, data.z);
      this.obstacles.push(tempObstacle);
    });
  }

  private animate() {
    const currentTime = Date.now();
    this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    if (this.gameStarted && !this.isGameOver) {
      this.updateScene();
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }

  private updateScene() {
    this.player!.update(this.keys, this.playerHorizontalSpeed);
    this.camera.position.x = this.player!.getPosition().x;

    if (Date.now() - this.lastUpdateTime >= 60 && this.ws.isConnected()) {
      this.ws.send({
        type: 'playerUpdate',
        position: this.player!.getPosition(),
      });
      this.lastUpdateTime = Date.now();
    }

    this.obstacles.forEach(obstacle => obstacle.update(this.speed, this.deltaTime));
    
    // Increment score based on time survived
    if (this.gameStarted && !this.isGameOver) {
      this.score += Math.floor(this.deltaTime * 10);
    }
  }

  private showGameOver() {
    this.isGameOver = true;
    this.gameOver = new GameOver(this.score, () => this.resetGame());
  }

  private resetGame() {
    this.isGameOver = false;
    this.gameStarted = false;
    this.isUnlocked = false;
    this.score = 0;
    this.speed = 60;
    this.obstacles.forEach(obstacle => obstacle.remove(this.scene));
    this.obstacles = [];
    this.player!.reset();
    this.ws.disconnect();
    this.token = null;
    this.gameOver = null;
    this.startButton = new StartButton(
      this.wallet,
      this.creditsDisplay!,
      (token: string) => this.onStartGame(token),
      true
    );
    if (this.gameContainer) {
      this.gameContainer.style.filter = 'blur(5px)';
      this.gameContainer.style.pointerEvents = 'none';
    }
  }

  public getScore(): number {
    return this.score;
  }
}
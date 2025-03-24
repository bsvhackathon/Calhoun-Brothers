import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import WebSocket from 'ws';

const app = express();
const port = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

export class GameSession {
  private client: WebSocket;
  private state: {
    score: number;
    isGameOver: boolean;
    speed: number;
    spawnInterval: number;
    gameStarted: boolean;
    worldWidth: number;
    obstacles: any[];
    newObstacles: any[];
    lastObstacleSpawn: number;
    player: {
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      speed: number;
    };
    movement: { left: boolean; right: boolean }; // Track movement state
  };

  constructor(client: WebSocket) {
    this.client = client; // WebSocket connection for this session
    this.state = {
      score: 0,
      isGameOver: false,
      speed: 0.3,
      spawnInterval: 45,
      gameStarted: false,
      worldWidth: 60,
      obstacles: [],
      newObstacles: [],
      lastObstacleSpawn: 0,
      player: {
        position: { x: 0, y: -0.5, z: 5 },
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        speed: .4
      },
      movement: { left: false, right: false } // Initialize movement state
    };
  }

  createObstacle(x: number, z: number) {
    // Generate and return obstacle data
    const positions = [
      x,
      x + this.state.worldWidth,
      x - this.state.worldWidth
    ];

    return positions.map(xPos => ({
      x: xPos,
      z: z,
      size: 1.2 + Math.random() * 0.4
    }));
  }

  wrapCoordinate(x: number) {
    const halfWidth = this.state.worldWidth / 2;
    return ((x + halfWidth) % this.state.worldWidth) - halfWidth;
  }
  createObstaclePattern() {
    // Generate pattern data
    const z = -80;
    const pattern = Math.floor(Math.random() * 5);
    const halfWidth = this.state.worldWidth / 2;
    const obstacles = [];

    switch (pattern) {
      case 0: // Infinite wave pattern
        for (let i = 0; i < 8; i++) {
          const baseX = (i * 5) - halfWidth;
          const waveX = baseX + Math.sin(i * 0.5) * 8;
          obstacles.push(...this.createObstacle(this.wrapCoordinate(waveX), z - i * 8));
        }
        break;
      case 1: // Scattered blocks
        for (let i = 0; i < 12; i++) {
          const x = (Math.random() * this.state.worldWidth) - halfWidth;
          obstacles.push(...this.createObstacle(x, z - i * 6));
        }
        break;
      case 2: // Diagonal walls
        for (let i = 0; i < 10; i++) {
          const x = ((i * 6) % this.state.worldWidth) - halfWidth;
          obstacles.push(...this.createObstacle(x, z - i * 6));
        }
        break;
      case 3: // Zigzag walls
        for (let i = 0; i < 8; i++) {
          const x = ((i * 8) % this.state.worldWidth) - halfWidth;
          obstacles.push(...this.createObstacle(x, z - i * 8));
          obstacles.push(...this.createObstacle(x + 10, z - i * 8));
        }
        break;
      case 4: // Spiral pattern
        for (let i = 0; i < 12; i++) {
          const angle = i * 0.5;
          const radius = 15 - (i * 0.5);
          const x = Math.cos(angle) * radius;
          obstacles.push(...this.createObstacle(this.wrapCoordinate(x), z - i * 5));
        }
        break;
    }

    // Add new obstacles to the state
    this.state.obstacles.push(...obstacles);
    this.state.newObstacles.push(...obstacles);
    // return obstacles;
  }

  checkCollisions() {
    // Authoritative collision check using pure math
    const playerSize = 1; // Player size
    const playerPos = this.state.player.position;
    const halfWidth = this.state.worldWidth / 2;


    for (const obstacle of this.state.obstacles) {

      // Calculate player bounds
      const playerMinX = playerPos.x - playerSize / 2;
      const playerMaxX = playerPos.x + playerSize / 2;
      const playerMinZ = playerPos.z - playerSize / 2;
      const playerMaxZ = playerPos.z + playerSize / 2;

      // Calculate obstacle bounds
      const obstacleMinX = obstacle.x - obstacle.size / 2;
      const obstacleMaxX = obstacle.x + obstacle.size / 2;
      const obstacleMinZ = obstacle.z - obstacle.size / 2;
      const obstacleMaxZ = obstacle.z + obstacle.size / 2;


      // Check for intersection between the two boxes
      // Account for world wrapping by checking all possible positions
      const possibleXPositions = [
        obstacleMinX,
        obstacleMinX + this.state.worldWidth,
        obstacleMinX - this.state.worldWidth
      ];

      for (const baseX of possibleXPositions) {
        const wrappedMinX = baseX;
        const wrappedMaxX = baseX + obstacle.size;

        // Check if the player is near the world edges
        const isPlayerNearLeftEdge = playerMinX < -halfWidth + playerSize;
        const isPlayerNearRightEdge = playerMaxX > halfWidth - playerSize;

        // If player is near edges, check for collisions with wrapped obstacles
        if (isPlayerNearLeftEdge || isPlayerNearRightEdge) {
          // Check collision with the current position
          if (playerMinX < wrappedMaxX &&
            playerMaxX > wrappedMinX &&
            playerMinZ < obstacleMaxZ &&
            playerMaxZ > obstacleMinZ) {
            this.state.isGameOver = true;
            // return true;
          }

          // If player is near left edge, also check collision with right side of world
          if (isPlayerNearLeftEdge &&
            playerMinX + this.state.worldWidth < wrappedMaxX &&
            playerMaxX + this.state.worldWidth > wrappedMinX &&
            playerMinZ < obstacleMaxZ &&
            playerMaxZ > obstacleMinZ) {
            this.state.isGameOver = true;
            // return true;
          }

          // If player is near right edge, also check collision with left side of world
          if (isPlayerNearRightEdge &&
            playerMinX - this.state.worldWidth < wrappedMaxX &&
            playerMaxX - this.state.worldWidth > wrappedMinX &&
            playerMinZ < obstacleMaxZ &&
            playerMaxZ > obstacleMinZ) {
            this.state.isGameOver = true;
            // return true;
          }
        } else {
          // Normal collision check for when player is not near edges
          if (playerMinX < wrappedMaxX &&
            playerMaxX > wrappedMinX &&
            playerMinZ < obstacleMaxZ &&
            playerMaxZ > obstacleMinZ) {
            this.state.isGameOver = true;
            // return true;
          }
        }
      }
    }
    // return false;
  }

  update() {
    if (!this.state.gameStarted || this.state.isGameOver) return;
    // Update score
    this.state.score += 0.1;

    // spawn new obstacles if necessary
    this.state.lastObstacleSpawn++;
    if (this.state.lastObstacleSpawn >= this.state.spawnInterval) {
      this.createObstaclePattern();
      this.state.lastObstacleSpawn = 0;
    }

    // update existing obstacles
    for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.state.obstacles[i];
      obstacle.z += this.state.speed;

      if (obstacle.z > 15) {
        this.state.obstacles.splice(i, 1);
      }
    }
    // Check collisions
    this.checkCollisions();

    // Send update to this session's client
    this.sendUpdate();
  }

  handleMessage(message: string) {
    try {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'start':
                this.state.gameStarted = true;
                break;
            case 'playerUpdate':
                // Update player position and rotation
                if (data.position) {
                    this.state.player.position = {
                        x: data.position.x,
                        y: data.position.y,
                        z: data.position.z
                    };
                }
                if (data.rotation) {
                    this.state.player.rotation = {
                        x: data.rotation.x,
                        y: data.rotation.y,
                        z: data.rotation.z
                    };
                }
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    } catch (err) {
        console.error('Invalid message from client:', err);
    }
}

  sendUpdate() {
    if (this.client.readyState === WebSocket.OPEN) {
      this.client.send(JSON.stringify({
        score: this.state.score,
        obstacles: this.state.newObstacles,
        isGameOver: this.state.isGameOver,
        speed: this.state.speed
      }));
      this.state.newObstacles = [];
    }
  }
}

// Manages all game sessions
class GameServer {
  private sessions: Map<WebSocket, GameSession>;

  constructor() {
    this.sessions = new Map(); // Map WebSocket client to GameSession
  }

  startGameLoop() {
    setInterval(() => this.updateSessions(), 1000 / 60); // 60 FPS
  }

  updateSessions() {
    // console.log(this.sessions)
    for (const session of this.sessions.values()) {
      // console.log(session)
      session.update();
    }
  }

  addSession(client: WebSocket) {
    const session = new GameSession(client);
    this.sessions.set(client, session);
    return session;
  }

  removeSession(client: WebSocket) {
    this.sessions.delete(client);
  }

  handleClientMessage(client: WebSocket, message: string) {
    const session = this.sessions.get(client);
    if (session) {
      session.handleMessage(message);
    }
  }
}

app.use(cors());
app.use(express.json());


const gameServer = new GameServer();
gameServer.startGameLoop();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  const session = gameServer.addSession(ws);

  ws.on('message', (message) => {
    gameServer.handleClientMessage(ws, message.toString());
  });

  ws.on('close', () => {
    gameServer.removeSession(ws);
    console.log('Client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    gameServer.removeSession(ws);
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the API' });
});

// Use server.listen instead of app.listen
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
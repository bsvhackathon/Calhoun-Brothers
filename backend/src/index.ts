import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import url from 'url';
import dotenv from 'dotenv';
import path from 'path';
import { Transaction, IIdentity, connectToDatabase, Lottery, Identity } from 'shared-models';
import mongoose from 'mongoose';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bsv-app';
(async () => {
  try {
    await connectToDatabase(MONGODB_URI);
    console.log('Backend connected to MongoDB successfully!');
  } catch (error) {
    console.error('Backend failed to connect to MongoDB:', error);
    process.exit(1); // Exit with error if database connection fails
  }
})();

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  verifyClient: (info, callback) => {
    // Parse URL and extract token
    const { query } = url.parse(info.req.url || '', true);
    const token = query.token;

    if (!token) {
      callback(false, 401, 'Unauthorized: No token provided');
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token as string, JWT_SECRET!);
      // Attach user data to the request object for later use
      (info.req as any).decoded_token = decoded;
      callback(true);
    } catch (err) {
      console.error('JWT verification failed:', err);
      callback(false, 401, 'Unauthorized: Invalid token');
    }
  }
});

export class GameSession {
  private client: WebSocket;
  private userToken: any; // Store the decoded token for this session
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
      horizontalSpeed: number;
    };
    movement: { left: boolean; right: boolean }; // Track movement state  
  };

  constructor(client: WebSocket) {
    this.client = client; // WebSocket connection for this session
    this.userToken = (client as any).decodedToken; // Store the token from the client
    this.state = {
      score: 0,
      isGameOver: false,
      speed: 60,
      spawnInterval: 30,
      gameStarted: false,
      worldWidth: 60,
      obstacles: [],
      newObstacles: [],
      lastObstacleSpawn: 0,
      player: {
        position: { x: 0, y: -0.5, z: 5 },
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        horizontalSpeed: .7
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
      size: 1.2 + Math.random() * 0.4,
      vx: 0, // Static in x direction for now
      vz: this.state.speed // Move toward player at game speed
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

  update(deltaTime: number) {
    if (!this.state.gameStarted || this.state.isGameOver) return;
    // Update score
    this.state.score += 0.1 * deltaTime * 60; // Normalize score to 60 FPS

    // spawn new obstacles if necessary
    this.state.lastObstacleSpawn++;
    if (this.state.lastObstacleSpawn >= this.state.spawnInterval) {
      this.createObstaclePattern();
      this.state.lastObstacleSpawn = 0;
    }

    // update existing obstacles
    for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.state.obstacles[i];
      obstacle.x += obstacle.vx * deltaTime;
      obstacle.z += obstacle.vz * deltaTime;

      if (obstacle.z > 15) {
        this.state.obstacles.splice(i, 1);
      }
    }
    // Check collisions
    this.checkCollisions();

    // Update MongoDB transaction once per second or when game is over
    this.updateGameStateInDB();

    // Send update to this session's client
    this.sendUpdate();
  }

  async updateGameStateInDB() {
    try {
      // Find the transaction with appropriate validation
      const transaction = await Transaction.findOne({
        sessionId: this.userToken.sessionId,
      }).populate<{ identity: IIdentity }>('identity');

      // If no transaction found or identity key doesn't match, this is unauthorized
      if (!transaction) {
        console.error(`Transaction validation failed: Transaction not found for sessionId ${this.userToken.sessionId}`);
        return;
      }

      if (transaction.identity.identityKey !== this.userToken.identityKey) {
        console.error(`Transaction validation failed: Identity mismatch for sessionId ${this.userToken.sessionId}`);
        return;
      }

      // If validation passes, update the transaction
      await Transaction.findByIdAndUpdate(transaction._id, {
        gameScore: Math.floor(this.state.score),
        gameOver: this.state.isGameOver,
        gameStarted: this.state.gameStarted
      });
    } catch (err) {
      console.error('Error updating transaction:', err);
      // Don't retry immediately, but log the error
      // We'll let future game updates attempt to update the DB
      // This prevents overwhelming the database with retry attempts
    }
  }

  handleMessage(message: string) {
    try {
      const data = JSON.parse(message);
      switch (data.type) {
        case 'start':
          this.state.gameStarted = true;
          this.updateGameStateInDB();
          this.sendUpdate(); // Send initial state immediately
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
        horizontalSpeed: this.state.player.horizontalSpeed,
        speed: this.state.speed
      }));
      this.state.newObstacles = [];
    }
  }

  setGameOver() {
    if (this.state.gameStarted) {
      this.state.isGameOver = true;
      this.updateGameStateInDB();
    }
  }
}

// Manages all game sessions
class GameServer {
  private sessions: Map<WebSocket, GameSession>;
  private lastUpdateTime: number;

  constructor() {
    this.sessions = new Map(); // Map WebSocket client to GameSession
    this.lastUpdateTime = Date.now();
  }

  startGameLoop() {
    const update = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
      this.lastUpdateTime = currentTime;

      this.updateSessions(deltaTime);
      setTimeout(update, 1000 / 60); // Aim for 60 FPS
    };
    update();
  }

  updateSessions(deltaTime: number) {
    // console.log(this.sessions)
    for (const session of this.sessions.values()) {
      // console.log(session)
      session.update(deltaTime);
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

  handleClientDisconnect(client: WebSocket) {
    const session = this.sessions.get(client);
    if (session) {
      // Set game over and update DB before removing the session
      session.setGameOver();
    }
    this.removeSession(client);
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
wss.on('connection', (ws, req) => {
  console.log('New client connected');
  // Attach decoded token directly to the WebSocket object
  (ws as any).decodedToken = (req as any).decoded_token;
  // Create game session after token is attached
  gameServer.addSession(ws);

  ws.on('message', (message) => {
    // Use the token attached to this specific WebSocket instance
    // console.log((ws as any).decodedToken);
    gameServer.handleClientMessage(ws, message.toString());
  });

  ws.on('close', () => {
    gameServer.handleClientDisconnect(ws);
    console.log('Client disconnected');
  });

  ws.on('error', (err) => {
    // console.log((ws as any).decodedToken);
    console.error('WebSocket error:', err);
    gameServer.removeSession(ws);
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the API' });
});

app.get('/lotteries', async (req: Request, res: Response) => {
  const lotteries = await Lottery.find({}).exec();
  res.json(lotteries);
});

app.get('/completed-lotteries', async (req: Request, res: Response) => {
  const completedLotteries = await Lottery.find({ winningIdentityKey: { $ne: null } }).exec();
  res.json(completedLotteries);
});

app.get('/unfinished-lotteries', async (req: Request, res: Response) => {
  const unfinishedLotteries = await Lottery.find({ winningIdentityKey: null }).exec();
  res.json(unfinishedLotteries);
});

app.get('/leaderboard', async (req: Request, res: Response) => {
  const leaderboard = await Transaction
    .find({})
    .sort({ gameScore: -1 }) // Sort descending (highest first)
    .limit(10)
    .select('identity gameScore createdAt') // Select relevant fields
    .populate<{ identity: { publicKey: string; identityKey: string } }>('identity', 'publicKey identityKey')
    .exec();

  if (leaderboard.length === 0) {
    console.log('No transactions found for leaderboard.');
    return res.status(200).json([]); // Return empty array with 200 status
  }

  const formattedLeaderboard = leaderboard.map((entry, index) => ({
    rank: index + 1,
    identityKey: entry.identity?.identityKey || 'Unknown',
    publicKey: entry.identity?.publicKey || 'Unknown',
    score: entry.gameScore,
    date: entry.createdAt
  }));

  res.status(200).json(formattedLeaderboard);
});

// Use server.listen instead of app.listen
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


async function assignTransactionsToLotteries() {
  try {
    // Step 1: Find all transactions without a lottery assigned
    const unassignedTransactions = await Transaction.find({ lottery: null })
      .populate('identity') // Optional: populate identity if needed for logging
      .exec();

    if (unassignedTransactions.length === 0) {
      console.log('No transactions without a lottery found.');
      return;
    }

    console.log(`Found ${unassignedTransactions.length} unassigned transactions.`);

    // Step 2: Process transactions in batches of 5
    const batchSize = 5;
    let processedCount = 0;

    for (let i = 0; i < unassignedTransactions.length; i += batchSize) {
      const batch = unassignedTransactions.slice(i, i + batchSize);

      // If batch has less than 5 transactions, leave them in the queue
      if (batch.length < batchSize) {
        console.log(`Leaving ${batch.length} transactions in the queue (less than 5).`);
        break;
      }

      // Step 3: Create a new lottery for this batch
      const lotteryId = `LOTTERY_${Date.now()}_${processedCount}`; // Unique lotteryId
      const lottery = await Lottery.create({ lotteryId });

      // Step 4: Assign the batch of 5 transactions to the new lottery
      const transactionIds = batch.map(tx => tx._id);
      await Transaction.updateMany(
        { _id: { $in: transactionIds } },
        { lottery: lottery._id }
      );

      processedCount += batch.length;
      console.log(`Assigned ${batch.length} transactions to ${lotteryId}`);
    }

    // Step 5: Report any leftovers
    const leftovers = unassignedTransactions.length - processedCount;
    if (leftovers > 0) {
      console.log(`${leftovers} transactions remain in the queue.`);
    } else {
      console.log('All transactions have been assigned to lotteries.');
    }
  } catch (error) {
    console.error('Error assigning transactions to lotteries:', error);
  } finally {
    // Optionally close the connection if this is a standalone script
    // await mongoose.connection.close();
  }
}

async function getUndrawnLotteriesDetails() {
  try {
    // Step 1: Find all lotteries that have not been drawn (winningIdentityKey is null)
    const undrawnLotteries = await Lottery.find({ winningIdentityKey: null }).exec();

    if (undrawnLotteries.length === 0) {
      console.log('No undrawn lotteries found.');
      return;
    }

    console.log(`Found ${undrawnLotteries.length} undrawn lotteries.`);

    // Step 2: For each lottery, get associated transactions and their details
    for (const lottery of undrawnLotteries) {
      const transactions = await Transaction.find({ lottery: lottery._id })
        .populate<{ identity: { publicKey: string; identityKey: string } }>('identity', 'publicKey identityKey')
        .exec();

      if (transactions.length === 0) {
        console.log(`Lottery ${lottery.lotteryId}: No transactions found.`);
        continue;
      }

      // Step 3: Extract nonce and identityKey for each transaction
      const details = transactions.map(tx => ({
        nonce: tx.nonce || 'N/A', // Handle case where nonce might be undefined
        identityKey: tx.identity ? tx.identity : 'Unknown', // Safely access identityKey
      }));

      // Log the results for this lottery
      console.log(`\nLottery ${lottery.lotteryId}:`);
      details.forEach((detail, index) => {
        console.log(`  ${index + 1}. Nonce: ${detail.nonce}, IdentityKey: ${detail.identityKey}`);
      });

      // THIS IS WHERE IT WOULD GOOOOO
    }
  } catch (error) {
    console.error('Error retrieving undrawn lotteries:', error);
  }
}

const intervalTime = 5000;

const run = async () => {
  console.log('Running assignTransactionsToLotteries...');
  try {
    await assignTransactionsToLotteries();
    await getUndrawnLotteriesDetails();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    setTimeout(run, intervalTime);
  }
};

// run();
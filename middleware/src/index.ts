import 'dotenv/config'
import express, { Request as ExpressRequest, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import { Setup } from '@bsv/wallet-toolbox'
import { createPaymentMiddleware } from '@bsv/payment-express-middleware'
import { AuthRequest, createAuthMiddleware } from '@bsv/auth-express-middleware'
import { Chain } from '@bsv/wallet-toolbox/out/src/sdk/types.js'
import path from 'path'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { connectToDatabase, Transaction, Identity } from 'mongo-tools'

// Load environment variables from .env file
require('dotenv').config({ 
  path: path.resolve(__dirname, '../.env') 
})

// Validate required environment variables
if (!process.env.SERVER_PRIVATE_KEY) {
  throw new Error('SERVER_PRIVATE_KEY is required in .env file')
}

const {
  SERVER_PRIVATE_KEY,
  WALLET_STORAGE_URL, 
  HTTP_PORT,
  BSV_NETWORK,
  MONGODB_URI
} = process.env

const app = express()
app.use(bodyParser.json({ limit: '64mb' }))

// This middleware sets CORS headers.
app.use((req: ExpressRequest, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Expose-Headers', '*')
  res.header('Access-Control-Allow-Private-Network', 'true')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Serve static files from the 'public' directory.
app.use(express.static('public'))

// -----------------------------------------------------------------------------
// Wallet and Middleware Setup inside async init function
// -----------------------------------------------------------------------------

async function init() {
  console.log(`Using BSV_NETWORK: ${BSV_NETWORK}`)
  console.log(`HTTP_PORT: ${HTTP_PORT}`)
  
  if (!SERVER_PRIVATE_KEY || !WALLET_STORAGE_URL || !BSV_NETWORK) {
    throw new Error('Missing required environment variables')
  }
  
  // Connect to MongoDB
  const mongoUri = MONGODB_URI
  try {
    await connectToDatabase(mongoUri!)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    throw error
  }
  
  const wallet = await Setup.createWalletClientNoEnv({
    chain: BSV_NETWORK as Chain,
    rootKeyHex: SERVER_PRIVATE_KEY,
    storageUrl: WALLET_STORAGE_URL
  })

  // Setup the authentication middleware.
  app.use(createAuthMiddleware({
    wallet,
    allowUnauthenticated: false,
    // logger: console,
    // logLevel: 'debug'
  }))

  // Setup the payment middleware.
  app.use(createPaymentMiddleware({
    wallet,
    calculateRequestPrice: async (req) => {
      return 1// 1 sat flat rate fee
    }
  }))

  // ---------------------------------------------------------------------------
  // /weatherStats Endpoint - Returns Mocked Mars Weather Data
  // ---------------------------------------------------------------------------

  app.get('/pay', async (req: AuthRequest, res: Response) => {
    let payment = ((req as any).payment)
    let auth = ((req as any).auth)
    
    // Generate a random session ID
    const sessionId = crypto.randomUUID();
    
    try {
      // Find or create an identity for this user
      const identityKey = auth?.identityKey;
      let identity = await Identity.findOne({ identityKey });
      
      if (!identity) {
        identity = new Identity({ identityKey });
        await identity.save();
        console.log(`Created new identity: ${identityKey}`);
      }
      
      // Create a transaction record
      const tx = new Transaction({
        tx: payment?.tx,
        sessionId: sessionId,
        satoshisPaid: payment?.satoshisPaid,
        accepted: payment?.accepted,
        identity: identity._id,
        gameStarted: false,
        gameOver: false,
        gameScore: 0
      });
      
      await tx.save();
      console.log(`Created new transaction record: ${sessionId}`);
      
      // Generate a JWT token with payload
      const payload = {
        sessionId,
        identityKey,
        iat: Math.floor(Date.now() / 1000),
      };
      
      // The secret key should ideally be in your .env file
      const secretKey = process.env.JWT_SECRET;
      
      // Sign the token
      const token = jwt.sign(payload, secretKey!);
      
      // Return the token in the response
      res.json({
        token: token
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  })

  // Start the server.
  app.listen(HTTP_PORT, () => {
    console.log(`Monetized Weather API Wrapper listening on port ${HTTP_PORT}`)
  })
}

init().catch(err => {
  console.error('Failed to start server:', err)
})
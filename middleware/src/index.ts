import 'dotenv/config'
import express, { Request as ExpressRequest, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import { Setup } from '@bsv/wallet-toolbox'
import { createPaymentMiddleware } from '@bsv/payment-express-middleware'
import { AuthRequest, createAuthMiddleware } from '@bsv/auth-express-middleware'
import { Chain } from '@bsv/wallet-toolbox/out/src/sdk/types.js'
import path from 'path'

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
      return 3 // 1 sat flat rate fee
    }
  }))

  // ---------------------------------------------------------------------------
  // /weatherStats Endpoint - Returns Mocked Mars Weather Data
  // ---------------------------------------------------------------------------

  app.get('/test', async (req: AuthRequest, res: Response) => {
    console.log((req as any).payment)
    console.log((req as any).auth)
    const test = { "message": "Hello World" }
    res.json(test)
    return
  })

  // Start the server.
  app.listen(HTTP_PORT, () => {
    console.log(`Monetized Weather API Wrapper listening on port ${HTTP_PORT}`)
  })
}

init().catch(err => {
  console.error('Failed to start server:', err)
})
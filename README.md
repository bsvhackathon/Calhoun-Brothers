# Calhoun Brothers Project

A blockchain-based gaming platform that integrates with the Metanet desktop wallet for transaction signing and uses a lottery system for game mechanics.

> **Note:** While the core functionality of the project is working and fully operational, there are some minor implementation details that were identified during the hackathon. These are documented in the [GitHub Issues](https://github.com/bsvhackathon/Calhoun-Brothers/issues) tab. Feel free to check them out if you're interested in contributing or understanding the project's evolution.

## System Architecture

![System Architecture](docs/images/diagram.png)

## Project Structure

The project is organized into several key components:

### Frontend
- Integrates with Metanet desktop wallet for transaction signing
- Communicates with backend for game state and data
- Interacts with middleware for token/credit management
- Built with modern web technologies

### Middleware
- Handles token/credit system using payment-middleware-express
- Manages MongoDB connections and operations
- Processes payments and credit distribution
- Acts as an intermediary between frontend and backend

### Backend
- Exposes MongoDB data to frontend
- Manages game state and player connections
- Implements WebSocket for real-time game state updates
- Validates player positions and game mechanics

### Contracts
- Contains the lottery smart contract implementation
- Uses scrypt-ts for Bitcoin SV smart contract development
- Handles lottery deployment, funding, and drawing
- Updates MongoDB with contract state changes
- Key files:
  - `deploy.ts`: Handles contract deployment and lottery operations

### Shared
- Contains MongoDB models used across the project
- Ensures consistent data structure throughout the application
- Shared between frontend, backend, and middleware

## Prerequisites

- Node.js v18
- MongoDB
- Metanet desktop wallet
- Bitcoin SV node (for contract deployment)

## Installation

1. Clone the repository
2. Build shared package:
   ```bash
   cd shared
   npm run clean
   npm run build
   cd ..
   ```
3. Install root dependencies:
   ```bash
   npm install
   ```

## Environment Setup

### MongoDB Setup
Create a MongoDB database with the following credentials:
- Username: admin
- Password: chaingamesdog
- Database: chain

### Environment Files

1. Backend (.env):
   ```
   JWT_SECRET=test
   MONGODB_URI=mongodb://admin:chaingamesdog@localhost:27017/chain
   PORT=3001
   WEBSOCKET_URL=ws://localhost:3002
   ```

2. Frontend (.env):
   ```
   WEBSOCKET_URL=ws://localhost:3002
   API_URL=http://localhost:3001
   ```

3. Middleware (.env):
   ```
   SERVER_PRIVATE_KEY=${use bsv/wallet-toolbox-examples to produce}
   WALLET_STORAGE_URL=https://storage.babbage.systems
   HTTP_PORT=3002
   BSV_NETWORK=main
   MONGODB_URI=mongodb://admin:chaingamesdog@localhost:27017/chain
   JWT_SECRET=test
   ```

4. Contracts (.env):
   ```
   PRIVATE_KEY="look at deploy.ts file to see how to produce"
   MONGODB_URI=mongodb://admin:chaingamesdog@localhost:27017/chain
   NETWORK=mainnet
   ```

## Running the Application

1. Start the main application:
   ```bash
   npm run dev
   ```
   This will start the frontend, backend, and middleware services.

2. Start the lottery contract service:
   ```bash
   cd contracts
   npm install
   npm run build
   npm run deploy
   ```
   This will handle the creation and settlement of lotteries.

## Smart Contract Development

The project uses scrypt-ts for Bitcoin SV smart contract development. Key features:

- Lottery contract deployment
- Contract funding
- Lottery drawing
- State management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your license information here] 
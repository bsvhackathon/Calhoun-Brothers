# ChainGames

A full-stack TypeScript application with Vite + React frontend and Express.js backend.

## Project Structure

```
chaingames/
├── frontend/          # Vite + React frontend
├── backend/           # Express.js backend
└── package.json       # Root package.json for workspace management
```

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development servers:
   ```bash
   npm run dev
   ```
   This will start both the frontend and backend servers concurrently.

3. Build for production:
   ```bash
   npm run build
   ```

4. Start production servers:
   ```bash
   npm run start
   ```

## Development

- Frontend runs on: http://localhost:5173
- Backend runs on: http://localhost:3001

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend in development mode
- `npm run dev:backend` - Start only backend in development mode
- `npm run build` - Build both frontend and backend
- `npm run start` - Start both frontend and backend in production mode
- `npm run start:frontend` - Start only frontend in production mode
- `npm run start:backend` - Start only backend in production mode

## Tech Stack

### Frontend
- Vite
- React
- TypeScript
- Tailwind CSS

### Backend
- Express.js
- TypeScript
- Node.js 
# Goat Cafe Vite Setup

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
PORT=8000
MONGO_URI=mongodb://localhost:27017/goat-cafe
SECRET=your-secret-key-here
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Make sure MongoDB is running locally on port 27017

3. Run the seed script to populate the database:
```bash
node config/seed.js
```

## Running the Application

### Development (Frontend + Backend)
```bash
npm run dev:full
```

This will start both the Express backend (port 8000) and Vite frontend (port 3000) concurrently.

### Frontend Only
```bash
npm run dev
```

### Backend Only
```bash
npm run server
```

## Features

- ✅ Vite + React frontend with SCSS support
- ✅ Express backend with ES modules
- ✅ MongoDB integration with Mongoose
- ✅ API proxy from frontend to backend
- ✅ Concurrent development server
- ✅ JWT authentication
- ✅ User management and orders system

## Ports

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API calls from frontend are automatically proxied to backend

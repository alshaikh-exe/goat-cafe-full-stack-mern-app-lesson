# Debug Guide: Troubleshooting Common Issues

## Overview
This guide provides solutions to common problems you may encounter while building and running the full-stack application. Each section includes the error message, likely causes, and step-by-step solutions.

## Table of Contents
1. [MongoDB Connection Issues](#mongodb-connection-issues)
2. [JWT Authentication Problems](#jwt-authentication-problems)
3. [Frontend-Backend Communication](#frontend-backend-communication)
4. [SCSS/Styling Issues](#scssstyling-issues)
5. [Module Import/Export Errors](#module-importexport-errors)
6. [Port Conflicts](#port-conflicts)
7. [Environment Variable Issues](#environment-variable-issues)
8. [React State and Rendering Issues](#react-state-and-rendering-issues)

---

## MongoDB Connection Issues

### Error: `MongooseError: The \`uri\` parameter to \`openUri()\` must be a string, got "undefined"`

**Cause**: Environment variables not loaded before database connection attempt.

**Solution**:
1. Check `server.js` import order:
```javascript
// CORRECT ORDER
import dotenv from 'dotenv';
dotenv.config(); // Must be first!

import './config/database.js';
import app from './app-server.js';
```

2. Verify `.env` file exists and has correct format:
```bash
# .env file should look like this (no spaces around =)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
SECRET=your_jwt_secret_here
PORT=3000
```

3. Check for hidden characters in `.env`:
```bash
# View hidden characters
cat -A .env

# Clean up any problematic characters
sed -i '' 's/[[:space:]]*$//' .env
sed -i '' 's/%$//' .env
```

### Error: `MongoServerError: Authentication failed`

**Cause**: Invalid MongoDB credentials or connection string.

**Solution**:
1. Verify MongoDB connection string format:
```bash
# Correct format
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

2. Check username/password in MongoDB Atlas:
   - Log into MongoDB Atlas
   - Go to Database Access
   - Verify username and password
   - Reset password if needed

3. Test connection string:
```bash
# Test with mongosh (if installed)
mongosh "mongodb+srv://username:password@cluster.mongodb.net/database"
```

---

## JWT Authentication Problems

### Error: `401 Unauthorized: No token provided`

**Cause**: Frontend not sending Authorization header or token not stored.

**Solution**:
1. Check token storage in frontend:
```javascript
// users-service.js
export function getToken() {
  const token = localStorage.getItem('token');
  console.log('Stored token:', token); // Add debugging
  return token;
}
```

2. Verify token is sent in API calls:
```javascript
// items-api.js
export async function getAllItems() {
  const token = getToken();
  console.log('Sending token:', token); // Add debugging
  
  const response = await fetch('/api/items', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  // ...
}
```

3. Check browser localStorage:
```javascript
// In browser console
console.log(localStorage.getItem('token'));
```

### Error: `401 Unauthorized: Invalid token`

**Cause**: Token expired, malformed, or SECRET mismatch.

**Solution**:
1. Check token expiration:
```javascript
// users-service.js
export function getToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload); // Add debugging
    console.log('Token expires:', new Date(payload.exp * 1000));
    
    if (payload.exp < Date.now() / 1000) {
      console.log('Token expired, removing...');
      localStorage.removeItem('token');
      return null;
    }
    return token;
  } catch (error) {
    console.log('Token decode error:', error);
    localStorage.removeItem('token');
    return null;
  }
}
```

2. Verify SECRET in backend:
```javascript
// config/checkToken.js
export default function checkToken(req, res, next) {
  console.log('SECRET available:', !!process.env.SECRET); // Add debugging
  console.log('SECRET length:', process.env.SECRET?.length);
  
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Received token:', token);
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.SECRET);
    console.log('Token verified, payload:', payload);
    req.user = payload;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

3. Check token format in browser:
```javascript
// In browser console, decode token manually
const token = localStorage.getItem('token');
const parts = token.split('.');
console.log('Header:', JSON.parse(atob(parts[0])));
console.log('Payload:', JSON.parse(atob(parts[1])));
```

---

## Frontend-Backend Communication

### Error: `Failed to fetch` or Network Error

**Cause**: Backend server not running or port mismatch.

**Solution**:
1. Check backend server status:
```bash
# Check if server is running
lsof -i :3000

# Or check process
ps aux | grep node
```

2. Verify Vite proxy configuration:
```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Must match backend port
        changeOrigin: true
      }
    }
  }
});
```

3. Check backend port in `.env`:
```bash
# .env file
PORT=3000
```

4. Test backend directly:
```bash
# Test backend endpoint
curl http://localhost:3000/api/items
```

### Error: `CORS error` in browser console

**Cause**: CORS middleware not configured or misconfigured.

**Solution**:
1. Verify CORS middleware in `app-server.js`:
```javascript
import cors from 'cors';

// CORS should be before other middleware
app.use(cors());
app.use(express.json());
```

2. Check CORS configuration:
```javascript
// More specific CORS config if needed
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

---

## SCSS/Styling Issues

### Error: `[sass] Can't find stylesheet to import`

**Cause**: Incorrect SCSS import paths or Vite configuration issues.

**Solution**:
1. Remove `additionalData` from Vite config:
```javascript
// vite.config.js - Remove this section
css: {
  preprocessorOptions: {
    scss: {
      // additionalData: '@import "src/index.scss";' // Remove this
    }
  }
}
```

2. Import SCSS files directly in components:
```javascript
// Component files
import styles from './Component.module.scss';
import '../../index.scss'; // If you need global styles
```

3. Check SCSS file paths:
```bash
# Verify file structure
ls -la src/
ls -la src/components/ComponentName/
```

### Error: Styles not applying or broken

**Cause**: CSS Modules not configured or class names not matching.

**Solution**:
1. Verify CSS Modules setup:
```javascript
// Component files must use .module.scss extension
import styles from './Component.module.scss';

// Use styles object for class names
<div className={styles.container}>
```

2. Check class name usage:
```javascript
// CORRECT
<div className={styles.button}>

// INCORRECT
<div className="button">
```

3. Verify SCSS compilation:
```bash
# Check if SCSS files are being processed
npm run dev
# Look for SCSS compilation messages
```

---

## Module Import/Export Errors

### Error: `SyntaxError: The requested module does not provide an export named 'default'`

**Cause**: Mismatch between export and import statements.

**Solution**:
1. Check export statements in controllers:
```javascript
// controllers/api/users.js - Use named exports
export const signup = async (req, res) => { /* ... */ };
export const login = async (req, res) => { /* ... */ };

// NOT export default
```

2. Check import statements in routes:
```javascript
// routes/api/users.js - Use named imports
import { signup, login } from '../../controllers/api/users.js';

// NOT import userController from ...
```

3. Check import statements in app-server.js:
```javascript
// app-server.js - Use named imports
import userRoutes from './routes/api/users.js';
import itemRoutes from './routes/api/items.js';
import orderRoutes from './routes/api/orders.js';
```

### Error: `Cannot use import statement outside a module`

**Cause**: Missing `"type": "module"` in package.json or CommonJS syntax.

**Solution**:
1. Verify package.json:
```json
{
  "type": "module",
  // ... other fields
}
```

2. Use ES module syntax throughout:
```javascript
// CORRECT - ES modules
import express from 'express';
import { fileURLToPath } from 'url';

// INCORRECT - CommonJS
const express = require('express');
const path = require('path');
```

3. Check file extensions:
```javascript
// Use .js extension for ES modules
import userRoutes from './routes/api/users.js';
```

---

## Port Conflicts

### Error: `EADDRINUSE: address already in use :::3000`

**Cause**: Another process is using port 3000.

**Solution**:
1. Find and kill the process:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill -9 PID
```

2. Use a different port:
```bash
# .env file
PORT=8001

# Or start with different port
PORT=8001 npm run dev
```

3. Check for multiple Node processes:
```bash
# List all Node processes
ps aux | grep node

# Kill all Node processes (be careful!)
pkill -f node
```

### Error: `Port 5173 is already in use`

**Cause**: Another Vite dev server is running.

**Solution**:
1. Kill existing Vite process:
```bash
# Find Vite process
ps aux | grep vite

# Kill it
kill -9 PID
```

2. Use different port:
```bash
# vite.config.js
export default defineConfig({
  server: {
    port: 5174, // Different port
  }
});
```

---

## Environment Variable Issues

### Error: `process.env.VARIABLE is undefined`

**Cause**: Environment variables not loaded or `.env` file issues.

**Solution**:
1. Check `.env` file location:
```bash
# .env should be in project root (same level as package.json)
ls -la .env
```

2. Verify `.env` file format:
```bash
# Correct format (no spaces, no quotes)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
SECRET=your_secret_here
PORT=3000

# Incorrect format
MONGO_URI = "mongodb+srv://..."
SECRET = 'your_secret_here'
```

3. Check for hidden characters:
```bash
# View file with hidden characters
cat -A .env

# Clean up the file
sed -i '' 's/[[:space:]]*$//' .env
sed -i '' 's/^[[:space:]]*//' .env
```

4. Restart server after `.env` changes:
```bash
# Stop server (Ctrl+C) and restart
npm run dev
```

---

## React State and Rendering Issues

### Error: Component not re-rendering after state update

**Cause**: State update not triggering re-render or incorrect state mutation.

**Solution**:
1. Use functional state updates:
```javascript
// CORRECT - Functional update
setCart(prevCart => [...prevCart, newItem]);

// INCORRECT - Direct mutation
cart.push(newItem);
setCart(cart);
```

2. Check state update logic:
```javascript
// Add debugging
const addToCart = (item) => {
  console.log('Adding item:', item);
  console.log('Current cart:', cart);
  
  setCart(prevCart => {
    const newCart = [...prevCart, item];
    console.log('New cart:', newCart);
    return newCart;
  });
};
```

3. Verify state dependencies:
```javascript
// Check useEffect dependencies
useEffect(() => {
  fetchItems();
}, []); // Empty array = run once on mount
```

### Error: `Maximum update depth exceeded`

**Cause**: Infinite re-render loop.

**Solution**:
1. Check useEffect dependencies:
```javascript
// CORRECT - Stable dependencies
const fetchItems = useCallback(async () => {
  // ... fetch logic
}, []);

useEffect(() => {
  fetchItems();
}, [fetchItems]);
```

2. Use useCallback for functions:
```javascript
const handleClick = useCallback(() => {
  // ... handler logic
}, [dependency]);
```

3. Check for state updates in render:
```javascript
// INCORRECT - State update in render
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // This causes infinite loop!
  
  return <div>{count}</div>;
}
```

---

## General Debugging Tips

### 1. Add Console Logs
```javascript
// Add logging throughout your code
console.log('Function called with:', arguments);
console.log('State before update:', state);
console.log('API response:', response);
```

### 2. Check Browser Network Tab
- Open Developer Tools → Network tab
- Look for failed requests
- Check request/response headers
- Verify API endpoints

### 3. Check Browser Console
- Look for JavaScript errors
- Check for CORS errors
- Verify API responses

### 4. Check Terminal Output
- Look for server errors
- Check for compilation errors
- Verify database connections

### 5. Use Debugger Statement
```javascript
// Add breakpoints in your code
debugger;
const result = await apiCall();
console.log('Result:', result);
```

---

## Common Debugging Commands

### Check Server Status
```bash
# Check if backend is running
lsof -i :3000

# Check if frontend is running
lsof -i :5173

# Check all Node processes
ps aux | grep node
```

### Check Environment Variables
```bash
# View .env file
cat .env

# Check for hidden characters
cat -A .env

# Test environment variable loading
node -e "require('dotenv').config(); console.log(process.env.MONGO_URI)"
```

### Check File Structure
```bash
# Verify project structure
tree -I 'node_modules|dist'

# Check specific directories
ls -la src/
ls -la config/
ls -la routes/
```

### Check Dependencies
```bash
# Verify package.json
cat package.json

# Check installed packages
npm list

# Reinstall dependencies if needed
rm -rf node_modules package-lock.json
npm install
```

---

## Getting Help

If you're still experiencing issues after trying these solutions:

1. **Check the error message carefully** - it often contains the solution
2. **Look at the stack trace** - it shows where the error occurred
3. **Search for the error message** - others have likely encountered it
4. **Check the documentation** - for the specific packages you're using
5. **Ask for help** - provide the error message, stack trace, and what you've tried

Remember: Most errors are configuration issues or simple syntax problems. Take your time, read the error messages carefully, and work through the solutions step by step.

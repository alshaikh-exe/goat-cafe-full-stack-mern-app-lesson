# Troubleshooting Guide for Full-Stack E-commerce Application

## Common Issues and Solutions

This guide covers the most common problems you'll encounter when building and running the full-stack application, along with their solutions.

---

## 1. Backend Server Issues

### Issue: MongoDB Connection Failed
**Error Message:**
```
MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined"
```

**Root Cause:** Environment variables not loaded before database import.

**Solution:**
1. Ensure `.env` file exists in root directory
2. Check import order in `server.js`:
   ```javascript
   import dotenv from 'dotenv';
   
   // Load environment variables FIRST
   dotenv.config();
   
   // Then import other modules that need environment variables
   import './config/database.js';
   import app from './app-server.js';
   ```

3. Verify `.env` file format:
   ```bash
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   SECRET=your-super-secret-jwt-key-here
   PORT=8000
   ```

**Prevention:** Always call `dotenv.config()` before any imports that depend on environment variables.

---

### Issue: JWT Authentication Fails
**Error Message:**
```
{"msg":"Unauthorized You Shall Not Pass"}
```

**Root Cause:** Missing `checkToken` middleware in protected routes.

**Solution:**
1. Ensure protected routes include both middleware functions:
   ```javascript
   // In app-server.js
   app.use('/api/items', checkToken, ensureLoggedIn, itemRoutes);
   app.use('/api/orders', checkToken, ensureLoggedIn, orderRoutes);
   ```

2. Verify middleware order:
   - `checkToken` - Extracts and verifies JWT token
   - `ensureLoggedIn` - Checks if user is authenticated
   - Route handlers - Process the request

3. Check that `SECRET` environment variable is set correctly

**Prevention:** Always include `checkToken` middleware before `ensureLoggedIn` for protected routes.

---

### Issue: Server Won't Start
**Error Message:**
```
SyntaxError: Cannot use import statement outside a module
```

**Root Cause:** Missing `"type": "module"` in package.json.

**Solution:**
1. Add to `package.json`:
   ```json
   {
     "type": "module"
   }
   ```

2. Ensure all imports use ES6 syntax:
   ```javascript
   import express from 'express';
   import cors from 'cors';
   ```

**Prevention:** Always set `"type": "module"` when using ES6 imports.

---

## 2. Frontend Issues

### Issue: SCSS Import Errors
**Error Message:**
```
[sass] Can't find stylesheet to import. @import "src/index.scss";
```

**Root Cause:** Vite configuration trying to import non-existent files.

**Solution:**
1. Remove `additionalData` from `vite.config.js`:
   ```javascript
   export default defineConfig({
     plugins: [react()],
     css: {
       preprocessorOptions: {
         scss: {
           // Remove additionalData - import SCSS files directly
         }
       }
     }
   })
   ```

2. Import SCSS files directly in components:
   ```javascript
   import styles from './Component.module.scss';
   ```

3. Import global SCSS in `main.jsx`:
   ```javascript
   import './index.scss';
   ```

**Prevention:** Don't use `additionalData` for global SCSS imports in Vite.

---

### Issue: API Calls Fail
**Error Message:**
```
Failed to fetch
```

**Root Cause:** Incorrect Vite proxy configuration or backend not running.

**Solution:**
1. Verify Vite proxy configuration:
   ```javascript
   server: {
     port: 5173,
     proxy: {
       '/api': {
         target: 'http://localhost:8000',
         changeOrigin: true
       }
     }
   }
   ```

2. Ensure backend server is running on port 8000
3. Check that frontend is running on port 5173
4. Verify API endpoints exist in backend

**Prevention:** Always start backend before frontend and verify proxy settings.

---

### Issue: React Router Not Working
**Error Message:**
```
Cannot GET /orders/new
```

**Root Cause:** Backend not serving `index.html` for React Router routes.

**Solution:**
1. Ensure catch-all route is configured correctly in `app-server.js`:
   ```javascript
   // For React Router - serve index.html for all non-API routes
   app.get('*', (req, res) => {
       // Don't serve index.html for API routes
       if (req.path.startsWith('/api/')) {
           return res.status(404).json({ error: 'API endpoint not found' });
       }
       
       // Serve the React app for all other routes
       res.sendFile(path.resolve(path.join(__dirname, indexPath)));
   });
   ```

2. Verify static file serving configuration:
   ```javascript
   const staticDir = process.env.NODE_ENV === 'production' ? 'dist' : 'public';
   const indexPath = process.env.NODE_ENV === 'production' ? 'dist/index.html' : 'index.html';
   
   app.use(express.static(staticDir));
   ```

**Prevention:** Always configure catch-all route for single-page applications.

---

## 3. Authentication Issues

### Issue: Login Succeeds But No Redirect
**Error Message:**
```
200 OK response but user state not updated
```

**Root Cause:** Frontend not handling backend response format correctly.

**Solution:**
1. Verify backend returns correct format:
   ```javascript
   const apiController = {
       auth(req, res) {
           res.json({
               token: res.locals.data.token,
               user: res.locals.data.user
           });
       }
   };
   ```

2. Ensure frontend extracts data correctly:
   ```javascript
   export async function login(credentials) {
       const response = await usersAPI.login(credentials);
       localStorage.setItem('token', response.token);
       return response.user; // Return user object, not full response
   }
   ```

**Prevention:** Always align frontend expectations with backend response format.

---

### Issue: Token Decoding Errors
**Error Message:**
```
InvalidCharacterError: Failed to execute 'atob' on 'Window'
```

**Root Cause:** Attempting to decode null or malformed tokens.

**Solution:**
1. Add null checks and error handling:
   ```javascript
   export function getToken() {
       const token = localStorage.getItem('token');
       if (!token) return null;
       
       try {
           const payload = JSON.parse(atob(token.split('.')[1]));
           if (payload.exp < Date.now() / 1000) {
               localStorage.removeItem('token');
               return null;
           }
           return token;
       } catch (error) {
           localStorage.removeItem('token');
           return null;
       }
   }
   ```

2. Handle token expiration gracefully
3. Clear invalid tokens automatically

**Prevention:** Always validate tokens before attempting to decode them.

---

## 4. Database Issues

### Issue: Mongoose Schema Validation Errors
**Error Message:**
```
ValidationError: Path `email` is required
```

**Root Cause:** Missing required fields or incorrect data types.

**Solution:**
1. Verify schema requirements:
   ```javascript
   const userSchema = new mongoose.Schema({
       name: { type: String, required: true },
       email: { type: String, required: true, unique: true },
       password: { type: String, required: true }
   });
   ```

2. Check data being sent from frontend
3. Validate data before sending to database

**Prevention:** Always validate data on both frontend and backend.

---

### Issue: Database Connection Timeout
**Error Message:**
```
MongoServerSelectionError: connect ECONNREFUSED
```

**Root Cause:** MongoDB not running or incorrect connection string.

**Solution:**
1. Verify MongoDB is running
2. Check connection string format
3. Ensure network access (for cloud databases)
4. Add connection options:
   ```javascript
   mongoose.connect(process.env.MONGO_URI, {
       serverSelectionTimeoutMS: 5000,
       socketTimeoutMS: 45000,
   });
   ```

**Prevention:** Always test database connections before starting the application.

---

## 5. Build and Deployment Issues

### Issue: Production Build Fails
**Error Message:**
```
Build failed with errors
```

**Root Cause:** Missing dependencies or configuration issues.

**Solution:**
1. Install all dependencies:
   ```bash
   npm install
   ```

2. Check for missing peer dependencies
3. Verify Node.js version compatibility
4. Clear build cache:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

**Prevention:** Always test builds in clean environments.

---

### Issue: Production Server Won't Start
**Error Message:**
```
Cannot find module './config/database.js'
```

**Root Cause:** File paths not resolving correctly in production.

**Solution:**
1. Use absolute paths with `fileURLToPath`:
   ```javascript
   import { fileURLToPath } from 'url';
   import path from 'path';
   
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   ```

2. Verify file structure in production
3. Check environment variable loading

**Prevention:** Always use proper path resolution for ES modules.

---

## 6. Performance Issues

### Issue: Slow API Responses
**Symptoms:** API calls take several seconds to complete.

**Root Cause:** Inefficient database queries or missing indexes.

**Solution:**
1. Add database indexes:
   ```javascript
   userSchema.index({ email: 1 });
   ```

2. Use `populate()` for related data
3. Implement pagination for large datasets
4. Add caching where appropriate

**Prevention:** Always profile database queries and add necessary indexes.

---

### Issue: Large Bundle Size
**Symptoms:** Frontend takes long to load.

**Root Cause:** Unused dependencies or inefficient imports.

**Solution:**
1. Analyze bundle with Vite build analyzer
2. Remove unused dependencies
3. Use dynamic imports for code splitting
4. Optimize images and assets

**Prevention:** Regularly audit dependencies and monitor bundle size.

---

## 7. Security Issues

### Issue: CORS Errors
**Error Message:**
```
Access to fetch at 'http://localhost:8000/api/users' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Root Cause:** Incorrect CORS configuration.

**Solution:**
1. Verify CORS middleware is enabled:
   ```javascript
   app.use(cors());
   ```

2. Configure CORS options if needed:
   ```javascript
   app.use(cors({
       origin: ['http://localhost:5173', 'https://yourdomain.com'],
       credentials: true
   }));
   ```

**Prevention:** Always enable CORS for cross-origin requests.

---

### Issue: JWT Secret Exposure
**Symptoms:** JWT tokens can be easily forged.

**Root Cause:** Weak or exposed JWT secret.

**Solution:**
1. Use strong, random secrets
2. Never commit secrets to version control
3. Use environment variables for all secrets
4. Rotate secrets regularly

**Prevention:** Always use strong, unique secrets stored in environment variables.

---

## 8. Testing Issues

### Issue: Tests Fail with Import Errors
**Error Message:**
```
Cannot resolve module 'path/to/component'
```

**Root Cause:** Incorrect test configuration or missing setup files.

**Solution:**
1. Configure Jest properly:
   ```json
   {
     "testEnvironment": "jsdom",
     "setupFilesAfterEnv": ["<rootDir>/src/setupTests.js"],
     "moduleNameMapping": {
       "\\.(css|less|scss|sass)$": "identity-obj-proxy"
     }
   }
   ```

2. Create proper test setup files
3. Mock external dependencies

**Prevention:** Always configure testing environment before writing tests.

---

## General Troubleshooting Tips

### 1. Check the Console
- Browser console for frontend errors
- Terminal for backend errors
- Network tab for API call issues

### 2. Verify Dependencies
- Ensure all packages are installed
- Check for version conflicts
- Update outdated packages

### 3. Test Incrementally
- Start with minimal setup
- Add features one at a time
- Test each addition before proceeding

### 4. Use Debugging Tools
- Node.js debugger for backend
- React DevTools for frontend
- MongoDB Compass for database

### 5. Check File Paths
- Verify import/export statements
- Check file naming conventions
- Ensure proper directory structure

---

## Getting Help

If you're still experiencing issues:

1. **Check the logs** - Look for specific error messages
2. **Search online** - Many issues have documented solutions
3. **Review the code** - Compare with working examples
4. **Simplify** - Remove complexity to isolate the problem
5. **Ask for help** - Provide specific error messages and context

Remember: Most issues stem from configuration problems or missing dependencies. Start with the basics and work your way up!

# Practical Exercises for Full-Stack E-commerce Application

## Overview
These exercises will help you understand and implement the key concepts from the full-stack lesson. Each exercise builds upon the previous one, creating a complete working application.

## Exercise 1: Project Setup and Configuration

### 1.1 Create Vite Project
```bash
# Create new Vite project
npm create vite@latest goat-cafe-vite -- --template react
cd goat-cafe-vite

# Install frontend dependencies
npm install

# Install backend dependencies
npm install express cors mongoose bcrypt jsonwebtoken dotenv
npm install --save-dev nodemon concurrently sass
```

### 1.2 Environment Configuration
Create a `.env` file in your root directory:
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
SECRET=your-super-secret-jwt-key-here
PORT=8000
```

### 1.3 Update Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "server": "nodemon server.js",
    "dev:full": "concurrently \"npm run server\" \"npm run dev\"",
    "build": "vite build",
    "start": "NODE_ENV=production node server.js",
    "start:dev": "NODE_ENV=development node server.js"
  }
}
```

**Expected Outcome**: Project structure with all dependencies installed and scripts configured.

---

## Exercise 2: Backend Server Setup

### 2.1 Create Server Entry Point
Create `server.js`:
```javascript
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Then import other modules that need environment variables
import './config/database.js';
import app from './app-server.js';

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log('We in the building on ' + PORT)
})
```

### 2.2 Create Express App Configuration
Create `app-server.js`:
```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import checkToken from './config/checkToken.js';
import ensureLoggedIn from './config/ensureLoggedIn.js';
import userRoutes from './routes/api/users.js';
import itemRoutes from './routes/api/items.js';
import orderRoutes from './routes/api/orders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    res.locals.data = {}
    next()
})

// API Routes - these must come before the static file serving
app.use('/api/users', userRoutes);
app.use('/api/items', checkToken, ensureLoggedIn, itemRoutes);
app.use('/api/orders', checkToken, ensureLoggedIn, orderRoutes);

// Determine which directory to serve static files from
const staticDir = process.env.NODE_ENV === 'production' ? 'dist' : 'public';
const indexPath = process.env.NODE_ENV === 'production' ? 'dist/index.html' : 'index.html';

// Serve static files from the appropriate directory
app.use(express.static(staticDir));

// For React Router - serve index.html for all non-API routes
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve the React app for all other routes
    res.sendFile(path.resolve(path.join(__dirname, indexPath)));
});

export default app;
```

### 2.3 Database Configuration
Create `config/database.js`:
```javascript
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;

db.on('connected', function() {
    console.log(`Connected to MongoDB at ${db.host}:${db.port}`);
});
```

**Expected Outcome**: Backend server starts without errors and connects to MongoDB.

---

## Exercise 3: JWT Authentication Implementation

### 3.1 Create User Model
Create `models/user.js`:
```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, {
    timestamps: true
});

// Instance method - available on user instances
userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

// Static method - available on User model
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email });
};

// Middleware - runs before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

export default mongoose.model('User', userSchema);
```

### 3.2 Create Authentication Middleware
Create `config/checkToken.js`:
```javascript
import jwt from 'jsonwebtoken';

export default (req, res, next) => {
    let token = req.get('Authorization');
    
    if (token) {
        token = token.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.SECRET);
            req.user = decoded.user;
            req.exp = new Date(decoded.exp * 1000);
        } catch (err) {
            req.user = null;
            req.exp = null;
        }
        next();
    } else {
        req.user = null;
        req.exp = null;
        next();
    }
};
```

Create `config/ensureLoggedIn.js`:
```javascript
export default function ensureLoggedIn(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ msg: "Unauthorized You Shall Not Pass" });
    }
    next();
}
```

### 3.3 Create User Controller
Create `controllers/api/users.js`:
```javascript
import User from '../../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const dataController = {
    async signup(req, res, next) {
        try {
            const user = await User.create(req.body);
            const token = createJWT(user);
            res.locals.data.user = user;
            res.locals.data.token = token;
            next();
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async login(req, res, next) {
        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) throw new Error('User not found');
            
            const match = await bcrypt.compare(req.body.password, user.password);
            if (!match) throw new Error('Password mismatch');
            
            const token = createJWT(user);
            res.locals.data.user = user;
            res.locals.data.token = token;
            next();
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

const apiController = {
    auth(req, res) {
        res.json({
            token: res.locals.data.token,
            user: res.locals.data.user
        });
    }
};

function createJWT(user) {
    return jwt.sign(
        { user },
        process.env.SECRET,
        { expiresIn: '24h' }
    );
}

export { dataController, apiController };
```

**Expected Outcome**: User registration and login endpoints work with JWT token generation.

---

## Exercise 4: API Routes and Controllers

### 4.1 Create User Routes
Create `routes/api/users.js`:
```javascript
import express from 'express';
import { dataController, apiController } from '../../controllers/api/users.js';

const router = express.Router();

// POST /api/users/signup
router.post('/signup', dataController.signup, apiController.auth);

// POST /api/users/login
router.post('/login', dataController.login, apiController.auth);

export default router;
```

### 4.2 Create Item Model and Controller
Create `models/item.js`:
```javascript
import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    emoji: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true }
}, {
    timestamps: true
});

// Virtual for formatted price
itemSchema.virtual('formattedPrice').get(function() {
    return `$${this.price.toFixed(2)}`;
});

// Ensure virtuals are included in JSON
itemSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Item', itemSchema);
```

Create `controllers/api/items.js`:
```javascript
import Item from '../../models/item.js';

const dataController = {
    async index(req, res, next) {
        try {
            const items = await Item.find({});
            res.locals.data.items = items;
            next();
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async show(req, res, next) {
        try {
            const item = await Item.findById(req.params.id);
            if (!item) throw new Error('Item not found');
            res.locals.data.item = item;
            next();
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

const apiController = {
    index(req, res) {
        res.json(res.locals.data.items);
    },

    show(req, res) {
        res.json(res.locals.data.item);
    }
};

export { dataController, apiController };
```

Create `routes/api/items.js`:
```javascript
import express from 'express';
import { dataController, apiController } from '../../controllers/api/items.js';

const router = express.Router();

// GET /api/items
router.get('/', dataController.index, apiController.index);

// GET /api/items/:id
router.get('/:id', dataController.show, apiController.show);

export default router;
```

**Expected Outcome**: Protected API endpoints that require authentication to access.

---

## Exercise 5: Frontend Authentication Service

### 5.1 Create API Service Layer
Create `src/utilities/users-api.js`:
```javascript
export async function signUp(userData) {
    const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
        throw new Error('Signup failed');
    }
    
    return response.json();
}

export async function login(credentials) {
    const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
        throw new Error('Login failed');
    }
    
    return response.json();
}
```

### 5.2 Create Authentication Service
Create `src/utilities/users-service.js`:
```javascript
import * as usersAPI from './users-api.js';

export async function signUp(userData) {
    const response = await usersAPI.signUp(userData);
    localStorage.setItem('token', response.token);
    return response.user;
}

export async function login(credentials) {
    const response = await usersAPI.login(credentials);
    localStorage.setItem('token', response.token);
    return response.user;
}

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

export function getUser() {
    const token = getToken();
    if (!token) return null;
    
    try {
        return JSON.parse(atob(token.split('.')[1])).user;
    } catch (error) {
        localStorage.removeItem('token');
        return null;
    }
}

export function logOut() {
    localStorage.removeItem('token');
}
```

**Expected Outcome**: Frontend can authenticate users and store JWT tokens securely.

---

## Exercise 6: Vite Configuration and SCSS Setup

### 6.1 Configure Vite
Update `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // SCSS configuration
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

### 6.2 Create Global SCSS
Create `src/index.scss`:
```scss
// CSS Custom Properties (Variables)
:root {
  --white: ghostwhite;
  --tan-1: #FBF9F6;
  --tan-2: #E7E2DD;
  --tan-3: #E2D9D1;
  --tan-4: #D3C1AE;
  --orange: orangered;
  --text-light: #968c84;
  --text-dark: black;
}

// Global SCSS Variables and Mixins
$primary-color: #3498db;
$secondary-color: #2ecc71;

@mixin button-style($bg-color) {
  background-color: $bg-color;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  
  &:hover {
    background-color: darken($bg-color, 10%);
  }
}

// Global styles
*, *:before, *:after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 2vmin;
  height: 100vh;
  background-color: var(--tan-4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// Utility classes
.btn-primary {
  @include button-style($primary-color);
}

.btn-secondary {
  @include button-style($secondary-color);
}
```

### 6.3 Import Global SCSS
Update `src/main.jsx`:
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Expected Outcome**: Vite serves the frontend with SCSS support and API proxy working.

---

## Exercise 7: React Authentication Components

### 7.1 Create Login Form Component
Create `src/components/LoginForm/LoginForm.jsx`:
```javascript
import { useState } from 'react';
import styles from './LoginForm.module.scss';

export default function LoginForm({ onLogin }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onLogin(formData);
            setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <form onSubmit={handleSubmit} className={styles.loginForm}>
            <h2>Login</h2>
            {error && <p className={styles.error}>{error}</p>}
            
            <div className={styles.formGroup}>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>
            
            <div className={styles.formGroup}>
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
            </div>
            
            <button type="submit" className={styles.submitButton}>
                Login
            </button>
        </form>
    );
}
```

Create `src/components/LoginForm/LoginForm.module.scss`:
```scss
.loginForm {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background-color: var(--white);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  h2 {
    text-align: center;
    color: var(--text-dark);
    margin-bottom: 1.5rem;
  }
  
  .formGroup {
    margin-bottom: 1rem;
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-dark);
      font-weight: 500;
    }
    
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--tan-3);
      border-radius: 4px;
      font-size: 1rem;
      
      &:focus {
        outline: none;
        border-color: var(--orange);
      }
    }
  }
  
  .submitButton {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--orange);
    color: var(--white);
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    
    &:hover {
      background-color: darken(orangered, 10%);
    }
  }
  
  .error {
    color: var(--orange);
    text-align: center;
    margin-bottom: 1rem;
  }
}
```

### 7.2 Update App Component
Update `src/App.jsx`:
```javascript
import { useState, useEffect } from 'react';
import * as usersService from './utilities/users-service.js';
import LoginForm from './components/LoginForm/LoginForm.jsx';
import './App.scss';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const user = usersService.getUser();
    setUser(user);
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const user = await usersService.login(credentials);
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const handleLogOut = () => {
    usersService.logOut();
    setUser(null);
  };

  return (
    <div className="App">
      {user ? (
        <div className="authenticated">
          <h1>Welcome, {user.name}!</h1>
          <button onClick={handleLogOut} className="btn-secondary">
            Log Out
          </button>
        </div>
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
```

**Expected Outcome**: Functional login form with authentication state management.

---

## Exercise 8: Testing the Full Application

### 8.1 Start Both Servers
```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend dev server
npm run dev

# Or run both simultaneously
npm run dev:full
```

### 8.2 Test Authentication Flow
1. **Open Browser**: Navigate to http://localhost:5173
2. **Create Test User**: Use the signup form or create directly in database
3. **Login**: Use credentials to authenticate
4. **Verify State**: Check that user state updates correctly
5. **Test Logout**: Verify logout clears state and token

### 8.3 Test API Endpoints
```bash
# Test user creation
curl -X POST http://localhost:8000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:8000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test protected endpoint (should fail without token)
curl http://localhost:8000/api/items

# Test protected endpoint with token
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8000/api/items
```

**Expected Outcome**: Full authentication flow working with protected routes.

---

## Exercise 9: Add More Features

### 9.1 Create Item Management
- Add CRUD operations for items
- Implement category filtering
- Add search functionality

### 9.2 Create Order System
- Implement shopping cart
- Add order creation and management
- Create order history

### 9.3 Enhance User Experience
- Add form validation
- Implement error boundaries
- Add loading states

---

## Exercise 10: Production Build and Deployment

### 10.1 Build for Production
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### 10.2 Test Production Build
- Verify all routes work correctly
- Check that static files are served properly
- Test authentication in production mode

### 10.3 Environment Configuration
- Set production environment variables
- Configure production database
- Set up proper CORS for production

---

## Troubleshooting Common Issues

### Issue 1: MongoDB Connection Failed
**Symptoms**: `MongooseError: The uri parameter to openUri() must be a string, got "undefined"`
**Solution**: Ensure `.env` file exists and `dotenv.config()` is called before database import.

### Issue 2: JWT Verification Fails
**Symptoms**: 401 "Unauthorized You Shall Not Pass" errors
**Solution**: Verify `checkToken` middleware is included in protected routes and `SECRET` is set.

### Issue 3: SCSS Import Errors
**Symptoms**: `Can't find stylesheet to import`
**Solution**: Remove `additionalData` from Vite config and import SCSS files directly in components.

### Issue 4: CORS Errors
**Symptoms**: Frontend can't call backend API
**Solution**: Verify Vite proxy configuration and CORS middleware setup.

---

## Success Criteria

✅ **Backend**: Express server runs without errors  
✅ **Database**: MongoDB connection established  
✅ **Authentication**: JWT signup/login working  
✅ **Protected Routes**: API endpoints require authentication  
✅ **Frontend**: React app loads and displays correctly  
✅ **SCSS**: Styles compile and apply properly  
✅ **API Proxy**: Frontend can call backend endpoints  
✅ **State Management**: User authentication state persists  

## Next Steps

1. **Add More Models**: Implement items and orders
2. **Enhance UI**: Add more components and styling
3. **Add Testing**: Implement Jest tests for components and API
4. **Performance**: Add caching and optimization
5. **Security**: Implement rate limiting and input validation
6. **Deployment**: Deploy to cloud platform

These exercises provide hands-on experience with all the concepts covered in the lesson. Complete them in order to build a fully functional full-stack application.

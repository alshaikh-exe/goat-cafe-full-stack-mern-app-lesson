# Full-Stack E-commerce API Application with Vite + Express

## Overview
This comprehensive lesson teaches you how to build a full-stack e-commerce application using modern technologies. You'll learn the architecture, implementation, and best practices for creating a production-ready application.

## Table of Contents
1. [Project Setup with Vite](#1-project-setup-with-vite)
2. [Full-Stack Architecture](#2-full-stack-architecture)
3. [Backend Setup](#3-backend-setup)
4. [JWT Authentication](#4-jwt-authentication)
5. [Database Models](#5-database-models)
6. [Controllers](#6-controllers)
7. [API Routes](#7-api-routes)
8. [Frontend Setup](#8-frontend-setup)
9. [State Management](#9-state-management)
10. [SCSS Integration](#10-scss-integration)
11. [Testing](#11-testing)
12. [Production Deployment](#12-production-deployment)

---

## 1. Project Setup with Vite

### Initial Setup
```bash
# Create a new Vite project
npm create vite@latest goat-cafe-vite -- --template react

# Navigate to project directory
cd goat-cafe-vite

# Install dependencies
npm install
```

### Key Vite Features
- **Fast Development**: Hot Module Replacement (HMR)
- **ES Modules**: Native ES6+ module support
- **Build Optimization**: Rollup-based bundling
- **Plugin System**: Extensible architecture

### Project Structure
```
goat-cafe-vite/
├── src/                    # Frontend source code
├── public/                 # Static assets (dev)
├── dist/                   # Built files (production)
├── routes/                 # Express API routes
├── controllers/            # Business logic
├── models/                 # Database models
├── config/                 # Configuration files
├── server.js              # Main server entry point
├── app-server.js          # Express app configuration
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies and scripts
```

---

## 2. Full-Stack Architecture

### Architecture Overview
```
┌─────────────────┐    HTTP/API    ┌─────────────────┐
│   React Frontend │ ◄────────────► │  Express Backend │
│   (Port 5173)   │                │   (Port 8000)   │
└─────────────────┘                └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │   MongoDB       │
                                    │   Database      │
                                    └─────────────────┘
```

### Key Concepts
- **Separation of Concerns**: Frontend and backend are separate applications
- **API-First Design**: Backend exposes RESTful endpoints
- **Stateless Authentication**: JWT tokens for user sessions
- **CRUD Operations**: Full Create, Read, Update, Delete functionality

### Data Flow
1. **User Action** → React component
2. **API Call** → Express backend via proxy
3. **Database Query** → MongoDB via Mongoose
4. **Response** → Frontend state update
5. **UI Update** → React re-render

---

## 3. Backend Setup

### Environment Configuration
Create a `.env` file in your root directory:
```bash
# MongoDB Connection String
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secret Key (use a strong, unique secret)
SECRET=your-super-secret-jwt-key-here

# Server Port
PORT=8000
```

### Server Entry Point (`server.js`)
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

**Critical**: Environment variables must be loaded before any imports that depend on them.

### Express App Configuration (`app-server.js`)
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

### Database Configuration (`config/database.js`)
```javascript
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;

db.on('connected', function() {
    console.log(`Connected to MongoDB at ${db.host}:${db.port}`);
});
```

### Package.json Scripts
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

---

## 4. JWT Authentication

### How JWT Works
1. **User Login/Signup** → Backend validates credentials
2. **Token Generation** → Backend creates JWT with user data
3. **Token Storage** → Frontend stores token in localStorage
4. **API Requests** → Frontend sends token in Authorization header
5. **Token Verification** → Backend middleware validates token
6. **User Access** → Backend provides access to protected resources

### Backend Authentication Flow

#### User Controller (`controllers/api/users.js`)
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

#### Token Verification Middleware (`config/checkToken.js`)
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

#### Authentication Guard (`config/ensureLoggedIn.js`)
```javascript
export default function ensureLoggedIn(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ msg: "Unauthorized You Shall Not Pass" });
    }
    next();
}
```

### Frontend Authentication Service (`src/utilities/users-service.js`)
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

---

## 5. Database Models

### User Model (`models/user.js`)
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

### Item Model (`models/item.js`)
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

### Order Model (`models/order.js`)
```javascript
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
        qty: { type: Number, required: true }
    }],
    isPaid: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Virtual for total price
orderSchema.virtual('total').get(function() {
    return this.items.reduce((sum, item) => sum + (item.item.price * item.qty), 0);
});

// Ensure virtuals are included in JSON
orderSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Order', orderSchema);
```

### Model Benefits
- **Schema Validation**: Ensures data integrity
- **Middleware**: Pre/post save hooks for business logic
- **Virtual Properties**: Computed fields that don't exist in database
- **Static Methods**: Utility functions on the model itself
- **Instance Methods**: Functions available on document instances

---

## 6. Controllers

### Controller Structure
Controllers handle the business logic between routes and models. They:
- Process incoming requests
- Interact with models
- Format responses
- Handle errors

### Items Controller (`controllers/api/items.js`)
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

### Orders Controller (`controllers/api/orders.js`)
```javascript
import Order from '../../models/order.js';

const dataController = {
    async index(req, res, next) {
        try {
            const orders = await Order.find({ user: req.user._id }).populate('items.item');
            res.locals.data.orders = orders;
            next();
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async create(req, res, next) {
        try {
            req.body.user = req.user._id;
            const order = await Order.create(req.body);
            res.locals.data.order = order;
            next();
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

const apiController = {
    index(req, res) {
        res.json(res.locals.data.orders);
    },

    create(req, res) {
        res.json(res.locals.data.order);
    }
};

export { dataController, apiController };
```

### Controller Pattern Benefits
- **Separation of Concerns**: Business logic separate from routing
- **Reusability**: Controllers can be used by multiple routes
- **Testability**: Easy to unit test business logic
- **Maintainability**: Clear structure for complex applications

---

## 7. API Routes

### Route Structure
Routes define the API endpoints and connect them to controllers.

### Users Routes (`routes/api/users.js`)
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

### Items Routes (`routes/api/items.js`)
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

### Orders Routes (`routes/api/orders.js`)
```javascript
import express from 'express';
import { dataController, apiController } from '../../controllers/api/orders.js';

const router = express.Router();

// GET /api/orders
router.get('/', dataController.index, apiController.index);

// POST /api/orders
router.post('/', dataController.create, apiController.create);

export default router;
```

### Route Middleware Chain
```javascript
// Example: POST /api/orders
router.post('/', 
    dataController.create,  // 1. Process request, create order
    apiController.create    // 2. Send response
);

// Protected route example
app.use('/api/orders', 
    checkToken,           // 1. Extract and verify JWT
    ensureLoggedIn,       // 2. Check if user is authenticated
    orderRoutes           // 3. Handle specific order routes
);
```

---

## 8. Frontend Setup

### Vite Configuration (`vite.config.js`)
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

### Key Configuration Points
- **Port 5173**: Frontend development server
- **API Proxy**: Redirects `/api/*` calls to backend
- **SCSS Support**: Built-in preprocessor support
- **Hot Reload**: Instant updates during development

### React Router Setup
```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/orders/new" element={<NewOrderPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
        </Routes>
      </div>
    </Router>
  );
}
```

---

## 9. State Management

### State Types
1. **Local State**: Component-specific data
2. **Global State**: App-wide data (user authentication)
3. **Server State**: Data from API calls

### User Authentication State
```javascript
import { useState, useEffect } from 'react';
import * as usersService from '../utilities/users-service.js';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const user = usersService.getUser();
    setUser(user);
  }, []);

  const handleSignUp = async (userData) => {
    try {
      const user = await usersService.signUp(userData);
      setUser(user);
      // Navigate to protected route
    } catch (error) {
      // Handle error
    }
  };

  const handleLogOut = () => {
    usersService.logOut();
    setUser(null);
  };

  return (
    <div className="App">
      {user ? (
        <AuthenticatedApp user={user} onLogOut={handleLogOut} />
      ) : (
        <UnauthenticatedApp onSignUp={handleSignUp} />
      )}
    </div>
  );
}
```

### API Service Layer
```javascript
// users-api.js
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
```

---

## 10. SCSS Integration

### SCSS Setup
```bash
npm install sass
```

### SCSS File Structure
```
src/
├── index.scss              # Global styles and variables
├── components/
│   ├── Logo/
│   │   ├── Logo.jsx
│   │   └── Logo.module.scss
│   └── MenuList/
│       ├── MenuList.jsx
│       └── MenuList.module.scss
└── pages/
    ├── NewOrderPage/
    │   ├── NewOrderPage.jsx
    │   └── NewOrderPage.module.scss
    └── OrderHistoryPage/
        ├── OrderHistoryPage.jsx
        └── OrderHistoryPage.module.scss
```

### Global SCSS (`src/index.scss`)
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

### Component SCSS Modules
```scss
// Logo.module.scss
.logo {
  font-size: 2rem;
  color: var(--orange);
  text-decoration: none;
  
  &:hover {
    color: darken(orangered, 10%);
  }
}
```

```scss
// NewOrderPage.module.scss
.newOrderPage {
  padding: 2vmin;
  
  .sectionHeading {
    display: flex;
    justify-content: space-around;
    align-items: center;
    background-color: var(--tan-1);
    color: var(--text-dark);
    border: 0.1vmin solid var(--tan-3);
    border-radius: 1vmin;
    padding: 0.6vmin;
    text-align: center;
    font-size: 2vmin;
  }
}
```

### SCSS Benefits
- **Variables**: Consistent colors, spacing, and typography
- **Nesting**: Logical organization of related styles
- **Mixins**: Reusable style patterns
- **Functions**: Dynamic value calculations
- **Modules**: Scoped styles to prevent conflicts

---

## 11. Testing

### Testing Setup
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Jest Configuration
```json
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/src/setupTests.js"],
  "moduleNameMapping": {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  }
}
```

### Component Testing Example
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from '../LoginForm';

test('renders login form', () => {
  render(<LoginForm />);
  
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

test('handles form submission', async () => {
  const mockOnLogin = jest.fn();
  render(<LoginForm onLogin={mockOnLogin} />);
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  });
  
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  
  expect(mockOnLogin).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  });
});
```

### API Testing Example
```javascript
import request from 'supertest';
import app from '../app-server.js';

describe('User API', () => {
  test('POST /api/users/signup creates new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const response = await request(app)
      .post('/api/users/signup')
      .send(userData)
      .expect(200);
    
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(userData.email);
  });
});
```

---

## 12. Production Deployment

### Build Process
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Production Scripts
```json
{
  "scripts": {
    "build": "vite build",
    "start": "NODE_ENV=production node server.js",
    "start:dev": "NODE_ENV=development node server.js"
  }
}
```

### Environment Variables
```bash
# Production .env
NODE_ENV=production
MONGO_URI=your-production-mongodb-uri
SECRET=your-production-secret
PORT=8000
```

### Deployment Options
1. **Single Server**: Frontend and backend on same machine
2. **Separate Servers**: Frontend on CDN, backend on API server
3. **Containerized**: Docker containers for scalability

### Security Considerations
- **HTTPS**: Always use SSL in production
- **Environment Variables**: Never commit secrets to version control
- **CORS**: Configure allowed origins properly
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize all user inputs

---

## Running the Application

### Development Mode
```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend dev server
npm run dev

# Or run both simultaneously
npm run dev:full
```

### Production Mode
```bash
# Build and start
npm run build
npm start
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Database**: MongoDB Atlas (cloud)

---

## Key Takeaways

1. **Architecture Matters**: Clear separation between frontend and backend
2. **Middleware Order**: Critical for authentication and request processing
3. **Environment Variables**: Load before imports that need them
4. **JWT Flow**: Token extraction → verification → user access
5. **SCSS Organization**: Global variables + component modules
6. **Testing Strategy**: Unit tests for components and integration tests for APIs
7. **Production Ready**: Environment-specific configurations and security

This architecture provides a solid foundation for building scalable, maintainable full-stack applications with modern web technologies.

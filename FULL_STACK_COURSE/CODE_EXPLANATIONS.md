# Code Explanations: Models, Controllers, and Config Files

## Overview
This file provides detailed, line-by-line explanations of the backend code structure, explaining what each line does and why it's important. This helps you understand the architecture and make informed decisions when modifying the code.

## Table of Contents
1. [Database Models](#database-models)
2. [Controllers](#controllers)
3. [Configuration Files](#configuration-files)
4. [Middleware](#middleware)
5. [Routes](#routes)

---

## Database Models

### models/user.js

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
```
**Purpose**: Import required dependencies
- `mongoose`: MongoDB ODM for schema definition and database operations
- `bcrypt`: Password hashing library for security

```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, {
  timestamps: true
});
```
**Purpose**: Define the User schema structure
- `name`: User's full name (required string)
- `email`: User's email address (required, must be unique)
- `password`: Hashed password (required string)
- `timestamps: true`: Automatically adds `createdAt` and `updatedAt` fields

```javascript
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
```
**Purpose**: Password hashing middleware
- `pre('save')`: Runs before saving document to database
- `this.isModified('password')`: Only hash if password changed
- `bcrypt.hash(this.password, 10)`: Hash password with salt rounds of 10
- `next()`: Continue to next middleware or save operation

```javascript
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
```
**Purpose**: Instance method for password verification
- `userSchema.methods`: Adds method to all user instances
- `comparePassword`: Method name for comparing passwords
- `bcrypt.compare()`: Safely compare plain text with hashed password

```javascript
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email });
};
```
**Purpose**: Static method for finding users by email
- `userSchema.statics`: Adds method to User model (not instances)
- `this.findOne()`: Mongoose method to find one document
- Useful for login operations

```javascript
export default mongoose.model('User', userSchema);
```
**Purpose**: Export the User model
- `mongoose.model()`: Creates and exports the model
- `'User'`: Model name (becomes collection name in MongoDB)
- `userSchema`: Schema definition for the model

### models/item.js

```javascript
import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  emoji: { type: String, required: true }
}, {
  timestamps: true
});
```
**Purpose**: Define the Item schema structure
- `name`: Item name (required string)
- `price`: Item price (required number)
- `category`: Item category (required string)
- `emoji`: Visual representation (required string)
- `timestamps: true`: Adds creation and update timestamps

```javascript
itemSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});
```
**Purpose**: Virtual property for formatted price display
- `virtual()`: Creates computed property that's not stored in database
- `formattedPrice`: Property name for the virtual
- `get()`: Function that returns the computed value
- `this.price.toFixed(2)`: Format price to 2 decimal places

```javascript
itemSchema.set('toJSON', { virtuals: true });
```
**Purpose**: Include virtual properties when converting to JSON
- `set('toJSON')`: Configure JSON serialization behavior
- `{ virtuals: true }`: Include virtual properties in JSON output
- Ensures `formattedPrice` is available in API responses

```javascript
export default mongoose.model('Item', itemSchema);
```
**Purpose**: Export the Item model
- Creates MongoDB collection named "items"

### models/order.js

```javascript
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    qty: { type: Number, required: true, min: 1 }
  }],
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});
```
**Purpose**: Define the Order schema structure
- `user`: Reference to User model (required)
- `items`: Array of order items with quantity
- `item`: Reference to Item model within each order item
- `qty`: Quantity of item (minimum 1)
- `ref: 'User'/'Item'`: Enables population of referenced documents

```javascript
orderSchema.virtual('total').get(function() {
  return this.items.reduce((sum, item) => {
    return sum + (item.item.price * item.qty);
  }, 0);
});
```
**Purpose**: Virtual property for order total calculation
- `reduce()`: Calculate sum of all item prices × quantities
- `item.item.price`: Access price from populated item reference
- `item.qty`: Quantity of the item

```javascript
orderSchema.virtual('totalQty').get(function() {
  return this.items.reduce((sum, item) => sum + item.qty, 0);
});
```
**Purpose**: Virtual property for total quantity calculation
- Sums up all quantities across all items in the order

```javascript
orderSchema.set('toJSON', { virtuals: true });
```
**Purpose**: Include virtual properties in JSON output
- Makes `total` and `totalQty` available in API responses

---

## Controllers

### controllers/api/users.js

```javascript
import User from '../../models/user.js';
import createJWT from '../../config/createJWT.js';
```
**Purpose**: Import dependencies
- `User`: User model for database operations
- `createJWT`: Function to generate JWT tokens

```javascript
export const signup = async (req, res) => {
  try {
    const user = await User.create(req.body);
    const token = createJWT(user);
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```
**Purpose**: Handle user registration
- `export const signup`: Named export for the signup function
- `async (req, res)`: Express route handler with async/await
- `User.create(req.body)`: Create new user from request body
- `createJWT(user)`: Generate JWT token for the new user
- `res.status(201)`: HTTP 201 Created status
- `{ token, user }`: Return both token and user data
- `catch (error)`: Handle any errors during user creation

```javascript
export const login = async (req, res) => {
  try {
    const user = await User.findByEmail(req.body.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = createJWT(user);
    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```
**Purpose**: Handle user authentication
- `User.findByEmail()`: Find user by email address
- `if (!user)`: Check if user exists
- `user.comparePassword()`: Verify password using instance method
- `return res.status(401)`: Early return for invalid credentials
- Same error message for both email/password to prevent user enumeration

### controllers/api/items.js

```javascript
import Item from '../../models/item.js';

export const index = async (req, res) => {
  try {
    const items = await Item.find({});
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```
**Purpose**: Get all items (menu)
- `Item.find({})`: Find all items (empty filter object)
- `res.json(items)`: Return items as JSON
- `res.status(500)`: Internal server error for database failures

```javascript
export const show = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```
**Purpose**: Get single item by ID
- `req.params.id`: Extract ID from URL parameters
- `Item.findById()`: Find item by MongoDB ObjectId
- `if (!item)`: Check if item exists
- `res.status(404)`: Not found status for missing items

```javascript
export const create = async (req, res) => {
  try {
    const item = await Item.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```
**Purpose**: Create new item
- `Item.create(req.body)`: Create item from request body
- `res.status(201)`: Created status for successful creation

```javascript
export const update = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```
**Purpose**: Update existing item
- `Item.findByIdAndUpdate()`: Find and update in one operation
- `{ new: true }`: Return updated document
- `{ runValidators: true }`: Run schema validation on update

```javascript
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```
**Purpose**: Delete item
- `Item.findByIdAndDelete()`: Find and delete in one operation
- Return success message instead of deleted item

### controllers/api/orders.js

```javascript
import Order from '../../models/order.js';

export const index = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.item')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```
**Purpose**: Get user's order history
- `{ user: req.user._id }`: Filter orders by authenticated user
- `.populate('items.item')`: Replace item IDs with full item objects
- `.sort({ createdAt: -1 })`: Most recent orders first

```javascript
export const show = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.item');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.user.toString() !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```
**Purpose**: Get single order with authorization
- `.populate('items.item')`: Include full item details
- `order.user.toString() !== req.user._id`: Check if user owns the order
- `res.status(403)`: Forbidden status for unauthorized access

```javascript
export const create = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      user: req.user._id
    };
    
    const order = await Order.create(orderData);
    await order.populate('items.item');
    
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```
**Purpose**: Create new order
- `...req.body`: Spread order data from request
- `user: req.user._id`: Add authenticated user to order
- `order.populate('items.item')`: Populate item details after creation

```javascript
export const update = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.user.toString() !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('items.item');
    
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```
**Purpose**: Update existing order with authorization
- Check ownership before allowing update
- Return populated order after update

```javascript
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.user.toString() !== req.user._id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```
**Purpose**: Delete order with authorization
- Verify ownership before deletion
- Return success message

---

## Configuration Files

### config/database.js

```javascript
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
```
**Purpose**: Establish database connection
- `mongoose.connect()`: Connect to MongoDB using connection string
- `process.env.MONGO_URI`: Get connection string from environment variables
- `.then()`: Handle successful connection
- `.catch()`: Handle connection errors

### config/createJWT.js

```javascript
import jwt from 'jsonwebtoken';

const createJWT = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email },
    process.env.SECRET,
    { expiresIn: '24h' }
  );
};

export default createJWT;
```
**Purpose**: Generate JWT tokens
- `jwt.sign()`: Create JWT token
- `{ _id: user._id, email: user.email }`: Token payload (user data)
- `process.env.SECRET`: Secret key for signing tokens
- `{ expiresIn: '24h' }`: Token expires in 24 hours

### config/checkToken.js

```javascript
import jwt from 'jsonwebtoken';

export default function checkToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```
**Purpose**: Verify JWT tokens in requests
- `req.headers.authorization?.split(' ')[1]`: Extract token from "Bearer TOKEN" format
- `jwt.verify()`: Verify token signature and expiration
- `req.user = payload`: Attach user data to request object
- `next()`: Continue to next middleware/route handler

### config/ensureLoggedIn.js

```javascript
export default function ensureLoggedIn(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  next();
}
```
**Purpose**: Ensure user is authenticated
- Check if `req.user` exists (set by checkToken middleware)
- Return 401 if no user data
- Continue if user is authenticated

---

## Middleware

### app-server.js Middleware

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
```
**Purpose**: Import required dependencies
- `express`: Web framework
- `path`: File path utilities
- `fileURLToPath`: Convert ES module URL to file path
- `cors`: Cross-Origin Resource Sharing middleware

```javascript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```
**Purpose**: Get current file and directory paths
- Required for ES modules (no `__dirname` global)
- Used for serving static files

```javascript
const app = express();

app.use(cors());
app.use(express.json());
```
**Purpose**: Configure Express application
- `app.use(cors())`: Enable CORS for frontend-backend communication
- `app.use(express.json())`: Parse JSON request bodies

```javascript
app.use((req, res, next) => {
  res.locals.data = {};
  next();
});
```
**Purpose**: Initialize response locals
- `res.locals.data`: Object for passing data between middleware
- `next()`: Continue to next middleware

```javascript
app.use('/api/users', userRoutes);
app.use('/api/items', checkToken, ensureLoggedIn, itemRoutes);
app.use('/api/orders', checkToken, ensureLoggedIn, orderRoutes);
```
**Purpose**: Mount API routes with middleware
- `/api/users`: Public routes (no authentication required)
- `/api/items` and `/api/orders`: Protected routes
- `checkToken`: Verify JWT token
- `ensureLoggedIn`: Ensure user is authenticated

```javascript
const staticDir = process.env.NODE_ENV === 'production' ? 'dist' : 'public';
const indexPath = process.env.NODE_ENV === 'production' ? 'dist/index.html' : 'index.html';
```
**Purpose**: Determine static file directory based on environment
- `production`: Serve from `dist/` (built files)
- `development`: Serve from `public/` (source files)

```javascript
app.use(express.static(staticDir));
```
**Purpose**: Serve static files
- CSS, JavaScript, images, etc.
- Different directories for dev vs production

```javascript
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.resolve(path.join(__dirname, indexPath)));
});
```
**Purpose**: Catch-all route for React Router
- `*`: Match all routes not handled by API routes
- Check if route starts with `/api/` (return 404 for unknown API endpoints)
- Serve `index.html` for all other routes (enables client-side routing)

---

## Routes

### routes/api/users.js

```javascript
import express from 'express';
import { signup, login } from '../../controllers/api/users.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

export default router;
```
**Purpose**: Define user authentication routes
- `express.Router()`: Create router instance
- `router.post()`: Handle POST requests
- `/signup`: User registration endpoint
- `/login`: User authentication endpoint

### routes/api/items.js

```javascript
import express from 'express';
import { 
  index, 
  show, 
  create, 
  update, 
  deleteItem 
} from '../../controllers/api/items.js';

const router = express.Router();

router.get('/', index);
router.get('/:id', show);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', deleteItem);

export default router;
```
**Purpose**: Define item management routes
- `router.get('/')`: Get all items
- `router.get('/:id')`: Get single item by ID
- `router.post('/')`: Create new item
- `router.put('/:id')`: Update existing item
- `router.delete('/:id')`: Delete item

### routes/api/orders.js

```javascript
import express from 'express';
import { 
  index, 
  show, 
  create, 
  update, 
  deleteOrder 
} from '../../controllers/api/orders.js';

const router = express.Router();

router.get('/', index);
router.get('/:id', show);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', deleteOrder);

export default router;
```
**Purpose**: Define order management routes
- Same RESTful pattern as items
- All routes protected by authentication middleware
- Users can only access their own orders

---

## Key Architectural Patterns

### 1. Separation of Concerns
- **Models**: Data structure and database operations
- **Controllers**: Business logic and request handling
- **Routes**: URL mapping and middleware application
- **Middleware**: Authentication and request processing

### 2. RESTful API Design
- **GET /**: Retrieve multiple resources
- **GET /:id**: Retrieve single resource
- **POST /**: Create new resource
- **PUT /:id**: Update existing resource
- **DELETE /:id**: Remove resource

### 3. Middleware Chain
```
Request → CORS → JSON Parser → Custom Middleware → Route Handler → Response
```

### 4. Error Handling
- Try-catch blocks in all async operations
- Appropriate HTTP status codes
- Consistent error response format
- Error propagation to client

### 5. Security Features
- Password hashing with bcrypt
- JWT token authentication
- Route protection with middleware
- User authorization checks
- Input validation through Mongoose schemas

This architecture provides a clean, maintainable, and secure foundation for the full-stack application. Each component has a single responsibility and communicates through well-defined interfaces.

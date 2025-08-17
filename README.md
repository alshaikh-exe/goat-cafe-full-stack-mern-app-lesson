# 🐐 Goat Cafe - Full-Stack Ecommerce Application

A comprehensive full-stack ecommerce application built with **Vite + React** frontend and **Express + MongoDB** backend. This project demonstrates modern web development practices, full-stack architecture, and real-world application patterns.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or cloud instance)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd goat-cafe-vite

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start both servers
npm run dev:full
```

### Environment Variables
Create a `.env` file in the root directory:
```bash
PORT=8000
MONGO_URI=mongodb://localhost:27017/goat-cafe
SECRET=your-super-secret-key-here
```

## 📚 Learning Resources

This project includes comprehensive learning materials:

- **[FULL_STACK_LESSON.md](./FULL_STACK_LESSON.md)** - Complete lesson plan explaining architecture and concepts
- **[PRACTICAL_EXERCISES.md](./PRACTICAL_EXERCISES.md)** - Step-by-step exercises to build the application
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[SETUP.md](./SETUP.md)** - Quick setup guide

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP/API    ┌─────────────────┐
│   Frontend      │ ◄────────────► │    Backend      │
│   (Vite + React)│                │  (Express +     │
│                 │                │   MongoDB)      │
└─────────────────┘                └─────────────────┘
```

### Frontend (Port 3000)
- **Vite** - Fast build tool and dev server
- **React 19** - Modern React with hooks and context
- **SCSS** - Advanced CSS with variables and mixins
- **CSS Modules** - Scoped styling

### Backend (Port 8000)
- **Express** - Web framework for Node.js
- **MongoDB + Mongoose** - Database and ODM
- **JWT** - Authentication and authorization
- **bcrypt** - Password hashing

## 🎯 Features

### Core Functionality
- ✅ User authentication (login/register)
- ✅ JWT-based session management
- ✅ Product catalog with categories
- ✅ Shopping cart functionality
- ✅ Order management system
- ✅ Responsive design

### Technical Features
- ✅ ES modules throughout
- ✅ API proxy configuration
- ✅ Concurrent development servers
- ✅ SCSS preprocessing
- ✅ CSS modules for styling
- ✅ Error handling and validation

## 📁 Project Structure

```
goat-cafe-vite/
├── src/                    # Frontend source
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page-level components
│   ├── contexts/          # React context providers
│   ├── utilities/          # API calls and helpers
│   └── index.scss         # Global SCSS variables
├── config/                 # Backend configuration
├── controllers/            # Business logic
├── models/                 # Database schemas
├── routes/                 # API endpoints
├── public/                 # Static assets
├── server.js              # Backend entry point
├── app-server.js          # Express app configuration
└── vite.config.js         # Vite configuration
```

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start frontend only
npm run server       # Start backend only
npm run dev:full     # Start both servers concurrently
npm run build        # Build frontend for production
npm run preview      # Preview production build
```

### Development Workflow
1. **Backend First**: Start with API endpoints and database models
2. **Frontend Integration**: Build React components that consume the API
3. **State Management**: Implement authentication and data flow
4. **Styling**: Add SCSS styles and responsive design
5. **Testing**: Add unit and integration tests

## 🔐 Authentication Flow

```
1. User Login → Backend validates credentials
2. Backend creates JWT with user data
3. JWT sent to frontend
4. Frontend stores JWT (localStorage)
5. Frontend sends JWT with each API request
6. Backend verifies JWT and extracts user data
```

## 🎨 Styling with SCSS

### Global Variables
```scss
$primary-color: #3498db;
$secondary-color: #2ecc71;
$text-color: #2c3e50;
$border-radius: 8px;
```

### Mixins
```scss
@mixin button-style($bg-color, $text-color: white) {
  background-color: $bg-color;
  color: $text-color;
  border-radius: $border-radius;
  padding: 12px 24px;
  transition: all 0.3s ease;
}
```

### CSS Modules
```jsx
import styles from './Component.module.scss';

<div className={styles.container}>
  <button className={styles.button}>Click me</button>
</div>
```

## 🧪 Testing

### Backend Testing
```bash
# Install testing dependencies
npm install --save-dev jest supertest

# Run tests
npm test
```

### Frontend Testing
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

## 🚀 Deployment

### Frontend Build
```bash
npm run build
# Serves static files from dist/ directory
```

### Backend Production
```bash
# Set production environment variables
NODE_ENV=production
PORT=8000
MONGO_URI=your-production-mongodb-url
SECRET=your-production-secret

# Start production server
npm run server
```

### Deployment Platforms
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, Railway, DigitalOcean
- **Database**: MongoDB Atlas, AWS DocumentDB

## 🔧 Configuration

### Vite Configuration
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "src/index.scss";`
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
```

### Express Configuration
```javascript
// app-server.js
app.use(cors());                    // Enable CORS
app.use(express.json());            // Parse JSON bodies
app.use(express.static('public'));  // Serve static files

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
```

## 📖 Learning Path

### Beginner Level
1. **Setup**: Follow the practical exercises
2. **Backend**: Understand Express and MongoDB
3. **Frontend**: Learn React with Vite
4. **Integration**: Connect frontend and backend

### Intermediate Level
1. **Authentication**: Implement JWT system
2. **State Management**: Use React Context
3. **Styling**: Master SCSS and CSS modules
4. **Testing**: Add comprehensive tests

### Advanced Level
1. **Performance**: Optimize database queries
2. **Security**: Add input validation and rate limiting
3. **Deployment**: Deploy to production
4. **Monitoring**: Add logging and error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

- **Documentation**: Check the lesson materials above
- **Troubleshooting**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Issues**: Open a GitHub issue for bugs or feature requests

## 🙏 Acknowledgments

- **Vite** team for the amazing build tool
- **Express** team for the web framework
- **MongoDB** team for the database
- **React** team for the frontend library

---

**Happy coding! 🚀**

This project demonstrates real-world full-stack development practices. Use it to learn, experiment, and build your own applications!

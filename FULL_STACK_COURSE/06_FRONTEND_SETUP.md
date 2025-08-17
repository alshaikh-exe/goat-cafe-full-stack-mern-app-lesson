# 06. Frontend Setup with Vite and React

## Overview
This file covers setting up the React frontend with Vite, configuring SCSS support, and setting up the basic application structure.

## Table of Contents
1. [Vite Configuration](#vite-configuration)
2. [React Application Structure](#react-application-structure)
3. [SCSS Integration](#scss-integration)
4. [Component Architecture](#component-architecture)
5. [State Management Setup](#state-management-setup)
6. [Testing Frontend](#testing-frontend)

---

## Vite Configuration

### Update vite.config.js
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
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

### Configuration Explained

#### 1. React Plugin
```javascript
plugins: [react()]
```
**Purpose**: Enables React support with Fast Refresh and JSX transformation

#### 2. SCSS Support
```javascript
css: {
  preprocessorOptions: {
    scss: {
      // SCSS configuration
    }
  }
}
```
**Purpose**: Enables SCSS compilation and preprocessing

#### 3. Development Server
```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

**Port**: Frontend runs on port 5173
**Proxy**: Redirects `/api/*` calls to backend on port 3000
**Change Origin**: Handles CORS for development

---

## React Application Structure

### Directory Layout
```
src/
├── components/           # Reusable UI components
│   ├── Logo/
│   │   ├── Logo.jsx
│   │   └── Logo.module.scss
│   ├── LoginForm/
│   │   ├── LoginForm.jsx
│   │   └── LoginForm.module.scss
│   └── Navigation/
│       ├── Navigation.jsx
│       └── Navigation.module.scss
├── pages/               # Page-level components
│   ├── HomePage/
│   │   ├── HomePage.jsx
│   │   └── HomePage.module.scss
│   ├── NewOrderPage/
│   │   ├── NewOrderPage.jsx
│   │   └── NewOrderPage.module.scss
│   └── OrderHistoryPage/
│       ├── OrderHistoryPage.jsx
│       └── OrderHistoryPage.module.scss
├── utilities/           # Business logic and API calls
│   ├── users-service.js
│   ├── users-api.js
│   ├── items-api.js
│   └── orders-api.js
├── contexts/            # React Context providers
│   └── AuthContext.jsx
├── main.jsx            # Application entry point
├── App.jsx             # Main application component
├── index.scss          # Global styles
└── App.scss            # App-specific styles
```

### Understanding the Structure

#### 1. Components Directory
**Purpose**: Reusable UI pieces that can be used across multiple pages
**Examples**: Buttons, forms, navigation bars, modals

#### 2. Pages Directory
**Purpose**: Full page layouts that compose multiple components
**Examples**: Home page, order creation page, order history page

#### 3. Utilities Directory
**Purpose**: Business logic, API calls, and helper functions
**Examples**: Authentication services, data fetching, form validation

#### 4. Contexts Directory
**Purpose**: Global state management using React Context
**Examples**: User authentication state, shopping cart state

---

## SCSS Integration

### Install SCSS Support
```bash
npm install sass
```

### Create Global SCSS File
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

// Layout utilities
.align-ctr {
  text-align: center;
}

.flex-ctr-ctr {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-col {
  flex-direction: column;
}

.section-heading {
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
```

### Import Global SCSS
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

---

## Component Architecture

### Component Structure
Each component follows this structure:
```
ComponentName/
├── ComponentName.jsx    # React component
├── ComponentName.module.scss  # Component-specific styles
└── index.js            # Export file (optional)
```

### Example Component
Create `src/components/Logo/Logo.jsx`:
```javascript
import styles from './Logo.module.scss';

export default function Logo() {
  return (
    <div className={styles.logo}>
      <h1>🐐 Goat Cafe</h1>
    </div>
  );
}
```

Create `src/components/Logo/Logo.module.scss`:
```scss
.logo {
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 3rem;
    color: var(--orange);
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }
}
```

### CSS Modules Benefits
- **Scoped Styles**: Styles only apply to specific components
- **No Conflicts**: Prevents style collisions between components
- **Dynamic Styling**: Use JavaScript variables in CSS
- **Hot Reload**: Style changes update immediately

---

## State Management Setup

### Create AuthContext
Create `src/contexts/AuthContext.jsx`:
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import * as usersService from '../utilities/users-service.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const user = usersService.getUser();
    setUser(user);
    setLoading(false);
  }, []);

  const signUp = async (userData) => {
    try {
      const user = await usersService.signUp(userData);
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const user = await usersService.login(credentials);
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    usersService.logOut();
    setUser(null);
  };

  const value = {
    user,
    signUp,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Update App Component
Update `src/App.jsx`:
```javascript
import { AuthProvider } from './contexts/AuthContext.jsx';
import AppContent from './AppContent.jsx';
import './App.scss';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
```

Create `src/AppContent.jsx`:
```javascript
import { useAuth } from './contexts/AuthContext.jsx';
import LoginForm from './components/LoginForm/LoginForm.jsx';
import Navigation from './components/Navigation/Navigation.jsx';
import HomePage from './pages/HomePage/HomePage.jsx';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {user ? (
        <>
          <Navigation />
          <HomePage />
        </>
      ) : (
        <LoginForm />
      )}
    </>
  );
}

export default AppContent;
```

---

## Basic Components

### Create LoginForm Component
Create `src/components/LoginForm/LoginForm.jsx`:
```javascript
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './LoginForm.module.scss';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { login, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await login(formData);
      } else {
        await signUp(formData);
      }
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
    <div className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        
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
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
        
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className={styles.toggleButton}
        >
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </button>
      </form>
    </div>
  );
}
```

Create `src/components/LoginForm/LoginForm.module.scss`:
```scss
.loginContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.loginForm {
  max-width: 400px;
  width: 100%;
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
    margin-bottom: 1rem;
    
    &:hover {
      background-color: darken(orangered, 10%);
    }
  }
  
  .toggleButton {
    width: 100%;
    padding: 0.5rem;
    background: none;
    border: 1px solid var(--tan-3);
    border-radius: 4px;
    color: var(--text-light);
    cursor: pointer;
    
    &:hover {
      background-color: var(--tan-1);
    }
  }
  
  .error {
    color: var(--orange);
    text-align: center;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: rgba(255, 69, 0, 0.1);
    border-radius: 4px;
  }
}
```

---

## Testing Frontend

### Start Development Server
```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run dev

# Or run both simultaneously
npm run dev:full
```

### Test Frontend
1. **Open Browser**: Navigate to http://localhost:5173
2. **Check Styling**: Verify SCSS is compiling correctly
3. **Test Components**: Ensure LoginForm displays properly
4. **Check Console**: Look for any JavaScript errors
5. **Test Responsiveness**: Resize browser window

### Expected Results
- ✅ Frontend loads without errors
- ✅ SCSS styles are applied correctly
- ✅ Login form displays with proper styling
- ✅ No console errors
- ✅ Components render correctly

---

## Common Issues and Solutions

### Issue: SCSS Not Compiling
**Problem**: Styles not applying or SCSS errors

**Solutions**:
1. Verify `sass` package is installed
2. Check import statements in components
3. Ensure file extensions are `.scss`
4. Restart development server

### Issue: Proxy Not Working
**Problem**: API calls going to wrong port

**Solutions**:
1. Check Vite proxy configuration
2. Ensure backend is running on port 3000
3. Verify API calls use relative paths (`/api/users`)
4. Check CORS configuration

### Issue: Components Not Rendering
**Problem**: Blank page or component errors

**Solutions**:
1. Check import/export statements
2. Verify component file structure
3. Check for JavaScript syntax errors
4. Ensure React components are properly exported

---

## Next Steps

After completing this setup:

1. **Verify Frontend**: Ensure all components render correctly
2. **Test Styling**: Verify SCSS compilation works
3. **Check Proxy**: Ensure API calls work correctly
4. **Move to Next File**: Continue with [07_UTILITIES_AND_SERVICES.md](07_UTILITIES_AND_SERVICES.md)

## Verification Checklist

- [ ] Vite configuration updated with proxy and SCSS
- [ ] React application structure created
- [ ] Global SCSS file created and imported
- [ ] Component architecture implemented
- [ ] AuthContext created for state management
- [ ] Basic components (Logo, LoginForm) created
- [ ] SCSS modules working correctly
- [ ] Frontend development server starts
- [ ] No console errors
- [ ] Components render with proper styling

Once all items are checked, you're ready to proceed to the next file!

# 07. Utilities and Services Layer

## Overview
This file covers implementing the service layer that handles API calls, business logic, and data management between the frontend and backend.

## Table of Contents
1. [Service Layer Architecture](#service-layer-architecture)
2. [User Authentication Services](#user-authentication-services)
3. [Items API Services](#items-api-services)
4. [Orders API Services](#orders-api-services)
5. [Error Handling](#error-handling)
6. [Testing Services](#testing-services)

---

## Service Layer Architecture

### Understanding the Pattern
The service layer acts as an abstraction between the UI components and the API:

```
UI Components → Service Layer → API Layer → Backend
```

### Benefits of Service Layer
- **Separation of Concerns**: UI logic separate from API logic
- **Reusability**: Services can be used by multiple components
- **Testability**: Easy to mock services for testing
- **Maintainability**: Centralized API logic and error handling

---

## User Authentication Services

### Create src/utilities/users-api.js
```javascript
const BASE_URL = '/api';

export async function signUp(userData) {
    const response = await fetch(`${BASE_URL}/users/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
    }
    
    return response.json();
}

export async function login(credentials) {
    const response = await fetch(`${BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
    }
    
    return response.json();
}
```

### Create src/utilities/users-service.js
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

export function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp < Date.now() / 1000;
    } catch (error) {
        return true;
    }
}
```

### Service Functions Explained

#### 1. API Layer (users-api.js)
**Purpose**: Handle HTTP requests to the backend

**Features**:
- **Base URL**: Centralized API endpoint configuration
- **Error Handling**: Extract error messages from responses
- **Headers**: Set proper content type for JSON requests

#### 2. Service Layer (users-service.js)
**Purpose**: Handle business logic and data persistence

**Functions**:
- **`signUp`**: Create user account and store token
- **`login`**: Authenticate user and store token
- **`getToken`**: Retrieve and validate stored token
- **`getUser`**: Extract user data from token
- **`logOut`**: Clear stored token
- **`isTokenExpired`**: Check if token is still valid

---

## Items API Services

### Create src/utilities/items-api.js
```javascript
const BASE_URL = '/api';

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getAllItems() {
    const response = await fetch(`${BASE_URL}/items`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch items');
    }
    
    return response.json();
}

export async function getItemById(id) {
    const response = await fetch(`${BASE_URL}/items/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch item');
    }
    
    return response.json();
}

export async function createItem(itemData) {
    const response = await fetch(`${BASE_URL}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(itemData)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create item');
    }
    
    return response.json();
}

export async function updateItem(id, itemData) {
    const response = await fetch(`${BASE_URL}/items/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(itemData)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update item');
    }
    
    return response.json();
}

export async function deleteItem(id) {
    const response = await fetch(`${BASE_URL}/items/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete item');
    }
    
    return response.json();
}
```

### Items Service Features

#### 1. Authentication Headers
```javascript
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}
```

**Purpose**: Automatically include JWT token in all requests
**Security**: Ensures all API calls are authenticated

#### 2. CRUD Operations
- **`getAllItems`**: Fetch all available items
- **`getItemById`**: Fetch single item by ID
- **`createItem`**: Create new item
- **`updateItem`**: Modify existing item
- **`deleteItem`**: Remove item

---

## Orders API Services

### Create src/utilities/orders-api.js
```javascript
const BASE_URL = '/api';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

export async function getUserOrders() {
    const response = await fetch(`${BASE_URL}/orders`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
    }
    
    return response.json();
}

export async function getOrderById(id) {
    const response = await fetch(`${BASE_URL}/orders/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch order');
    }
    
    return response.json();
}

export async function createOrder(orderData) {
    const response = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
    }
    
    return response.json();
}

export async function updateOrder(id, orderData) {
    const response = await fetch(`${BASE_URL}/orders/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
    }
    
    return response.json();
}

export async function deleteOrder(id) {
    const response = await fetch(`${BASE_URL}/orders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete order');
    }
    
    return response.json();
}
```

### Orders Service Features

#### 1. User-Specific Data
**All order operations are user-specific**:
- Users can only access their own orders
- Backend validates user ownership
- Frontend automatically includes user token

#### 2. Order Structure
```javascript
// Example order data structure
const orderData = {
    items: [
        {
            item: "item_id_here",
            qty: 2
        }
    ]
};
```

---

## Error Handling

### Centralized Error Handling
```javascript
// Enhanced error handling in API calls
export async function handleApiCall(url, options) {
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to server');
        }
        throw error;
    }
}

// Usage example
export async function getAllItems() {
    return handleApiCall(`${BASE_URL}/items`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
}
```

### Error Types and Handling

#### 1. Network Errors
```javascript
if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new Error('Network error: Unable to connect to server');
}
```

**Causes**: Server down, network issues, CORS problems
**User Experience**: Clear message about connection issues

#### 2. Authentication Errors
```javascript
if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    throw new Error('Session expired. Please login again.');
}
```

**Causes**: Expired tokens, invalid tokens
**User Experience**: Redirect to login page

#### 3. Validation Errors
```javascript
if (response.status === 400) {
    const errorData = await response.json();
    if (errorData.errors) {
        // Handle validation errors
        throw new Error('Please check your input and try again.');
    }
}
```

**Causes**: Invalid data, missing required fields
**User Experience**: Show specific validation messages

---

## Advanced Service Features

### Request Interceptors
```javascript
// Add request interceptor for automatic token refresh
function addRequestInterceptor() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(url, options = {}) {
        // Check if token is about to expire
        const token = localStorage.getItem('token');
        if (token && isTokenExpired(token)) {
            // Token expired, redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
        }
        
        return originalFetch(url, options);
    };
}

// Initialize interceptor
addRequestInterceptor();
```

### Response Caching
```javascript
// Simple cache implementation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedItems() {
    const cacheKey = 'all-items';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    
    const items = await getAllItems();
    cache.set(cacheKey, {
        data: items,
        timestamp: Date.now()
    });
    
    return items;
}
```

### Retry Logic
```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fetch(url, options);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}
```

---

## Testing Services

### Test Authentication Flow
```javascript
// Test user signup
try {
    const user = await signUp({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
    });
    console.log('Signup successful:', user);
} catch (error) {
    console.error('Signup failed:', error.message);
}

// Test user login
try {
    const user = await login({
        email: 'test@example.com',
        password: 'password123'
    });
    console.log('Login successful:', user);
} catch (error) {
    console.error('Login failed:', error.message);
}
```

### Test Protected APIs
```javascript
// Test items API
try {
    const items = await getAllItems();
    console.log('Items fetched:', items);
} catch (error) {
    console.error('Failed to fetch items:', error.message);
}

// Test orders API
try {
    const orders = await getUserOrders();
    console.log('Orders fetched:', orders);
} catch (error) {
    console.error('Failed to fetch orders:', error.message);
}
```

---

## Common Issues and Solutions

### Issue: Token Not Being Sent
**Problem**: API calls return 401 Unauthorized

**Solutions**:
1. Check `getAuthHeaders()` function
2. Verify token is stored in localStorage
3. Ensure token format: `Bearer <token>`
4. Check token expiration

### Issue: CORS Errors
**Problem**: Network errors in browser console

**Solutions**:
1. Verify Vite proxy configuration
2. Check backend CORS settings
3. Ensure frontend and backend ports are correct
4. Test with Postman to isolate frontend issues

### Issue: Error Messages Not Displaying
**Problem**: Generic error messages shown to users

**Solutions**:
1. Check error handling in API calls
2. Verify error response structure from backend
3. Ensure proper error propagation through service layer
4. Test error scenarios manually

---

## Next Steps

After completing this setup:

1. **Test All Services**: Verify API calls work correctly
2. **Test Error Handling**: Ensure proper error messages
3. **Test Authentication**: Verify token management works
4. **Move to Next File**: Continue with [08_COMPONENT_STATE_LOGIC.md](08_COMPONENT_STATE_LOGIC.md)

## Verification Checklist

- [ ] User authentication services implemented
- [ ] Items API services implemented
- [ ] Orders API services implemented
- [ ] Error handling implemented
- [ ] Token management working
- [ ] All CRUD operations tested
- [ ] Authentication headers working
- [ ] Error messages displaying correctly
- [ ] Network error handling implemented
- [ ] Service layer properly abstracted

Once all items are checked, you're ready to proceed to the next file!

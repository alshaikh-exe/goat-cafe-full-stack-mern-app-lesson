# Utility Logic Explanation: Frontend Service Layer

## Overview
This file explains the utility logic that powers the frontend application. The utilities handle API communication, data management, authentication state, and provide a clean interface between React components and the backend services.

## Table of Contents
1. [Service Layer Architecture](#service-layer-architecture)
2. [Authentication Utilities](#authentication-utilities)
3. [API Communication Utilities](#api-communication-utilities)
4. [Data Management Utilities](#data-management-utilities)
5. [Error Handling Patterns](#error-handling-patterns)
6. [State Synchronization](#state-synchronization)

---

## Service Layer Architecture

### Purpose and Benefits
The service layer acts as an abstraction between React components and external APIs, providing:

- **Separation of Concerns**: Components focus on UI, utilities handle data
- **Reusability**: API logic can be shared across multiple components
- **Maintainability**: Centralized place for API changes and business logic
- **Testing**: Easier to mock and test API interactions
- **Error Handling**: Consistent error handling across the application

### Architecture Pattern
```
React Components → Utility Functions → API Calls → Backend
     ↓                ↓              ↓
  UI State      Business Logic   HTTP Requests
  Rendering     Data Processing  Response Handling
```

---

## Authentication Utilities

### users-service.js

#### Token Management Functions

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

**Purpose**: Retrieve and validate stored JWT token
**Logic Flow**:
1. Get token from localStorage
2. If no token exists, return null
3. Decode JWT payload (second part of token)
4. Check if token has expired
5. Remove expired/invalid tokens
6. Return valid token or null

**Key Features**:
- **Automatic Expiration**: Checks token expiration on each access
- **Self-Cleaning**: Removes invalid tokens automatically
- **Error Handling**: Gracefully handles malformed tokens
- **Security**: Prevents use of expired tokens

```javascript
export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}
```

**Purpose**: Store or remove JWT token
**Logic Flow**:
1. If token provided, store in localStorage
2. If no token (null/undefined), remove from localStorage
3. Handles both setting and clearing tokens

```javascript
export function removeToken() {
  localStorage.removeItem('token');
}
```

**Purpose**: Explicitly remove stored token
**Usage**: Called during logout or when clearing authentication

#### User Data Management

```javascript
export function getUser() {
  const token = getToken();
  return token ? JSON.parse(atob(token.split('.')[1])) : null;
}
```

**Purpose**: Extract user information from JWT token
**Logic Flow**:
1. Get valid token using getToken()
2. If token exists, decode payload (second part)
3. Parse JSON payload to get user object
4. Return user object or null

**Key Features**:
- **No Database Calls**: User data comes from token payload
- **Real-time Updates**: Reflects current token state
- **Efficient**: No additional HTTP requests needed

#### Authentication Operations

```javascript
export async function signUp(userData) {
  try {
    const response = await usersApi.signUp(userData);
    if (response.token) {
      setToken(response.token);
      return response.user;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    throw error;
  }
}
```

**Purpose**: Handle user registration process
**Logic Flow**:
1. Call signUp API with user data
2. Check if response contains token
3. Store token if received
4. Return user object for state update
5. Handle errors appropriately

**Key Features**:
- **Token Storage**: Automatically stores received token
- **Error Propagation**: Passes errors up to calling component
- **Data Validation**: Ensures token exists before proceeding

```javascript
export async function login(credentials) {
  try {
    const response = await usersApi.login(credentials);
    if (response.token) {
      setToken(response.token);
      return response.user;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    throw error;
  }
}
```

**Purpose**: Handle user authentication process
**Logic Flow**:
1. Call login API with credentials
2. Verify response contains token
3. Store token for future requests
4. Return user object for state update
5. Handle authentication errors

**Key Features**:
- **Credential Validation**: Backend handles actual validation
- **Token Management**: Automatically manages authentication state
- **User Data**: Returns user object for React state

```javascript
export function logOut() {
  removeToken();
}
```

**Purpose**: Handle user logout
**Logic Flow**:
1. Remove stored token
2. Clear authentication state
3. Component will re-render based on token state

---

## API Communication Utilities

### users-api.js

#### Direct API Communication

```javascript
export async function signUp(userData) {
  const response = await fetch('/api/users/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}
```

**Purpose**: Make HTTP request to user signup endpoint
**Logic Flow**:
1. Create POST request to `/api/users/signup`
2. Set appropriate headers for JSON data
3. Send user data in request body
4. Check response status
5. Parse error messages if request fails
6. Return parsed response data

**Key Features**:
- **Error Handling**: Converts HTTP errors to JavaScript errors
- **Status Checking**: Verifies response success before processing
- **Data Parsing**: Automatically parses JSON responses
- **Error Messages**: Extracts meaningful error messages from backend

```javascript
export async function login(credentials) {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}
```

**Purpose**: Make HTTP request to user login endpoint
**Logic Flow**: Similar to signUp but for authentication
**Key Features**: Same error handling and response processing

### items-api.js

#### Item Management API Calls

```javascript
export async function getAllItems() {
  const token = getToken();
  const response = await fetch('/api/items', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}
```

**Purpose**: Fetch all items with authentication
**Logic Flow**:
1. Get current authentication token
2. Make GET request to `/api/items`
3. Include token in Authorization header
4. Handle response and errors
5. Return parsed items array

**Key Features**:
- **Authentication**: Automatically includes user token
- **Protected Route**: Accesses backend protected endpoint
- **Error Handling**: Consistent with other API utilities

```javascript
export async function getItemById(id) {
  const token = getToken();
  const response = await fetch(`/api/items/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}
```

**Purpose**: Fetch single item by ID
**Logic Flow**: Similar to getAllItems but for specific item
**Key Features**: Dynamic URL construction, same authentication pattern

```javascript
export async function createItem(itemData) {
  const token = getToken();
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(itemData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}
```

**Purpose**: Create new item
**Logic Flow**:
1. Get authentication token
2. Create POST request with item data
3. Include both Content-Type and Authorization headers
4. Send item data in request body
5. Handle response and errors

**Key Features**:
- **Data Creation**: Handles POST requests for new resources
- **Dual Headers**: Sets both content type and authentication
- **Request Body**: Serializes JavaScript objects to JSON

### orders-api.js

#### Order Management API Calls

```javascript
export async function getUserOrders() {
  const token = getToken();
  const response = await fetch('/api/orders', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}
```

**Purpose**: Fetch authenticated user's orders
**Logic Flow**: Similar to getAllItems but for orders
**Key Features**: User-specific data, same authentication pattern

```javascript
export async function createOrder(orderData) {
  const token = getToken();
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}
```

**Purpose**: Create new order
**Logic Flow**: Similar to createItem but for orders
**Key Features**: Order-specific data structure, same authentication pattern

---

## Data Management Utilities

### Custom Hooks

#### useCart Hook

```javascript
export function useCart() {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.item._id === item._id);
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.item._id === item._id
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { item, qty: 1 }];
      }
    });
  }, []);
}
```

**Purpose**: Manage shopping cart state
**Logic Flow**:
1. Check if item already exists in cart
2. If exists, increment quantity
3. If new, add with quantity 1
4. Use functional state update for immutability

**Key Features**:
- **Quantity Management**: Handles duplicate items intelligently
- **Immutable Updates**: Prevents state mutation issues
- **Performance**: Uses useCallback to prevent unnecessary re-renders

```javascript
const removeFromCart = useCallback((itemId) => {
  setCart(prevCart => prevCart.filter(cartItem => cartItem.item._id !== itemId));
}, []);
```

**Purpose**: Remove item from cart
**Logic Flow**: Filter out item with matching ID
**Key Features**: Simple removal, maintains cart integrity

```javascript
const updateQuantity = useCallback((itemId, newQty) => {
  if (newQty <= 0) {
    removeFromCart(itemId);
    return;
  }
  
  setCart(prevCart =>
    prevCart.map(cartItem =>
      cartItem.item._id === itemId
        ? { ...cartItem, qty: newQty }
        : cartItem
    )
  );
}, [removeFromCart]);
```

**Purpose**: Update item quantity in cart
**Logic Flow**:
1. Check if new quantity is valid
2. Remove item if quantity ≤ 0
3. Update quantity if valid
4. Maintain cart structure

**Key Features**:
- **Validation**: Prevents negative quantities
- **Auto-removal**: Removes items when quantity reaches 0
- **Dependency Management**: Properly manages hook dependencies

#### useApi Hook

```javascript
export function useApi(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError('');
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);
}
```

**Purpose**: Generic API state management
**Logic Flow**:
1. Set loading state to true
2. Clear any previous errors
3. Execute API function
4. Store result in data state
5. Set loading to false
6. Handle errors appropriately

**Key Features**:
- **Generic**: Works with any API function
- **State Management**: Handles loading, data, and error states
- **Error Handling**: Catches and stores errors
- **Loading States**: Provides loading indicators for UI

---

## Error Handling Patterns

### Centralized Error Handling

```javascript
// In API utilities
if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || `HTTP ${response.status}`);
}
```

**Purpose**: Convert HTTP errors to JavaScript errors
**Logic Flow**:
1. Check if response indicates error
2. Parse error response from backend
3. Extract error message or use status code
4. Throw JavaScript Error for consistent handling

**Key Features**:
- **Backend Integration**: Uses backend error messages when available
- **Fallback**: Provides HTTP status when no message available
- **Consistency**: All API errors become JavaScript errors

### Component Error Handling

```javascript
// In React components
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  
  try {
    await signUp(formData);
    // Handle success
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**Purpose**: Handle errors in user interactions
**Logic Flow**:
1. Clear previous errors
2. Set loading state
3. Execute async operation
4. Handle success case
5. Catch and display errors
6. Reset loading state

**Key Features**:
- **User Feedback**: Shows errors in UI
- **Loading States**: Prevents multiple submissions
- **Error Clearing**: Removes old errors on new attempts

---

## State Synchronization

### Authentication State

```javascript
// In AuthContext
const login = async (credentials) => {
  try {
    const user = await usersService.login(credentials);
    setUser(user);
    setError('');
  } catch (err) {
    setError(err.message);
    setUser(null);
  }
};
```

**Purpose**: Synchronize authentication state across app
**Logic Flow**:
1. Attempt login operation
2. Update user state on success
3. Clear any previous errors
4. Handle errors by clearing user state

**Key Features**:
- **Global State**: Authentication available throughout app
- **Error Management**: Centralized error handling
- **State Consistency**: User state reflects authentication status

### Data State Management

```javascript
// In components using useApi
const { data: items, loading, error, execute: fetchItems } = useApi(getAllItems);

useEffect(() => {
  fetchItems();
}, [fetchItems]);
```

**Purpose**: Manage API data state in components
**Logic Flow**:
1. Initialize API state with useApi hook
2. Execute API call on component mount
3. Component re-renders based on state changes
4. Loading, data, and error states available for UI

**Key Features**:
- **Automatic Loading**: Handles loading states automatically
- **Data Synchronization**: Keeps component data up-to-date
- **Error Display**: Provides error information for UI

---

## Advanced Utility Features

### Request Interceptors

```javascript
// Example of how to add request interceptors
const createAuthenticatedRequest = (url, options = {}) => {
  const token = getToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
};
```

**Purpose**: Automatically add authentication to requests
**Key Features**:
- **Automatic Auth**: No need to manually add tokens
- **Flexible**: Works with any fetch options
- **Consistent**: Same authentication pattern everywhere

### Response Caching

```javascript
// Example of simple caching utility
const cache = new Map();

const cachedFetch = async (url, options = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  cache.set(cacheKey, data);
  return data;
};
```

**Purpose**: Cache API responses for performance
**Key Features**:
- **Performance**: Reduces duplicate API calls
- **Memory Management**: Stores responses in memory
- **Flexible**: Can be applied to any fetch operation

### Retry Logic

```javascript
// Example of retry utility
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

**Purpose**: Handle temporary network failures
**Key Features**:
- **Resilience**: Automatically retries failed requests
- **Exponential Backoff**: Increases delay between retries
- **Configurable**: Adjustable retry count and timing

---

## Best Practices

### 1. Error Handling
- Always check response status
- Extract meaningful error messages
- Provide fallback error information
- Handle network errors gracefully

### 2. State Management
- Use functional state updates
- Avoid direct state mutation
- Manage loading and error states
- Synchronize state across components

### 3. Performance
- Use useCallback for stable references
- Implement proper dependency arrays
- Consider caching for expensive operations
- Avoid unnecessary re-renders

### 4. Security
- Never store sensitive data in localStorage
- Validate all user inputs
- Handle authentication errors gracefully
- Implement proper token expiration

### 5. Maintainability
- Keep utilities focused and single-purpose
- Use consistent naming conventions
- Document complex logic
- Test utility functions independently

This utility layer provides a robust foundation for the frontend application, handling all the complex logic of API communication, state management, and data processing while keeping React components clean and focused on presentation.

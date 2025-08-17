# 08. Component State Logic and React Hooks

## Overview
This file covers implementing React components with proper state management, using hooks, and connecting components to the service layer.

## Table of Contents
1. [State Management Patterns](#state-management-patterns)
2. [Authentication Components](#authentication-components)
3. [Items Management Components](#items-management-components)
4. [Orders Management Components](#orders-management-components)
5. [Custom Hooks](#custom-hooks)
6. [Testing Components](#testing-components)

---

## State Management Patterns

### Understanding State Types
In React applications, we manage different types of state:

1. **Local State**: Component-specific data (`useState`)
2. **Global State**: App-wide data (`useContext`, `useReducer`)
3. **Server State**: Data from API calls (`useEffect`, custom hooks)

### State Management Strategy
```
Local State → Component-specific data
Global State → User authentication, shopping cart
Server State → API data, loading states
```

---

## Authentication Components

### Enhanced LoginForm Component
Update `src/components/LoginForm/LoginForm.jsx`:
```javascript
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './LoginForm.module.scss';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        // Validate signup data
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        await signUp({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        
        {error && <p className={styles.error}>{error}</p>}
        
        {!isLogin && (
          <div className={styles.formGroup}>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
        )}
        
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
        
        {!isLogin && (
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        )}
        
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
        </button>
        
        <button
          type="button"
          onClick={toggleMode}
          className={styles.toggleButton}
          disabled={loading}
        >
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </button>
      </form>
    </div>
  );
}
```

### State Logic Explained

#### 1. Form State Management
```javascript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});
```

**Purpose**: Store all form input values
**Benefits**: Single state object for all form fields

#### 2. Loading State
```javascript
const [loading, setLoading] = useState(false);
```

**Purpose**: Show loading indicators during API calls
**User Experience**: Prevents multiple submissions and shows progress

#### 3. Error State
```javascript
const [error, setError] = useState('');
```

**Purpose**: Display error messages to users
**User Experience**: Clear feedback on what went wrong

---

## Items Management Components

### Create ItemsList Component
Create `src/components/ItemsList/ItemsList.jsx`:
```javascript
import { useState, useEffect } from 'react';
import { getAllItems } from '../../utilities/items-api.js';
import styles from './ItemsList.module.scss';

export default function ItemsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const itemsData = await getAllItems();
      setItems(itemsData);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const categories = ['all', ...new Set(items.map(item => item.category))];

  if (loading) {
    return <div className={styles.loading}>Loading items...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={fetchItems} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.itemsList}>
      <div className={styles.filters}>
        <label htmlFor="category">Filter by Category:</label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.grid}>
        {filteredItems.map(item => (
          <div key={item._id} className={styles.itemCard}>
            <div className={styles.emoji}>{item.emoji}</div>
            <h3>{item.name}</h3>
            <p className={styles.category}>{item.category}</p>
            <p className={styles.price}>{item.formattedPrice}</p>
            <button 
              className={styles.addButton}
              onClick={() => handleAddToCart(item)}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <p className={styles.noItems}>No items found in this category.</p>
      )}
    </div>
  );
}

function handleAddToCart(item) {
  // This will be implemented in the cart context
  console.log('Adding to cart:', item);
}
```

### ItemsList State Logic

#### 1. Data Fetching
```javascript
useEffect(() => {
  fetchItems();
}, []);
```

**Purpose**: Fetch items when component mounts
**Dependencies**: Empty array means run only once

#### 2. Loading States
```javascript
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
```

**Purpose**: Handle different UI states
**User Experience**: Show appropriate feedback

#### 3. Filtering Logic
```javascript
const filteredItems = selectedCategory === 'all' 
  ? items 
  : items.filter(item => item.category === selectedCategory);
```

**Purpose**: Filter items by category
**Performance**: Computed value, not stored in state

---

## Orders Management Components

### Create NewOrderPage Component
Create `src/pages/NewOrderPage/NewOrderPage.jsx`:
```javascript
import { useState, useEffect } from 'react';
import { getAllItems } from '../../utilities/items-api.js';
import { createOrder } from '../../utilities/orders-api.js';
import { useNavigate } from 'react-router-dom';
import styles from './NewOrderPage.module.scss';

export default function NewOrderPage() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const itemsData = await getAllItems();
      setItems(itemsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
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
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.item._id !== itemId));
  };

  const updateQuantity = (itemId, newQty) => {
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
  };

  const getCartTotal = () => {
    return cart.reduce((total, cartItem) => {
      return total + (cartItem.item.price * cartItem.qty);
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const orderData = {
        items: cart.map(cartItem => ({
          item: cartItem.item._id,
          qty: cartItem.qty
        }))
      };

      await createOrder(orderData);
      navigate('/orders');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading menu...</div>;
  }

  return (
    <div className={styles.newOrderPage}>
      <h1 className={styles.sectionHeading}>Create New Order</h1>
      
      {error && <p className={styles.error}>{error}</p>}
      
      <div className={styles.content}>
        <div className={styles.menuSection}>
          <h2>Menu Items</h2>
          <div className={styles.itemsGrid}>
            {items.map(item => (
              <div key={item._id} className={styles.menuItem}>
                <div className={styles.emoji}>{item.emoji}</div>
                <h3>{item.name}</h3>
                <p className={styles.price}>{item.formattedPrice}</p>
                <button
                  onClick={() => addToCart(item)}
                  className={styles.addButton}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.cartSection}>
          <h2>Your Cart</h2>
          {cart.length === 0 ? (
            <p className={styles.emptyCart}>Your cart is empty</p>
          ) : (
            <>
              <div className={styles.cartItems}>
                {cart.map(cartItem => (
                  <div key={cartItem.item._id} className={styles.cartItem}>
                    <div className={styles.itemInfo}>
                      <span className={styles.emoji}>{cartItem.item.emoji}</span>
                      <span className={styles.name}>{cartItem.item.name}</span>
                    </div>
                    <div className={styles.quantity}>
                      <button
                        onClick={() => updateQuantity(cartItem.item._id, cartItem.qty - 1)}
                        className={styles.qtyButton}
                      >
                        -
                      </button>
                      <span>{cartItem.qty}</span>
                      <button
                        onClick={() => updateQuantity(cartItem.item._id, cartItem.qty + 1)}
                        className={styles.qtyButton}
                      >
                        +
                      </button>
                    </div>
                    <div className={styles.price}>
                      ${(cartItem.item.price * cartItem.qty).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeFromCart(cartItem.item._id)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              
              <div className={styles.cartTotal}>
                <h3>Total: ${getCartTotal().toFixed(2)}</h3>
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className={styles.submitButton}
                >
                  {submitting ? 'Processing...' : 'Submit Order'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

### NewOrderPage State Logic

#### 1. Cart State Management
```javascript
const [cart, setCart] = useState([]);
```

**Purpose**: Store items in shopping cart
**Structure**: Array of objects with `item` and `qty` properties

#### 2. Cart Operations
```javascript
const addToCart = (item) => {
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
};
```

**Logic**: 
- If item exists, increment quantity
- If item doesn't exist, add new item with quantity 1
- Uses functional state updates for immutability

#### 3. Computed Values
```javascript
const getCartTotal = () => {
  return cart.reduce((total, cartItem) => {
    return total + (cartItem.item.price * cartItem.qty);
  }, 0);
};
```

**Purpose**: Calculate total price dynamically
**Performance**: Computed on each render, not stored in state

---

## Custom Hooks

### Create useCart Hook
Create `src/hooks/useCart.js`:
```javascript
import { useState, useCallback } from 'react';

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

  const removeFromCart = useCallback((itemId) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.item._id !== itemId));
  }, []);

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

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, cartItem) => {
      return total + (cartItem.item.price * cartItem.qty);
    }, 0);
  }, [cart]);

  const getCartItemCount = useCallback(() => {
    return cart.reduce((total, cartItem) => total + cartItem.qty, 0);
  }, [cart]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount
  };
}
```

### Create useApi Hook
Create `src/hooks/useApi.js`:
```javascript
import { useState, useCallback } from 'react';

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

  const reset = useCallback(() => {
    setData(null);
    setError('');
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}
```

### Using Custom Hooks
```javascript
// In a component
const { cart, addToCart, getCartTotal } = useCart();
const { data: items, loading, error, execute: fetchItems } = useApi(getAllItems);

useEffect(() => {
  fetchItems();
}, [fetchItems]);
```

---

## Testing Components

### Test State Changes
```javascript
// Test cart functionality
const { result } = renderHook(() => useCart());

act(() => {
  result.current.addToCart({ _id: '1', name: 'Pizza', price: 10 });
});

expect(result.current.cart).toHaveLength(1);
expect(result.current.getCartTotal()).toBe(10);
```

### Test API Integration
```javascript
// Mock API calls
jest.mock('../../utilities/items-api.js');
const mockGetAllItems = getAllItems;

test('fetches items on mount', async () => {
  mockGetAllItems.mockResolvedValue([
    { _id: '1', name: 'Pizza', price: 10 }
  ]);

  render(<ItemsList />);
  
  await waitFor(() => {
    expect(screen.getByText('Pizza')).toBeInTheDocument();
  });
});
```

---

## Common Issues and Solutions

### Issue: State Not Updating
**Problem**: Component not re-rendering after state change

**Solutions**:
1. Use functional state updates for complex state
2. Ensure state updates are immutable
3. Check for unnecessary re-renders with `useMemo` or `useCallback`

### Issue: Infinite Re-renders
**Problem**: Component re-rendering continuously

**Solutions**:
1. Check `useEffect` dependencies
2. Use `useCallback` for functions passed as props
3. Use `useMemo` for expensive calculations

### Issue: State Lost on Navigation
**Problem**: State reset when navigating between pages

**Solutions**:
1. Lift state up to parent component
2. Use React Context for global state
3. Use URL parameters or localStorage for persistence

---

## Next Steps

After completing this setup:

1. **Test Components**: Verify all components work correctly
2. **Test State Logic**: Ensure state updates properly
3. **Test User Interactions**: Verify forms and buttons work
4. **Move to Next File**: Continue with [09_END_TO_END_FLOW.md](09_END_TO_END_FLOW.md)

## Verification Checklist

- [ ] Authentication components implemented with proper state
- [ ] Items management components working
- [ ] Orders management components working
- [ ] Custom hooks created and tested
- [ ] State management patterns implemented
- [ ] Loading and error states handled
- [ ] User interactions working correctly
- [ ] No infinite re-renders
- [ ] State updates working properly
- [ ] Components properly connected to services

Once all items are checked, you're ready to proceed to the next file!

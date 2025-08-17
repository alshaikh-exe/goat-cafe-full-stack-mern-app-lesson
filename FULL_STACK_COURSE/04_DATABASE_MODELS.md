# 04. Database Models and Mongoose Schemas

## Overview
This file covers creating database models for items, orders, and understanding Mongoose schema features like virtuals, middleware, and relationships.

## Table of Contents
1. [Item Model](#item-model)
2. [Order Model](#order-model)
3. [Model Relationships](#model-relationships)
4. [Mongoose Features](#mongoose-features)
5. [Data Validation](#data-validation)
6. [Testing Models](#testing-models)

---

## Item Model

### Create models/item.js
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

### Item Model Features Explained

#### 1. Schema Definition
```javascript
const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    emoji: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true }
}, {
    timestamps: true
});
```

**Field Types**:
- **`name`**: String field for item name
- **`emoji`**: String field for visual representation
- **`category`**: String field for grouping items
- **`price`**: Number field for item cost
- **`timestamps`**: Automatically adds `createdAt` and `updatedAt`

#### 2. Virtual Properties
```javascript
itemSchema.virtual('formattedPrice').get(function() {
    return `$${this.price.toFixed(2)}`;
});
```

**Purpose**: Computed properties that don't exist in the database
**Usage**: `item.formattedPrice` returns `"$9.99"`
**Benefits**: Format data for display without storing duplicate information

#### 3. JSON Configuration
```javascript
itemSchema.set('toJSON', { virtuals: true });
```

**Purpose**: Include virtual properties when converting to JSON
**Result**: `JSON.stringify(item)` includes `formattedPrice`

---

## Order Model

### Create models/order.js
```javascript
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
        qty: { type: Number, required: true, min: 1 }
    }],
    isPaid: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Virtual for total price
orderSchema.virtual('total').get(function() {
    return this.items.reduce((sum, item) => sum + (item.item.price * item.qty), 0);
});

// Virtual for total quantity
orderSchema.virtual('totalQty').get(function() {
    return this.items.reduce((sum, item) => sum + item.qty, 0);
});

// Ensure virtuals are included in JSON
orderSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Order', orderSchema);
```

### Order Model Features Explained

#### 1. Schema Structure
```javascript
const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
        qty: { type: Number, required: true, min: 1 }
    }],
    isPaid: { type: Boolean, default: false }
}, {
    timestamps: true
});
```

**Fields**:
- **`user`**: Reference to User model (who placed the order)
- **`items`**: Array of order items with quantity
- **`isPaid`**: Boolean flag for payment status
- **`timestamps`**: Creation and update timestamps

#### 2. Array of Subdocuments
```javascript
items: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    qty: { type: Number, required: true, min: 1 }
}]
```

**Structure**: Each item in the array has:
- **`item`**: Reference to Item model
- **`qty`**: Quantity with minimum value of 1

#### 3. Virtual Properties
```javascript
// Total price calculation
orderSchema.virtual('total').get(function() {
    return this.items.reduce((sum, item) => sum + (item.item.price * item.qty), 0);
});

// Total quantity calculation
orderSchema.virtual('totalQty').get(function() {
    return this.items.reduce((sum, item) => sum + item.qty, 0);
});
```

**`total`**: Calculates total cost of all items
**`totalQty`**: Calculates total quantity of all items

---

## Model Relationships

### Understanding References
```javascript
// In Order model
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

// In Order items
item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true }
```

**`ObjectId`**: MongoDB's unique identifier type
**`ref`**: Specifies which model this field references
**`required: true`**: Field must be provided

### Populating References
```javascript
// Get order with populated user and items
const order = await Order.findById(orderId)
    .populate('user')
    .populate('items.item');

// Result includes full user and item objects
console.log(order.user.name);        // User's name
console.log(order.items[0].item.name); // First item's name
```

### Relationship Types

#### 1. One-to-Many (User → Orders)
```javascript
// One user can have many orders
// User model doesn't need to reference orders
// Orders reference the user via user field
```

#### 2. Many-to-Many (Orders ↔ Items)
```javascript
// Orders can have multiple items
// Items can be in multiple orders
// Implemented via items array in Order model
```

---

## Mongoose Features

### Instance Methods
```javascript
// Add to itemSchema
itemSchema.methods.getDisplayName = function() {
    return `${this.emoji} ${this.name}`;
};

// Usage
const item = await Item.findById(id);
console.log(item.getDisplayName()); // "🍕 Pepperoni Pizza"
```

### Static Methods
```javascript
// Add to itemSchema
itemSchema.statics.findByCategory = function(category) {
    return this.find({ category: category });
};

// Usage
const pizzas = await Item.findByCategory('pizza');
```

### Middleware (Pre/Post Hooks)
```javascript
// Pre-save middleware
itemSchema.pre('save', function(next) {
    // Convert name to title case
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
    next();
});

// Post-save middleware
itemSchema.post('save', function(doc) {
    console.log(`Item "${doc.name}" was saved`);
});
```

---

## Data Validation

### Schema Validation
```javascript
const itemSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Item name is required'],
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    price: { 
        type: Number, 
        required: true,
        min: [0, 'Price cannot be negative'],
        validate: {
            validator: function(v) {
                return v % 0.01 === 0; // Must be divisible by 0.01
            },
            message: 'Price must have at most 2 decimal places'
        }
    },
    category: {
        type: String,
        enum: {
            values: ['pizza', 'drink', 'dessert', 'appetizer'],
            message: '{VALUE} is not a valid category'
        }
    }
});
```

### Custom Validators
```javascript
// Custom validator function
itemSchema.path('price').validate(function(value) {
    return value >= 0.01; // Minimum price of $0.01
}, 'Price must be at least $0.01');

// Async validator
itemSchema.path('name').validate(async function(value) {
    const existingItem = await this.constructor.findOne({ name: value });
    return !existingItem; // Name must be unique
}, 'Item name already exists');
```

---

## Testing Models

### Create Test Data
```javascript
// Create test items
const testItems = await Item.create([
    {
        name: 'Pepperoni Pizza',
        emoji: '🍕',
        category: 'pizza',
        price: 12.99
    },
    {
        name: 'Coca Cola',
        emoji: '🥤',
        category: 'drink',
        price: 2.99
    }
]);

// Create test order
const testOrder = await Order.create({
    user: userId, // Use actual user ID
    items: [
        { item: testItems[0]._id, qty: 2 },
        { item: testItems[1]._id, qty: 1 }
    ]
});
```

### Test Virtual Properties
```javascript
// Test item virtual
console.log(testItems[0].formattedPrice); // "$12.99"

// Test order virtuals
const populatedOrder = await Order.findById(testOrder._id)
    .populate('items.item');

console.log(populatedOrder.total);    // 28.97 (2 * 12.99 + 1 * 2.99)
console.log(populatedOrder.totalQty); // 3 (2 + 1)
```

### Test Relationships
```javascript
// Test population
const orderWithDetails = await Order.findById(testOrder._id)
    .populate('user')
    .populate('items.item');

console.log(orderWithDetails.user.name);           // User's name
console.log(orderWithDetails.items[0].item.name); // First item's name
```

---

## Advanced Model Features

### Indexes for Performance
```javascript
// Add indexes for frequently queried fields
itemSchema.index({ category: 1 });
itemSchema.index({ price: 1 });
itemSchema.index({ name: 'text' }); // Text search index

// Compound index
orderSchema.index({ user: 1, createdAt: -1 });
```

### Schema Options
```javascript
const itemSchema = new mongoose.Schema({
    // ... field definitions
}, {
    timestamps: true,           // Add createdAt and updatedAt
    toJSON: { virtuals: true }, // Include virtuals in JSON
    toObject: { virtuals: true }, // Include virtuals in objects
    collection: 'menu_items',   // Custom collection name
    strict: false               // Allow fields not in schema
});
```

### Query Helpers
```javascript
// Add query helper methods
itemSchema.query.byCategory = function(category) {
    return this.where({ category: category });
};

itemSchema.query.byPriceRange = function(min, max) {
    return this.where('price').gte(min).lte(max);
};

// Usage
const expensivePizzas = await Item.find()
    .byCategory('pizza')
    .byPriceRange(10, 20);
```

---

## Common Issues and Solutions

### Issue: Virtuals Not Working
**Problem**: Virtual properties not showing in responses

**Solution**: Ensure `toJSON` and `toObject` include virtuals:
```javascript
itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });
```

### Issue: Population Not Working
**Problem**: Referenced fields showing as ObjectIds instead of objects

**Solution**: Use `.populate()` method:
```javascript
const order = await Order.findById(id).populate('user').populate('items.item');
```

### Issue: Validation Errors
**Problem**: Data not saving due to validation failures

**Solution**: Check validation rules and provide valid data:
```javascript
// Check what validation failed
try {
    await Item.create(data);
} catch (error) {
    console.log('Validation errors:', error.errors);
}
```

---

## Next Steps

After completing this setup:

1. **Test Models**: Verify all models work correctly
2. **Test Relationships**: Ensure population works
3. **Test Virtuals**: Check computed properties
4. **Move to Next File**: Continue with [05_CONTROLLERS_AND_ROUTES.md](05_CONTROLLERS_AND_ROUTES.md)

## Verification Checklist

- [ ] Item model created with virtuals
- [ ] Order model created with relationships
- [ ] Virtual properties working correctly
- [ ] Model relationships properly defined
- [ ] Data validation implemented
- [ ] Indexes added for performance
- [ ] Population working correctly
- [ ] Test data created successfully
- [ ] All virtuals displaying properly
- [ ] No validation errors

Once all items are checked, you're ready to proceed to the next file!

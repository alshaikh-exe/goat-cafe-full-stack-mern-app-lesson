import mongoose from 'mongoose';
// Ensure the Category model is processed by Mongoose
import './category.js';

import itemSchema from './itemSchema.js';

export default mongoose.model('Item', itemSchema);
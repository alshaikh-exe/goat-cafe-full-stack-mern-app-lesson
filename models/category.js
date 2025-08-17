import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: { type: String, required: true },
  sortOrder: Number
}, {
  timestamps: true
});

export default mongoose.model('Category', categorySchema);
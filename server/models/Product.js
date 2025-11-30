
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  dailyIncome: { type: Number, required: true },
  days: { type: Number, required: true },
  totalRevenue: { type: Number },
  image: String,
  purchaseLimit: { type: Number, default: 2 },
  createdAt: { type: Date, default: Date.now }
});

// Calculate total revenue automatically before saving
ProductSchema.pre('save', function(next) {
  this.totalRevenue = this.dailyIncome * this.days;
  next();
});

export default mongoose.model('Product', ProductSchema);

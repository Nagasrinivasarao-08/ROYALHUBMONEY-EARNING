
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['recharge', 'withdrawal', 'income', 'investment', 'referral'],
    required: true 
  },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'success', 'failed', 'rejected'],
    default: 'success'
  },
  // CRITICAL FIX: Use Mixed type. This allows ANY structure (Strings, Objects, etc.) to be saved.
  withdrawalDetails: { type: mongoose.Schema.Types.Mixed }
}, { strict: false }); // strict: false allows fields not defined in schema to be saved

const InvestmentSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  purchaseDate: { type: Date, default: Date.now },
  lastClaimDate: { type: Date, default: Date.now },
  claimedAmount: { type: Number, default: 0 },
  productSnapshot: {
    name: String,
    price: Number,
    dailyIncome: Number,
    image: String,
    days: Number
  }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  balance: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  referredBy: { type: String },
  investments: [InvestmentSchema],
  transactions: [TransactionSchema],
  registeredAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);

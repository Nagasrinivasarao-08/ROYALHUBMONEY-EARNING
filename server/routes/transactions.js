
import express from 'express';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// Create Transaction (Recharge/Withdrawal Request)
router.post('/', async (req, res) => {
  const { userId, type, amount, withdrawalDetails } = req.body;
  
  console.log(`[Transaction] Processing ${type} request. Amount: ${amount}, UserId: ${userId}`);
  if (withdrawalDetails) {
      console.log(`[Transaction] Withdrawal Details:`, JSON.stringify(withdrawalDetails));
  }

  // 1. Validate User ID
  if (!userId || typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error(`[Transaction] Invalid UserId received: ${userId} (Type: ${typeof userId})`);
      return res.status(400).json({ message: "Invalid User ID. Please re-login." });
  }

  // 2. Validate Amount
  const valAmount = Number(amount);
  if (isNaN(valAmount) || valAmount <= 0) {
      console.error(`[Transaction] Invalid Amount: ${amount}`);
      return res.status(400).json({ message: "Invalid amount entered." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
        console.error(`[Transaction] User not found in DB: ${userId}`);
        return res.status(404).json({ message: "User account not found." });
    }

    if (type === 'withdrawal') {
        if (valAmount < 200) {
            return res.status(400).json({ message: "Minimum withdrawal amount is ₹200" });
        }
        if (user.balance < valAmount) {
            return res.status(400).json({ message: "Insufficient balance for withdrawal" });
        }
    }

    const newTx = {
        type,
        amount: valAmount,
        status: 'pending',
        date: new Date(),
        withdrawalDetails: withdrawalDetails || undefined
    };

    // Transaction Logic
    if (type === 'withdrawal') {
        user.balance -= valAmount; // Deduct immediately for withdrawal
    }
    // Note: Recharges don't add balance until approved by admin

    user.transactions.push(newTx);
    await user.save();
    
    console.log(`[Transaction] Success: ${type} created for ${user.username}`);
    res.status(200).json(user);
  } catch (err) {
    console.error("[Transaction] DB Error:", err);
    res.status(500).json({ message: "Transaction failed to process", error: err.message });
  }
});

export default router;

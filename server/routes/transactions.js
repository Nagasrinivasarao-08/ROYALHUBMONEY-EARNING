
import express from 'express';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// Create Transaction (Recharge/Withdrawal Request)
router.post('/', async (req, res) => {
  const { userId, type, amount, withdrawalDetails } = req.body;
  
  console.log(`[Transaction] Processing ${type} request. Amount: ${amount}, UserId: ${userId}`);
  
  // 1. Basic Validation
  if (!userId || typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
  }

  // 2. Amount Validation
  const valAmount = Number(amount);
  if (isNaN(valAmount) || valAmount <= 0) {
      return res.status(400).json({ message: "Please enter a valid amount greater than zero." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User account not found." });
    }

    // 3. Business Logic Validation
    if (type === 'withdrawal') {
        if (valAmount < 200) {
            return res.status(400).json({ message: "Minimum withdrawal limit is ₹200." });
        }
        if (user.balance < valAmount) {
            return res.status(400).json({ 
                message: `Insufficient balance. Available: ₹${user.balance.toFixed(2)}` 
            });
        }
    }

    // Prepare robust withdrawal details string (preserves previous fix)
    let detailsString = "";
    if (withdrawalDetails) {
        if (typeof withdrawalDetails === 'object') {
            detailsString = JSON.stringify(withdrawalDetails);
        } else {
            detailsString = String(withdrawalDetails);
        }
    } else if (type === 'withdrawal') {
        detailsString = JSON.stringify({ method: 'unknown', details: 'No details provided' });
    }

    const newTx = {
        type,
        amount: valAmount,
        status: 'pending',
        date: new Date(),
        withdrawalDetails: detailsString
    };

    // Transaction Logic
    if (type === 'withdrawal') {
        user.balance -= valAmount; // Deduct immediately for withdrawal
    }

    user.transactions.push(newTx);
    
    // Explicitly mark modified to ensure persistence
    user.markModified('transactions'); 
    
    await user.save();
    
    console.log(`[Transaction] Success: ${type} created for ${user.username}`);
    res.status(200).json(user);

  } catch (err) {
    console.error("[Transaction] DB Error:", err);
    // Return specific 500 message
    res.status(500).json({ 
        message: "We couldn't process this transaction due to a system error. Please try again later.", 
        technicalError: err.message 
    });
  }
});

export default router;

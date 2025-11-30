
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Create Transaction (Recharge/Withdrawal Request)
router.post('/', async (req, res) => {
  const { userId, type, amount, withdrawalDetails } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json("User not found");

    if (type === 'withdrawal') {
        if (amount < 200) {
            return res.status(400).json("Minimum withdrawal amount is 200");
        }
        if (user.balance < amount) {
            return res.status(400).json("Insufficient balance");
        }
    }

    const newTx = {
        type,
        amount,
        status: 'pending',
        date: new Date(),
        withdrawalDetails: withdrawalDetails || undefined
    };

    if (type === 'withdrawal') {
        user.balance -= amount; // Deduct immediately for withdrawal
    }

    user.transactions.push(newTx);
    await user.save();

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;

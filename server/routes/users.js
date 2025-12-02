
import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Settings from '../models/Settings.js';
import mongoose from 'mongoose';

const router = express.Router();

// Middleware to validate Object IDs
const validateId = (req, res, next) => {
    const id = req.params.id || req.body.userId;
    // CRITICAL FIX: Explicitly check for "undefined" or "null" strings before Mongoose validation
    if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({ message: "Invalid User ID provided (Missing or Undefined)" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid User ID format" });
    }
    next();
};

// Get User Data
router.get('/:id', validateId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({ message: "User not found" });
    
    const { password, ...others } = user._doc;
    const formattedUser = {
        ...others,
        id: user._id.toString(),
        transactions: user.transactions.map(t => ({...t._doc, id: t._id.toString()})),
        investments: user.investments.map(i => ({...i._doc, id: i._id.toString()}))
    };
    
    res.status(200).json(formattedUser);
  } catch (err) {
    console.error("Get User Error:", err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});

// Invest
router.post('/invest', validateId, async (req, res) => {
    const { userId, productId } = req.body;
    
    try {
        const user = await User.findById(userId);
        const product = await Product.findById(productId);
        const settings = await Settings.findOne() || { referralBonusPercentage: 5 };

        if (!user || !product) return res.status(404).json({ message: "User or Product not found" });
        if (user.balance < product.price) return res.status(400).json({ message: "Insufficient balance" });

        // 1. Deduct Balance
        user.balance -= product.price;

        // 2. Add Investment with Snapshot
        const productSnapshot = {
            name: product.name,
            price: product.price,
            dailyIncome: product.dailyIncome,
            image: product.image,
            days: product.days
        };

        user.investments.push({
            productId: product._id,
            purchaseDate: new Date(),
            lastClaimDate: new Date(),
            claimedAmount: 0,
            productSnapshot
        });

        // 3. Add Transaction Record
        user.transactions.push({
            type: 'investment',
            amount: product.price,
            status: 'success',
            date: new Date()
        });

        // 4. Referral Logic (First Investment Only)
        if (user.investments.length === 1 && user.referredBy) {
            const referrer = await User.findOne({ referralCode: user.referredBy });
            if (referrer) {
                const bonusAmount = product.price * (settings.referralBonusPercentage / 100);
                referrer.balance += bonusAmount;
                referrer.transactions.push({
                    type: 'referral',
                    amount: bonusAmount,
                    status: 'success',
                    date: new Date()
                });
                await referrer.save();
            }
        }

        await user.save();
        res.status(200).json({ message: "Investment successful" });

    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// Claim Daily Income
router.post('/claim', validateId, async (req, res) => {
    const { userId } = req.body;
    
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        let totalClaim = 0;
        const now = new Date();
        const CLAIM_INTERVAL = 24 * 60 * 60 * 1000; // 24 Hours

        user.investments.forEach(inv => {
            const lastClaim = new Date(inv.lastClaimDate).getTime();
            if (now.getTime() - lastClaim >= CLAIM_INTERVAL) {
                const income = inv.productSnapshot ? inv.productSnapshot.dailyIncome : 0;
                if (income > 0) {
                    totalClaim += income;
                    inv.lastClaimDate = now;
                    inv.claimedAmount += income;
                }
            }
        });

        if (totalClaim > 0) {
            user.balance += totalClaim;
            user.transactions.push({
                type: 'income',
                amount: totalClaim,
                status: 'success',
                date: now
            });
            await user.save();
            res.status(200).json({ message: "Claim successful", amount: totalClaim });
        } else {
            res.status(400).json({ message: "Nothing to claim yet" });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

export default router;

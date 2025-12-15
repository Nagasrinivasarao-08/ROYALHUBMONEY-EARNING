import express from 'express';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const router = express.Router();

// --- PUBLIC ROUTES (No Auth Required) ---

// Get Settings (Must be accessible for app initialization)
router.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- SECURITY MIDDLEWARE ---
const verifyAdmin = async (req, res, next) => {
    try {
        if (req.method === 'OPTIONS') return next();

        // Frontend sends user ID in 'x-user-id' header
        const requestUserId = req.headers['x-user-id'];
        
        if (!requestUserId || requestUserId === 'undefined' || requestUserId === 'null') {
            return res.status(401).json({ message: "Authentication required" });
        }

        if (!mongoose.Types.ObjectId.isValid(requestUserId)) {
            return res.status(401).json({ message: "Invalid ID format" });
        }

        const user = await User.findById(requestUserId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== 'admin') {
            console.warn(`[Security] Unauthorized Admin access attempt by ${user.email} (${user._id})`);
            return res.status(403).json({ message: "Access Denied: Admin privileges required" });
        }

        // User is admin, proceed
        next();

    } catch (err) {
        console.error("Admin Auth Error:", err);
        return res.status(500).json({ message: "Internal Auth Error" });
    }
};

// APPLY MIDDLEWARE TO ALL ROUTES BELOW
router.use(verifyAdmin);


// --- PROTECTED ROUTES (Admin Only) ---

// Get All Users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().sort({ registeredAt: -1 });
        const formatted = users.map(u => ({
            ...u._doc,
            id: u._id.toString(),
            transactions: u.transactions.map(t => ({...t._doc, id: t._id.toString()})),
            investments: u.investments.map(i => ({...i._doc, id: i._id.toString()}))
        }));
        res.status(200).json(formatted);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Update User
router.put('/users/:id', async (req, res) => {
    try {
        const { balance, password } = req.body;
        const updates = {};
        if (balance !== undefined) updates.balance = balance;
        if (password !== undefined) updates.password = password; 

        await User.findByIdAndUpdate(req.params.id, { $set: updates });
        res.status(200).json("User updated");
    } catch (err) {
        res.status(500).json(err);
    }
});

// Delete User
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");
        if (user.role === 'admin') return res.status(403).json("Cannot delete admin");

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json("User deleted successfully");
    } catch (err) {
        res.status(500).json(err);
    }
});

// Approve/Reject Transaction
router.post('/transaction/:userId/:txId', async (req, res) => {
    const { action } = req.body;
    const { userId, txId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json("Invalid User ID");
    
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json("User not found");

        const tx = user.transactions.id(txId);
        if (!tx) return res.status(404).json("Transaction not found");
        
        if (tx.status !== 'pending') return res.status(400).json("Transaction is not pending");

        if (action === 'approve') {
            tx.status = 'success';
            if (tx.type === 'recharge') {
                user.balance += tx.amount;
            }
        } else if (action === 'reject') {
            tx.status = 'rejected';
            if (tx.type === 'withdrawal') {
                user.balance += tx.amount; // Refund balance
            }
        }

        await user.save();
        res.status(200).json("Transaction updated");

    } catch (err) {
        console.error("Admin Tx Error:", err);
        res.status(500).json(err);
    }
});

// Update Settings (Protected)
router.put('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();
        
        Object.assign(settings, req.body);
        await settings.save();
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Factory Reset
router.post('/reset', async (req, res) => {
    try {
        await User.deleteMany({ role: { $ne: 'admin' } }); 
        await Product.deleteMany({});
        const admins = await User.find({ role: 'admin' });
        for (let admin of admins) {
            admin.balance = 0;
            admin.investments = [];
            admin.transactions = [];
            await admin.save();
        }
        res.status(200).json("System Reset");
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
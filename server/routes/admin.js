import express from 'express';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * SECURITY MIDDLEWARE
 * Verifies that the requester has a valid User ID in headers and that the user is an Admin.
 */
const verifyAdmin = async (req, res, next) => {
    try {
        const requestUserId = req.headers['x-user-id'];
        
        if (!requestUserId || requestUserId === 'undefined' || requestUserId === 'null' || requestUserId === '') {
            return res.status(401).json({ message: "Security Check: Authentication required" });
        }

        if (!mongoose.Types.ObjectId.isValid(requestUserId)) {
            return res.status(401).json({ message: "Security Check: Invalid ID format" });
        }

        const user = await User.findById(requestUserId);
        
        if (!user) {
            return res.status(401).json({ message: "Security Check: Account no longer exists" });
        }

        if (user.role !== 'admin') {
            console.warn(`[Blocked Access] Unauthorized attempt by ${user.email}`);
            return res.status(403).json({ message: "Access Denied: Admin role required" });
        }

        // Passed all checks
        req.adminUser = user;
        next();

    } catch (err) {
        console.error("Admin Auth Logic Error:", err);
        return res.status(500).json({ message: "Internal Security Error" });
    }
};

// --- PUBLIC ROUTES (Accessible without login) ---

// Get System Settings (UPI ID, QR, Fees)
router.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ message: "Failed to load settings" });
    }
});


// --- PROTECTED ROUTES (Require Admin Privileges) ---

// Get All Users List
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find().sort({ registeredAt: -1 });
        const formatted = users.map(u => ({
            ...u._doc,
            id: u._id.toString(),
            transactions: (u.transactions || []).map(t => ({...t._doc, id: t._id.toString()})),
            investments: (u.investments || []).map(i => ({...i._doc, id: i._id.toString()}))
        }));
        res.status(200).json(formatted);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch user list" });
    }
});

// Update User Details (Balance, Password)
router.put('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const { balance, password } = req.body;
        const updates = {};
        if (balance !== undefined) updates.balance = balance;
        if (password !== undefined) updates.password = password; 

        await User.findByIdAndUpdate(req.params.id, { $set: updates });
        res.status(200).json({ message: "User updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Update failed" });
    }
});

// Delete User
router.delete('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.role === 'admin') return res.status(403).json({ message: "Cannot delete administrators" });

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: "Deletion failed" });
    }
});

// Process Transaction (Approve/Reject)
router.post('/transaction/:userId/:txId', verifyAdmin, async (req, res) => {
    const { action } = req.body;
    const { userId, txId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const tx = user.transactions.id(txId);
        if (!tx) return res.status(404).json({ message: "Transaction not found" });
        
        if (tx.status !== 'pending') return res.status(400).json({ message: "Transaction already processed" });

        if (action === 'approve') {
            tx.status = 'success';
            if (tx.type === 'recharge') {
                user.balance += tx.amount;
            }
        } else if (action === 'reject') {
            tx.status = 'rejected';
            if (tx.type === 'withdrawal') {
                user.balance += tx.amount; // Refund
            }
        }

        await user.save();
        res.status(200).json({ message: "Status updated" });
    } catch (err) {
        res.status(500).json({ message: "Transaction processing failed" });
    }
});

// Update Global Settings
router.put('/settings', verifyAdmin, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();
        
        Object.assign(settings, req.body);
        await settings.save();
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ message: "Settings update failed" });
    }
});

// Full System Reset
router.post('/reset', verifyAdmin, async (req, res) => {
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
        res.status(200).json({ message: "System factory reset complete" });
    } catch (err) {
        res.status(500).json({ message: "Reset failed" });
    }
});

export default router;
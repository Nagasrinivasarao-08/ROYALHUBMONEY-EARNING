
import express from 'express';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Product from '../models/Product.js';

const router = express.Router();

// Get All Users (Admin)
router.get('/users', async (req, res) => {
    try {
        // Sort by registration date descending (Newest first)
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

// Update User (Admin)
router.put('/users/:id', async (req, res) => {
    try {
        const { balance, password } = req.body;
        const updates = {};
        if (balance !== undefined) updates.balance = balance;
        if (password !== undefined) updates.password = password; // Should hash in prod

        await User.findByIdAndUpdate(req.params.id, { $set: updates });
        res.status(200).json("User updated");
    } catch (err) {
        res.status(500).json(err);
    }
});

// Approve/Reject Transaction
router.post('/transaction/:userId/:txId', async (req, res) => {
    const { action } = req.body; // 'approve' or 'reject'
    
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json("User not found");

        const tx = user.transactions.id(req.params.txId);
        if (!tx || tx.status !== 'pending') return res.status(400).json("Invalid transaction or not pending");

        if (action === 'approve') {
            tx.status = 'success';
            if (tx.type === 'recharge') {
                user.balance += tx.amount;
            }
            // If withdrawal, balance was already deducted, so just mark success
        } else if (action === 'reject') {
            tx.status = 'rejected';
            if (tx.type === 'withdrawal') {
                user.balance += tx.amount; // Refund balance
            }
        }

        await user.save();
        res.status(200).json("Transaction updated");

    } catch (err) {
        res.status(500).json(err);
    }
});

// Get Settings
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

// Update Settings
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
        await User.deleteMany({ role: { $ne: 'admin' } }); // Keep admins
        await Product.deleteMany({});
        // Reset Admin Data
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

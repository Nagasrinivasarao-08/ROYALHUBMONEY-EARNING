
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, referralCode } = req.body;
    
    // Generate unique referral code for new user
    const newRefCode = username.substring(0, 4).toUpperCase() + Math.floor(Math.random() * 1000);

    // Check if referrer exists
    let referrerId = null;
    if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        if (!referrer) return res.status(400).json("Invalid Referral Code");
        referrerId = referralCode;
    }

    const newUser = new User({
      username,
      email,
      password, // Note: In production, hash this password with bcrypt!
      referralCode: newRefCode,
      referredBy: referrerId
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json("User not found");
    
    if (user.password !== req.body.password) {
        return res.status(400).json("Wrong credentials");
    }

    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;

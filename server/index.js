import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoute from './routes/auth.js';
import productRoute from './routes/products.js';
import userRoute from './routes/users.js';
import txRoute from './routes/transactions.js';
import adminRoute from './routes/admin.js';
import User from './models/User.js';

dotenv.config();

const app = express();

// --- MANUAL CORS MIDDLEWARE ---
// This overrides any library defaults and forces permissive CORS
app.use((req, res, next) => {
    // Allow any origin
    res.header('Access-Control-Allow-Origin', '*');
    
    // Allow standard methods
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    
    // Allow headers that the frontend might send
    // ADDED: 'x-user-id' is required for the new security check
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id');
    
    // Handle Preflight strictly
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Request Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://nagasrinivasaraoeevuri_db_user:Srinivas%409121@cluster0.zpuclhq.mongodb.net/?appName=Cluster0';

mongoose.set('strictQuery', false);

const seedAdmin = async () => {
    try {
        const adminEmail = 'srinivas@gmail.com';
        const exists = await User.findOne({ email: adminEmail });
        if (!exists) {
            const admin = new User({
                username: 'Admin',
                e
                
        error: err.message 
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on port ${PORT}`);
});
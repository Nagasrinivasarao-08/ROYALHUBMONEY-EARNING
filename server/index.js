import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoute from './routes/auth.js';
import productRoute from './routes/products.js';
import userRoute from './routes/users.js';
import txRoute from './routes/transactions.js';
import adminRoute from './routes/admin.js';
import User from './models/User.js';

dotenv.config();

const app = express();

// INCREASED LIMIT: Fixes issues where uploading product images or QR codes failed
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS Configuration - Enhanced for Vercel <-> Render communication
app.use(cors({
    origin: '*', // Allow all origins for public API
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// MongoDB Connection
// Use the provided connection string as default if env is missing
const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://nagasrinivasaraoeevuri_db_user:Srinivas%409121@cluster0.zpuclhq.mongodb.net/?appName=Cluster0';

mongoose.set('strictQuery', false);

const seedAdmin = async () => {
    try {
        const adminEmail = 'srinivas@gmail.com';
        const exists = await User.findOne({ email: adminEmail });
        if (!exists) {
            const admin = new User({
                username: 'Admin',
                email: adminEmail,
                password: 'srinivas@9121', 
                role: 'admin',
                referralCode: 'ADMIN',
                balance: 0
            });
            await admin.save();
            console.log('✅ Default Admin Account Seeded');
            console.log('   Email: srinivas@gmail.com');
            console.log('   Pass:  srinivas@9121');
        } else {
            // Ensure role is admin if it exists
            if (exists.role !== 'admin') {
                exists.role = 'admin';
                await exists.save();
                console.log('✅ Updated permissions for srinivas@gmail.com to Admin');
            }
        }
    } catch (err) {
        console.error('❌ Admin seeding failed:', err);
    }
};

mongoose.connect(MONGO_URL)
  .then((conn) => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      seedAdmin();
  })
  .catch((err) => {
      console.error("❌ MongoDB Connection Error:", err);
  });

// Routes
app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
app.use("/api/users", userRoute);
app.use("/api/transactions", txRoute);
app.use("/api/admin", adminRoute);

// Specific handler for /api to avoid "Cannot GET /api" confusion
app.get('/api', (req, res) => {
    res.status(200).json({ 
        status: "Healthy", 
        message: "Royal Hub API is online and ready.", 
        version: "1.0.0" 
    });
});

app.get('/', (req, res) => {
    res.status(200).json({ status: "Healthy", time: new Date(), message: "Royal Hub API is running" });
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    console.error("Unhandled Server Error:", err.stack);
    
    // Provide a standardized error response
    res.status(500).json({ 
        message: "Internal Server Error", 
        error: "An unexpected error occurred on the server.",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on port ${PORT}`);
  console.log(`📡 Ready to accept connections`);
});
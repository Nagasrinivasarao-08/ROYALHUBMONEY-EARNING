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

// --- CORS MIDDLEWARE ---
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Logging & Body Parsing
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
                email: adminEmail,
                password: 'srinivas@9121', 
                role: 'admin',
                referralCode: 'ADMIN',
                balance: 0
            });
            await admin.save();
            console.log('✅ Default Admin Account Seeded');
        } else if (exists.role !== 'admin') {
            exists.role = 'admin';
            await exists.save();
            console.log('✅ Updated permissions for Admin');
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

// Health Checks
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "OK", timestamp: Date.now() });
});

app.get('/api', (req, res) => {
    res.status(200).json({ 
        status: "Healthy", 
        message: "Royal Hub API is online", 
        version: "1.0.4"
    });
});

app.get('/', (req, res) => {
    res.status(200).json({ status: "Healthy", service: "Royal Hub Backend" });
});

// Global Error Handler - Fixed syntax to prevent identifiers errors
app.use((err, req, res, next) => {
    console.error("Critical Server Error:", err);
    if (res.headersSent) {
        return next(err);
    }
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        message: "Internal Server Error",
        error: err.message || "An unexpected error occurred"
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Royal Hub Backend active on port ${PORT}`);
});
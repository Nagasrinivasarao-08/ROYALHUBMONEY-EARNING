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
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
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
                email: adminEmail,
                password: 'srinivas@9121', 
                role: 'admin',
                referralCode: 'ADMIN',
                balance: 0
            });
            await admin.save();
            console.log('✅ Default Admin Account Seeded');
        } else {
             if (exists.role !== 'admin') {
                exists.role = 'admin';
                await exists.save();
                console.log('✅ Updated permissions for Admin');
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

// Root Health Check
app.get('/api', (req, res) => {
    res.status(200).json({ 
        status: "Healthy", 
        message: "Royal Hub API is online", 
        version: "1.0.2",
        cors: "Manual Middleware"
    });
});

app.get('/', (req, res) => {
    res.status(200).json({ status: "Healthy", service: "Royal Hub Backend" });
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    console.error("Server Error:", err);
    res.status(500).json({ 
        message: "Internal Server Error", 
        error: err.message 
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on port ${PORT}`);
});
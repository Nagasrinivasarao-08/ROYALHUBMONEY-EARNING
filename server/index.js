
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

app.use(express.json({ limit: '50mb' }));

// CORS Configuration: Allow all origins to ensure Frontend (Vercel) can access Backend (Render)
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
                password: 'srinivas@9121', // In production, hash this
                role: 'admin',
                referralCode: 'ADMIN',
                balance: 0
            });
            await admin.save();
            console.log('✅ Default Admin Account Seeded (srinivas@gmail.com)');
        }
    } catch (err) {
        console.error('❌ Admin seeding failed:', err);
    }
};

mongoose.connect(MONGO_URL)
  .then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      seedAdmin();
  })
  .catch((err) => {
      console.error("MongoDB Connection Error:", err);
  });

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
app.use("/api/users", userRoute);
app.use("/api/transactions", txRoute);
app.use("/api/admin", adminRoute);

app.get('/', (req, res) => {
    res.send("Royal Hub API is running. Status: Healthy.");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

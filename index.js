const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const authRoutes = require('./routes/auth');
const jobCardRoutes = require('./routes/jobCards');
const userRoutes = require('./routes/users');
const path = require('path');

const app = express();
app.use(express.json());

// More robust CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5001',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(ao => origin.startsWith(ao))) {
            callback(null, true);
        } else {
            console.log('CORS blocked for origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Serve uploads folder as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root route for health check
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Job Query API is running...' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobcards', jobCardRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/job-query';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const tenantRoutes = require('./routes/tenants');
const roomRoutes = require('./routes/rooms');
const paymentRoutes = require('./routes/payments');
const houseRoutes = require('./routes/houses');
const reportRoutes = require('./routes/reports');
const profileRoutes = require('./routes/profile');
const notificationRoutes = require('./routes/notifications');
const path = require('path');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard'); // 1. Import it

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
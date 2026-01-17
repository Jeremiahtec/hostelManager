const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../core/db');

// REGISTER LANDLORD
router.post('/register', async (req, res) => {
    const { full_name, email, password } = req.body;

    try {
        // 1. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Insert into PostgreSQL
        const result = await db.query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email',
            [full_name, email, hashedPassword, 'landlord']
        );

        res.status(201).json({ 
            message: "Landlord registered successfully", 
            user: result.rows[0] 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Email already registered or Database error" });
    }
});

// LOGIN LANDLORD
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }

        // Create JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // Set token in HTTP-only cookie
        res.cookie('token', token, { 
    httpOnly: true, 
    secure: false, // Must be false for localhost
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 
});

        res.json({ message: "Login successful", role: user.role });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../core/db');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// GET current staff profile
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT full_name, email FROM users WHERE id = $1',
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// PUT update profile details
router.put('/', auth, async (req, res) => {
    const { full_name, email, password } = req.body;
    try {
        if (password) {
            const hashedPw = await bcrypt.hash(password, 10);
            await db.query(
                'UPDATE users SET full_name = $1, email = $2, password_hash = $3 WHERE id = $4',
                [full_name, email, hashedPw, req.user.id]
            );
        } else {
            await db.query(
                'UPDATE users SET full_name = $1, email = $2 WHERE id = $3',
                [full_name, email, req.user.id]
            );
        }
        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

module.exports = router;
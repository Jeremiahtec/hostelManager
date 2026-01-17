const express = require('express');
const router = express.Router();
const db = require('../core/db');
const auth = require('../middleware/auth');

// GET all houses for the logged-in landlord
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM houses WHERE landlord_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

// POST a new house
router.post('/', auth, async (req, res) => {
    const { name, address } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO houses (landlord_id, name, address) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, name, address]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to create house" });
    }

    router.put('/:id', auth, async (req, res) => {
    const { name, address } = req.body;
    try {
        await db.query('UPDATE houses SET name = $1, address = $2 WHERE id = $3', [name, address, req.params.id]);
        res.json({ message: "Updated" });
    } catch (err) { res.status(500).send("Error"); }
});
});

module.exports = router;
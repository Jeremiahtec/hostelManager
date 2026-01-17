const express = require('express');
const router = express.Router();
const db = require('../core/db');
const auth = require('../middleware/auth');

// GET all payments for a landlord
router.get('/', auth, async (req, res) => {
    const result = await db.query(`
        SELECT p.*, t.full_name, r.room_number, h.name as house_name
        FROM payments p
        JOIN leases l ON p.lease_id = l.id
        JOIN tenants t ON l.tenant_id = t.id
        JOIN rooms r ON l.room_id = r.id
        JOIN houses h ON r.house_id = h.id
        WHERE h.landlord_id = $1
        ORDER BY p.payment_date DESC
    `, [req.user.id]);
    res.json(result.rows);
});

// POST a new payment
router.post('/', auth, async (req, res) => {
    const { lease_id, amount, method, reference } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO payments (lease_id, amount_paid, payment_method, reference_no) VALUES ($1, $2, $3, $4) RETURNING *',
            [lease_id, amount, method, reference]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Payment recording failed" });
    }
});

module.exports = router;
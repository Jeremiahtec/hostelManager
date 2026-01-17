const express = require('express');
const router = express.Router();
const db = require('../core/db');
const auth = require('../middleware/auth');

// GET active list
router.get('/active-list', auth, async (req, res) => {
    try {
        const query = `
            SELECT t.full_name, t.phone, r.room_number, h.name as house_name, l.end_date, l.id as lease_id, r.id as room_id
            FROM leases l
            JOIN tenants t ON l.tenant_id = t.id
            JOIN rooms r ON l.room_id = r.id
            JOIN houses h ON r.house_id = h.id
            WHERE l.is_active = TRUE
            ORDER BY l.end_date ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to load directory" });
    }
});

// POST Assign (The "Check-in" heart)
router.post('/assign', auth, async (req, res) => {
    const { full_name, phone, room_id, start_date, end_date } = req.body;
    try {
        await db.query('BEGIN'); // Start transaction

        // 1. Create Tenant
        const tRes = await db.query(
            'INSERT INTO tenants (full_name, phone) VALUES ($1, $2) RETURNING id',
            [full_name, phone]
        );
        const tenantId = tRes.rows[0].id;

        // 2. Create Lease
        await db.query(
            'INSERT INTO leases (room_id, tenant_id, start_date, end_date, is_active) VALUES ($1, $2, $3, $4, TRUE)', 
            [room_id, tenantId, start_date, end_date]
        );

        // 3. Mark Room Occupied (Crucial for the query filter)
        await db.query('UPDATE rooms SET status = $1 WHERE id = $2', ['occupied', room_id]);

        await db.query('COMMIT'); // Save everything
        res.status(201).json({ message: "Success" });
    } catch (err) {
        await db.query('ROLLBACK'); // Undo everything if something failed
        console.error(err);
        res.status(500).json({ error: "Database error during check-in" });
    }
});

// (Ensure /history and /checkout routes are also present here...)

module.exports = router;
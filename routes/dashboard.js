const express = require('express');
const router = express.Router();
const db = require('../core/db');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
    try {
        const landlordId = req.user.id;

        // 1. Basic Counts
        const houses = await db.query('SELECT COUNT(*) FROM houses WHERE landlord_id = $1', [landlordId]);
        const rooms = await db.query('SELECT COUNT(*) FROM rooms JOIN houses ON rooms.house_id = houses.id WHERE houses.landlord_id = $1', [landlordId]);
        const vacant = await db.query('SELECT COUNT(*) FROM rooms JOIN houses ON rooms.house_id = houses.id WHERE houses.landlord_id = $1 AND status = $2', [landlordId, 'vacant']);

        // 2. Financials: Total Revenue this month
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const revenue = await db.query(`
            SELECT SUM(amount_paid) FROM payments p
            JOIN leases l ON p.lease_id = l.id
            JOIN rooms r ON l.room_id = r.id
            JOIN houses h ON r.house_id = h.id
            WHERE h.landlord_id = $1 
            AND EXTRACT(MONTH FROM p.payment_date) = $2
            AND EXTRACT(YEAR FROM p.payment_date) = $3
        `, [landlordId, currentMonth, currentYear]);

        res.json({
            totalHouses: houses.rows[0].count,
            totalRooms: rooms.rows[0].count,
            vacantRooms: vacant.rows[0].count,
            occupiedRooms: parseInt(rooms.rows[0].count) - parseInt(vacant.rows[0].count),
            monthlyRevenue: revenue.rows[0].sum || 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Dashboard calculation failed" });
    }

    // 3. Get Expiry Warnings (Leases ending in next 30 days)
const expiringSoon = await db.query(`
    SELECT t.full_name, r.room_number, l.end_date
    FROM leases l
    JOIN tenants t ON l.tenant_id = t.id
    JOIN rooms r ON l.room_id = r.id
    JOIN houses h ON r.house_id = h.id
    WHERE h.landlord_id = $1 
    AND l.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
    AND l.is_active = TRUE
`, [landlordId]);

// Add 'expiringLeases: expiringSoon.rows' to your res.json output
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../core/db');
const auth = require('../middleware/auth');

router.get('/monthly-summary', auth, async (req, res) => {
    try {
        const landlordId = req.user.id;
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();

        // 1. Potential Revenue (Rent from occupied rooms)
        const expected = await db.query(`
            SELECT SUM(r.base_rent) as total_expected
            FROM rooms r
            JOIN houses h ON r.house_id = h.id
            WHERE h.landlord_id = $1 AND r.status = 'occupied'
        `, [landlordId]);

        // 2. Collected Revenue (Payments made this month)
        const collected = await db.query(`
            SELECT SUM(p.amount_paid) as total_collected
            FROM payments p
            JOIN leases l ON p.lease_id = l.id
            JOIN rooms r ON l.room_id = r.id
            JOIN houses h ON r.house_id = h.id
            WHERE h.landlord_id = $1 
            AND EXTRACT(MONTH FROM p.payment_date) = $2
            AND EXTRACT(YEAR FROM p.payment_date) = $3
        `, [landlordId, month, year]);

        // 3. Defaulters List (Occupants with 0 payments this month)
        const defaulters = await db.query(`
            SELECT t.full_name, r.room_number, h.name as house_name, r.base_rent
            FROM leases l
            JOIN tenants t ON l.tenant_id = t.id
            JOIN rooms r ON l.room_id = r.id
            JOIN houses h ON r.house_id = h.id
            WHERE h.landlord_id = $1 
            AND l.is_active = TRUE
            AND l.id NOT IN (
                SELECT lease_id FROM payments 
                WHERE EXTRACT(MONTH FROM payment_date) = $2
                AND EXTRACT(YEAR FROM payment_date) = $3
            )
        `, [landlordId, month, year]);

        res.json({
            expected: expected.rows[0].total_expected || 0,
            collected: collected.rows[0].total_collected || 0,
            defaulters: defaulters.rows,
            monthName: new Date().toLocaleString('default', { month: 'long' })
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Report generation failed" });
    }
});

module.exports = router;
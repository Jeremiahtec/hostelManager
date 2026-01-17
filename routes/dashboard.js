const express = require('express');
const router = express.Router();
const db = require('../core/db');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
    try {
        const landlordId = req.user.id;

        // Query to get totals
        const houses = await db.query('SELECT COUNT(*) FROM houses WHERE landlord_id = $1', [landlordId]);
        const rooms = await db.query('SELECT COUNT(*) FROM rooms JOIN houses ON rooms.house_id = houses.id WHERE houses.landlord_id = $1', [landlordId]);
        const vacant = await db.query('SELECT COUNT(*) FROM rooms JOIN houses ON rooms.house_id = houses.id WHERE houses.landlord_id = $1 AND status = $2', [landlordId, 'vacant']);

        res.json({
            totalHouses: houses.rows[0].count,
            totalRooms: rooms.rows[0].count,
            vacantRooms: vacant.rows[0].count,
            occupiedRooms: parseInt(rooms.rows[0].count) - parseInt(vacant.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
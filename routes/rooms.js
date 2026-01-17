const express = require('express');
const router = express.Router();
const db = require('../core/db');
const auth = require('../middleware/auth');

// GET all rooms for a specific house
router.get('/:houseId', auth, async (req, res) => {
    try {
        const { houseId } = req.params;
        const result = await db.query(
            'SELECT * FROM rooms WHERE house_id = $1 ORDER BY room_number ASC',
            [houseId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

// POST a new room to a house
router.post('/', auth, async (req, res) => {
    const { house_id, room_number, room_type, base_rent } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO rooms (house_id, room_number, room_type, base_rent, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [house_id, room_number, room_type, base_rent, 'vacant']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create room" });
    }
});

// UPDATE room details
router.put('/:id', auth, async (req, res) => {
    const { room_number, room_type, base_rent } = req.body;
    try {
        await db.query(
            'UPDATE rooms SET room_number = $1, room_type = $2, base_rent = $3 WHERE id = $4',
            [room_number, room_type, base_rent, req.params.id]
        );
        res.json({ message: "Room updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

// DELETE a room
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if room has any active leases before deleting
        const check = await db.query('SELECT * FROM rooms WHERE id = $1 AND status = $2', [req.params.id, 'vacant']);
        if (check.rows.length === 0) {
            return res.status(400).json({ error: "Cannot delete an occupied room" });
        }
        
        await db.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
        res.json({ message: "Room deleted" });
    } catch (err) {
        res.status(500).json({ error: "Delete failed (Room may have history)" });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../core/db');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Initialize Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// SAFE INITIALIZATION: Prevent crash if SID is missing
let smsClient;
if (process.env.TWILIO_SID && process.env.TWILIO_SID.startsWith('AC')) {
    smsClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
    console.warn("⚠️ Twilio SID missing or invalid. SMS features will be disabled.");
}

router.post('/send-reminders', auth, async (req, res) => {
    try {
        const query = `
            SELECT t.full_name, t.phone, t.email, r.room_number, h.name as house_name, l.end_date
            FROM leases l
            JOIN tenants t ON l.tenant_id = t.id
            JOIN rooms r ON l.room_id = r.id
            JOIN houses h ON r.house_id = h.id
            WHERE l.is_active = TRUE 
            AND l.end_date = CURRENT_DATE + INTERVAL '3 days'
        `;
        const occupants = await db.query(query);

        for (const occupant of occupants.rows) {
            const message = `Hello ${occupant.full_name}, your lease for Room ${occupant.room_number} at ${occupant.house_name} expires on ${new Date(occupant.end_date).toLocaleDateString()}. Please contact the office for renewal.`;

            // Only try to send SMS if the client was initialized
            if (smsClient && occupant.phone) {
                await smsClient.messages.create({
                    body: message,
                    to: occupant.phone,
                    from: process.env.TWILIO_PHONE
                });
            }

            // Email remains active
            if (occupant.email) {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: occupant.email,
                    subject: 'Lease Expiration Reminder',
                    text: message
                });
            }
        }

        res.json({ message: `Sent to ${occupants.rows.length} occupants.` });
    } catch (err) {
        console.error("Notification Error:", err);
        res.status(500).json({ error: "Reminder broadcast failed." });
    }
});

module.exports = router;
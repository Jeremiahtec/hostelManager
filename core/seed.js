const db = require('./db');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        console.log("⏳ Clearing old data...");
        await db.query('TRUNCATE TABLE payments, leases, tenants, rooms, houses, users RESTART IDENTITY CASCADE');

        console.log("🌱 Starting Full Database Seeding...");

        // 1. Create a Staff Account
        const hashedPw = await bcrypt.hash('password123', 10);
        const userRes = await db.query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
            ['Admin Staff', 'test@virtulease.com', hashedPw, 'landlord']
        );
        const userId = userRes.rows[0].id;

        // 2. Create Houses
        const houseRes = await db.query(
            "INSERT INTO houses (landlord_id, name, address) VALUES ($1, 'Emerald Office Complex', '12 Business District, Ogbomoso') RETURNING id",
            [userId]
        );
        const houseId = houseRes.rows[0].id;

        // 3. Create Rooms
        const roomData = [
            { no: 'A101', type: 'Executive Suite', rent: 500000 },
            { no: 'A102', type: 'Single Room', rent: 150000 },
            { no: 'A103', type: 'Self-Contain', rent: 250000 }
        ];

        const roomIds = [];
        for (const r of roomData) {
            const res = await db.query(
                'INSERT INTO rooms (house_id, room_number, room_type, base_rent, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [houseId, r.no, r.type, r.rent, 'vacant']
            );
            roomIds.push(res.rows[0].id); // Corrected to res.rows[0].id
        }

        // 4. Create Tenants & Active Leases
        const tenants = [
            { name: 'Aderinto Fredrick', phone: '08011122233', roomIdx: 0 },
            { name: 'Soji Adesoji', phone: '08044455566', roomIdx: 1 }
        ];

        for (const t of tenants) {
            // Create Tenant
            const tRes = await db.query(
                'INSERT INTO tenants (full_name, phone) VALUES ($1, $2) RETURNING id',
                [t.name, t.phone]
            );
            const tenantId = tRes.rows[0].id;
            const roomId = roomIds[t.roomIdx];

            // Create Lease
            const leaseRes = await db.query(
                "INSERT INTO leases (room_id, tenant_id, start_date, end_date, is_active) VALUES ($1, $2, '2026-01-01', '2027-01-01', TRUE) RETURNING id",
                [roomId, tenantId]
            );
            const currentLeaseId = leaseRes.rows[0].id; // Defined correctly here

            // Mark Room as Occupied
            await db.query('UPDATE rooms SET status = $1 WHERE id = $2', ['occupied', roomId]);

            // 5. Create Payments for these leases
            await db.query(
                'INSERT INTO payments (lease_id, amount_paid, payment_method, reference_no) VALUES ($1, $2, $3, $4)',
                [currentLeaseId, 100000, 'Bank Transfer', 'SEED-REF-' + Math.random().toString(36).substr(2, 9)]
            );
        }

        console.log("✅ Seeding Complete!");
        console.log("Staff: test@virtulease.com / password123");
        process.exit();
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
};

seedDatabase();
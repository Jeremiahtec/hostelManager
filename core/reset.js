const db = require('./db');

const resetDatabase = async () => {
    try {
        console.log("⏳ Resetting VirtuLease Database...");
        await db.query(`
            TRUNCATE TABLE payments, leases, tenants, rooms, houses, users 
            RESTART IDENTITY CASCADE;
        `);
        console.log("✅ Database cleared. All counters reset to 1.");
        process.exit();
    } catch (err) {
        console.error("❌ Reset failed:", err);
        process.exit(1);
    }
};

resetDatabase();

// command is: node core/reset.js
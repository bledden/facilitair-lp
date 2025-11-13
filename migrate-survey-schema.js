/**
 * Migration script to add new columns to user_surveys table
 * Run this before deploying the new survey
 */

const Database = require('better-sqlite3');
const db = new Database('facilitair-emails.db');

console.log('Starting survey schema migration...');

try {
    // Check if table exists
    const tableExists = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='user_surveys'
    `).get();

    if (!tableExists) {
        console.log('Creating user_surveys table...');
        db.prepare(`
            CREATE TABLE user_surveys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subscriber_id INTEGER NOT NULL,
                planned_use TEXT NOT NULL,
                anticipated_usage TEXT NOT NULL,
                task_types TEXT,
                domains TEXT,
                how_found TEXT NOT NULL,
                role TEXT,
                current_services TEXT,
                pain_points TEXT,
                value_props TEXT,
                byok TEXT,
                additional_info TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
            )
        `).run();
        console.log('✓ Created user_surveys table');
    } else {
        // Table exists, check if new columns exist
        const columns = db.prepare("PRAGMA table_info(user_surveys)").all();
        const columnNames = columns.map(c => c.name);

        const newColumns = [
            { name: 'task_types', type: 'TEXT' },
            { name: 'domains', type: 'TEXT' },
            { name: 'role', type: 'TEXT' },
            { name: 'current_services', type: 'TEXT' },
            { name: 'pain_points', type: 'TEXT' },
            { name: 'value_props', type: 'TEXT' },
            { name: 'byok', type: 'TEXT' }
        ];

        for (const col of newColumns) {
            if (!columnNames.includes(col.name)) {
                console.log(`Adding column: ${col.name}`);
                db.prepare(`ALTER TABLE user_surveys ADD COLUMN ${col.name} ${col.type}`).run();
                console.log(`✓ Added ${col.name}`);
            } else {
                console.log(`✓ Column ${col.name} already exists`);
            }
        }

        // Rename background column if it exists (we replaced it with role)
        if (columnNames.includes('background') && !columnNames.includes('role')) {
            console.log('Note: background column exists but role column added separately');
            console.log('You may want to migrate data from background to role if needed');
        }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew survey fields:');
    console.log('  - task_types (JSON array)');
    console.log('  - domains (JSON array)');
    console.log('  - role (dropdown)');
    console.log('  - current_services (JSON array)');
    console.log('  - pain_points (text)');
    console.log('  - value_props (JSON array)');
    console.log('  - byok (dropdown)');

} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
} finally {
    db.close();
}

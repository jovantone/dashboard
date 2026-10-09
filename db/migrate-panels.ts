import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });
const dbPath = join(dataDir, 'dashboard.db');

const db = createClient({ url: `file:${dbPath}` });

async function migrate() {
  // Create panels table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS panels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Seed default panels if empty
  const existingPanels = await db.execute('SELECT COUNT(*) as count FROM panels');
  if (Number(existingPanels.rows[0].count) === 0) {
    await db.execute("INSERT INTO panels (name, sort_order) VALUES ('Work', 1)");
    await db.execute("INSERT INTO panels (name, sort_order) VALUES ('Life', 2)");
    console.log('Created Work and Life panels.');
  }

  // Add panel_id column to categories if it doesn't exist
  const cols = await db.execute("PRAGMA table_info(categories)");
  const hasPanelId = cols.rows.some((r: any) => r.name === 'panel_id');
  if (!hasPanelId) {
    await db.execute('ALTER TABLE categories ADD COLUMN panel_id INTEGER NOT NULL DEFAULT 1');
    console.log('Added panel_id column to categories (defaulting to Work panel).');
  } else {
    console.log('panel_id column already exists.');
  }

  console.log('Migration complete.');
}

migrate().catch(console.error);

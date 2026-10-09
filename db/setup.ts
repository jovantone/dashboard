import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });
const dbPath = join(dataDir, 'dashboard.db');

const db = createClient({ url: `file:${dbPath}` });

async function setup() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS panels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      panel_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (panel_id) REFERENCES panels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // Check if panels exist, seed if not
  const existingPanels = await db.execute('SELECT COUNT(*) as count FROM panels');
  if (Number(existingPanels.rows[0].count) === 0) {
    await db.executeMultiple(`
      INSERT INTO panels (name, sort_order) VALUES ('Work', 1);
      INSERT INTO panels (name, sort_order) VALUES ('Life', 2);
    `);
    console.log('Panels seeded.');
  }

  // Check if categories exist
  const existing = await db.execute('SELECT COUNT(*) as count FROM categories');
  if (Number(existing.rows[0].count) > 0) {
    console.log('Database already seeded.');
    return;
  }

  // Seed categories (assigned to Work panel = id 1)
  await db.executeMultiple(`
    INSERT INTO categories (panel_id, name, sort_order) VALUES (1, 'Tools', 1);
    INSERT INTO categories (panel_id, name, sort_order) VALUES (1, 'Docs', 2);
  `);

  // Seed links
  await db.executeMultiple(`
    INSERT INTO links (category_id, name, description, url, sort_order)
    VALUES (1, 'GitHub', 'Repositories', 'https://github.com/', 1);

    INSERT INTO links (category_id, name, description, url, sort_order)
    VALUES (1, 'Vercel', 'Deployments', 'https://vercel.com/dashboard', 2);

    INSERT INTO links (category_id, name, description, url, sort_order)
    VALUES (2, 'MDN', 'Web platform reference', 'https://developer.mozilla.org/', 1);

    INSERT INTO links (category_id, name, description, url, sort_order)
    VALUES (2, 'Node.js', 'Node API docs', 'https://nodejs.org/docs/latest/api/', 2);
  `);

  console.log('Database seeded successfully.');
}

setup().catch(console.error);

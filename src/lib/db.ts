import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

const db = createClient({
  url: `file:${join(projectRoot, 'data', 'dashboard.db')}`,
});

export interface Panel {
  id: number;
  name: string;
  sort_order: number;
}

export interface Category {
  id: number;
  panel_id: number;
  name: string;
  sort_order: number;
}

export interface Link {
  id: number;
  category_id: number;
  name: string;
  description: string;
  url: string;
  sort_order: number;
}

export async function getPanels(): Promise<Panel[]> {
  const result = await db.execute('SELECT * FROM panels ORDER BY sort_order');
  return result.rows as unknown as Panel[];
}

export async function addPanel(name: string): Promise<Panel> {
  const maxOrder = await db.execute(
    'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM panels',
  );
  const sortOrder = Number(maxOrder.rows[0].next_order);
  const result = await db.execute({
    sql: 'INSERT INTO panels (name, sort_order) VALUES (?, ?)',
    args: [name, sortOrder],
  });
  return {
    id: Number(result.lastInsertRowid),
    name,
    sort_order: sortOrder,
  };
}

export async function deletePanel(id: number): Promise<void> {
  // Delete all links in categories belonging to this panel
  await db.execute({
    sql: 'DELETE FROM links WHERE category_id IN (SELECT id FROM categories WHERE panel_id = ?)',
    args: [id],
  });
  // Delete all categories belonging to this panel
  await db.execute({
    sql: 'DELETE FROM categories WHERE panel_id = ?',
    args: [id],
  });
  // Delete the panel
  await db.execute({
    sql: 'DELETE FROM panels WHERE id = ?',
    args: [id],
  });
}

export async function getCategories(panelId?: number): Promise<Category[]> {
  if (panelId) {
    const result = await db.execute({
      sql: 'SELECT * FROM categories WHERE panel_id = ? ORDER BY sort_order',
      args: [panelId],
    });
    return result.rows as unknown as Category[];
  }
  const result = await db.execute('SELECT * FROM categories ORDER BY sort_order');
  return result.rows as unknown as Category[];
}

export async function getLinks(): Promise<Link[]> {
  const result = await db.execute('SELECT * FROM links ORDER BY sort_order');
  return result.rows as unknown as Link[];
}

export async function getLinksByPanel(panelId: number): Promise<Link[]> {
  const result = await db.execute({
    sql: `SELECT l.* FROM links l
          JOIN categories c ON l.category_id = c.id
          WHERE c.panel_id = ?
          ORDER BY l.sort_order`,
    args: [panelId],
  });
  return result.rows as unknown as Link[];
}

export async function getLinksByCategory(categoryId: number): Promise<Link[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM links WHERE category_id = ? ORDER BY sort_order',
    args: [categoryId],
  });
  return result.rows as unknown as Link[];
}

export async function addLink(
  categoryId: number,
  name: string,
  description: string,
  url: string,
): Promise<Link> {
  const maxOrder = await db.execute({
    sql: 'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM links WHERE category_id = ?',
    args: [categoryId],
  });
  const sortOrder = Number(maxOrder.rows[0].next_order);

  const result = await db.execute({
    sql: 'INSERT INTO links (category_id, name, description, url, sort_order) VALUES (?, ?, ?, ?, ?)',
    args: [categoryId, name, description, url, sortOrder],
  });

  return {
    id: Number(result.lastInsertRowid),
    category_id: categoryId,
    name,
    description,
    url,
    sort_order: sortOrder,
  };
}

export async function updateCategory(id: number, name: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE categories SET name = ? WHERE id = ?',
    args: [name, id],
  });
}

export async function updateLink(
  id: number,
  name: string,
  description: string,
  url: string,
): Promise<void> {
  await db.execute({
    sql: 'UPDATE links SET name = ?, description = ?, url = ? WHERE id = ?',
    args: [name, description, url, id],
  });
}

export async function deleteLink(id: number): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM links WHERE id = ?',
    args: [id],
  });
}

export async function addCategory(name: string, panelId: number): Promise<Category> {
  const maxOrder = await db.execute({
    sql: 'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM categories WHERE panel_id = ?',
    args: [panelId],
  });
  const sortOrder = Number(maxOrder.rows[0].next_order);

  const result = await db.execute({
    sql: 'INSERT INTO categories (name, panel_id, sort_order) VALUES (?, ?, ?)',
    args: [name, panelId, sortOrder],
  });

  return {
    id: Number(result.lastInsertRowid),
    panel_id: panelId,
    name,
    sort_order: sortOrder,
  };
}

export async function reorderCategories(ids: number[]): Promise<void> {
  const stmts = ids.map((id, i) => ({
    sql: 'UPDATE categories SET sort_order = ? WHERE id = ?',
    args: [i, id],
  }));
  await db.batch(stmts);
}

export async function reorderLinks(categoryId: number, linkIds: number[]): Promise<void> {
  const stmts = linkIds.map((id, i) => ({
    sql: 'UPDATE links SET sort_order = ?, category_id = ? WHERE id = ?',
    args: [i, categoryId, id],
  }));
  await db.batch(stmts);
}

export async function getLink(id: number): Promise<Link | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM links WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as Link;
}

export async function getPanel(id: number): Promise<Panel | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM panels WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as Panel;
}

export async function updatePanel(id: number, name: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE panels SET name = ? WHERE id = ?',
    args: [name, id],
  });
}

export async function getCategory(id: number): Promise<Category | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM categories WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as Category;
}

export async function deleteCategory(id: number): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM links WHERE category_id = ?',
    args: [id],
  });
  await db.execute({
    sql: 'DELETE FROM categories WHERE id = ?',
    args: [id],
  });
}

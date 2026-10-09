import type { APIRoute } from 'astro';
import { reorderCategories, reorderLinks } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { type } = body;

  if (type === 'categories') {
    const { ids } = body;
    if (!Array.isArray(ids)) {
      return new Response('Missing ids', { status: 400 });
    }
    await reorderCategories(ids.map(Number));
    return new Response('ok', { status: 200 });
  }

  if (type === 'links') {
    const { categoryId, ids } = body;
    if (!categoryId || !Array.isArray(ids)) {
      return new Response('Missing categoryId or ids', { status: 400 });
    }
    await reorderLinks(Number(categoryId), ids.map(Number));
    return new Response('ok', { status: 200 });
  }

  return new Response('Invalid type', { status: 400 });
};

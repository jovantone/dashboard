import type { APIRoute } from 'astro';
import { addPanel, deletePanel } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return new Response('Missing name', { status: 400 });
  }

  const panel = await addPanel(name);
  return new Response(JSON.stringify(panel), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  await deletePanel(Number(id));
  return new Response('', { status: 200 });
};

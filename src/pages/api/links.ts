import type { APIRoute } from 'astro';
import { addLink, updateLink, deleteLink, getLink } from '../../lib/db';

function linkPartial(link: { id: number; name: string; description: string; url: string; category_id: number }) {
  return `<div class="link" id="link-${link.id}">
  <div class="drag-handle" title="Drag to reorder">⠿</div>
  <a href="${link.url}" style="display:contents;color:inherit;text-decoration:none;">
    <div class="link-content">
      <div class="link-name">${escapeHtml(link.name)}</div>
      <div class="link-desc">${escapeHtml(link.description)}</div>
    </div>
  </a>
  <div class="link-actions">
    <button class="btn" x-on:click="openEdit(${link.id}, '${escapeJs(link.name)}', '${escapeJs(link.description)}', '${link.url}', ${link.category_id})">Edit</button>
    <button class="btn btn-danger" x-on:click="confirmDelete(${link.id})">Del</button>
  </div>
</div>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { category_id, name, description, url } = body;

  if (!name || !url || !category_id) {
    return new Response('Missing fields', { status: 400 });
  }

  const link = await addLink(Number(category_id), name, description || '', url);
  return new Response(linkPartial(link), {
    headers: { 'Content-Type': 'text/html' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { id, name, description, url } = body;

  if (!id || !name || !url) {
    return new Response('Missing fields', { status: 400 });
  }

  await updateLink(Number(id), name, description || '', url);
  const link = await getLink(Number(id));
  if (!link) {
    return new Response('Link not found', { status: 404 });
  }

  return new Response(linkPartial(link), {
    headers: { 'Content-Type': 'text/html' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  await deleteLink(Number(id));
  return new Response('', { status: 200 });
};

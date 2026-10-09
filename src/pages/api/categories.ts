import type { APIRoute } from 'astro'
import { addCategory, updateCategory, deleteCategory } from '../../lib/db'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeJs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json()
  const { name, panel_id } = body

  if (!name || !panel_id) {
    return new Response('Missing name or panel_id', { status: 400 })
  }

  const category = await addCategory(name, Number(panel_id))

  const html = `<div class="section" id="category-${category.id}">
  <div class="section-header">
    <span class="section-title" x-on:dblclick="openRenameCategory(${category.id}, '${escapeJs(category.name)}')">${escapeHtml(category.name)}</span>
    <div class="section-meta">
      <button class="btn-add" x-on:click="openAdd(${category.id}, '${escapeHtml(category.name)}')">+ Add</button>
      <button class="btn-add btn-danger" x-on:click="confirmDeleteCategory(${category.id})">Del</button>
    </div>
  </div>
  <div class="links" id="links-${category.id}"></div>
</div>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json()
  const { id, name } = body

  if (!id || !name) {
    return new Response('Missing id or name', { status: 400 })
  }

  await updateCategory(Number(id), name)
  return new Response('', { status: 200 })
}

export const DELETE: APIRoute = async ({ request }) => {
  const body = await request.json()
  const { id } = body

  if (!id) {
    return new Response('Missing id', { status: 400 })
  }

  await deleteCategory(Number(id))
  return new Response('', { status: 200 })
}

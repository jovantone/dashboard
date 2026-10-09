#!/usr/bin/env tsx

import { Command } from 'commander'
import { readFileSync, writeFileSync } from 'fs'
import {
  getPanels,
  getPanel,
  addPanel,
  updatePanel,
  deletePanel,
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
  getLinks,
  getLinksByPanel,
  getLinksByCategory,
  getLink,
  addLink,
  updateLink,
  deleteLink,
} from './src/lib/db.js'

const program = new Command()

function output(data: unknown) {
  console.log(JSON.stringify(data, null, 2))
}

function error(message: string): never {
  console.error(JSON.stringify({ error: message }, null, 2))
  process.exit(1)
}

program
  .name('dashboard-cli')
  .description('CLI to manage dashboard panels, categories, and links')
  .version('1.0.0')
  .addHelpText(
    'after',
    `
Data Model:
  Panel → Category → Link

  Panels are top-level containers (e.g. "Work", "Life").
  Categories group links within a panel (e.g. "Tools", "Hosting").
  Links are the actual entries with a name, URL, and optional description.

  Deleting a panel removes all its categories and links.
  Deleting a category removes all its links.

Examples:
  $ dashboard-cli panel list                          List all panels
  $ dashboard-cli panel add --name "Work"             Create a panel
  $ dashboard-cli category add --name "Tools" --panel-id 1
  $ dashboard-cli link add --category-id 3 --name "GitHub" --url "https://github.com"
  $ dashboard-cli link list --panel-id 1              All links in a panel
  $ dashboard-cli link edit --id 5 --url "https://new-url.com"

Typical workflow:
  1. dashboard-cli panel list                         Find the right panel
  2. dashboard-cli category list --panel-id 1         Find or create a category
  3. dashboard-cli link add --category-id 3 \\
       --name "Docs" --url "https://docs.example.com"

All output is JSON. Errors return { "error": "..." } with exit code 1.`
  )

// ── Panels ──────────────────────────────────────────────

const panelCmd = program
  .command('panel')
  .description('Manage panels')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli panel list                          List all panels
  $ dashboard-cli panel get --id 1                    Get panel details
  $ dashboard-cli panel add --name "Projects"         Create a new panel
  $ dashboard-cli panel edit --id 1 --name "Work"     Rename a panel
  $ dashboard-cli panel delete --id 2                 Delete panel + children`
  )

panelCmd
  .command('list')
  .description('List all panels')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli panel list`
  )
  .action(async () => {
    const panels = await getPanels()
    output(panels)
  })

panelCmd
  .command('get')
  .description('Get a panel by ID')
  .requiredOption('--id <id>', 'Panel ID')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli panel get --id 1
  $ dashboard-cli panel get --id 3`
  )
  .action(async (opts) => {
    const panel = await getPanel(Number(opts.id))
    if (!panel) error(`Panel with id ${opts.id} not found`)
    output(panel)
  })

panelCmd
  .command('add')
  .description('Add a new panel')
  .requiredOption('--name <name>', 'Panel name')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli panel add --name "Work"
  $ dashboard-cli panel add --name "Side Projects"`
  )
  .action(async (opts) => {
    const panel = await addPanel(opts.name)
    output(panel)
  })

panelCmd
  .command('edit')
  .description('Rename a panel')
  .requiredOption('--id <id>', 'Panel ID')
  .requiredOption('--name <name>', 'New panel name')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli panel edit --id 1 --name "Personal"
  $ dashboard-cli panel edit --id 2 --name "Work stuff"`
  )
  .action(async (opts) => {
    const existing = await getPanel(Number(opts.id))
    if (!existing) error(`Panel with id ${opts.id} not found`)
    await updatePanel(Number(opts.id), opts.name)
    const updated = await getPanel(Number(opts.id))
    output(updated)
  })

panelCmd
  .command('delete')
  .description('Delete a panel and all its categories and links')
  .requiredOption('--id <id>', 'Panel ID')
  .addHelpText(
    'after',
    `
  Deleting a panel also removes all categories and links inside it.

Examples:
  $ dashboard-cli panel delete --id 2`
  )
  .action(async (opts) => {
    const existing = await getPanel(Number(opts.id))
    if (!existing) error(`Panel with id ${opts.id} not found`)
    await deletePanel(Number(opts.id))
    output({ deleted: true, id: Number(opts.id) })
  })

// ── Categories ──────────────────────────────────────────

const categoryCmd = program
  .command('category')
  .description('Manage categories')
  .addHelpText(
    'after',
    `
  Categories group links within a panel.

Examples:
  $ dashboard-cli category list                       List all categories
  $ dashboard-cli category list --panel-id 1          Filter by panel
  $ dashboard-cli category get --id 5                 Get category details
  $ dashboard-cli category add --name "APIs" --panel-id 1
  $ dashboard-cli category edit --id 5 --name "Dev Tools"
  $ dashboard-cli category delete --id 5              Delete category + links`
  )

categoryCmd
  .command('list')
  .description('List categories, optionally filtered by panel')
  .option('--panel-id <panelId>', 'Filter by panel ID')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli category list                       All categories
  $ dashboard-cli category list --panel-id 1          Only panel 1`
  )
  .action(async (opts) => {
    const panelId = opts.panelId ? Number(opts.panelId) : undefined
    const categories = await getCategories(panelId)
    output(categories)
  })

categoryCmd
  .command('get')
  .description('Get a category by ID')
  .requiredOption('--id <id>', 'Category ID')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli category get --id 5`
  )
  .action(async (opts) => {
    const category = await getCategory(Number(opts.id))
    if (!category) error(`Category with id ${opts.id} not found`)
    output(category)
  })

categoryCmd
  .command('add')
  .description('Add a new category to a panel')
  .requiredOption('--name <name>', 'Category name')
  .requiredOption('--panel-id <panelId>', 'Panel ID to add the category to')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli category add --name "APIs" --panel-id 1
  $ dashboard-cli category add --name "Hosting" --panel-id 2`
  )
  .action(async (opts) => {
    const panel = await getPanel(Number(opts.panelId))
    if (!panel) error(`Panel with id ${opts.panelId} not found`)
    const category = await addCategory(opts.name, Number(opts.panelId))
    output(category)
  })

categoryCmd
  .command('edit')
  .description('Rename a category')
  .requiredOption('--id <id>', 'Category ID')
  .requiredOption('--name <name>', 'New category name')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli category edit --id 5 --name "Dev Tools"
  $ dashboard-cli category edit --id 8 --name "Monitoring"`
  )
  .action(async (opts) => {
    const existing = await getCategory(Number(opts.id))
    if (!existing) error(`Category with id ${opts.id} not found`)
    await updateCategory(Number(opts.id), opts.name)
    const updated = await getCategory(Number(opts.id))
    output(updated)
  })

categoryCmd
  .command('delete')
  .description('Delete a category and all its links')
  .requiredOption('--id <id>', 'Category ID')
  .addHelpText(
    'after',
    `
  Deleting a category also removes all links inside it.

Examples:
  $ dashboard-cli category delete --id 5`
  )
  .action(async (opts) => {
    const existing = await getCategory(Number(opts.id))
    if (!existing) error(`Category with id ${opts.id} not found`)
    await deleteCategory(Number(opts.id))
    output({ deleted: true, id: Number(opts.id) })
  })

// ── Links ───────────────────────────────────────────────

const linkCmd = program
  .command('link')
  .description('Manage links')
  .addHelpText(
    'after',
    `
  Links are the actual entries with a name, URL, and optional description.

Examples:
  $ dashboard-cli link list                           List all links
  $ dashboard-cli link list --panel-id 1              All links in a panel
  $ dashboard-cli link list --category-id 3           Links in a category
  $ dashboard-cli link get --id 22                    Get link details
  $ dashboard-cli link add --category-id 3 --name "GitHub" --url "https://github.com"
  $ dashboard-cli link add --category-id 3 --name "GitHub" --url "https://github.com" --description "Code hosting"
  $ dashboard-cli link edit --id 22 --name "New Name"
  $ dashboard-cli link edit --id 22 --url "https://new-url.com" --description "Updated"
  $ dashboard-cli link delete --id 22`
  )

linkCmd
  .command('list')
  .description('List links, optionally filtered by category or panel')
  .option('--category-id <categoryId>', 'Filter by category ID')
  .option('--panel-id <panelId>', 'Filter by panel ID')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli link list                           All links
  $ dashboard-cli link list --category-id 3           By category
  $ dashboard-cli link list --panel-id 1              By panel`
  )
  .action(async (opts) => {
    if (opts.categoryId) {
      const links = await getLinksByCategory(Number(opts.categoryId))
      output(links)
    } else if (opts.panelId) {
      const links = await getLinksByPanel(Number(opts.panelId))
      output(links)
    } else {
      const links = await getLinks()
      output(links)
    }
  })

linkCmd
  .command('get')
  .description('Get a link by ID')
  .requiredOption('--id <id>', 'Link ID')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli link get --id 22`
  )
  .action(async (opts) => {
    const link = await getLink(Number(opts.id))
    if (!link) error(`Link with id ${opts.id} not found`)
    output(link)
  })

linkCmd
  .command('add')
  .description('Add a new link to a category')
  .requiredOption('--category-id <categoryId>', 'Category ID')
  .requiredOption('--name <name>', 'Link name')
  .requiredOption('--url <url>', 'Link URL')
  .option('--description <description>', 'Link description', '')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli link add --category-id 3 --name "GitHub" --url "https://github.com"
  $ dashboard-cli link add --category-id 3 --name "GitHub" --url "https://github.com" --description "Code hosting"`
  )
  .action(async (opts) => {
    const category = await getCategory(Number(opts.categoryId))
    if (!category) error(`Category with id ${opts.categoryId} not found`)
    const link = await addLink(
      Number(opts.categoryId),
      opts.name,
      opts.description,
      opts.url
    )
    output(link)
  })

linkCmd
  .command('edit')
  .description('Edit a link (only specified fields are updated)')
  .requiredOption('--id <id>', 'Link ID')
  .option('--name <name>', 'New link name')
  .option('--url <url>', 'New link URL')
  .option('--description <description>', 'New link description')
  .addHelpText(
    'after',
    `
  Only the fields you pass are updated. The rest stay the same.

Examples:
  $ dashboard-cli link edit --id 22 --name "Updated Name"
  $ dashboard-cli link edit --id 22 --url "https://new-url.com"
  $ dashboard-cli link edit --id 22 --name "New" --url "https://new.com" --description "Changed"`
  )
  .action(async (opts) => {
    const existing = await getLink(Number(opts.id))
    if (!existing) error(`Link with id ${opts.id} not found`)
    const name = opts.name ?? existing!.name
    const description = opts.description ?? existing!.description
    const url = opts.url ?? existing!.url
    await updateLink(Number(opts.id), name, description, url)
    const updated = await getLink(Number(opts.id))
    output(updated)
  })

linkCmd
  .command('delete')
  .description('Delete a link')
  .requiredOption('--id <id>', 'Link ID')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli link delete --id 22`
  )
  .action(async (opts) => {
    const existing = await getLink(Number(opts.id))
    if (!existing) error(`Link with id ${opts.id} not found`)
    await deleteLink(Number(opts.id))
    output({ deleted: true, id: Number(opts.id) })
  })

// ── Export / Import ─────────────────────────────────────

program
  .command('export')
  .description('Export all panels, categories, and links as JSON')
  .option('--file <path>', 'Write to a file instead of stdout')
  .addHelpText(
    'after',
    `
Examples:
  $ dashboard-cli export                               Print to stdout
  $ dashboard-cli export --file backup.json            Save to file`
  )
  .action(async (opts) => {
    const panels = await getPanels()
    const allCategories = await getCategories()
    const allLinks = await getLinks()

    const data = {
      panels: panels.map((panel) => ({
        name: panel.name,
        sort_order: panel.sort_order,
        categories: allCategories
          .filter((c) => c.panel_id === panel.id)
          .map((cat) => ({
            name: cat.name,
            sort_order: cat.sort_order,
            links: allLinks
              .filter((l) => l.category_id === cat.id)
              .map((link) => ({
                name: link.name,
                url: link.url,
                description: link.description,
                sort_order: link.sort_order,
              })),
          })),
      })),
    }

    const json = JSON.stringify(data, null, 2)
    if (opts.file) {
      writeFileSync(opts.file, json, 'utf-8')
      console.error(`Exported to ${opts.file}`)
    } else {
      console.log(json)
    }
  })

program
  .command('import')
  .description('Import panels, categories, and links from a JSON file')
  .requiredOption('--file <path>', 'JSON file to import')
  .addHelpText(
    'after',
    `
  Clears all existing data before importing.

Examples:
  $ dashboard-cli import --file backup.json`
  )
  .action(async (opts) => {
    const raw = readFileSync(opts.file, 'utf-8')
    const data = JSON.parse(raw)

    if (!data.panels || !Array.isArray(data.panels)) {
      error('Invalid format: expected { "panels": [...] }')
    }

    const existingPanels = await getPanels()
    for (const p of existingPanels) {
      await deletePanel(p.id)
    }

    let categoryCount = 0
    let linkCount = 0

    for (const panelData of data.panels) {
      const panel = await addPanel(panelData.name)
      if (panelData.categories) {
        for (const catData of panelData.categories) {
          const cat = await addCategory(catData.name, panel.id)
          categoryCount++
          if (catData.links) {
            for (const linkData of catData.links) {
              await addLink(
                cat.id,
                linkData.name,
                linkData.description || '',
                linkData.url
              )
              linkCount++
            }
          }
        }
      }
    }

    output({
      imported: true,
      panels: data.panels.length,
      categories: categoryCount,
      links: linkCount,
    })
  })

// ── Run ─────────────────────────────────────────────────

program.parseAsync(process.argv).catch((err) => {
  error(err.message)
})

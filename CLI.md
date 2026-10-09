# dashboard-cli

A command-line tool to manage the dashboard: panels, categories, and links.

All output is JSON. Errors return `{ "error": "message" }` with exit code 1.

## Installation

The CLI requires `tsx` to be installed globally:

```sh
npm install -g tsx
```

Then link the CLI globally from the project directory:

```sh
npm link
```

This makes `dashboard-cli` available from anywhere on your system.

You can also run it locally without linking:

```sh
npm run cli -- <command>
```

## Data model

The dashboard organizes data in three levels:

```
Panel → Category → Link
```

- **Panels** are top-level containers (e.g. "Work", "Life")
- **Categories** group links within a panel (e.g. "Tools", "Hosting")
- **Links** are the actual entries with a name, URL, and optional description

Deleting a panel removes all its categories and links. Deleting a category removes all its links.

## Panels

### List all panels

```sh
dashboard-cli panel list
```

```json
[
  { "id": 1, "name": "Work", "sort_order": 1 },
  { "id": 2, "name": "Life", "sort_order": 2 }
]
```

### Get a panel by ID

```sh
dashboard-cli panel get --id 1
```

### Add a panel

```sh
dashboard-cli panel add --name "Projects"
```

### Rename a panel

```sh
dashboard-cli panel edit --id 1 --name "New Name"
```

### Delete a panel

Deletes the panel and all its categories and links.

```sh
dashboard-cli panel delete --id 1
```

## Categories

### List categories

List all categories:

```sh
dashboard-cli category list
```

Filter by panel:

```sh
dashboard-cli category list --panel-id 1
```

### Get a category by ID

```sh
dashboard-cli category get --id 5
```

### Add a category

```sh
dashboard-cli category add --name "APIs" --panel-id 1
```

### Rename a category

```sh
dashboard-cli category edit --id 5 --name "New Name"
```

### Delete a category

Deletes the category and all its links.

```sh
dashboard-cli category delete --id 5
```

## Links

### List links

List all links:

```sh
dashboard-cli link list
```

Filter by category:

```sh
dashboard-cli link list --category-id 12
```

Filter by panel (returns all links across all categories in that panel):

```sh
dashboard-cli link list --panel-id 1
```

### Get a link by ID

```sh
dashboard-cli link get --id 22
```

```json
{
  "id": 22,
  "category_id": 12,
  "name": "Sendy",
  "description": "",
  "url": "https://list.flaviocopes.com/",
  "sort_order": 1
}
```

### Add a link

```sh
dashboard-cli link add --category-id 12 --name "GitHub" --url "https://github.com"
```

With a description:

```sh
dashboard-cli link add --category-id 12 --name "GitHub" --url "https://github.com" --description "Code hosting"
```

### Edit a link

Only the fields you pass are updated. The rest stay the same.

```sh
dashboard-cli link edit --id 22 --name "Updated Name"
dashboard-cli link edit --id 22 --url "https://new-url.com"
dashboard-cli link edit --id 22 --name "New" --url "https://new.com" --description "Changed"
```

### Delete a link

```sh
dashboard-cli link delete --id 22
```

## For AI agents

Every command outputs valid JSON to stdout. Use `--help` on any command to see its options:

```sh
dashboard-cli --help
dashboard-cli panel --help
dashboard-cli link add --help
```

A typical workflow to add a new link:

1. Find the right panel: `dashboard-cli panel list`
2. Find or create a category: `dashboard-cli category list --panel-id 1`
3. Add the link: `dashboard-cli link add --category-id 12 --name "Docs" --url "https://docs.example.com"`

Errors return JSON with a non-zero exit code:

```json
{ "error": "Link with id 999 not found" }
```

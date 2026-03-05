---
name: supabase-code-exec
description: Direct connection to PostgreSQL/Supabase database using the Code Execution pattern (99%+ token reduction). Use when you need to execute SQL queries, explore database schemas, list tables, or interact with local/cloud Supabase without MCP server.
---

# Supabase Code Execution

Direct connection to PostgreSQL/Supabase without MCP server.

## Setup (one-time per project)

1. Install dependencies:
```bash
npm install pg @types/pg
```

2. Copy `scripts/client-pg.ts` to the project

3. Configure environment variable:
```bash
export POSTGRES_URL_NON_POOLING="postgresql://user:pass@host:port/db"
```

Default: `postgresql://postgres:postgres@localhost:54322/postgres` (local Supabase)

## Usage

```typescript
import { getSchemas, getTables, getTableSchema, executePostgresql, closePool } from './client-pg.js';

// List schemas
const schemas = await getSchemas();

// List tables in a schema
const tables = await getTables('public');

// Table structure
const columns = await getTableSchema('public', 'users');

// Custom query (SELECT/READ only)
const result = await executePostgresql('SELECT * FROM users LIMIT 10;');

// Write query (requires explicit flag)
const insert = await executePostgresql('INSERT INTO logs (msg) VALUES ($1);', true);

// Close connections
await closePool();
```

## Available Functions

| Function | Description |
|----------|-------------|
| `getSchemas()` | List schemas with sizes and table counts |
| `getTables(schema)` | List tables with rows and sizes |
| `getTableSchema(schema, table)` | Columns, types, nullable, defaults |
| `executePostgresql(sql, allowWrite?)` | Custom query (default: read-only) |
| `query(sql, params?)` | Low-level parameterized query |
| `closePool()` | Close connection pool |

## Recommended Patterns

**Process locally, report summary:**
```typescript
const data = await executePostgresql('SELECT * FROM big_table;');
const activeCount = data.rows.filter(r => r.active).length;
console.log(`${activeCount} active records out of ${data.rowCount} total`);
// Only the summary goes into context, not all rows
```

**Use parameterized queries:**
```typescript
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
```

## Common Local Supabase Ports

| Service | Port |
|---------|------|
| PostgreSQL | 54322 |
| Kong API | 54321 |
| Studio | 54323 |
| Inbucket | 54324 |

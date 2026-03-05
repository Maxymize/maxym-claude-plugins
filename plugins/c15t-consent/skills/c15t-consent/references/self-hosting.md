# c15t Self-Hosting Guide

## Table of Contents
- [Quick Setup](#quick-setup)
- [Manual Setup](#manual-setup)
- [Database Adapters](#database-adapters)
- [Options Reference](#options-reference)
- [Next.js Integration](#nextjs-integration)
- [Cloudflare Workers](#cloudflare-workers)
- [Migration from v1](#migration-from-v1)

---

## Quick Setup

```bash
npx @c15t/cli
```

---

## Manual Setup

### 1. Install Package

```bash
npm install @c15t/backend
```

### 2. Create Instance

```tsx
// c15t.ts
import { c15tInstance } from '@c15t/backend/v2';
import { kyselyAdapter } from '@c15t/backend/v2/db/adapters/kysely';
import { Kysely } from 'kysely';

const handler = c15tInstance({
  appName: 'my-app',
  basePath: '/',
  adapter: kyselyAdapter({
    db: new Kysely({ /* config */ }),
    provider: 'postgresql',
  }),
  trustedOrigins: ['localhost', 'myapp.com'],
  advanced: {
    disableGeoLocation: true,
    openapi: {
      enabled: true,
    },
  },
  logger: {
    level: 'debug',
  },
});

export { handler };
```

---

## Database Adapters

### Supported ORMs
- **Drizzle ORM** (full support, query mode required)
- **Prisma ORM** (full support)
- **TypeORM** (via Kysely, no MongoDB support)

### Supported Databases
- PostgreSQL
- MySQL
- SQLite
- MongoDB
- Microsoft SQL Server
- CockroachDB

### Adapter Examples

#### Kysely (PostgreSQL)

```tsx
import { kyselyAdapter } from '@c15t/backend/v2/db/adapters/kysely';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

const db = new Kysely({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
});

const adapter = kyselyAdapter({
  db,
  provider: 'postgresql',
});
```

#### Drizzle

```tsx
import { drizzleAdapter } from '@c15t/backend/v2/db/adapters/drizzle';

const adapter = drizzleAdapter({
  db: drizzleClient,
  provider: 'postgresql',
});
```

#### Prisma

```tsx
import { prismaAdapter } from '@c15t/backend/v2/db/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const adapter = prismaAdapter({
  db: prisma,
});
```

#### MongoDB

```tsx
import { mongoAdapter } from '@c15t/backend/v2/db/adapters/mongo';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

const adapter = mongoAdapter({
  db: client.db('c15t'),
});
```

---

## Options Reference

```tsx
interface C15TOptions {
  // App name (used in logger and OpenAPI)
  appName?: string; // default: 'c15t'

  // Base path for API routes
  basePath?: string; // default: '/'
  // For Next.js: '/api/c15t'

  // Database adapter (required)
  adapter: DatabaseAdapter;

  // CORS/CSRF trusted origins
  trustedOrigins?: string[] | ((request: Request) => string[]);

  // Advanced options
  advanced?: {
    disableGeoLocation?: boolean;
    customTranslations?: TranslationConfig;
    ipAddress?: IPAddressConfig;
    openapi?: {
      enabled?: boolean;
    };
    telemetry?: TelemetryConfig;
  };

  // Logging configuration
  logger?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
  };
}
```

---

## Next.js Integration

### App Router

```tsx
// app/api/c15t/[...path]/route.ts
import { handler } from '@/lib/c15t';

export const GET = handler.handler;
export const POST = handler.handler;
export const OPTIONS = handler.handler;
```

### Pages Router

```tsx
// pages/api/c15t/[...path].ts
import { handler } from '@/lib/c15t';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function c15tHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return handler.handler(req, res);
}
```

---

## Cloudflare Workers

```tsx
// worker.ts
import { c15tInstance } from '@c15t/backend/v2';
import { kyselyAdapter } from '@c15t/backend/v2/db/adapters/kysely';

const handler = c15tInstance({
  appName: 'my-app',
  basePath: '/',
  adapter: kyselyAdapter({
    db: /* D1 or external DB */,
    provider: 'sqlite',
  }),
  trustedOrigins: ['myapp.com'],
});

export default {
  async fetch(request: Request): Promise<Response> {
    return handler.handler(request);
  },
};
```

---

## Migration from v1

### Notable Changes
- Uses FumaDB for database integration
- Dates stored as EPOCH milliseconds (not ISO strings)
- Different instance interface
- No custom prefixes or table names

### Run Migration

```bash
npx @c15t/cli migrate
```

### Manual SQL (if needed)

```sql
CREATE TABLE private_c15t_settings (
  key character varying(255) NOT NULL,
  value text NOT NULL,
  PRIMARY KEY (key)
);

INSERT INTO private_c15t_settings VALUES
('version', '1.0.0');
```

---

## Database Schema

c15t creates these tables:
- `subject` - User identifiers
- `domain` - Registered domains
- `consentPolicy` - Privacy policies
- `consentPurpose` - Consent categories
- `consent` - User consent records
- `consentRecord` - Consent history
- `auditLog` - Audit trail

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/c15t
C15T_BASE_URL=https://api.myapp.com
```

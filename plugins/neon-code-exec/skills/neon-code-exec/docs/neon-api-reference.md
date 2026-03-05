# Neon API Reference

Complete API reference for Neon Serverless Postgres, collected from official documentation.

## Base URL

```
https://console.neon.tech/api/v2/
```

## Authentication

All API requests require authentication via Bearer token:

```
Authorization: Bearer $NEON_API_KEY
```

API keys are managed in the Neon Console under Account Settings → API keys.

## Rate Limits

- **Standard limit**: 700 requests per minute (~11 per second)
- **Burst allowance**: Up to 40 requests per second per route
- **Exceeded limit response**: HTTP 429 Too Many Requests

---

## Projects API

### List Projects

```
GET /projects
```

**Query Parameters:**
- `cursor` (string) - Pagination cursor
- `limit` (number) - Results per page (1-400, default 10)
- `search` (string) - Filter by name or ID
- `org_id` (string) - Filter by organization

**Response:**
```json
{
  "projects": [
    {
      "id": "dry-heart-13671059",
      "name": "my-project",
      "region_id": "aws-us-east-1",
      "pg_version": 16,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "cursor": "next-cursor-value"
  }
}
```

### Create Project

```
POST /projects
```

**Request Body:**
```json
{
  "project": {
    "name": "my-project",
    "region_id": "aws-us-east-1",
    "pg_version": 16,
    "default_endpoint_settings": {
      "autoscaling_limit_min_cu": 0.25,
      "autoscaling_limit_max_cu": 4
    },
    "branch": {
      "name": "main",
      "database_name": "neondb",
      "role_name": "neondb_owner"
    }
  }
}
```

**Response:**
```json
{
  "project": { ... },
  "branch": { ... },
  "endpoints": [ ... ],
  "databases": [ ... ],
  "roles": [ ... ],
  "operations": [ ... ],
  "connection_uris": [
    {
      "connection_uri": "postgresql://user:pass@host/db",
      "connection_parameters": { ... }
    }
  ]
}
```

### Get Project

```
GET /projects/{project_id}
```

### Update Project

```
PATCH /projects/{project_id}
```

**Request Body:**
```json
{
  "project": {
    "name": "new-name",
    "settings": {
      "quota": {
        "active_time_seconds": 3600
      }
    }
  }
}
```

### Delete Project

```
DELETE /projects/{project_id}
```

---

## Branches API

### List Branches

```
GET /projects/{project_id}/branches
```

**Response:**
```json
{
  "branches": [
    {
      "id": "br-morning-meadow-afu2s1jl",
      "project_id": "dry-heart-13671059",
      "name": "main",
      "current_state": "ready",
      "primary": true,
      "default": true,
      "protected": false,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create Branch

```
POST /projects/{project_id}/branches
```

**Request Body:**
```json
{
  "branch": {
    "name": "development",
    "parent_id": "br-parent-xxx"
  },
  "endpoints": [
    {
      "type": "read_write"
    }
  ]
}
```

### Get Branch

```
GET /projects/{project_id}/branches/{branch_id}
```

### Update Branch

```
PATCH /projects/{project_id}/branches/{branch_id}
```

### Delete Branch

```
DELETE /projects/{project_id}/branches/{branch_id}
```

### Set Default Branch

```
POST /projects/{project_id}/branches/{branch_id}/set_as_default
```

### Restore Branch (Reset from Parent)

```
POST /projects/{project_id}/branches/{branch_id}/restore
```

**Request Body:**
```json
{
  "preserve_under_name": "backup-before-restore"
}
```

### Get Branch Schema

```
GET /projects/{project_id}/branches/{branch_id}/schema
```

**Query Parameters:**
- `db_name` (string) - Database name
- `role` (string) - Role name

### Compare Branch Schemas

```
GET /projects/{project_id}/branches/{branch_id}/schema/diff
```

**Query Parameters:**
- `base_branch_id` (string, required) - Branch to compare against
- `db_name` (string) - Database name

**Response:**
```json
{
  "diff": "--- a/neondb\n+++ b/neondb\n@@ ... @@\n..."
}
```

---

## Databases API

### List Databases

```
GET /projects/{project_id}/branches/{branch_id}/databases
```

**Response:**
```json
{
  "databases": [
    {
      "id": 1139149,
      "branch_id": "br-xxx",
      "name": "neondb",
      "owner_name": "neondb_owner",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create Database

```
POST /projects/{project_id}/branches/{branch_id}/databases
```

**Request Body:**
```json
{
  "database": {
    "name": "mydb",
    "owner_name": "neondb_owner"
  }
}
```

### Get Database

```
GET /projects/{project_id}/branches/{branch_id}/databases/{database_name}
```

### Update Database

```
PATCH /projects/{project_id}/branches/{branch_id}/databases/{database_name}
```

### Delete Database

```
DELETE /projects/{project_id}/branches/{branch_id}/databases/{database_name}
```

---

## Roles API

### List Roles

```
GET /projects/{project_id}/branches/{branch_id}/roles
```

### Create Role

```
POST /projects/{project_id}/branches/{branch_id}/roles
```

**Request Body:**
```json
{
  "role": {
    "name": "myuser"
  }
}
```

### Get Role

```
GET /projects/{project_id}/branches/{branch_id}/roles/{role_name}
```

### Delete Role

```
DELETE /projects/{project_id}/branches/{branch_id}/roles/{role_name}
```

### Reset Role Password

```
POST /projects/{project_id}/branches/{branch_id}/roles/{role_name}/reset_password
```

---

## Endpoints (Computes) API

### List Endpoints

```
GET /projects/{project_id}/endpoints
```

**Response:**
```json
{
  "endpoints": [
    {
      "id": "ep-xxx",
      "host": "ep-xxx.us-east-1.aws.neon.tech",
      "project_id": "project-xxx",
      "branch_id": "br-xxx",
      "type": "read_write",
      "current_state": "active",
      "autoscaling_limit_min_cu": 0.25,
      "autoscaling_limit_max_cu": 4,
      "pooler_enabled": true,
      "pooler_mode": "transaction"
    }
  ]
}
```

### Create Endpoint

```
POST /projects/{project_id}/endpoints
```

**Request Body:**
```json
{
  "endpoint": {
    "branch_id": "br-xxx",
    "type": "read_write",
    "autoscaling_limit_min_cu": 0.25,
    "autoscaling_limit_max_cu": 4,
    "pooler_enabled": true,
    "pooler_mode": "transaction"
  }
}
```

### Get Endpoint

```
GET /projects/{project_id}/endpoints/{endpoint_id}
```

### Update Endpoint

```
PATCH /projects/{project_id}/endpoints/{endpoint_id}
```

### Delete Endpoint

```
DELETE /projects/{project_id}/endpoints/{endpoint_id}
```

### Start Endpoint

```
POST /projects/{project_id}/endpoints/{endpoint_id}/start
```

### Suspend Endpoint

```
POST /projects/{project_id}/endpoints/{endpoint_id}/suspend
```

### Restart Endpoint

```
POST /projects/{project_id}/endpoints/{endpoint_id}/restart
```

---

## Operations API

### List Operations

```
GET /projects/{project_id}/operations
```

**Query Parameters:**
- `cursor` (string) - Pagination cursor
- `limit` (number) - Results per page (1-1000)

**Response:**
```json
{
  "operations": [
    {
      "id": "op-xxx",
      "project_id": "project-xxx",
      "action": "create_branch",
      "status": "finished",
      "created_at": "2024-01-15T10:00:00Z",
      "total_duration_ms": 1234
    }
  ]
}
```

### Get Operation

```
GET /projects/{project_id}/operations/{operation_id}
```

**Operation Statuses:**
- `scheduling` - Being scheduled
- `running` - In progress
- `finished` - Completed successfully
- `failed` - Failed with error
- `cancelled` - Cancelled
- `cancelling` - Being cancelled

---

## Connection String API

### Get Connection String

```
GET /projects/{project_id}/connection_uri
```

**Query Parameters:**
- `branch_id` (string) - Branch ID
- `endpoint_id` (string) - Endpoint ID
- `database_name` (string) - Database name
- `role_name` (string) - Role name
- `pooled` (boolean) - Use connection pooler

**Response:**
```json
{
  "uri": "postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
}
```

---

## API Keys API

### List API Keys

```
GET /api_keys
```

### Create API Key

```
POST /api_keys
```

**Request Body:**
```json
{
  "name": "my-api-key"
}
```

**Response:**
```json
{
  "id": 12345,
  "key": "neon_api_key_xxx..."
}
```

### Delete API Key

```
DELETE /api_keys/{key_id}
```

---

## Organizations API

### List Organizations

```
GET /users/me/organizations
```

**Query Parameters:**
- `search` (string) - Filter by name or ID

---

## Search API

### Search Resources

```
GET /search
```

**Query Parameters:**
- `query` (string, required) - Search query (min 3 chars)

**Response:**
```json
{
  "results": [
    {
      "id": "project-xxx",
      "title": "my-project",
      "url": "https://console.neon.tech/app/projects/project-xxx",
      "type": "project"
    }
  ]
}
```

---

## SQL Execution via Serverless Driver

Neon provides HTTP-based SQL execution through the Serverless Driver.

### HTTP SQL Endpoint

```
POST https://{endpoint-host}/sql
```

**Headers:**
- `Content-Type: application/json`
- `Neon-Connection-String: postgresql://...`

**Request Body:**
```json
{
  "query": "SELECT * FROM users WHERE id = $1",
  "params": [123]
}
```

**Response:**
```json
{
  "rows": [
    { "id": 123, "name": "Alice", "email": "alice@example.com" }
  ],
  "rowCount": 1,
  "fields": [
    { "name": "id", "dataTypeID": 23 },
    { "name": "name", "dataTypeID": 25 },
    { "name": "email", "dataTypeID": 25 }
  ]
}
```

### Transactions

For transactions, use the Node.js Serverless Driver:

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const [posts, tags] = await sql.transaction([
  sql`SELECT * FROM posts ORDER BY created_at DESC LIMIT 10`,
  sql`SELECT * FROM tags WHERE active = true`
]);
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `unauthorized` | Invalid or missing API key |
| `not_found` | Resource not found |
| `forbidden` | Permission denied |
| `conflict` | Resource conflict |
| `rate_limited` | Too many requests |
| `invalid_request` | Invalid parameters |
| `internal_error` | Server error |
| `project_limit_exceeded` | Project quota reached |
| `branch_limit_exceeded` | Branch quota reached |
| `compute_time_exceeded` | Compute time quota exceeded |

---

## PostgreSQL Versions

Neon supports:
- PostgreSQL 14
- PostgreSQL 15
- PostgreSQL 16 (default)

---

## Compute Sizing

| Compute Units (CU) | vCPU | RAM |
|-------------------|------|-----|
| 0.25 | 0.25 | 1 GB |
| 0.5 | 0.5 | 2 GB |
| 1 | 1 | 4 GB |
| 2 | 2 | 8 GB |
| 4 | 4 | 16 GB |
| 8 | 8 | 32 GB |
| 16 | 16 | 64 GB |

Autoscaling range: 0.25 - 16 CU
Fixed sizing: Up to 56 CU

---

## References

- [Neon API Reference](https://api-docs.neon.tech/reference/getting-started-with-neon-api)
- [Neon Documentation](https://neon.com/docs)
- [OpenAPI Specification](https://neon.com/api_spec/release/v2.json)
- [Serverless Driver](https://neon.com/docs/serverless/serverless-driver)
- [Context7 Documentation](https://context7.com/neondatabase/serverless)

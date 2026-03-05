# Convex API Reference

Complete reference for all Convex HTTP APIs used by this skill.

## Authentication

Convex uses two types of authentication:

### 1. Access Token (Management API)

Used for team/project/deployment management operations.

```
Authorization: Bearer <access_token>
```

**How to get:**
1. Go to https://dashboard.convex.dev
2. Click team name → Settings → Access Tokens
3. Create new token

**Environment variable:** `CONVEX_ACCESS_TOKEN`

### 2. Deploy Key (Deployment API)

Used for function execution, environment variables, and streaming export.

```
Authorization: Convex <deploy_key>
```

**How to get:**
1. Go to https://dashboard.convex.dev
2. Select your project → Settings → Deploy Keys
3. Generate new deploy key

**Environment variables:**
- `CONVEX_DEPLOY_KEY` - The deploy key
- `CONVEX_URL` - Deployment URL (e.g., `https://your-deployment.convex.cloud`)

---

## Management API

Base URL: `https://api.convex.dev/v1`

OpenAPI Spec: https://api.convex.dev/v1/openapi.json

### GET /token_details

Get information about the current access token.

**Response:**
```json
{
  "teamId": 12345,
  "type": "team"
}
```

### GET /teams/{teamId}/list_projects

List all projects for a team.

**Response:**
```json
{
  "projects": [
    {
      "id": 123,
      "name": "my-project",
      "slug": "my-project",
      "teamId": 12345,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /teams/{teamId}/create_project

Create a new project.

**Request:**
```json
{
  "projectName": "new-project",
  "deploymentType": "dev"
}
```

**Response:**
```json
{
  "project": { ... },
  "deployment": {
    "id": 456,
    "name": "new-project-abc123",
    "url": "https://new-project-abc123.convex.cloud",
    "deploymentType": "dev"
  }
}
```

### POST /projects/{projectId}/delete

Delete a project and all its deployments.

**Response:** `204 No Content`

### GET /projects/{projectId}/list_deployments

List all deployments for a project.

**Response:**
```json
{
  "deployments": [
    {
      "id": 456,
      "name": "my-deployment",
      "projectId": 123,
      "deploymentType": "dev",
      "url": "https://my-deployment.convex.cloud",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /deployments/{deploymentName}/create_deploy_key

Generate a new deploy key.

**Request:**
```json
{
  "name": "my-key"
}
```

**Response:**
```json
{
  "id": 789,
  "name": "my-key",
  "key": "convex_deploy_key_...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### GET /deployments/{deploymentName}/custom_domains

List custom domains for a deployment.

**Response:**
```json
{
  "domains": [
    {
      "domain": "api.example.com",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /deployments/{deploymentName}/create_custom_domain

Add a custom domain.

**Request:**
```json
{
  "domain": "api.example.com",
  "requestDestination": "convex"
}
```

### POST /deployments/{deploymentName}/delete_custom_domain

Remove a custom domain.

**Request:**
```json
{
  "domain": "api.example.com"
}
```

---

## Deployment API - Function Execution

Base URL: `https://<deployment-name>.convex.cloud`

### POST /api/query

Execute a query function.

**Request:**
```json
{
  "path": "messages:list",
  "args": {
    "channelId": "abc123"
  },
  "format": "json"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "value": [...],
  "logLines": []
}
```

**Response (Error):**
```json
{
  "status": "error",
  "errorMessage": "Function not found",
  "errorData": null,
  "logLines": []
}
```

### POST /api/mutation

Execute a mutation function.

**Request:**
```json
{
  "path": "messages:send",
  "args": {
    "channelId": "abc123",
    "content": "Hello!"
  },
  "format": "json"
}
```

**Response:** Same as query.

### POST /api/action

Execute an action function.

**Request:**
```json
{
  "path": "ai:generateResponse",
  "args": {
    "prompt": "Hello"
  },
  "format": "json"
}
```

**Response:** Same as query.

### POST /api/run/{functionIdentifier}

Execute any function by identifier. The function identifier uses `/` instead of `:`.

**Example:** `/api/run/messages/list`

**Request:**
```json
{
  "args": {},
  "format": "json"
}
```

---

## Deployment API - Environment Variables

Base URL: `https://<deployment-name>.convex.cloud`

### GET /api/v1/list_environment_variables

List all environment variables.

**Response:**
```json
{
  "environmentVariables": {
    "OPENAI_API_KEY": "sk-...",
    "DATABASE_URL": "postgres://..."
  }
}
```

### POST /api/v1/update_environment_variables

Set or update environment variables.

> **Warning:** This invalidates all subscriptions!

**Request:**
```json
{
  "variables": {
    "NEW_VAR": "value",
    "ANOTHER_VAR": "another-value"
  }
}
```

---

## Streaming Export API (Beta)

Base URL: `https://<deployment-name>.convex.cloud`

Documentation: https://docs.convex.dev/streaming-export-api

### GET /api/json_schemas

List all tables with their JSON schemas.

**Query Parameters:**
- `deltaSchema` (boolean) - Include metadata fields (`_ts`, `_deleted`, `_table`)
- `format` (string) - Output format, currently only `json`

**Response:**
```json
{
  "users": {
    "$id": "https://example.com/schemas/user.json",
    "title": "User",
    "type": "object",
    "properties": {
      "_id": {
        "type": "string",
        "$description": "Convex unique ID for the document."
      },
      "name": {
        "type": "string"
      },
      "email": {
        "type": "string",
        "format": "email"
      },
      "_creationTime": {
        "type": "number",
        "$description": "Timestamp of document creation."
      }
    },
    "required": ["_id", "name", "email", "_creationTime"]
  },
  "messages": {
    ...
  }
}
```

### GET /api/list_snapshot

Walk a consistent snapshot of documents with pagination.

**Query Parameters:**
- `snapshot` (int) - Database timestamp to continue from
- `cursor` (string) - Pagination cursor
- `tableName` (string) - Filter to specific table
- `format` (string) - Output format

**Response:**
```json
{
  "values": [
    {
      "_id": "abc123",
      "_creationTime": 1678886400000,
      "name": "Alice",
      "_ts": 1678886400000,
      "_table": "users"
    }
  ],
  "hasMore": true,
  "snapshot": 1678886460000,
  "cursor": "eyJjdXJzb3IiOiJhYmMxMjMifQ=="
}
```

### GET /api/document_deltas

Access the change log of documents.

**Query Parameters:**
- `cursor` (int) - Required. Database timestamp to start from
- `tableName` (string) - Filter to specific table
- `format` (string) - Output format

**Response:**
```json
{
  "values": [
    {
      "_id": "abc123",
      "_ts": 1678886500000,
      "name": "Alice Updated"
    },
    {
      "_id": "xyz789",
      "_ts": 1678886600000,
      "_deleted": true
    }
  ],
  "cursor": 1678886600000,
  "hasMore": false
}
```

---

## Error Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 400 | Bad Request | Invalid JSON, missing required fields |
| 401 | Unauthorized | Invalid/expired token or deploy key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Function/project/deployment doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Convex service error |

## Rate Limits

- Management API: ~100 requests/minute
- Deployment API: Higher limits, varies by plan
- Streaming Export: Subject to beta limitations

## References

- [Convex HTTP API](https://docs.convex.dev/http-api/)
- [Convex Streaming Export API](https://docs.convex.dev/streaming-export-api)
- [Convex Deployment Platform API](https://docs.convex.dev/deployment-platform-api)
- [Convex Management API OpenAPI](https://api.convex.dev/v1/openapi.json)

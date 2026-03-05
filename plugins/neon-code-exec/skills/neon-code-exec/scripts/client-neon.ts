/**
 * Neon Code Execution Client
 *
 * Direct connection to Neon Serverless Postgres API for project management,
 * branch operations, database queries, and schema management.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 * @see https://neon.com/docs/reference/api-reference
 * @see https://api-docs.neon.tech/reference/getting-started-with-neon-api
 */

// ============================================================================
// Configuration
// ============================================================================

const NEON_API_BASE = 'https://console.neon.tech/api/v2';

// ============================================================================
// Types - Core
// ============================================================================

export interface NeonConfig {
  apiKey: string;
}

export interface NeonError {
  code: string;
  message: string;
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginationResponse {
  cursor?: string;
}

// ============================================================================
// Types - Organizations
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  handle?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Types - Projects
// ============================================================================

export interface Project {
  id: string;
  platform_id?: string;
  region_id: string;
  name: string;
  provisioner?: string;
  default_endpoint_settings?: EndpointSettings;
  settings?: ProjectSettings;
  pg_version: number;
  proxy_host: string;
  branch_logical_size_limit?: number;
  branch_logical_size_limit_bytes?: number;
  store_passwords: boolean;
  maintenance_starts_at?: string;
  creation_source: string;
  history_retention_seconds?: number;
  created_at: string;
  updated_at: string;
  synthetic_storage_size?: number;
  quota?: ProjectQuota;
  owner_id: string;
  org_id?: string;
}

export interface ProjectSettings {
  quota?: ProjectQuota;
  allowed_ips?: AllowedIps;
  enable_logical_replication?: boolean;
}

export interface ProjectQuota {
  active_time_seconds?: number;
  compute_time_seconds?: number;
  written_data_bytes?: number;
  data_transfer_bytes?: number;
  logical_size_bytes?: number;
}

export interface AllowedIps {
  ips: string[];
  primary_branch_only?: boolean;
}

export interface EndpointSettings {
  autoscaling_limit_min_cu?: number;
  autoscaling_limit_max_cu?: number;
  suspend_timeout_seconds?: number;
}

export interface CreateProjectParams {
  name?: string;
  region_id?: string;
  pg_version?: number;
  org_id?: string;
  default_endpoint_settings?: EndpointSettings;
  branch?: {
    name?: string;
    role_name?: string;
    database_name?: string;
  };
}

export interface UpdateProjectParams {
  name?: string;
  settings?: ProjectSettings;
  default_endpoint_settings?: EndpointSettings;
  history_retention_seconds?: number;
}

// ============================================================================
// Types - Branches
// ============================================================================

export interface Branch {
  id: string;
  project_id: string;
  parent_id?: string;
  parent_lsn?: string;
  parent_timestamp?: string;
  name: string;
  current_state: 'init' | 'ready' | 'archiving' | 'archived';
  state_changed_at?: string;
  logical_size?: number;
  creation_source: string;
  primary: boolean;
  default: boolean;
  protected: boolean;
  cpu_used_sec: number;
  compute_time_seconds: number;
  active_time_seconds: number;
  written_data_bytes: number;
  data_transfer_bytes: number;
  created_at: string;
  updated_at: string;
  created_by?: {
    name: string;
    image?: string;
  };
}

export interface CreateBranchParams {
  name?: string;
  parent_id?: string;
  parent_lsn?: string;
  parent_timestamp?: string;
  endpoints?: CreateEndpointParams[];
}

export interface UpdateBranchParams {
  name?: string;
  protected?: boolean;
}

// ============================================================================
// Types - Databases
// ============================================================================

export interface Database {
  id: number;
  branch_id: string;
  name: string;
  owner_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDatabaseParams {
  name: string;
  owner_name: string;
}

export interface UpdateDatabaseParams {
  name?: string;
  owner_name?: string;
}

// ============================================================================
// Types - Roles
// ============================================================================

export interface Role {
  branch_id: string;
  name: string;
  password?: string;
  protected: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleParams {
  name: string;
}

// ============================================================================
// Types - Endpoints (Computes)
// ============================================================================

export interface Endpoint {
  id: string;
  host: string;
  project_id: string;
  branch_id: string;
  region_id: string;
  autoscaling_limit_min_cu: number;
  autoscaling_limit_max_cu: number;
  type: 'read_write' | 'read_only';
  current_state: 'init' | 'active' | 'idle';
  settings?: EndpointSettings;
  pooler_enabled: boolean;
  pooler_mode: 'transaction' | 'session';
  disabled: boolean;
  passwordless_access: boolean;
  creation_source: string;
  suspend_timeout_seconds: number;
  provisioner?: string;
  compute_release_version?: string;
  created_at: string;
  updated_at: string;
  proxy_host: string;
}

export interface CreateEndpointParams {
  type: 'read_write' | 'read_only';
  branch_id?: string;
  autoscaling_limit_min_cu?: number;
  autoscaling_limit_max_cu?: number;
  suspend_timeout_seconds?: number;
  pooler_enabled?: boolean;
  pooler_mode?: 'transaction' | 'session';
}

export interface UpdateEndpointParams {
  branch_id?: string;
  autoscaling_limit_min_cu?: number;
  autoscaling_limit_max_cu?: number;
  suspend_timeout_seconds?: number;
  pooler_enabled?: boolean;
  pooler_mode?: 'transaction' | 'session';
  disabled?: boolean;
}

// ============================================================================
// Types - Operations
// ============================================================================

export interface Operation {
  id: string;
  project_id: string;
  branch_id?: string;
  endpoint_id?: string;
  action: string;
  status: 'scheduling' | 'running' | 'finished' | 'failed' | 'cancelled' | 'cancelling';
  failures_count: number;
  error?: string;
  created_at: string;
  updated_at: string;
  total_duration_ms?: number;
}

// ============================================================================
// Types - SQL Execution
// ============================================================================

export interface SQLResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number | null;
  fields?: Array<{
    name: string;
    dataTypeID: number;
  }>;
}

export interface ExplainResult {
  plan: string;
  executionTime?: number;
}

export interface TableInfo {
  schema: string;
  name: string;
  type: 'table' | 'view';
  owner: string;
}

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: 'YES' | 'NO';
  column_default: string | null;
  character_maximum_length: number | null;
}

// ============================================================================
// Types - Connection
// ============================================================================

export interface ConnectionString {
  uri: string;
  host: string;
  database: string;
  role: string;
  password: string;
  pooled: boolean;
}

// ============================================================================
// Types - Schema Comparison
// ============================================================================

export interface SchemaDiff {
  diff: string;
}

// ============================================================================
// Types - API Keys
// ============================================================================

export interface ApiKey {
  id: number;
  name: string;
  created_at: string;
  last_used_at?: string;
  last_used_from_addr?: string;
}

// ============================================================================
// Types - Regions
// ============================================================================

export interface Region {
  region_id: string;
  region_name: string;
  default: boolean;
}

// Available Neon regions
export const NEON_REGIONS: Record<string, string> = {
  'aws-us-east-1': 'US East (N. Virginia)',
  'aws-us-east-2': 'US East (Ohio)',
  'aws-us-west-2': 'US West (Oregon)',
  'aws-eu-central-1': 'Europe (Frankfurt)',
  'aws-eu-west-1': 'Europe (Ireland)',
  'aws-eu-west-2': 'Europe (London)',
  'aws-ap-southeast-1': 'Asia Pacific (Singapore)',
  'aws-ap-southeast-2': 'Asia Pacific (Sydney)',
  'azure-eastus2': 'Azure US East 2',
};

// ============================================================================
// Local Utility Functions (no network)
// ============================================================================

/**
 * Validate a Neon API key format
 */
export function validateApiKey(apiKey: string): { valid: boolean; message?: string } {
  if (!apiKey) {
    return { valid: false, message: 'API key is required' };
  }
  // Neon API keys are typically long alphanumeric strings
  if (apiKey.length < 20) {
    return { valid: false, message: 'API key appears too short' };
  }
  return { valid: true };
}

/**
 * Get default API key from environment
 */
export function getDefaultApiKey(): string | undefined {
  return process.env.NEON_API_KEY;
}

/**
 * Check if API key is available
 */
export function hasApiKey(): boolean {
  return !!getDefaultApiKey();
}

/**
 * Build a PostgreSQL connection string from components
 */
export function buildConnectionString(params: {
  host: string;
  database: string;
  role: string;
  password: string;
  sslmode?: string;
  pooled?: boolean;
}): string {
  const { host, database, role, password, sslmode = 'require', pooled = false } = params;
  const actualHost = pooled ? host.replace('.neon.tech', '-pooler.neon.tech') : host;
  return `postgresql://${encodeURIComponent(role)}:${encodeURIComponent(password)}@${actualHost}/${database}?sslmode=${sslmode}`;
}

/**
 * Parse a Neon connection string into components
 */
export function parseConnectionString(uri: string): {
  host: string;
  database: string;
  role: string;
  password: string;
  pooled: boolean;
} | null {
  try {
    const url = new URL(uri);
    return {
      host: url.hostname,
      database: url.pathname.slice(1),
      role: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      pooled: url.hostname.includes('-pooler'),
    };
  } catch {
    return null;
  }
}

/**
 * Get a region's display name
 */
export function getRegionName(regionId: string): string {
  return NEON_REGIONS[regionId] || regionId;
}

/**
 * List available regions
 */
export function listRegions(): Array<{ id: string; name: string }> {
  return Object.entries(NEON_REGIONS).map(([id, name]) => ({ id, name }));
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format compute units to human-readable string
 */
export function formatComputeUnits(cu: number): string {
  return `${cu} CU (${cu} vCPU, ${cu * 4} GB RAM)`;
}

/**
 * Get getting started guide for Neon
 */
export function getGettingStartedGuide(): string {
  return `
# Neon Getting Started Guide

## 1. Get your API Key

1. Go to https://console.neon.tech
2. Click on your profile icon → Account Settings
3. Navigate to "API keys" section
4. Click "Create new API key"
5. Copy the generated key

## 2. Set Environment Variable

\`\`\`bash
export NEON_API_KEY="your-api-key-here"
\`\`\`

Or add to your .env file:
\`\`\`
NEON_API_KEY=your-api-key-here
\`\`\`

## 3. Create Your First Project

\`\`\`typescript
import { createProject } from './client-neon.js';

const project = await createProject({
  name: 'my-first-project',
  region_id: 'aws-us-east-1',
  pg_version: 16
});
console.log('Project ID:', project.id);
\`\`\`

## 4. Execute SQL Queries

\`\`\`typescript
import { runSql } from './client-neon.js';

// Create a table
await runSql({
  projectId: 'your-project-id',
  sql: 'CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT)'
});

// Insert data
await runSql({
  projectId: 'your-project-id',
  sql: "INSERT INTO users (name) VALUES ('Alice'), ('Bob')"
});

// Query data
const result = await runSql({
  projectId: 'your-project-id',
  sql: 'SELECT * FROM users'
});
console.log(result.rows);
\`\`\`

## 5. Work with Branches

Neon's killer feature is instant database branching:

\`\`\`typescript
import { createBranch, runSql } from './client-neon.js';

// Create a development branch
const branch = await createBranch({
  projectId: 'your-project-id',
  name: 'development'
});

// Run queries on the branch
await runSql({
  projectId: 'your-project-id',
  branchId: branch.id,
  sql: 'ALTER TABLE users ADD COLUMN email TEXT'
});
\`\`\`

## Available Regions

| Region ID | Location |
|-----------|----------|
| aws-us-east-1 | US East (N. Virginia) |
| aws-us-east-2 | US East (Ohio) |
| aws-us-west-2 | US West (Oregon) |
| aws-eu-central-1 | Europe (Frankfurt) |
| aws-eu-west-1 | Europe (Ireland) |
| aws-eu-west-2 | Europe (London) |
| aws-ap-southeast-1 | Asia Pacific (Singapore) |
| aws-ap-southeast-2 | Asia Pacific (Sydney) |

## Rate Limits

- Standard: 700 requests/minute
- Burst: Up to 40 requests/second per route

## Resources

- Console: https://console.neon.tech
- Documentation: https://neon.com/docs
- API Reference: https://api-docs.neon.tech
`;
}

/**
 * Get common error codes and solutions
 */
export function getErrorReference(): Record<string, string> {
  return {
    'unauthorized': 'Invalid or missing API key. Check your NEON_API_KEY environment variable.',
    'not_found': 'Resource not found. Verify the project/branch/database ID.',
    'forbidden': 'Permission denied. You may not have access to this resource.',
    'conflict': 'Resource already exists or operation conflicts with current state.',
    'rate_limited': 'Too many requests. Wait a moment and retry (max 700 req/min).',
    'invalid_request': 'Invalid request parameters. Check your input values.',
    'internal_error': 'Neon service error. Try again later.',
    'project_limit_exceeded': 'Project limit reached for your plan. Upgrade or delete unused projects.',
    'branch_limit_exceeded': 'Branch limit reached. Delete unused branches.',
    'compute_time_exceeded': 'Compute time quota exceeded. Upgrade your plan.',
  };
}

// ============================================================================
// API Key Validation with User Guidance
// ============================================================================

export interface ApiKeyCheckResult {
  found: boolean;
  valid: boolean;
  message: string;
  instructions?: string;
}

/**
 * Check for API key and provide user guidance if not found.
 * Call this function at the start of any Neon operation to ensure
 * the user has configured their API key correctly.
 *
 * @returns ApiKeyCheckResult with status and instructions
 */
export function checkApiKeyWithGuidance(): ApiKeyCheckResult {
  const apiKey = getDefaultApiKey();

  if (!apiKey) {
    return {
      found: false,
      valid: false,
      message: '⚠️ NEON_API_KEY not found in environment variables',
      instructions: `
╔══════════════════════════════════════════════════════════════════════════════╗
║                        NEON API KEY REQUIRED                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  To use the Neon Code Execution skill, you need to set up your API key.     ║
║                                                                              ║
║  HOW TO GET YOUR API KEY:                                                    ║
║  ─────────────────────────                                                   ║
║  1. Go to https://console.neon.tech                                         ║
║  2. Click on your profile icon (top-right corner)                           ║
║  3. Select "Account Settings"                                               ║
║  4. Navigate to "API keys" section                                          ║
║  5. Click "Create new API key"                                              ║
║  6. Copy the generated key (you won't be able to see it again!)             ║
║                                                                              ║
║  HOW TO SET THE ENVIRONMENT VARIABLE:                                        ║
║  ────────────────────────────────────                                        ║
║                                                                              ║
║  Option 1: Export in terminal (temporary, for current session)              ║
║  ┌──────────────────────────────────────────────────────────────┐           ║
║  │ export NEON_API_KEY="your-api-key-here"                      │           ║
║  └──────────────────────────────────────────────────────────────┘           ║
║                                                                              ║
║  Option 2: Add to .env file (persistent, recommended)                       ║
║  ┌──────────────────────────────────────────────────────────────┐           ║
║  │ NEON_API_KEY=your-api-key-here                               │           ║
║  └──────────────────────────────────────────────────────────────┘           ║
║                                                                              ║
║  Then reload your environment:                                               ║
║  - If using .env: run 'source .env' or restart your terminal                ║
║  - If using VS Code: restart the integrated terminal                        ║
║                                                                              ║
║  Please confirm you have set up the API key before proceeding.              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`
    };
  }

  // Validate format
  const validation = validateApiKey(apiKey);
  if (!validation.valid) {
    return {
      found: true,
      valid: false,
      message: `⚠️ API key found but appears invalid: ${validation.message}`,
      instructions: `
╔══════════════════════════════════════════════════════════════════════════════╗
║                      INVALID NEON API KEY FORMAT                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Your NEON_API_KEY appears to be invalid: ${validation.message?.padEnd(30)}  ║
║                                                                              ║
║  Please verify your API key:                                                 ║
║  1. Go to https://console.neon.tech → Account Settings → API keys           ║
║  2. Create a new API key if needed                                          ║
║  3. Update your environment variable with the correct key                   ║
║                                                                              ║
║  Example (in .env file):                                                     ║
║  ┌──────────────────────────────────────────────────────────────┐           ║
║  │ NEON_API_KEY=your-correct-api-key-here                       │           ║
║  └──────────────────────────────────────────────────────────────┘           ║
║                                                                              ║
║  Please confirm you have corrected the API key before proceeding.           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`
    };
  }

  return {
    found: true,
    valid: true,
    message: '✅ NEON_API_KEY found and valid'
  };
}

/**
 * Ensure API key is available before proceeding.
 * Throws an error with detailed instructions if not found.
 */
export function ensureApiKey(): void {
  const check = checkApiKeyWithGuidance();
  if (!check.valid) {
    console.log(check.instructions);
    throw new Error(check.message);
  }
}

/**
 * Get a formatted message for requesting user confirmation after API key setup.
 */
export function getApiKeyConfirmationPrompt(): string {
  return `
Have you set up your NEON_API_KEY environment variable?

Please confirm by typing:
- "yes" or "done" if you have set up the API key
- "help" if you need the instructions again
- "cancel" to abort the operation
`;
}

// ============================================================================
// Core API Request Function
// ============================================================================

async function neonRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
  config?: NeonConfig
): Promise<T> {
  const apiKey = config?.apiKey || getDefaultApiKey();

  if (!apiKey) {
    throw new Error('Neon API key is required. Set NEON_API_KEY environment variable or pass config.apiKey');
  }

  const url = `${NEON_API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// Organizations API
// ============================================================================

/**
 * List all organizations accessible to the user
 */
export async function listOrganizations(
  params?: { search?: string },
  config?: NeonConfig
): Promise<{ organizations: Organization[] }> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  return neonRequest(`/users/me/organizations${query ? `?${query}` : ''}`, 'GET', undefined, config);
}

// ============================================================================
// Projects API
// ============================================================================

/**
 * List all projects
 */
export async function listProjects(
  params?: PaginationParams & { search?: string; org_id?: string },
  config?: NeonConfig
): Promise<{ projects: Project[]; pagination?: PaginationResponse }> {
  const searchParams = new URLSearchParams();
  if (params?.cursor) searchParams.set('cursor', params.cursor);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.search) searchParams.set('search', params.search);
  if (params?.org_id) searchParams.set('org_id', params.org_id);

  const query = searchParams.toString();
  return neonRequest(`/projects${query ? `?${query}` : ''}`, 'GET', undefined, config);
}

/**
 * List shared projects
 */
export async function listSharedProjects(
  params?: PaginationParams & { search?: string },
  config?: NeonConfig
): Promise<{ projects: Project[]; pagination?: PaginationResponse }> {
  const searchParams = new URLSearchParams();
  if (params?.cursor) searchParams.set('cursor', params.cursor);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  return neonRequest(`/projects/shared${query ? `?${query}` : ''}`, 'GET', undefined, config);
}

/**
 * Get a specific project
 */
export async function getProject(
  projectId: string,
  config?: NeonConfig
): Promise<{ project: Project }> {
  return neonRequest(`/projects/${projectId}`, 'GET', undefined, config);
}

/**
 * Create a new project
 */
export async function createProject(
  params?: CreateProjectParams,
  config?: NeonConfig
): Promise<{
  project: Project;
  branch: Branch;
  endpoints: Endpoint[];
  databases: Database[];
  roles: Role[];
  operations: Operation[];
  connection_uris: Array<{ connection_uri: string; connection_parameters: Record<string, string> }>;
}> {
  return neonRequest('/projects', 'POST', { project: params || {} }, config);
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  params: UpdateProjectParams,
  config?: NeonConfig
): Promise<{ project: Project; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}`, 'PATCH', { project: params }, config);
}

/**
 * Delete a project
 */
export async function deleteProject(
  projectId: string,
  config?: NeonConfig
): Promise<{ project: Project }> {
  return neonRequest(`/projects/${projectId}`, 'DELETE', undefined, config);
}

// ============================================================================
// Branches API
// ============================================================================

/**
 * List all branches for a project
 */
export async function listBranches(
  projectId: string,
  params?: PaginationParams,
  config?: NeonConfig
): Promise<{ branches: Branch[]; pagination?: PaginationResponse }> {
  const searchParams = new URLSearchParams();
  if (params?.cursor) searchParams.set('cursor', params.cursor);
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const query = searchParams.toString();
  return neonRequest(`/projects/${projectId}/branches${query ? `?${query}` : ''}`, 'GET', undefined, config);
}

/**
 * Get a specific branch
 */
export async function getBranch(
  projectId: string,
  branchId: string,
  config?: NeonConfig
): Promise<{ branch: Branch }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}`, 'GET', undefined, config);
}

/**
 * Create a new branch
 */
export async function createBranch(
  projectId: string,
  params?: CreateBranchParams,
  config?: NeonConfig
): Promise<{
  branch: Branch;
  endpoints: Endpoint[];
  operations: Operation[];
  connection_uris?: Array<{ connection_uri: string; connection_parameters: Record<string, string> }>;
}> {
  return neonRequest(`/projects/${projectId}/branches`, 'POST', { branch: params || {}, endpoints: params?.endpoints }, config);
}

/**
 * Update a branch
 */
export async function updateBranch(
  projectId: string,
  branchId: string,
  params: UpdateBranchParams,
  config?: NeonConfig
): Promise<{ branch: Branch; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}`, 'PATCH', { branch: params }, config);
}

/**
 * Delete a branch
 */
export async function deleteBranch(
  projectId: string,
  branchId: string,
  config?: NeonConfig
): Promise<{ branch: Branch; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}`, 'DELETE', undefined, config);
}

/**
 * Set a branch as default
 */
export async function setDefaultBranch(
  projectId: string,
  branchId: string,
  config?: NeonConfig
): Promise<{ branch: Branch; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/set_as_default`, 'POST', undefined, config);
}

/**
 * Reset a branch to its parent
 */
export async function resetBranchFromParent(
  projectId: string,
  branchId: string,
  params?: { preserve_under_name?: string },
  config?: NeonConfig
): Promise<{ branch: Branch; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/restore`, 'POST', params, config);
}

/**
 * Get branch schema
 */
export async function getBranchSchema(
  projectId: string,
  branchId: string,
  params?: { db_name?: string; role?: string },
  config?: NeonConfig
): Promise<{ sql: string }> {
  const searchParams = new URLSearchParams();
  if (params?.db_name) searchParams.set('db_name', params.db_name);
  if (params?.role) searchParams.set('role', params.role);

  const query = searchParams.toString();
  return neonRequest(`/projects/${projectId}/branches/${branchId}/schema${query ? `?${query}` : ''}`, 'GET', undefined, config);
}

/**
 * Compare branch schemas
 */
export async function compareBranchSchemas(
  projectId: string,
  branchId: string,
  params: { base_branch_id: string; db_name?: string },
  config?: NeonConfig
): Promise<SchemaDiff> {
  const searchParams = new URLSearchParams();
  searchParams.set('base_branch_id', params.base_branch_id);
  if (params.db_name) searchParams.set('db_name', params.db_name);

  return neonRequest(`/projects/${projectId}/branches/${branchId}/schema/diff?${searchParams}`, 'GET', undefined, config);
}

// ============================================================================
// Databases API
// ============================================================================

/**
 * List all databases for a branch
 */
export async function listDatabases(
  projectId: string,
  branchId: string,
  config?: NeonConfig
): Promise<{ databases: Database[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/databases`, 'GET', undefined, config);
}

/**
 * Get a specific database
 */
export async function getDatabase(
  projectId: string,
  branchId: string,
  databaseName: string,
  config?: NeonConfig
): Promise<{ database: Database }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/databases/${databaseName}`, 'GET', undefined, config);
}

/**
 * Create a new database
 */
export async function createDatabase(
  projectId: string,
  branchId: string,
  params: CreateDatabaseParams,
  config?: NeonConfig
): Promise<{ database: Database; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/databases`, 'POST', { database: params }, config);
}

/**
 * Update a database
 */
export async function updateDatabase(
  projectId: string,
  branchId: string,
  databaseName: string,
  params: UpdateDatabaseParams,
  config?: NeonConfig
): Promise<{ database: Database; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/databases/${databaseName}`, 'PATCH', { database: params }, config);
}

/**
 * Delete a database
 */
export async function deleteDatabase(
  projectId: string,
  branchId: string,
  databaseName: string,
  config?: NeonConfig
): Promise<{ database: Database; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/databases/${databaseName}`, 'DELETE', undefined, config);
}

// ============================================================================
// Roles API
// ============================================================================

/**
 * List all roles for a branch
 */
export async function listRoles(
  projectId: string,
  branchId: string,
  config?: NeonConfig
): Promise<{ roles: Role[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/roles`, 'GET', undefined, config);
}

/**
 * Get a specific role
 */
export async function getRole(
  projectId: string,
  branchId: string,
  roleName: string,
  config?: NeonConfig
): Promise<{ role: Role }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/roles/${roleName}`, 'GET', undefined, config);
}

/**
 * Create a new role
 */
export async function createRole(
  projectId: string,
  branchId: string,
  params: CreateRoleParams,
  config?: NeonConfig
): Promise<{ role: Role; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/roles`, 'POST', { role: params }, config);
}

/**
 * Delete a role
 */
export async function deleteRole(
  projectId: string,
  branchId: string,
  roleName: string,
  config?: NeonConfig
): Promise<{ role: Role; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/roles/${roleName}`, 'DELETE', undefined, config);
}

/**
 * Reset a role's password
 */
export async function resetRolePassword(
  projectId: string,
  branchId: string,
  roleName: string,
  config?: NeonConfig
): Promise<{ role: Role; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/branches/${branchId}/roles/${roleName}/reset_password`, 'POST', undefined, config);
}

// ============================================================================
// Endpoints (Computes) API
// ============================================================================

/**
 * List all endpoints for a project
 */
export async function listEndpoints(
  projectId: string,
  config?: NeonConfig
): Promise<{ endpoints: Endpoint[] }> {
  return neonRequest(`/projects/${projectId}/endpoints`, 'GET', undefined, config);
}

/**
 * Get a specific endpoint
 */
export async function getEndpoint(
  projectId: string,
  endpointId: string,
  config?: NeonConfig
): Promise<{ endpoint: Endpoint }> {
  return neonRequest(`/projects/${projectId}/endpoints/${endpointId}`, 'GET', undefined, config);
}

/**
 * Create a new endpoint
 */
export async function createEndpoint(
  projectId: string,
  params: CreateEndpointParams & { branch_id: string },
  config?: NeonConfig
): Promise<{ endpoint: Endpoint; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/endpoints`, 'POST', { endpoint: params }, config);
}

/**
 * Update an endpoint
 */
export async function updateEndpoint(
  projectId: string,
  endpointId: string,
  params: UpdateEndpointParams,
  config?: NeonConfig
): Promise<{ endpoint: Endpoint; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/endpoints/${endpointId}`, 'PATCH', { endpoint: params }, config);
}

/**
 * Delete an endpoint
 */
export async function deleteEndpoint(
  projectId: string,
  endpointId: string,
  config?: NeonConfig
): Promise<{ endpoint: Endpoint; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/endpoints/${endpointId}`, 'DELETE', undefined, config);
}

/**
 * Start an endpoint
 */
export async function startEndpoint(
  projectId: string,
  endpointId: string,
  config?: NeonConfig
): Promise<{ endpoint: Endpoint; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/endpoints/${endpointId}/start`, 'POST', undefined, config);
}

/**
 * Suspend an endpoint
 */
export async function suspendEndpoint(
  projectId: string,
  endpointId: string,
  config?: NeonConfig
): Promise<{ endpoint: Endpoint; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/endpoints/${endpointId}/suspend`, 'POST', undefined, config);
}

/**
 * Restart an endpoint
 */
export async function restartEndpoint(
  projectId: string,
  endpointId: string,
  config?: NeonConfig
): Promise<{ endpoint: Endpoint; operations: Operation[] }> {
  return neonRequest(`/projects/${projectId}/endpoints/${endpointId}/restart`, 'POST', undefined, config);
}

// ============================================================================
// Operations API
// ============================================================================

/**
 * List all operations for a project
 */
export async function listOperations(
  projectId: string,
  params?: PaginationParams,
  config?: NeonConfig
): Promise<{ operations: Operation[]; pagination?: PaginationResponse }> {
  const searchParams = new URLSearchParams();
  if (params?.cursor) searchParams.set('cursor', params.cursor);
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const query = searchParams.toString();
  return neonRequest(`/projects/${projectId}/operations${query ? `?${query}` : ''}`, 'GET', undefined, config);
}

/**
 * Get a specific operation
 */
export async function getOperation(
  projectId: string,
  operationId: string,
  config?: NeonConfig
): Promise<{ operation: Operation }> {
  return neonRequest(`/projects/${projectId}/operations/${operationId}`, 'GET', undefined, config);
}

/**
 * Wait for an operation to complete
 */
export async function waitForOperation(
  projectId: string,
  operationId: string,
  options?: { timeout?: number; interval?: number },
  config?: NeonConfig
): Promise<Operation> {
  const timeout = options?.timeout || 300000; // 5 minutes default
  const interval = options?.interval || 2000; // 2 seconds default
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const { operation } = await getOperation(projectId, operationId, config);

    if (operation.status === 'finished') {
      return operation;
    }

    if (operation.status === 'failed' || operation.status === 'cancelled') {
      throw new Error(`Operation ${operationId} ${operation.status}: ${operation.error || 'Unknown error'}`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Operation ${operationId} timed out after ${timeout}ms`);
}

// ============================================================================
// Connection String API
// ============================================================================

/**
 * Get connection string for a database
 */
export async function getConnectionString(
  projectId: string,
  params?: {
    branch_id?: string;
    endpoint_id?: string;
    database_name?: string;
    role_name?: string;
    pooled?: boolean;
  },
  config?: NeonConfig
): Promise<{ uri: string }> {
  const searchParams = new URLSearchParams();
  if (params?.branch_id) searchParams.set('branch_id', params.branch_id);
  if (params?.endpoint_id) searchParams.set('endpoint_id', params.endpoint_id);
  if (params?.database_name) searchParams.set('database_name', params.database_name);
  if (params?.role_name) searchParams.set('role_name', params.role_name);
  if (params?.pooled !== undefined) searchParams.set('pooled', params.pooled.toString());

  const query = searchParams.toString();
  return neonRequest(`/projects/${projectId}/connection_uri${query ? `?${query}` : ''}`, 'GET', undefined, config);
}

// ============================================================================
// SQL Execution via Neon Serverless Driver
// ============================================================================

/**
 * Execute a SQL query using the Neon Serverless Driver over HTTP
 */
export async function runSql<T = Record<string, unknown>>(
  params: {
    projectId: string;
    branchId?: string;
    databaseName?: string;
    sql: string;
  },
  config?: NeonConfig
): Promise<SQLResult<T>> {
  // First, get the connection string
  const { uri } = await getConnectionString(
    params.projectId,
    {
      branch_id: params.branchId,
      database_name: params.databaseName || 'neondb',
    },
    config
  );

  // Parse the connection string to get host info
  const parsed = parseConnectionString(uri);
  if (!parsed) {
    throw new Error('Failed to parse connection string');
  }

  // Use the Neon HTTP SQL API
  const sqlEndpoint = `https://${parsed.host}/sql`;

  const response = await fetch(sqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': uri,
    },
    body: JSON.stringify({
      query: params.sql,
      params: [],
    }),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  return {
    rows: data.rows || [],
    rowCount: data.rowCount ?? data.rows?.length ?? null,
    fields: data.fields,
  };
}

/**
 * Execute multiple SQL statements in a transaction
 */
export async function runSqlTransaction<T = Record<string, unknown>>(
  params: {
    projectId: string;
    branchId?: string;
    databaseName?: string;
    sqlStatements: string[];
  },
  config?: NeonConfig
): Promise<SQLResult<T>[]> {
  const results: SQLResult<T>[] = [];

  // Wrap in transaction
  await runSql({ ...params, sql: 'BEGIN' }, config);

  try {
    for (const sql of params.sqlStatements) {
      const result = await runSql<T>({ ...params, sql }, config);
      results.push(result);
    }
    await runSql({ ...params, sql: 'COMMIT' }, config);
  } catch (error) {
    await runSql({ ...params, sql: 'ROLLBACK' }, config);
    throw error;
  }

  return results;
}

/**
 * Explain a SQL query (get execution plan)
 */
export async function explainSql(
  params: {
    projectId: string;
    branchId?: string;
    databaseName?: string;
    sql: string;
    analyze?: boolean;
  },
  config?: NeonConfig
): Promise<ExplainResult> {
  const explainPrefix = params.analyze ? 'EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT TEXT)' : 'EXPLAIN (COSTS, VERBOSE, FORMAT TEXT)';
  const result = await runSql<{ 'QUERY PLAN': string }>({
    projectId: params.projectId,
    branchId: params.branchId,
    databaseName: params.databaseName,
    sql: `${explainPrefix} ${params.sql}`,
  }, config);

  const planLines = result.rows.map(row => row['QUERY PLAN']);

  return {
    plan: planLines.join('\n'),
  };
}

/**
 * Get all tables in a database
 */
export async function getTables(
  params: {
    projectId: string;
    branchId?: string;
    databaseName?: string;
  },
  config?: NeonConfig
): Promise<TableInfo[]> {
  const result = await runSql<TableInfo>({
    projectId: params.projectId,
    branchId: params.branchId,
    databaseName: params.databaseName,
    sql: `
      SELECT
        schemaname as schema,
        tablename as name,
        'table' as type,
        tableowner as owner
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      UNION ALL
      SELECT
        schemaname as schema,
        viewname as name,
        'view' as type,
        viewowner as owner
      FROM pg_views
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema, name
    `,
  }, config);

  return result.rows;
}

/**
 * Get the schema of a specific table
 */
export async function getTableSchema(
  params: {
    projectId: string;
    branchId?: string;
    databaseName?: string;
    tableName: string;
    schemaName?: string;
  },
  config?: NeonConfig
): Promise<ColumnInfo[]> {
  const schemaName = params.schemaName || 'public';

  const result = await runSql<ColumnInfo>({
    projectId: params.projectId,
    branchId: params.branchId,
    databaseName: params.databaseName,
    sql: `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = '${schemaName}'
        AND table_name = '${params.tableName}'
      ORDER BY ordinal_position
    `,
  }, config);

  return result.rows;
}

/**
 * List slow queries from pg_stat_statements
 */
export async function listSlowQueries(
  params: {
    projectId: string;
    branchId?: string;
    databaseName?: string;
    minExecutionTimeMs?: number;
    limit?: number;
  },
  config?: NeonConfig
): Promise<Array<{
  query: string;
  calls: number;
  total_time: number;
  mean_time: number;
  rows: number;
}>> {
  const minTime = params.minExecutionTimeMs || 1000;
  const limit = params.limit || 10;

  const result = await runSql<{
    query: string;
    calls: number;
    total_time: number;
    mean_time: number;
    rows: number;
  }>({
    projectId: params.projectId,
    branchId: params.branchId,
    databaseName: params.databaseName,
    sql: `
      SELECT
        query,
        calls,
        total_exec_time as total_time,
        mean_exec_time as mean_time,
        rows
      FROM pg_stat_statements
      WHERE mean_exec_time > ${minTime}
      ORDER BY mean_exec_time DESC
      LIMIT ${limit}
    `,
  }, config);

  return result.rows;
}

// ============================================================================
// API Keys API
// ============================================================================

/**
 * List all API keys for the account
 */
export async function listApiKeys(
  config?: NeonConfig
): Promise<{ api_keys: ApiKey[] }> {
  return neonRequest('/api_keys', 'GET', undefined, config);
}

/**
 * Create a new API key
 */
export async function createApiKey(
  params: { name: string },
  config?: NeonConfig
): Promise<{ id: number; key: string }> {
  return neonRequest('/api_keys', 'POST', params, config);
}

/**
 * Delete an API key
 */
export async function deleteApiKey(
  keyId: number,
  config?: NeonConfig
): Promise<{ id: number; name: string; revoked: boolean }> {
  return neonRequest(`/api_keys/${keyId}`, 'DELETE', undefined, config);
}

// ============================================================================
// Search API
// ============================================================================

/**
 * Search across projects, branches, and other resources
 */
export async function search(
  query: string,
  config?: NeonConfig
): Promise<{
  results: Array<{
    id: string;
    title: string;
    url: string;
    type: 'project' | 'branch' | 'organization';
  }>;
}> {
  return neonRequest(`/search?query=${encodeURIComponent(query)}`, 'GET', undefined, config);
}

// ============================================================================
// Batch Operations (Convenience Functions)
// ============================================================================

/**
 * Create a project with a development branch
 */
export async function createProjectWithDevBranch(
  params: CreateProjectParams & { devBranchName?: string },
  config?: NeonConfig
): Promise<{
  project: Project;
  mainBranch: Branch;
  devBranch: Branch;
}> {
  // Create the project
  const projectResult = await createProject(params, config);
  const mainBranch = projectResult.branch;

  // Create development branch
  const devBranchResult = await createBranch(
    projectResult.project.id,
    { name: params.devBranchName || 'development' },
    config
  );

  return {
    project: projectResult.project,
    mainBranch,
    devBranch: devBranchResult.branch,
  };
}

/**
 * Clone a branch with all its databases
 */
export async function cloneBranch(
  params: {
    projectId: string;
    sourceBranchId: string;
    newBranchName: string;
  },
  config?: NeonConfig
): Promise<{
  branch: Branch;
  endpoints: Endpoint[];
}> {
  const result = await createBranch(
    params.projectId,
    {
      name: params.newBranchName,
      parent_id: params.sourceBranchId,
    },
    config
  );

  return {
    branch: result.branch,
    endpoints: result.endpoints,
  };
}

/**
 * Get a full project summary including branches, endpoints, and databases
 */
export async function getProjectSummary(
  projectId: string,
  config?: NeonConfig
): Promise<{
  project: Project;
  branches: Branch[];
  endpoints: Endpoint[];
  databases: Database[];
  roles: Role[];
}> {
  const [projectResult, branchesResult, endpointsResult] = await Promise.all([
    getProject(projectId, config),
    listBranches(projectId, undefined, config),
    listEndpoints(projectId, config),
  ]);

  // Get databases and roles from the default branch
  const defaultBranch = branchesResult.branches.find(b => b.default);
  let databases: Database[] = [];
  let roles: Role[] = [];

  if (defaultBranch) {
    const [dbResult, rolesResult] = await Promise.all([
      listDatabases(projectId, defaultBranch.id, config),
      listRoles(projectId, defaultBranch.id, config),
    ]);
    databases = dbResult.databases;
    roles = rolesResult.roles;
  }

  return {
    project: projectResult.project,
    branches: branchesResult.branches,
    endpoints: endpointsResult.endpoints,
    databases,
    roles,
  };
}

/**
 * Get branch with tree view of objects (databases, schemas, tables)
 */
export async function describeBranch(
  params: {
    projectId: string;
    branchId: string;
    databaseName?: string;
  },
  config?: NeonConfig
): Promise<{
  branch: Branch;
  databases: Database[];
  tables: TableInfo[];
}> {
  const [branchResult, dbResult] = await Promise.all([
    getBranch(params.projectId, params.branchId, config),
    listDatabases(params.projectId, params.branchId, config),
  ]);

  // Get tables from the specified database or default
  const dbName = params.databaseName || dbResult.databases[0]?.name || 'neondb';
  const tables = await getTables({
    projectId: params.projectId,
    branchId: params.branchId,
    databaseName: dbName,
  }, config);

  return {
    branch: branchResult.branch,
    databases: dbResult.databases,
    tables,
  };
}

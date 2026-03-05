/**
 * Convex Code Execution Client
 *
 * Direct connection to Convex APIs for project management, function execution,
 * environment variables, table schema discovery, and code generation assistance.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * This is a HYBRID skill:
 * - Management API: 100% Code Execution
 * - Function Execution (query/mutation/action): 100% Code Execution
 * - Environment Variables: 100% Code Execution
 * - Tables with Schema (Streaming Export API): 100% Code Execution
 * - Code Generation Helpers: 100% Local
 *
 * MCP still required for:
 * - functionSpec (function metadata discovery) - No public API
 * - logs (execution log streaming) - Requires external integration or CLI
 * - runOneoffQuery (sandboxed queries) - MCP sandbox only
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 * @see https://docs.convex.dev
 * @see https://docs.convex.dev/http-api/
 * @see https://docs.convex.dev/streaming-export-api
 * @see https://docs.convex.dev/deployment-platform-api
 */

// ============================================================================
// Configuration
// ============================================================================

const CONVEX_MANAGEMENT_API_BASE = 'https://api.convex.dev/v1';

// ============================================================================
// Types - Core
// ============================================================================

export interface ConvexConfig {
  accessToken?: string;
  deploymentUrl?: string;
  deployKey?: string;
}

export interface ConvexError {
  code: string;
  message: string;
}

// ============================================================================
// Types - Teams & Projects
// ============================================================================

export interface Team {
  id: number;
  name: string;
  slug: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  teamId: number;
  createdAt: string;
}

export interface CreateProjectParams {
  projectName: string;
  deploymentType: 'dev' | 'prod';
}

// ============================================================================
// Types - Deployments
// ============================================================================

export interface Deployment {
  id: number;
  name: string;
  projectId: number;
  deploymentType: 'dev' | 'prod';
  url: string;
  createdAt: string;
}

export interface DeployKey {
  id: number;
  name: string;
  key: string;
  createdAt: string;
}

// ============================================================================
// Types - Custom Domains
// ============================================================================

export interface CustomDomain {
  domain: string;
  status: 'pending' | 'active' | 'failed';
  requestDestination?: string;
  createdAt: string;
}

export interface CreateCustomDomainParams {
  domain: string;
  requestDestination?: string;
}

// ============================================================================
// Types - Function Execution
// ============================================================================

export interface FunctionResult<T = unknown> {
  status: 'success' | 'error';
  value?: T;
  errorMessage?: string;
  errorData?: unknown;
  logLines: string[];
}

export interface FunctionCallParams {
  path: string;
  args: Record<string, unknown>;
  format?: 'json';
}

// ============================================================================
// Types - Environment Variables
// ============================================================================

export interface EnvironmentVariables {
  [key: string]: string;
}

// ============================================================================
// Types - Token Details
// ============================================================================

export interface TokenDetails {
  teamId?: number;
  projectId?: number;
  type: 'team' | 'project' | 'oauth';
}

// ============================================================================
// Types - Validators (for code generation)
// ============================================================================

export type ValidatorType =
  | { type: 'string' }
  | { type: 'number' }
  | { type: 'boolean' }
  | { type: 'null' }
  | { type: 'int64' }
  | { type: 'bytes' }
  | { type: 'id'; tableName: string }
  | { type: 'array'; element: ValidatorType }
  | { type: 'object'; fields: Record<string, ValidatorType> }
  | { type: 'record'; keys: ValidatorType; values: ValidatorType }
  | { type: 'union'; variants: ValidatorType[] }
  | { type: 'literal'; value: string | number | boolean }
  | { type: 'optional'; inner: ValidatorType };

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
 * Get default access token from environment (for Management API)
 */
export function getDefaultAccessToken(): string | undefined {
  return process.env.CONVEX_ACCESS_TOKEN;
}

/**
 * Get default deploy key from environment (for Deployment API)
 */
export function getDefaultDeployKey(): string | undefined {
  return process.env.CONVEX_DEPLOY_KEY;
}

/**
 * Get deployment URL from environment
 */
export function getDeploymentUrl(): string | undefined {
  return process.env.CONVEX_URL;
}

/**
 * Check if access token is available
 */
export function hasAccessToken(): boolean {
  return !!getDefaultAccessToken();
}

/**
 * Check if deploy key is available
 */
export function hasDeployKey(): boolean {
  return !!getDefaultDeployKey();
}

/**
 * Validate token format
 */
export function validateToken(token: string): { valid: boolean; message?: string } {
  if (!token) {
    return { valid: false, message: 'Token is required' };
  }
  if (token.length < 20) {
    return { valid: false, message: 'Token appears too short' };
  }
  return { valid: true };
}

/**
 * Check for access token and provide user guidance if not found.
 */
export function checkAccessTokenWithGuidance(): ApiKeyCheckResult {
  const token = getDefaultAccessToken();

  if (!token) {
    return {
      found: false,
      valid: false,
      message: '⚠️ CONVEX_ACCESS_TOKEN not found in environment variables',
      instructions: `
╔══════════════════════════════════════════════════════════════════════════════╗
║                     CONVEX ACCESS TOKEN REQUIRED                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  To use the Convex Management API, you need an access token.                 ║
║                                                                              ║
║  HOW TO GET YOUR ACCESS TOKEN:                                               ║
║  ─────────────────────────────                                               ║
║  1. Go to https://dashboard.convex.dev                                      ║
║  2. Click on your team name (top-left) → Settings                           ║
║  3. Navigate to "Access Tokens" section                                     ║
║  4. Click "Create Access Token"                                             ║
║  5. Copy the generated token                                                ║
║                                                                              ║
║  HOW TO SET THE ENVIRONMENT VARIABLE:                                        ║
║  ────────────────────────────────────                                        ║
║                                                                              ║
║  Option 1: Export in terminal (temporary)                                   ║
║  ┌──────────────────────────────────────────────────────────────┐           ║
║  │ export CONVEX_ACCESS_TOKEN="your-token-here"                 │           ║
║  └──────────────────────────────────────────────────────────────┘           ║
║                                                                              ║
║  Option 2: Add to .env file (persistent, recommended)                       ║
║  ┌──────────────────────────────────────────────────────────────┐           ║
║  │ CONVEX_ACCESS_TOKEN=your-token-here                          │           ║
║  └──────────────────────────────────────────────────────────────┘           ║
║                                                                              ║
║  Please confirm you have set up the access token before proceeding.         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`
    };
  }

  const validation = validateToken(token);
  if (!validation.valid) {
    return {
      found: true,
      valid: false,
      message: `⚠️ Access token found but appears invalid: ${validation.message}`,
    };
  }

  return {
    found: true,
    valid: true,
    message: '✅ CONVEX_ACCESS_TOKEN found and valid'
  };
}

/**
 * Check for deploy key and provide user guidance if not found.
 */
export function checkDeployKeyWithGuidance(): ApiKeyCheckResult {
  const key = getDefaultDeployKey();
  const url = getDeploymentUrl();

  if (!key) {
    return {
      found: false,
      valid: false,
      message: '⚠️ CONVEX_DEPLOY_KEY not found in environment variables',
      instructions: `
╔══════════════════════════════════════════════════════════════════════════════╗
║                      CONVEX DEPLOY KEY REQUIRED                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  To execute functions on a Convex deployment, you need a deploy key.        ║
║                                                                              ║
║  HOW TO GET YOUR DEPLOY KEY:                                                 ║
║  ───────────────────────────                                                 ║
║  1. Go to https://dashboard.convex.dev                                      ║
║  2. Select your project                                                     ║
║  3. Go to Settings → Deploy Keys                                            ║
║  4. Click "Generate Deploy Key"                                             ║
║  5. Copy the generated key                                                  ║
║                                                                              ║
║  ALSO SET YOUR DEPLOYMENT URL:                                               ║
║  ┌──────────────────────────────────────────────────────────────┐           ║
║  │ export CONVEX_URL="https://your-deployment.convex.cloud"     │           ║
║  │ export CONVEX_DEPLOY_KEY="your-deploy-key-here"              │           ║
║  └──────────────────────────────────────────────────────────────┘           ║
║                                                                              ║
║  Or add to .env file:                                                        ║
║  ┌──────────────────────────────────────────────────────────────┐           ║
║  │ CONVEX_URL=https://your-deployment.convex.cloud              │           ║
║  │ CONVEX_DEPLOY_KEY=your-deploy-key-here                       │           ║
║  └──────────────────────────────────────────────────────────────┘           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`
    };
  }

  if (!url) {
    return {
      found: true,
      valid: false,
      message: '⚠️ CONVEX_URL not found - deployment URL required',
      instructions: `
Set your deployment URL:
  export CONVEX_URL="https://your-deployment.convex.cloud"
`
    };
  }

  return {
    found: true,
    valid: true,
    message: '✅ CONVEX_DEPLOY_KEY and CONVEX_URL found'
  };
}

/**
 * Ensure access token is available before proceeding.
 */
export function ensureAccessToken(): void {
  const check = checkAccessTokenWithGuidance();
  if (!check.valid) {
    console.log(check.instructions);
    throw new Error(check.message);
  }
}

/**
 * Ensure deploy key is available before proceeding.
 */
export function ensureDeployKey(): void {
  const check = checkDeployKeyWithGuidance();
  if (!check.valid) {
    console.log(check.instructions);
    throw new Error(check.message);
  }
}

// ============================================================================
// Core API Request Functions
// ============================================================================

/**
 * Make a request to the Convex Management API
 */
async function managementRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE',
  body?: unknown,
  config?: ConvexConfig
): Promise<T> {
  const token = config?.accessToken || getDefaultAccessToken();

  if (!token) {
    throw new Error('Convex access token is required. Set CONVEX_ACCESS_TOKEN environment variable.');
  }

  const url = `${CONVEX_MANAGEMENT_API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method === 'POST') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

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

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Make a request to a Convex Deployment API
 */
async function deploymentRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST',
  body?: unknown,
  config?: ConvexConfig
): Promise<T> {
  const deployKey = config?.deployKey || getDefaultDeployKey();
  const deploymentUrl = config?.deploymentUrl || getDeploymentUrl();

  if (!deployKey) {
    throw new Error('Convex deploy key is required. Set CONVEX_DEPLOY_KEY environment variable.');
  }

  if (!deploymentUrl) {
    throw new Error('Convex deployment URL is required. Set CONVEX_URL environment variable.');
  }

  const url = `${deploymentUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Authorization': `Convex ${deployKey}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method === 'POST') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message || errorData.errorMessage) {
        errorMessage = errorData.message || errorData.errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// ============================================================================
// Management API - Token Details
// ============================================================================

/**
 * Get details about the current access token
 */
export async function getTokenDetails(
  config?: ConvexConfig
): Promise<TokenDetails> {
  return managementRequest('/token_details', 'GET', undefined, config);
}

// ============================================================================
// Management API - Projects
// ============================================================================

/**
 * List all projects for a team
 */
export async function listProjects(
  teamId: number,
  config?: ConvexConfig
): Promise<{ projects: Project[] }> {
  return managementRequest(`/teams/${teamId}/list_projects`, 'GET', undefined, config);
}

/**
 * Create a new project
 */
export async function createProject(
  teamId: number,
  params: CreateProjectParams,
  config?: ConvexConfig
): Promise<{ project: Project; deployment: Deployment }> {
  return managementRequest(`/teams/${teamId}/create_project`, 'POST', params, config);
}

/**
 * Delete a project (and all its deployments)
 */
export async function deleteProject(
  projectId: number,
  config?: ConvexConfig
): Promise<void> {
  return managementRequest(`/projects/${projectId}/delete`, 'POST', undefined, config);
}

// ============================================================================
// Management API - Deployments
// ============================================================================

/**
 * List all deployments for a project
 */
export async function listDeployments(
  projectId: number,
  config?: ConvexConfig
): Promise<{ deployments: Deployment[] }> {
  return managementRequest(`/projects/${projectId}/list_deployments`, 'GET', undefined, config);
}

/**
 * Create a deploy key for a deployment
 */
export async function createDeployKey(
  deploymentName: string,
  keyName: string,
  config?: ConvexConfig
): Promise<DeployKey> {
  return managementRequest(`/deployments/${deploymentName}/create_deploy_key`, 'POST', { name: keyName }, config);
}

// ============================================================================
// Management API - Custom Domains
// ============================================================================

/**
 * List custom domains for a deployment
 */
export async function listCustomDomains(
  deploymentName: string,
  config?: ConvexConfig
): Promise<{ domains: CustomDomain[] }> {
  return managementRequest(`/deployments/${deploymentName}/custom_domains`, 'GET', undefined, config);
}

/**
 * Create a custom domain for a deployment
 */
export async function createCustomDomain(
  deploymentName: string,
  params: CreateCustomDomainParams,
  config?: ConvexConfig
): Promise<CustomDomain> {
  return managementRequest(`/deployments/${deploymentName}/create_custom_domain`, 'POST', params, config);
}

/**
 * Delete a custom domain from a deployment
 */
export async function deleteCustomDomain(
  deploymentName: string,
  domain: string,
  config?: ConvexConfig
): Promise<void> {
  return managementRequest(`/deployments/${deploymentName}/delete_custom_domain`, 'POST', { domain }, config);
}

// ============================================================================
// Deployment API - Function Execution
// ============================================================================

/**
 * Execute a Convex query function
 */
export async function runQuery<T = unknown>(
  path: string,
  args: Record<string, unknown> = {},
  config?: ConvexConfig
): Promise<FunctionResult<T>> {
  return deploymentRequest<FunctionResult<T>>('/api/query', 'POST', {
    path,
    args,
    format: 'json'
  }, config);
}

/**
 * Execute a Convex mutation function
 */
export async function runMutation<T = unknown>(
  path: string,
  args: Record<string, unknown> = {},
  config?: ConvexConfig
): Promise<FunctionResult<T>> {
  return deploymentRequest<FunctionResult<T>>('/api/mutation', 'POST', {
    path,
    args,
    format: 'json'
  }, config);
}

/**
 * Execute a Convex action function
 */
export async function runAction<T = unknown>(
  path: string,
  args: Record<string, unknown> = {},
  config?: ConvexConfig
): Promise<FunctionResult<T>> {
  return deploymentRequest<FunctionResult<T>>('/api/action', 'POST', {
    path,
    args,
    format: 'json'
  }, config);
}

/**
 * Execute any Convex function by identifier
 * Function identifier format: "file/path:functionName" or "file/path/functionName"
 */
export async function runFunction<T = unknown>(
  functionIdentifier: string,
  args: Record<string, unknown> = {},
  config?: ConvexConfig
): Promise<FunctionResult<T>> {
  // Convert colon to slash for URL path
  const urlPath = functionIdentifier.replace(':', '/');
  return deploymentRequest<FunctionResult<T>>(`/api/run/${urlPath}`, 'POST', {
    args,
    format: 'json'
  }, config);
}

// ============================================================================
// Streaming Export API - Tables & Schema
// ============================================================================

/**
 * JSON Schema for a table (from Streaming Export API)
 */
export interface TableJsonSchema {
  $id?: string;
  title?: string;
  type: string;
  properties: Record<string, {
    type: string;
    $description?: string;
    format?: string;
    items?: unknown;
  }>;
  required?: string[];
  $description?: string;
}

/**
 * Response from /api/json_schemas endpoint
 */
export interface JsonSchemasResponse {
  [tableName: string]: TableJsonSchema;
}

/**
 * List all tables and their JSON schemas
 * This endpoint is part of the Streaming Export API (beta feature)
 *
 * @param options.deltaSchema - If true, include metadata fields (_ts, _deleted, _table)
 * @param config - Convex configuration
 */
export async function listTablesWithSchema(
  options?: { deltaSchema?: boolean },
  config?: ConvexConfig
): Promise<JsonSchemasResponse> {
  const deployKey = config?.deployKey || getDefaultDeployKey();
  const deploymentUrl = config?.deploymentUrl || getDeploymentUrl();

  if (!deployKey) {
    throw new Error('Convex deploy key is required. Set CONVEX_DEPLOY_KEY environment variable.');
  }

  if (!deploymentUrl) {
    throw new Error('Convex deployment URL is required. Set CONVEX_URL environment variable.');
  }

  const params = new URLSearchParams();
  if (options?.deltaSchema) {
    params.append('deltaSchema', 'true');
  }
  params.append('format', 'json');

  const queryString = params.toString();
  const url = `${deploymentUrl}/api/json_schemas${queryString ? `?${queryString}` : ''}`;

  const headers: Record<string, string> = {
    'Authorization': `Convex ${deployKey}`,
    'Accept': 'application/json',
  };

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message || errorData.errorMessage) {
        errorMessage = errorData.message || errorData.errorMessage;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get table names only (derived from json_schemas)
 */
export async function listTables(config?: ConvexConfig): Promise<string[]> {
  const schemas = await listTablesWithSchema(undefined, config);
  return Object.keys(schemas);
}

/**
 * Get schema for a specific table
 */
export async function getTableSchema(
  tableName: string,
  config?: ConvexConfig
): Promise<TableJsonSchema | null> {
  const schemas = await listTablesWithSchema(undefined, config);
  return schemas[tableName] || null;
}

// ============================================================================
// Deployment API - Environment Variables
// ============================================================================

/**
 * List all environment variables for a deployment
 */
export async function listEnvironmentVariables(
  config?: ConvexConfig
): Promise<EnvironmentVariables> {
  const result = await deploymentRequest<{ environmentVariables?: EnvironmentVariables }>(
    '/api/v1/list_environment_variables',
    'GET',
    undefined,
    config
  );
  return result.environmentVariables || result as EnvironmentVariables;
}

/**
 * Get a specific environment variable
 */
export async function getEnvironmentVariable(
  name: string,
  config?: ConvexConfig
): Promise<string | undefined> {
  const vars = await listEnvironmentVariables(config);
  return vars[name];
}

/**
 * Set or update environment variables
 * Note: This invalidates all subscriptions
 */
export async function updateEnvironmentVariables(
  variables: EnvironmentVariables,
  config?: ConvexConfig
): Promise<void> {
  await deploymentRequest(
    '/api/v1/update_environment_variables',
    'POST',
    { variables },
    config
  );
}

/**
 * Set a single environment variable
 */
export async function setEnvironmentVariable(
  name: string,
  value: string,
  config?: ConvexConfig
): Promise<void> {
  await updateEnvironmentVariables({ [name]: value }, config);
}

/**
 * Remove an environment variable (set to empty string)
 */
export async function removeEnvironmentVariable(
  name: string,
  config?: ConvexConfig
): Promise<void> {
  // Convex doesn't have a delete endpoint, so we set to empty
  // The actual removal might need to be done via dashboard
  await updateEnvironmentVariables({ [name]: '' }, config);
}

// ============================================================================
// Local Utilities - Code Generation Helpers
// ============================================================================

/**
 * Convex validator types reference
 */
export const CONVEX_VALIDATORS: Record<string, string> = {
  'string': 'v.string()',
  'number': 'v.number()',
  'boolean': 'v.boolean()',
  'null': 'v.null()',
  'int64': 'v.int64()',
  'bytes': 'v.bytes()',
  'id': 'v.id("tableName")',
  'array': 'v.array(v.string())',
  'object': 'v.object({ field: v.string() })',
  'record': 'v.record(v.string(), v.number())',
  'union': 'v.union(v.string(), v.number())',
  'literal': 'v.literal("value")',
  'optional': 'v.optional(v.string())',
};

/**
 * Generate a validator string from a type definition
 */
export function generateValidator(type: ValidatorType): string {
  switch (type.type) {
    case 'string':
      return 'v.string()';
    case 'number':
      return 'v.number()';
    case 'boolean':
      return 'v.boolean()';
    case 'null':
      return 'v.null()';
    case 'int64':
      return 'v.int64()';
    case 'bytes':
      return 'v.bytes()';
    case 'id':
      return `v.id("${type.tableName}")`;
    case 'array':
      return `v.array(${generateValidator(type.element)})`;
    case 'object': {
      const fields = Object.entries(type.fields)
        .map(([key, val]) => `${key}: ${generateValidator(val)}`)
        .join(', ');
      return `v.object({ ${fields} })`;
    }
    case 'record':
      return `v.record(${generateValidator(type.keys)}, ${generateValidator(type.values)})`;
    case 'union': {
      const variants = type.variants.map(v => generateValidator(v)).join(', ');
      return `v.union(${variants})`;
    }
    case 'literal':
      return typeof type.value === 'string'
        ? `v.literal("${type.value}")`
        : `v.literal(${type.value})`;
    case 'optional':
      return `v.optional(${generateValidator(type.inner)})`;
    default:
      return 'v.any()';
  }
}

/**
 * Generate a Convex query function template
 */
export function generateQueryTemplate(
  name: string,
  args: Record<string, string>,
  returnType: string,
  tableName?: string
): string {
  const argsStr = Object.entries(args)
    .map(([key, type]) => `    ${key}: ${type},`)
    .join('\n');

  const dbQuery = tableName
    ? `    const results = await ctx.db
      .query("${tableName}")
      .order("desc")
      .take(10);
    return results;`
    : '    // Your query logic here\n    return null;';

  return `import { query } from "./_generated/server";
import { v } from "convex/values";

export const ${name} = query({
  args: {
${argsStr}
  },
  returns: ${returnType},
  handler: async (ctx, args) => {
${dbQuery}
  },
});`;
}

/**
 * Generate a Convex mutation function template
 */
export function generateMutationTemplate(
  name: string,
  args: Record<string, string>,
  tableName?: string
): string {
  const argsStr = Object.entries(args)
    .map(([key, type]) => `    ${key}: ${type},`)
    .join('\n');

  const dbMutation = tableName
    ? `    const id = await ctx.db.insert("${tableName}", {
      // Document fields from args
    });
    return id;`
    : '    // Your mutation logic here\n    return null;';

  return `import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const ${name} = mutation({
  args: {
${argsStr}
  },
  returns: ${tableName ? `v.id("${tableName}")` : 'v.null()'},
  handler: async (ctx, args) => {
${dbMutation}
  },
});`;
}

/**
 * Generate a Convex action function template
 */
export function generateActionTemplate(
  name: string,
  args: Record<string, string>,
  useNode: boolean = false
): string {
  const argsStr = Object.entries(args)
    .map(([key, type]) => `    ${key}: ${type},`)
    .join('\n');

  const nodeDirective = useNode ? '"use node";\n' : '';

  return `${nodeDirective}import { action } from "./_generated/server";
import { v } from "convex/values";

export const ${name} = action({
  args: {
${argsStr}
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Actions cannot access ctx.db directly
    // Use ctx.runQuery or ctx.runMutation to interact with the database
    return null;
  },
});`;
}

/**
 * Generate a Convex internal function template
 */
export function generateInternalFunctionTemplate(
  name: string,
  type: 'query' | 'mutation' | 'action',
  args: Record<string, string>
): string {
  const functionType = type === 'query' ? 'internalQuery'
    : type === 'mutation' ? 'internalMutation'
    : 'internalAction';

  const argsStr = Object.entries(args)
    .map(([key, t]) => `    ${key}: ${t},`)
    .join('\n');

  return `import { ${functionType} } from "./_generated/server";
import { v } from "convex/values";

export const ${name} = ${functionType}({
  args: {
${argsStr}
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Internal function - only callable from other Convex functions
    // Use internal.file.${name} to reference this function
    return null;
  },
});`;
}

/**
 * Generate a Convex schema template
 */
export function generateSchemaTemplate(
  tables: { name: string; fields: Record<string, string>; indexes?: string[][] }[]
): string {
  const tableDefinitions = tables.map(table => {
    const fieldsStr = Object.entries(table.fields)
      .map(([key, type]) => `    ${key}: ${type},`)
      .join('\n');

    const indexStr = table.indexes?.length
      ? table.indexes.map(idx => {
          const indexName = `by_${idx.join('_and_')}`;
          return `.index("${indexName}", [${idx.map(f => `"${f}"`).join(', ')}])`;
        }).join('\n    ')
      : '';

    return `  ${table.name}: defineTable({
${fieldsStr}
  })${indexStr ? `\n    ${indexStr}` : ''},`;
  }).join('\n\n');

  return `import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
${tableDefinitions}
});`;
}

/**
 * Generate HTTP endpoint template
 */
export function generateHttpTemplate(
  routes: { path: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE'; name: string }[]
): string {
  const routeHandlers = routes.map(route => `
// ${route.name}
http.route({
  path: "${route.path}",
  method: "${route.method}",
  handler: httpAction(async (ctx, req) => {
    ${route.method === 'GET'
      ? 'return new Response(JSON.stringify({ message: "OK" }), {\n      status: 200,\n      headers: { "Content-Type": "application/json" }\n    });'
      : `const body = await req.json();
    // Process request
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });`}
  }),
});`).join('\n');

  return `import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();
${routeHandlers}

export default http;`;
}

/**
 * Generate cron jobs template
 */
export function generateCronTemplate(
  jobs: { name: string; schedule: { hours?: number; minutes?: number; cron?: string }; functionRef: string }[]
): string {
  const jobDefinitions = jobs.map(job => {
    if (job.schedule.cron) {
      return `crons.cron("${job.name}", "${job.schedule.cron}", ${job.functionRef}, {});`;
    } else {
      const interval: string[] = [];
      if (job.schedule.hours) interval.push(`hours: ${job.schedule.hours}`);
      if (job.schedule.minutes) interval.push(`minutes: ${job.schedule.minutes}`);
      return `crons.interval("${job.name}", { ${interval.join(', ')} }, ${job.functionRef}, {});`;
    }
  }).join('\n');

  return `import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

${jobDefinitions}

export default crons;`;
}

/**
 * Generate paginated query template
 */
export function generatePaginatedQueryTemplate(
  name: string,
  tableName: string,
  filterField?: string
): string {
  const filterArg = filterField ? `    ${filterField}: v.optional(v.string()),\n` : '';
  const filterLogic = filterField
    ? `
    let query = ctx.db.query("${tableName}");
    if (args.${filterField}) {
      query = query.withIndex("by_${filterField}", (q) =>
        q.eq("${filterField}", args.${filterField})
      );
    }`
    : `    const query = ctx.db.query("${tableName}");`;

  return `import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const ${name} = query({
  args: {
    paginationOpts: paginationOptsValidator,
${filterArg}  },
  handler: async (ctx, args) => {${filterLogic}
    return await query
      .order("desc")
      .paginate(args.paginationOpts);
  },
});`;
}

// ============================================================================
// Convex Best Practices Reference
// ============================================================================

/**
 * Get Convex coding guidelines
 */
export function getConvexGuidelines(): string {
  return `
# Convex Coding Guidelines

## Function Syntax (ALWAYS use this format)

\`\`\`typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myFunction = query({
  args: { /* validators */ },
  returns: v.null(), // ALWAYS include return validator
  handler: async (ctx, args) => {
    // Function body
  },
});
\`\`\`

## Key Rules

### Validators
- ALWAYS use \`v.null()\` when returning null
- Use \`v.int64()\` instead of deprecated \`v.bigint()\`
- Use \`v.record()\` for dynamic keys (not v.map/v.set)

### Queries
- Do NOT use \`.filter()\` - use \`.withIndex()\` instead
- Use \`.unique()\` for single document queries
- Default order is ascending by \`_creationTime\`

### Mutations
- Use \`ctx.db.patch()\` for partial updates
- Use \`ctx.db.replace()\` for full replacement
- Convex does NOT support \`.delete()\` on queries - use ctx.db.delete(id)

### Actions
- Add \`"use node";\` at top for Node.js modules
- Actions CANNOT access \`ctx.db\` directly
- Use \`ctx.runQuery\` / \`ctx.runMutation\` to access data

### Internal Functions
- Use \`internalQuery\`, \`internalMutation\`, \`internalAction\` for private functions
- Reference with \`internal.file.function\` (not \`api\`)

### Function Calling
- Use \`ctx.runQuery\` to call a query from mutation or action
- Use \`ctx.runMutation\` to call a mutation from mutation or action
- Use \`ctx.runAction\` to call an action from an action (only for cross-runtime)
- Pass FunctionReference (api.file.fn), NOT the function directly

### Indexes
- Include all index fields in the name: \`by_field1_and_field2\`
- Query fields in the same order as defined in index

### TypeScript
- Use \`Id<'tableName'>\` for document IDs (from './_generated/dataModel')
- Use \`as const\` for string literals in unions
- Add \`@types/node\` when using Node.js modules

## System Fields (auto-added)
- \`_id\`: v.id(tableName) - Document ID
- \`_creationTime\`: v.number() - Creation timestamp

## Pagination
- Use \`paginationOptsValidator\` from "convex/server"
- Returns: { page, isDone, continueCursor }
`;
}

/**
 * Get common Convex error patterns and solutions
 */
export function getErrorReference(): Record<string, string> {
  return {
    'ValidationError': 'Check validator syntax. Common issues: missing v.null() for null returns, wrong validator type.',
    'DatabaseError': 'Verify table exists in schema. Check field names match schema definition.',
    'AuthenticationError': 'Token expired or invalid. Generate new token from Convex dashboard.',
    'RateLimitError': 'Too many requests. Implement backoff strategy.',
    'FunctionNotFound': 'Function not deployed. Run `npx convex dev` or `npx convex deploy`.',
    'TypeMismatch': 'Argument or return type doesn\'t match validator. Check TypeScript types.',
    'IndexNotFound': 'Index not defined in schema. Add index to schema.ts and redeploy.',
    'QueryOrderError': 'Index fields must be queried in definition order.',
    'TransactionConflict': 'OCC write conflict. Retry the mutation.',
  };
}

/**
 * Generate package.json for a Convex project
 */
export function generatePackageJson(projectName: string, additionalDeps?: Record<string, string>): string {
  const deps = {
    "convex": "^1.17.4",
    ...additionalDeps
  };

  return JSON.stringify({
    name: projectName,
    version: "1.0.0",
    dependencies: deps,
    devDependencies: {
      "typescript": "^5.7.3"
    }
  }, null, 2);
}

/**
 * Generate tsconfig.json for a Convex project
 */
export function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: "ESNext",
      lib: ["DOM", "DOM.Iterable", "ESNext"],
      skipLibCheck: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      module: "ESNext",
      moduleResolution: "Bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      allowImportingTsExtensions: true,
      noEmit: true,
      jsx: "react-jsx"
    },
    exclude: ["convex"],
    include: ["**/src/**/*.tsx", "**/src/**/*.ts", "vite.config.ts"]
  }, null, 2);
}

// ============================================================================
// URL Utilities
// ============================================================================

/**
 * Get the Convex deployment URL
 */
export function buildDeploymentUrl(deploymentName: string): string {
  return `https://${deploymentName}.convex.cloud`;
}

/**
 * Get the Convex HTTP actions URL
 */
export function buildSiteUrl(deploymentName: string): string {
  return `https://${deploymentName}.convex.site`;
}

/**
 * Get the Convex dashboard URL for a project
 */
export function getDashboardUrl(teamSlug: string, projectSlug: string): string {
  return `https://dashboard.convex.dev/t/${teamSlug}/p/${projectSlug}`;
}

/**
 * Get the Convex documentation URL for a topic
 */
export function getDocsUrl(topic?: string): string {
  const base = 'https://docs.convex.dev';
  if (!topic) return base;

  const topicUrls: Record<string, string> = {
    'functions': '/functions',
    'queries': '/functions/query-functions',
    'mutations': '/functions/mutation-functions',
    'actions': '/functions/actions',
    'http': '/functions/http-actions',
    'schema': '/database/schemas',
    'indexes': '/database/indexes',
    'pagination': '/database/pagination',
    'file-storage': '/file-storage',
    'scheduling': '/scheduling/cron-jobs',
    'authentication': '/auth',
    'deployment': '/production',
    'api': '/http-api',
  };

  return base + (topicUrls[topic] || '');
}

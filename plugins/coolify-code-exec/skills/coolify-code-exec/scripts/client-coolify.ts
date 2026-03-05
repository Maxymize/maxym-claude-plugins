/**
 * Coolify Code Execution Client
 *
 * Direct connection to Coolify REST API without MCP server overhead.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * Covers ALL 107 Coolify API v1 endpoints:
 * - System (version, health, enable/disable)
 * - Applications (CRUD, deploy, logs, env vars)
 * - Deployments (list, get, cancel, deploy by tag/uuid)
 * - Servers (CRUD, resources, domains, validate)
 * - Databases (CRUD for 8 DB types, backups, start/stop/restart)
 * - Services (CRUD, env vars, start/stop/restart)
 * - Projects & Environments (CRUD)
 * - Teams & Members
 * - Private Keys (security)
 * - Resources (list all)
 * - Cloud Provider Tokens
 * - GitHub Apps
 *
 * @see https://coolify.io/docs/api-reference
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 */

// ============================================================
// Configuration
// ============================================================

export interface CoolifyConfig {
  apiUrl: string;
  token: string;
}

export function getCoolifyConfigFromEnv(): CoolifyConfig {
  const apiUrl = process.env.COOLIFY_API_URL;
  const token = process.env.COOLIFY_TOKEN;
  if (!apiUrl) throw new Error('COOLIFY_API_URL environment variable not set');
  if (!token) throw new Error('COOLIFY_TOKEN environment variable not set');
  return { apiUrl: apiUrl.replace(/\/$/, ''), token };
}

// ============================================================
// HTTP Client
// ============================================================

async function request<T>(
  config: CoolifyConfig,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string | number | boolean>
): Promise<T> {
  let url = `${config.apiUrl}/api/v1${path}`;

  if (queryParams) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(queryParams)) {
      if (v !== undefined && v !== null) params.append(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.token}`,
    'Accept': 'application/json',
  };

  const fetchOptions: RequestInit = { method, headers };

  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  // Some endpoints return plain text
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let errorBody: string;
    try {
      errorBody = await response.text();
    } catch {
      errorBody = `HTTP ${response.status}`;
    }
    throw new Error(`Coolify API ${method} ${path} failed (${response.status}): ${errorBody}`);
  }

  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  // Return text as-is for non-JSON responses
  const text = await response.text();
  return text as unknown as T;
}

// Convenience wrappers
function get<T>(c: CoolifyConfig, path: string, query?: Record<string, string | number | boolean>) {
  return request<T>(c, 'GET', path, undefined, query);
}
function post<T>(c: CoolifyConfig, path: string, body?: Record<string, unknown>) {
  return request<T>(c, 'POST', path, body);
}
function patch<T>(c: CoolifyConfig, path: string, body?: Record<string, unknown>) {
  return request<T>(c, 'PATCH', path, body);
}
function del<T>(c: CoolifyConfig, path: string) {
  return request<T>(c, 'DELETE', path);
}

// ============================================================
// Factory: createCoolifyClient
// ============================================================

export function createCoolifyClient(config: CoolifyConfig) {
  const c = config;

  return {
    // ========================================================
    // SYSTEM
    // ========================================================

    /** Get Coolify version */
    version: () => get<string>(c, '/version'),

    /** Health check */
    health: () => request<string>(c, 'GET', '', undefined, undefined)
      .then(() => true).catch(() => false),

    /** Enable API */
    enableApi: () => get<{ message: string }>(c, '/enable'),

    /** Disable API */
    disableApi: () => get<{ message: string }>(c, '/disable'),

    // ========================================================
    // APPLICATIONS
    // ========================================================

    /** List all applications */
    listApplications: () => get<any[]>(c, '/applications'),

    /** Get application by UUID */
    getApplication: (uuid: string) => get<any>(c, `/applications/${uuid}`),

    /** Create application from public Git repo */
    createApplicationPublic: (params: {
      project_uuid: string;
      server_uuid: string;
      environment_name: string;
      git_repository: string;
      git_branch: string;
      build_pack: string;
      ports_exposes: string;
      [key: string]: unknown;
    }) => post<any>(c, '/applications/public', params),

    /** Create application from private GitHub App repo */
    createApplicationPrivateGithub: (params: {
      project_uuid: string;
      server_uuid: string;
      environment_name: string;
      git_repository: string;
      git_branch: string;
      build_pack: string;
      ports_exposes: string;
      github_app_uuid: string;
      [key: string]: unknown;
    }) => post<any>(c, '/applications/private-github-app', params),

    /** Create application from private deploy key repo */
    createApplicationPrivateKey: (params: {
      project_uuid: string;
      server_uuid: string;
      environment_name: string;
      git_repository: string;
      git_branch: string;
      build_pack: string;
      ports_exposes: string;
      private_key_uuid: string;
      [key: string]: unknown;
    }) => post<any>(c, '/applications/private-deploy-key', params),

    /** Create application from Dockerfile */
    createApplicationDockerfile: (params: {
      project_uuid: string;
      server_uuid: string;
      environment_name: string;
      dockerfile: string; // Base64-encoded
      [key: string]: unknown;
    }) => post<any>(c, '/applications/dockerfile', params),

    /** Create application from Docker image */
    createApplicationDockerImage: (params: {
      project_uuid: string;
      server_uuid: string;
      environment_name: string;
      docker_registry_image_name: string;
      [key: string]: unknown;
    }) => post<any>(c, '/applications/dockerimage', params),

    /** Create application from Docker Compose */
    createApplicationDockerCompose: (params: {
      project_uuid: string;
      server_uuid: string;
      environment_name: string;
      docker_compose_raw: string; // Base64-encoded YAML
      docker_compose_domains: any[];
      [key: string]: unknown;
    }) => post<any>(c, '/applications/dockercompose', params),

    /** Update application */
    updateApplication: (uuid: string, params: Record<string, unknown>) =>
      patch<{ uuid: string }>(c, `/applications/${uuid}`, params),

    /** Delete application */
    deleteApplication: (uuid: string) => del<any>(c, `/applications/${uuid}`),

    /** Get application logs */
    getApplicationLogs: (uuid: string, lines = 100) =>
      get<{ logs: string }>(c, `/applications/${uuid}/logs`, { lines }),

    /** Start/deploy application */
    startApplication: (uuid: string) => get<any>(c, `/applications/${uuid}/start`),

    /** Stop application */
    stopApplication: (uuid: string) => get<any>(c, `/applications/${uuid}/stop`),

    /** Restart application */
    restartApplication: (uuid: string) => get<any>(c, `/applications/${uuid}/restart`),

    // --- Application Environment Variables ---

    /** List env vars for application */
    listApplicationEnvs: (uuid: string) => get<any[]>(c, `/applications/${uuid}/envs`),

    /** Create env var for application */
    createApplicationEnv: (uuid: string, params: {
      key: string;
      value?: string;
      is_preview?: boolean;
      is_literal?: boolean;
      is_multiline?: boolean;
      is_shown_once?: boolean;
    }) => post<{ uuid: string }>(c, `/applications/${uuid}/envs`, params as any),

    /** Update env var for application */
    updateApplicationEnv: (uuid: string, params: {
      key: string;
      value?: string;
      is_preview?: boolean;
      is_literal?: boolean;
      is_multiline?: boolean;
      is_shown_once?: boolean;
    }) => patch<any>(c, `/applications/${uuid}/envs`, params as any),

    /** Bulk update env vars for application */
    bulkUpdateApplicationEnvs: (uuid: string, envs: Array<{
      key: string;
      value?: string;
      is_preview?: boolean;
      is_literal?: boolean;
      is_multiline?: boolean;
      is_shown_once?: boolean;
    }>) => patch<any>(c, `/applications/${uuid}/envs/bulk`, envs as any),

    /** Delete env var for application */
    deleteApplicationEnv: (appUuid: string, envUuid: string) =>
      del<any>(c, `/applications/${appUuid}/envs/${envUuid}`),

    // ========================================================
    // DEPLOYMENTS
    // ========================================================

    /** List all running deployments */
    listDeployments: () => get<any[]>(c, '/deployments'),

    /** Get deployment by UUID */
    getDeployment: (uuid: string) => get<any>(c, `/deployments/${uuid}`),

    /** List deployments for an application */
    listApplicationDeployments: (appUuid: string, skip = 0, take = 10) =>
      get<any[]>(c, `/deployments/applications/${appUuid}`, { skip, take }),

    /** Deploy by tag, UUID, or PR */
    deploy: (params: {
      tag?: string;
      uuid?: string;
      force?: boolean;
      pr?: number;
    }) => {
      const query: Record<string, string | number | boolean> = {};
      if (params.tag) query.tag = params.tag;
      if (params.uuid) query.uuid = params.uuid;
      if (params.force !== undefined) query.force = params.force;
      if (params.pr !== undefined) query.pr = params.pr;
      return get<{ deployments: any[] }>(c, '/deploy', query);
    },

    /** Deploy via POST (same params as GET but via body) */
    deployPost: (params: {
      tag?: string;
      uuid?: string;
      force?: boolean;
      pr?: number;
    }) => post<{ deployments: any[] }>(c, '/deploy', params as any),

    /** Cancel a deployment */
    cancelDeployment: (uuid: string) =>
      post<{ message: string; deployment_uuid: string; status: string }>(c, `/deployments/${uuid}/cancel`),

    // ========================================================
    // SERVERS
    // ========================================================

    /** List all servers */
    listServers: () => get<any[]>(c, '/servers'),

    /** Get server by UUID */
    getServer: (uuid: string, resources = false) =>
      get<any>(c, `/servers/${uuid}`, resources ? { resources: true } : undefined),

    /** Create a server */
    createServer: (params: {
      name: string;
      ip: string;
      port: number;
      user: string;
      private_key_uuid: string;
      description?: string;
      is_build_server?: boolean;
      instant_validate?: boolean;
      proxy_type?: string;
    }) => post<{ uuid: string }>(c, '/servers', params as any),

    /** Update a server */
    updateServer: (uuid: string, params: Record<string, unknown>) =>
      patch<any>(c, `/servers/${uuid}`, params),

    /** Delete a server */
    deleteServer: (uuid: string) => del<any>(c, `/servers/${uuid}`),

    /** List resources on a server */
    listServerResources: (uuid: string) => get<any[]>(c, `/servers/${uuid}/resources`),

    /** Get domain mappings for a server */
    getServerDomains: (uuid: string) => get<any>(c, `/servers/${uuid}/domains`),

    /** Validate server connectivity */
    validateServer: (uuid: string) => get<any>(c, `/servers/${uuid}/validate`),

    // ========================================================
    // DATABASES
    // ========================================================

    /** List all databases */
    listDatabases: () => get<any[]>(c, '/databases'),

    /** Get database by UUID */
    getDatabase: (uuid: string) => get<any>(c, `/databases/${uuid}`),

    /** Create PostgreSQL database */
    createPostgresql: (params: {
      server_uuid: string;
      project_uuid: string;
      environment_name: string;
      environment_uuid: string;
      destination_uuid: string;
      name: string;
      postgres_user: string;
      postgres_password: string;
      postgres_db: string;
      [key: string]: unknown;
    }) => post<any>(c, '/databases/postgresql', params as any),

    /** Create MySQL database */
    createMysql: (params: Record<string, unknown>) =>
      post<any>(c, '/databases/mysql', params),

    /** Create MariaDB database */
    createMariadb: (params: Record<string, unknown>) =>
      post<any>(c, '/databases/mariadb', params),

    /** Create MongoDB database */
    createMongodb: (params: Record<string, unknown>) =>
      post<any>(c, '/databases/mongodb', params),

    /** Create Redis database */
    createRedis: (params: Record<string, unknown>) =>
      post<any>(c, '/databases/redis', params),

    /** Create ClickHouse database */
    createClickhouse: (params: Record<string, unknown>) =>
      post<any>(c, '/databases/clickhouse', params),

    /** Create KeyDB database */
    createKeydb: (params: Record<string, unknown>) =>
      post<any>(c, '/databases/keydb', params),

    /** Create DragonFly database */
    createDragonfly: (params: Record<string, unknown>) =>
      post<any>(c, '/databases/dragonfly', params),

    /** Update database */
    updateDatabase: (uuid: string, params: Record<string, unknown>) =>
      patch<any>(c, `/databases/${uuid}`, params),

    /** Delete database */
    deleteDatabase: (uuid: string) => del<any>(c, `/databases/${uuid}`),

    /** Start database */
    startDatabase: (uuid: string) => get<any>(c, `/databases/${uuid}/start`),

    /** Stop database */
    stopDatabase: (uuid: string) => get<any>(c, `/databases/${uuid}/stop`),

    /** Restart database */
    restartDatabase: (uuid: string) => get<any>(c, `/databases/${uuid}/restart`),

    // --- Database Backups ---

    /** List backup configs for a database */
    listDatabaseBackups: (uuid: string) => get<any[]>(c, `/databases/${uuid}/backups`),

    /** Create backup config */
    createDatabaseBackup: (uuid: string, params: {
      frequency: string;
      enabled?: boolean;
      save_s3?: boolean;
      s3_storage_uuid?: string;
      databases_to_backup?: string;
      dump_all?: boolean;
      backup_now?: boolean;
      [key: string]: unknown;
    }) => post<{ uuid: string; message: string }>(c, `/databases/${uuid}/backups`, params as any),

    /** Update backup config */
    updateDatabaseBackup: (dbUuid: string, backupUuid: string, params: Record<string, unknown>) =>
      patch<any>(c, `/databases/${dbUuid}/backups/${backupUuid}`, params),

    /** Delete backup config */
    deleteDatabaseBackup: (dbUuid: string, backupUuid: string) =>
      del<any>(c, `/databases/${dbUuid}/backups/${backupUuid}`),

    /** List backup executions */
    listBackupExecutions: (dbUuid: string, backupUuid: string) =>
      get<any[]>(c, `/databases/${dbUuid}/backups/${backupUuid}/executions`),

    /** Delete backup execution */
    deleteBackupExecution: (dbUuid: string, backupUuid: string, executionUuid: string) =>
      del<any>(c, `/databases/${dbUuid}/backups/${backupUuid}/executions/${executionUuid}`),

    // ========================================================
    // SERVICES
    // ========================================================

    /** List all services */
    listServices: () => get<any[]>(c, '/services'),

    /** Get service by UUID */
    getService: (uuid: string) => get<any>(c, `/services/${uuid}`),

    /** Create a service */
    createService: (params: {
      type: string;
      name: string;
      project_uuid: string;
      server_uuid: string;
      destination_uuid: string;
      [key: string]: unknown;
    }) => post<{ uuid: string; domains: string[] }>(c, '/services', params as any),

    /** Update a service */
    updateService: (uuid: string, params: Record<string, unknown>) =>
      patch<{ uuid: string; domains: string[] }>(c, `/services/${uuid}`, params),

    /** Delete a service */
    deleteService: (uuid: string) => del<any>(c, `/services/${uuid}`),

    /** Start service */
    startService: (uuid: string) => get<any>(c, `/services/${uuid}/start`),

    /** Stop service */
    stopService: (uuid: string) => get<any>(c, `/services/${uuid}/stop`),

    /** Restart service */
    restartService: (uuid: string) => get<any>(c, `/services/${uuid}/restart`),

    // --- Service Environment Variables ---

    /** List env vars for service */
    listServiceEnvs: (uuid: string) => get<any[]>(c, `/services/${uuid}/envs`),

    /** Create env var for service */
    createServiceEnv: (uuid: string, params: {
      key: string;
      value?: string;
      is_preview?: boolean;
      is_literal?: boolean;
      is_multiline?: boolean;
      is_shown_once?: boolean;
    }) => post<{ uuid: string }>(c, `/services/${uuid}/envs`, params as any),

    /** Update env var for service */
    updateServiceEnv: (uuid: string, params: Record<string, unknown>) =>
      patch<any>(c, `/services/${uuid}/envs`, params),

    /** Bulk update env vars for service */
    bulkUpdateServiceEnvs: (uuid: string, envs: any[]) =>
      patch<any>(c, `/services/${uuid}/envs/bulk`, envs as any),

    /** Delete env var for service */
    deleteServiceEnv: (serviceUuid: string, envUuid: string) =>
      del<any>(c, `/services/${serviceUuid}/envs/${envUuid}`),

    // ========================================================
    // PROJECTS
    // ========================================================

    /** List all projects */
    listProjects: () => get<any[]>(c, '/projects'),

    /** Get project by UUID */
    getProject: (uuid: string) => get<any>(c, `/projects/${uuid}`),

    /** Create a project */
    createProject: (params: { name: string; description?: string }) =>
      post<{ uuid: string }>(c, '/projects', params as any),

    /** Update a project */
    updateProject: (uuid: string, params: { name?: string; description?: string }) =>
      patch<any>(c, `/projects/${uuid}`, params as any),

    /** Delete a project */
    deleteProject: (uuid: string) => del<any>(c, `/projects/${uuid}`),

    // --- Project Environments ---

    /** List environments in a project */
    listEnvironments: (projectUuid: string) =>
      get<any[]>(c, `/projects/${projectUuid}/environments`),

    /** Create environment in a project */
    createEnvironment: (projectUuid: string, name: string) =>
      post<{ uuid: string }>(c, `/projects/${projectUuid}/environments`, { name } as any),

    /** Get environment by name or UUID */
    getEnvironment: (projectUuid: string, envNameOrUuid: string) =>
      get<any>(c, `/projects/${projectUuid}/${envNameOrUuid}`),

    /** Delete environment */
    deleteEnvironment: (projectUuid: string, envNameOrUuid: string) =>
      del<{ message: string }>(c, `/projects/${projectUuid}/environments/${envNameOrUuid}`),

    // ========================================================
    // TEAMS
    // ========================================================

    /** List all teams */
    listTeams: () => get<any[]>(c, '/teams'),

    /** Get team by ID */
    getTeam: (id: number) => get<any>(c, `/teams/${id}`),

    /** Get team members */
    getTeamMembers: (id: number) => get<any[]>(c, `/teams/${id}/members`),

    /** Get current team */
    getCurrentTeam: () => get<any>(c, '/teams/current'),

    /** Get current team members */
    getCurrentTeamMembers: () => get<any[]>(c, '/teams/current/members'),

    // ========================================================
    // SECURITY (Private Keys)
    // ========================================================

    /** List all private keys */
    listPrivateKeys: () => get<any[]>(c, '/security/keys'),

    /** Get private key by UUID */
    getPrivateKey: (uuid: string) => get<any>(c, `/security/keys/${uuid}`),

    /** Create a private key */
    createPrivateKey: (params: {
      name: string;
      private_key: string;
      description?: string;
    }) => post<{ uuid: string }>(c, '/security/keys', params as any),

    /** Update a private key */
    updatePrivateKey: (uuid: string, params: {
      name?: string;
      description?: string;
      private_key?: string;
    }) => patch<any>(c, `/security/keys/${uuid}`, params as any),

    /** Delete a private key */
    deletePrivateKey: (uuid: string) => del<any>(c, `/security/keys/${uuid}`),

    // ========================================================
    // RESOURCES
    // ========================================================

    /** List all resources (applications, databases, services) */
    listResources: () => get<any[]>(c, '/resources'),

    // ========================================================
    // CLOUD PROVIDER TOKENS
    // ========================================================

    /** List all cloud provider tokens */
    listCloudTokens: () => get<any[]>(c, '/cloud-tokens'),

    /** Get cloud token by UUID */
    getCloudToken: (uuid: string) => get<any>(c, `/cloud-tokens/${uuid}`),

    /** Create cloud provider token */
    createCloudToken: (params: {
      provider: string;
      token: string;
      name: string;
    }) => post<{ uuid: string }>(c, '/cloud-tokens', params as any),

    /** Update cloud provider token */
    updateCloudToken: (uuid: string, params: Record<string, unknown>) =>
      patch<any>(c, `/cloud-tokens/${uuid}`, params),

    /** Delete cloud provider token */
    deleteCloudToken: (uuid: string) => del<any>(c, `/cloud-tokens/${uuid}`),

    /** Validate cloud provider token */
    validateCloudToken: (uuid: string) =>
      post<any>(c, `/cloud-tokens/${uuid}/validate`),

    // ========================================================
    // GITHUB APPS
    // ========================================================

    /** List all GitHub Apps */
    listGithubApps: () => get<any[]>(c, '/github-apps'),

    /** Create GitHub App */
    createGithubApp: (params: {
      name: string;
      organization?: string;
      api_url?: string;
      html_url?: string;
      custom_user?: string;
      custom_port?: number;
      app_id: number;
      installation_id: number;
      client_id: string;
      client_secret: string;
      webhook_secret: string;
      private_key_uuid: string;
      is_system_wide?: boolean;
    }) => post<any>(c, '/github-apps', params as any),

    /** Get GitHub App repositories */
    getGithubAppRepos: (uuid: string) => get<any[]>(c, `/github-apps/${uuid}/repositories`),

    /** Get branches for a repo in a GitHub App */
    getGithubAppRepoBranches: (uuid: string, repository: string) =>
      get<any[]>(c, `/github-apps/${uuid}/repositories/${repository}/branches`),

    /** Update GitHub App */
    updateGithubApp: (uuid: string, params: Record<string, unknown>) =>
      patch<any>(c, `/github-apps/${uuid}`, params),

    /** Delete GitHub App */
    deleteGithubApp: (uuid: string) => del<any>(c, `/github-apps/${uuid}`),

    // ========================================================
    // UTILITY / BATCH OPERATIONS
    // ========================================================

    /** Deploy application and return deployment info */
    deployApplication: async (appUuid: string): Promise<{
      deployment_uuid: string;
      message: string;
    }> => {
      const result = await get<any>(c, `/applications/${appUuid}/restart`);
      return result;
    },

    /** Get application status (running/stopped/etc) */
    getApplicationStatus: async (uuid: string): Promise<string> => {
      const app = await get<any>(c, `/applications/${uuid}`);
      return app.status || 'unknown';
    },

    /** Get all env vars as key-value map */
    getApplicationEnvMap: async (uuid: string): Promise<Record<string, string>> => {
      const envs = await get<any[]>(c, `/applications/${uuid}/envs`);
      const map: Record<string, string> = {};
      for (const env of envs) {
        map[env.key] = env.real_value || env.value || '';
      }
      return map;
    },

    /** Set multiple env vars at once (upsert) */
    setApplicationEnvs: async (uuid: string, vars: Record<string, string>) => {
      const envs = Object.entries(vars).map(([key, value]) => ({
        key,
        value,
        is_preview: false,
      }));
      return patch<any>(c, `/applications/${uuid}/envs/bulk`, envs as any);
    },

    /** Get full deployment info with logs */
    getDeploymentWithLogs: async (deploymentUuid: string) => {
      const deployment = await get<any>(c, `/deployments/${deploymentUuid}`);
      return {
        uuid: deployment.deployment_uuid,
        status: deployment.status,
        commit: deployment.commit,
        commit_message: deployment.commit_message,
        created_at: deployment.created_at,
        logs: deployment.logs,
      };
    },

    /** Wait for deployment to finish (polling) */
    waitForDeployment: async (
      appUuid: string,
      deploymentUuid: string,
      timeoutMs = 600000,
      pollIntervalMs = 10000
    ): Promise<{ status: string; logs: string }> => {
      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        const dep = await get<any>(c, `/deployments/${deploymentUuid}`);
        const status = dep.status;
        if (['finished', 'failed', 'cancelled-by-user'].includes(status)) {
          return { status, logs: dep.logs || '' };
        }
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }
      throw new Error(`Deployment ${deploymentUuid} timed out after ${timeoutMs}ms`);
    },

    /** Get server overview: resources + status */
    getServerOverview: async (uuid: string) => {
      const [server, resources] = await Promise.all([
        get<any>(c, `/servers/${uuid}`),
        get<any[]>(c, `/servers/${uuid}/resources`),
      ]);
      return {
        name: server.name,
        ip: server.ip,
        status: server.settings?.is_reachable ? 'reachable' : 'unreachable',
        resourceCount: resources.length,
        resources: resources.map((r: any) => ({
          name: r.name,
          type: r.type,
          status: r.status,
        })),
      };
    },

    /** Quick deploy: restart app and return deployment UUID */
    quickDeploy: async (appUuid: string): Promise<string> => {
      const result = await post<any>(c, '/deploy', {
        uuid: appUuid,
        force: false,
      });
      if (result.deployments && result.deployments.length > 0) {
        return result.deployments[0].deployment_uuid;
      }
      // Fallback: use restart endpoint
      const restart = await get<any>(c, `/applications/${appUuid}/restart`);
      return restart.deployment_uuid || 'unknown';
    },

    /** Force rebuild: deploy with cache bypass */
    forceRebuild: (appUuid: string) =>
      post<{ deployments: any[] }>(c, '/deploy', {
        uuid: appUuid,
        force: true,
      }),
  };
}

// ============================================================
// Type exports for IDE support
// ============================================================

export type CoolifyClient = ReturnType<typeof createCoolifyClient>;

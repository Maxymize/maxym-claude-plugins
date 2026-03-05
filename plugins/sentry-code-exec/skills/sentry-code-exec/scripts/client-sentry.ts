/**
 * Sentry Code Execution Client
 *
 * Direct connection to Sentry API without MCP server overhead.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 * @see https://docs.sentry.io/api/
 */

// ============================================================================
// Configuration & Types
// ============================================================================

export interface SentryConfig {
  authToken: string;
  host?: string; // Default: https://sentry.io
  organizationSlug?: string;
}

export interface SentryError {
  error: string;
  detail?: string;
  status?: number;
}

// ============================================================================
// Organization Types
// ============================================================================

export interface Organization {
  id: string;
  slug: string;
  name: string;
  dateCreated: string;
  status: {
    id: string;
    name: string;
  };
  features: string[];
  isEarlyAdopter: boolean;
  require2FA: boolean;
  avatar?: {
    avatarType: string;
    avatarUuid: string | null;
  };
}

// ============================================================================
// Project Types
// ============================================================================

export interface Project {
  id: string;
  slug: string;
  name: string;
  platform: string;
  dateCreated: string;
  isBookmarked: boolean;
  isMember: boolean;
  features: string[];
  firstEvent: string | null;
  firstTransactionEvent: boolean;
  hasSessions: boolean;
  hasProfiles: boolean;
  hasReplays: boolean;
  hasMinifiedStackTrace: boolean;
  team?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CreateProjectParams {
  name: string;
  slug?: string;
  platform?: string;
  defaultRules?: boolean;
}

// ============================================================================
// Team Types
// ============================================================================

export interface Team {
  id: string;
  slug: string;
  name: string;
  dateCreated: string;
  isMember: boolean;
  teamRole: string | null;
  hasAccess: boolean;
  isPending: boolean;
  memberCount: number;
  avatar?: {
    avatarType: string;
    avatarUuid: string | null;
  };
}

export interface CreateTeamParams {
  name: string;
  slug?: string;
}

// ============================================================================
// Issue Types
// ============================================================================

export interface Issue {
  id: string;
  shortId: string;
  title: string;
  culprit: string;
  permalink: string;
  logger: string | null;
  level: 'error' | 'warning' | 'info' | 'fatal';
  status: 'resolved' | 'unresolved' | 'ignored';
  statusDetails: any;
  isPublic: boolean;
  platform: string;
  project: {
    id: string;
    name: string;
    slug: string;
    platform: string;
  };
  type: string;
  metadata: {
    value?: string;
    type?: string;
    filename?: string;
    function?: string;
  };
  numComments: number;
  assignedTo: any;
  isBookmarked: boolean;
  isSubscribed: boolean;
  subscriptionDetails: any;
  hasSeen: boolean;
  annotations: string[];
  isUnhandled: boolean;
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  stats?: {
    '24h': Array<[number, number]>;
  };
}

export interface ListIssuesOptions {
  query?: string;
  statsPeriod?: string;
  shortIdLookup?: boolean;
  limit?: number;
  cursor?: string;
  sort?: 'date' | 'new' | 'freq' | 'priority' | 'user';
}

export interface UpdateIssueParams {
  status?: 'resolved' | 'unresolved' | 'ignored';
  assignedTo?: string;
  hasSeen?: boolean;
  isBookmarked?: boolean;
  isSubscribed?: boolean;
  isPublic?: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

export interface Event {
  id: string;
  groupID: string;
  eventID: string;
  projectID: string;
  message: string;
  title: string;
  location: string | null;
  culprit: string;
  dateReceived: string;
  dateCreated: string;
  user: {
    id?: string;
    email?: string;
    username?: string;
    ip_address?: string;
  } | null;
  tags: Array<{
    key: string;
    value: string;
  }>;
  platform: string;
  type: string;
  metadata: any;
  entries: any[];
  errors: any[];
  contexts: any;
  sdk: {
    name: string;
    version: string;
  } | null;
}

// ============================================================================
// Release Types
// ============================================================================

export interface Release {
  id: string;
  version: string;
  shortVersion: string;
  ref: string | null;
  url: string | null;
  dateCreated: string;
  dateReleased: string | null;
  newGroups: number;
  commitCount: number;
  lastCommit: any;
  deployCount: number;
  lastDeploy: any;
  authors: any[];
  owner: any;
  versionInfo: {
    buildHash: string | null;
    version: {
      raw: string;
    };
  };
  projects: Array<{
    id: number;
    name: string;
    slug: string;
    platform: string;
  }>;
}

export interface CreateReleaseParams {
  version: string;
  ref?: string;
  url?: string;
  projects: string[];
  dateReleased?: string;
  commits?: Array<{
    id: string;
    repository?: string;
    message?: string;
  }>;
}

// ============================================================================
// Client Class
// ============================================================================

export class SentryClient {
  private config: Required<SentryConfig>;
  private baseUrl: string;

  constructor(config: SentryConfig) {
    this.config = {
      authToken: config.authToken,
      host: config.host || 'https://sentry.io',
      organizationSlug: config.organizationSlug || ''
    };
    this.baseUrl = `${this.config.host}/api/0`;

    if (!this.config.authToken) {
      throw new Error('Sentry auth token is required');
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.config.authToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: response.statusText,
          status: response.status
        }));
        throw new Error(
          `Sentry API error (${response.status}): ${errorData.detail || errorData.error || response.statusText}`
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Sentry API request failed: ${error}`);
    }
  }

  /**
   * Set the organization slug for subsequent requests
   */
  setOrganization(organizationSlug: string): void {
    this.config.organizationSlug = organizationSlug;
  }

  /**
   * Get the current organization slug
   */
  getOrganization(): string {
    if (!this.config.organizationSlug) {
      throw new Error('Organization slug not set. Use setOrganization() or provide it in constructor');
    }
    return this.config.organizationSlug;
  }

  // ==========================================================================
  // Organizations API
  // ==========================================================================

  /**
   * List organizations accessible to the user
   */
  async listOrganizations(): Promise<Organization[]> {
    return this.request('/organizations/');
  }

  /**
   * Get details of a specific organization
   */
  async getOrganization(orgSlug?: string): Promise<Organization> {
    const slug = orgSlug || this.getOrganization();
    return this.request(`/organizations/${slug}/`);
  }

  // ==========================================================================
  // Projects API
  // ==========================================================================

  /**
   * List all projects in an organization
   */
  async listProjects(orgSlug?: string): Promise<Project[]> {
    const slug = orgSlug || this.getOrganization();
    return this.request(`/organizations/${slug}/projects/`);
  }

  /**
   * Get details of a specific project
   */
  async getProject(projectSlug: string, orgSlug?: string): Promise<Project> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/projects/${org}/${projectSlug}/`);
  }

  /**
   * Create a new project
   */
  async createProject(
    teamSlug: string,
    params: CreateProjectParams,
    orgSlug?: string
  ): Promise<Project> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/teams/${org}/${teamSlug}/projects/`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Update a project
   */
  async updateProject(
    projectSlug: string,
    params: Partial<CreateProjectParams>,
    orgSlug?: string
  ): Promise<Project> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/projects/${org}/${projectSlug}/`, {
      method: 'PUT',
      body: JSON.stringify(params)
    });
  }

  /**
   * Delete a project
   */
  async deleteProject(projectSlug: string, orgSlug?: string): Promise<void> {
    const org = orgSlug || this.getOrganization();
    await this.request(`/projects/${org}/${projectSlug}/`, {
      method: 'DELETE'
    });
  }

  // ==========================================================================
  // Teams API
  // ==========================================================================

  /**
   * List all teams in an organization
   */
  async listTeams(orgSlug?: string): Promise<Team[]> {
    const slug = orgSlug || this.getOrganization();
    return this.request(`/organizations/${slug}/teams/`);
  }

  /**
   * Get details of a specific team
   */
  async getTeam(teamSlug: string, orgSlug?: string): Promise<Team> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/teams/${org}/${teamSlug}/`);
  }

  /**
   * Create a new team
   */
  async createTeam(params: CreateTeamParams, orgSlug?: string): Promise<Team> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/organizations/${org}/teams/`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Delete a team
   */
  async deleteTeam(teamSlug: string, orgSlug?: string): Promise<void> {
    const org = orgSlug || this.getOrganization();
    await this.request(`/teams/${org}/${teamSlug}/`, {
      method: 'DELETE'
    });
  }

  // ==========================================================================
  // Issues API
  // ==========================================================================

  /**
   * List issues in an organization
   */
  async listIssues(options: ListIssuesOptions = {}, orgSlug?: string): Promise<Issue[]> {
    const org = orgSlug || this.getOrganization();
    const params = new URLSearchParams();

    if (options.query) params.set('query', options.query);
    if (options.statsPeriod) params.set('statsPeriod', options.statsPeriod);
    if (options.shortIdLookup !== undefined) params.set('shortIdLookup', String(options.shortIdLookup));
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.cursor) params.set('cursor', options.cursor);
    if (options.sort) params.set('sort', options.sort);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/organizations/${org}/issues/${query}`);
  }

  /**
   * List issues for a specific project
   */
  async listProjectIssues(
    projectSlug: string,
    options: ListIssuesOptions = {},
    orgSlug?: string
  ): Promise<Issue[]> {
    const org = orgSlug || this.getOrganization();
    const params = new URLSearchParams();

    if (options.query) params.set('query', options.query);
    if (options.statsPeriod) params.set('statsPeriod', options.statsPeriod);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.cursor) params.set('cursor', options.cursor);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/projects/${org}/${projectSlug}/issues/${query}`);
  }

  /**
   * Get details of a specific issue
   */
  async getIssue(issueId: string): Promise<Issue> {
    return this.request(`/issues/${issueId}/`);
  }

  /**
   * Update an issue
   */
  async updateIssue(issueId: string, params: UpdateIssueParams): Promise<Issue> {
    return this.request(`/issues/${issueId}/`, {
      method: 'PUT',
      body: JSON.stringify(params)
    });
  }

  /**
   * Delete an issue
   */
  async deleteIssue(issueId: string): Promise<void> {
    await this.request(`/issues/${issueId}/`, {
      method: 'DELETE'
    });
  }

  /**
   * Bulk update issues
   */
  async bulkUpdateIssues(
    issueIds: string[],
    params: UpdateIssueParams,
    orgSlug?: string
  ): Promise<{ status: string }> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/organizations/${org}/issues/`, {
      method: 'PUT',
      body: JSON.stringify({
        ...params,
        id: issueIds
      })
    });
  }

  /**
   * Bulk delete issues
   */
  async bulkDeleteIssues(issueIds: string[], orgSlug?: string): Promise<void> {
    const org = orgSlug || this.getOrganization();
    await this.request(`/organizations/${org}/issues/`, {
      method: 'DELETE',
      body: JSON.stringify({ id: issueIds })
    });
  }

  // ==========================================================================
  // Events API
  // ==========================================================================

  /**
   * List events for an issue
   */
  async listIssueEvents(issueId: string): Promise<Event[]> {
    return this.request(`/issues/${issueId}/events/`);
  }

  /**
   * Get a specific event for a project
   */
  async getProjectEvent(
    projectSlug: string,
    eventId: string,
    orgSlug?: string
  ): Promise<Event> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/projects/${org}/${projectSlug}/events/${eventId}/`);
  }

  /**
   * List error events for a project
   */
  async listProjectEvents(
    projectSlug: string,
    options: { full?: boolean; limit?: number; cursor?: string } = {},
    orgSlug?: string
  ): Promise<Event[]> {
    const org = orgSlug || this.getOrganization();
    const params = new URLSearchParams();

    if (options.full) params.set('full', 'true');
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.cursor) params.set('cursor', options.cursor);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/projects/${org}/${projectSlug}/events/${query}`);
  }

  // ==========================================================================
  // Releases API
  // ==========================================================================

  /**
   * List releases for an organization
   */
  async listReleases(orgSlug?: string): Promise<Release[]> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/organizations/${org}/releases/`);
  }

  /**
   * Get details of a specific release
   */
  async getRelease(version: string, orgSlug?: string): Promise<Release> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/organizations/${org}/releases/${version}/`);
  }

  /**
   * Create a new release
   */
  async createRelease(params: CreateReleaseParams, orgSlug?: string): Promise<Release> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/organizations/${org}/releases/`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Update a release
   */
  async updateRelease(
    version: string,
    params: Partial<CreateReleaseParams>,
    orgSlug?: string
  ): Promise<Release> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/organizations/${org}/releases/${version}/`, {
      method: 'PUT',
      body: JSON.stringify(params)
    });
  }

  /**
   * Delete a release
   */
  async deleteRelease(version: string, orgSlug?: string): Promise<void> {
    const org = orgSlug || this.getOrganization();
    await this.request(`/organizations/${org}/releases/${version}/`, {
      method: 'DELETE'
    });
  }

  /**
   * List commits for a release
   */
  async listReleaseCommits(version: string, orgSlug?: string): Promise<any[]> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/organizations/${org}/releases/${version}/commits/`);
  }

  // ==========================================================================
  // Client Keys (DSN) API
  // ==========================================================================

  /**
   * List client keys (DSNs) for a project
   */
  async listProjectKeys(projectSlug: string, orgSlug?: string): Promise<any[]> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/projects/${org}/${projectSlug}/keys/`);
  }

  /**
   * Create a new client key (DSN)
   */
  async createProjectKey(
    projectSlug: string,
    params: { name: string },
    orgSlug?: string
  ): Promise<any> {
    const org = orgSlug || this.getOrganization();
    return this.request(`/projects/${org}/${projectSlug}/keys/`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Delete a client key (DSN)
   */
  async deleteProjectKey(
    projectSlug: string,
    keyId: string,
    orgSlug?: string
  ): Promise<void> {
    const org = orgSlug || this.getOrganization();
    await this.request(`/projects/${org}/${projectSlug}/keys/${keyId}/`, {
      method: 'DELETE'
    });
  }

  // ==========================================================================
  // Stats API
  // ==========================================================================

  /**
   * Get organization stats
   */
  async getOrganizationStats(
    options: {
      stat?: 'received' | 'rejected' | 'blacklisted';
      since?: number;
      until?: number;
      resolution?: '10s' | '1h' | '1d';
    } = {},
    orgSlug?: string
  ): Promise<any> {
    const org = orgSlug || this.getOrganization();
    const params = new URLSearchParams();

    if (options.stat) params.set('stat', options.stat);
    if (options.since) params.set('since', options.since.toString());
    if (options.until) params.set('until', options.until.toString());
    if (options.resolution) params.set('resolution', options.resolution);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/organizations/${org}/stats/${query}`);
  }

  /**
   * Get project stats
   */
  async getProjectStats(
    projectSlug: string,
    options: {
      stat?: 'received' | 'rejected' | 'blacklisted';
      since?: number;
      until?: number;
      resolution?: '10s' | '1h' | '1d';
    } = {},
    orgSlug?: string
  ): Promise<any> {
    const org = orgSlug || this.getOrganization();
    const params = new URLSearchParams();

    if (options.stat) params.set('stat', options.stat);
    if (options.since) params.set('since', options.since.toString());
    if (options.until) params.set('until', options.until.toString());
    if (options.resolution) params.set('resolution', options.resolution);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/projects/${org}/${projectSlug}/stats/${query}`);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a Sentry client instance
 *
 * @example
 * const client = createSentryClient({
 *   authToken: process.env.SENTRY_AUTH_TOKEN!,
 *   host: 'https://sentry.io', // or your self-hosted instance
 *   organizationSlug: 'my-org'
 * });
 */
export function createSentryClient(config: SentryConfig): SentryClient {
  return new SentryClient(config);
}

/**
 * Get Sentry configuration from environment variables
 */
export function getSentryConfigFromEnv(): SentryConfig {
  const authToken = process.env.SENTRY_AUTH_TOKEN || process.env.SENTRY_TOKEN;
  const host = process.env.SENTRY_HOST;
  const organizationSlug = process.env.SENTRY_ORG || process.env.SENTRY_ORGANIZATION_SLUG;

  if (!authToken) {
    throw new Error(
      'Sentry auth token not found. Set SENTRY_AUTH_TOKEN or SENTRY_TOKEN environment variable.\n' +
      'Create a token at: https://sentry.io/settings/account/api/auth-tokens/'
    );
  }

  return {
    authToken,
    host,
    organizationSlug
  };
}

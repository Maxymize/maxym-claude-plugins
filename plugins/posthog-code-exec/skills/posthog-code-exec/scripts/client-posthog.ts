/**
 * PostHog Code Execution Client
 *
 * Direct connection to PostHog API without MCP server overhead.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 * @see https://posthog.com/docs/api
 */

// ============================================================================
// Configuration & Types
// ============================================================================

export interface PostHogConfig {
  apiKey: string;
  host?: string; // Default: https://us.posthog.com (or https://eu.posthog.com for EU)
  projectId?: string;
}

export interface PostHogError {
  error: string;
  detail?: string;
  status?: number;
}

// ============================================================================
// Feature Flags Types
// ============================================================================

export interface FeatureFlag {
  id: number;
  name: string;
  key: string;
  active: boolean;
  deleted: boolean;
  created_at: string;
  filters?: {
    groups?: Array<{
      properties?: any[];
      rollout_percentage?: number;
      variant?: string;
    }>;
    multivariate?: {
      variants?: Array<{
        key: string;
        name?: string;
        rollout_percentage: number;
      }>;
    };
    payloads?: Record<string, any>;
  };
  rollout_percentage?: number;
  ensure_experience_continuity?: boolean;
}

export interface CreateFeatureFlagParams {
  key: string;
  name?: string;
  active?: boolean;
  rollout_percentage?: number;
  filters?: FeatureFlag['filters'];
  ensure_experience_continuity?: boolean;
}

export interface UpdateFeatureFlagParams {
  name?: string;
  active?: boolean;
  rollout_percentage?: number;
  filters?: FeatureFlag['filters'];
}

// ============================================================================
// Insights & Analytics Types
// ============================================================================

export interface Insight {
  id: number;
  name: string;
  description?: string;
  query?: any;
  filters?: any;
  result?: any;
  created_at: string;
  last_modified_at: string;
  created_by?: {
    id: number;
    uuid: string;
    distinct_id: string;
    first_name: string;
    email: string;
  };
  saved?: boolean;
  dashboards?: number[];
}

export interface CreateInsightParams {
  name: string;
  description?: string;
  query?: any;
  filters?: any;
}

export interface QueryParams {
  query: any; // HogQL or structured query
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface Dashboard {
  id: number;
  name: string;
  description?: string;
  pinned?: boolean;
  created_at: string;
  created_by?: any;
  is_shared?: boolean;
  deleted?: boolean;
  tiles?: Array<{
    insight?: number;
    text?: any;
    color?: string;
    layouts?: any;
  }>;
  filters?: any;
  tags?: string[];
}

export interface CreateDashboardParams {
  name: string;
  description?: string;
  pinned?: boolean;
  tags?: string[];
}

export interface UpdateDashboardParams {
  name?: string;
  description?: string;
  pinned?: boolean;
  tags?: string[];
}

// ============================================================================
// Error Tracking Types
// ============================================================================

export interface ErrorGroup {
  id: string;
  fingerprint: string;
  first_seen: string;
  last_seen: string;
  status: 'active' | 'resolved' | 'archived';
  volume: number;
  users_affected: number;
  occurrences: number;
}

export interface ErrorDetails {
  id: string;
  fingerprint: string;
  exception: {
    type?: string;
    value?: string;
    mechanism?: any;
  };
  stack_trace?: any[];
  properties?: Record<string, any>;
  timestamp: string;
}

// ============================================================================
// Experiment Types
// ============================================================================

export interface Experiment {
  id: number;
  name: string;
  description?: string;
  feature_flag_key: string;
  start_date?: string;
  end_date?: string;
  archived?: boolean;
  parameters?: any;
  metrics?: any[];
  saved_metrics?: any[];
}

export interface CreateExperimentParams {
  name: string;
  description?: string;
  feature_flag_key: string;
  parameters?: any;
  metrics?: any[];
}

// ============================================================================
// Survey Types
// ============================================================================

export interface Survey {
  id: string;
  name: string;
  description?: string;
  type: 'popover' | 'widget' | 'full_screen' | 'email';
  questions: Array<{
    type: 'open' | 'link' | 'rating' | 'single_choice' | 'multiple_choice';
    question: string;
    choices?: string[];
  }>;
  start_date?: string;
  end_date?: string;
  targeting?: any;
  appearance?: any;
}

export interface CreateSurveyParams {
  name: string;
  description?: string;
  type: Survey['type'];
  questions: Survey['questions'];
  targeting?: any;
}

// ============================================================================
// Client Class
// ============================================================================

export class PostHogClient {
  private config: Required<PostHogConfig>;
  private baseUrl: string;

  constructor(config: PostHogConfig) {
    this.config = {
      apiKey: config.apiKey,
      host: config.host || 'https://us.posthog.com',
      projectId: config.projectId || ''
    };
    this.baseUrl = `${this.config.host}/api`;

    if (!this.config.apiKey) {
      throw new Error('PostHog API key is required');
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
      'Authorization': `Bearer ${this.config.apiKey}`,
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
          `PostHog API error (${response.status}): ${errorData.error || errorData.detail || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`PostHog API request failed: ${error}`);
    }
  }

  /**
   * Set the project ID for subsequent requests
   */
  setProjectId(projectId: string): void {
    this.config.projectId = projectId;
  }

  /**
   * Get the current project ID
   */
  getProjectId(): string {
    if (!this.config.projectId) {
      throw new Error('Project ID not set. Use setProjectId() or provide it in constructor');
    }
    return this.config.projectId;
  }

  // ==========================================================================
  // Feature Flags API
  // ==========================================================================

  /**
   * Get all feature flags
   */
  async getFeatureFlags(): Promise<{ results: FeatureFlag[] }> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/feature_flags/`);
  }

  /**
   * Get a specific feature flag
   */
  async getFeatureFlag(flagId: number): Promise<FeatureFlag> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/feature_flags/${flagId}/`);
  }

  /**
   * Get feature flag by key
   */
  async getFeatureFlagByKey(key: string): Promise<FeatureFlag> {
    const { results } = await this.getFeatureFlags();
    const flag = results.find(f => f.key === key);
    if (!flag) {
      throw new Error(`Feature flag with key '${key}' not found`);
    }
    return flag;
  }

  /**
   * Create a new feature flag
   */
  async createFeatureFlag(params: CreateFeatureFlagParams): Promise<FeatureFlag> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/feature_flags/`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Update an existing feature flag
   */
  async updateFeatureFlag(
    flagId: number,
    params: UpdateFeatureFlagParams
  ): Promise<FeatureFlag> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/feature_flags/${flagId}/`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  }

  /**
   * Delete a feature flag
   */
  async deleteFeatureFlag(flagId: number): Promise<void> {
    const projectId = this.getProjectId();
    await this.request(`/projects/${projectId}/feature_flags/${flagId}/`, {
      method: 'DELETE'
    });
  }

  // ==========================================================================
  // Insights API
  // ==========================================================================

  /**
   * Get all insights
   */
  async getInsights(options: { limit?: number; offset?: number } = {}): Promise<{
    results: Insight[];
    next?: string;
    previous?: string;
  }> {
    const projectId = this.getProjectId();
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/projects/${projectId}/insights/${query}`);
  }

  /**
   * Get a specific insight
   */
  async getInsight(insightId: number): Promise<Insight> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/insights/${insightId}/`);
  }

  /**
   * Create a new insight
   */
  async createInsight(params: CreateInsightParams): Promise<Insight> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/insights/`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Update an insight
   */
  async updateInsight(insightId: number, params: Partial<CreateInsightParams>): Promise<Insight> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/insights/${insightId}/`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  }

  /**
   * Delete an insight
   */
  async deleteInsight(insightId: number): Promise<void> {
    const projectId = this.getProjectId();
    await this.request(`/projects/${projectId}/insights/${insightId}/`, {
      method: 'DELETE'
    });
  }

  /**
   * Run a query (HogQL or structured)
   */
  async runQuery(params: QueryParams): Promise<any> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/query/`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // ==========================================================================
  // Dashboard API
  // ==========================================================================

  /**
   * Get all dashboards
   */
  async getDashboards(): Promise<{ results: Dashboard[] }> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/dashboards/`);
  }

  /**
   * Get a specific dashboard
   */
  async getDashboard(dashboardId: number): Promise<Dashboard> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/dashboards/${dashboardId}/`);
  }

  /**
   * Create a new dashboard
   */
  async createDashboard(params: CreateDashboardParams): Promise<Dashboard> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/dashboards/`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Update a dashboard
   */
  async updateDashboard(
    dashboardId: number,
    params: UpdateDashboardParams
  ): Promise<Dashboard> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/dashboards/${dashboardId}/`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  }

  /**
   * Delete a dashboard
   */
  async deleteDashboard(dashboardId: number): Promise<void> {
    const projectId = this.getProjectId();
    await this.request(`/projects/${projectId}/dashboards/${dashboardId}/`, {
      method: 'DELETE'
    });
  }

  /**
   * Add insight to dashboard
   */
  async addInsightToDashboard(
    dashboardId: number,
    insightId: number,
    options?: { color?: string; layouts?: any }
  ): Promise<Dashboard> {
    const dashboard = await this.getDashboard(dashboardId);
    const newTile = {
      insight: insightId,
      ...options
    };

    return this.updateDashboard(dashboardId, {
      ...dashboard,
      tiles: [...(dashboard.tiles || []), newTile]
    });
  }

  // ==========================================================================
  // Error Tracking API
  // ==========================================================================

  /**
   * List errors in the project
   */
  async listErrors(options: {
    status?: 'active' | 'resolved' | 'archived';
    limit?: number;
    offset?: number;
  } = {}): Promise<{ results: ErrorGroup[] }> {
    const projectId = this.getProjectId();
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/projects/${projectId}/error_tracking/errors/${query}`);
  }

  /**
   * Get error details
   */
  async getErrorDetails(errorId: string): Promise<ErrorDetails> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/error_tracking/errors/${errorId}/`);
  }

  // ==========================================================================
  // Experiments API
  // ==========================================================================

  /**
   * Get all experiments
   */
  async getExperiments(): Promise<{ results: Experiment[] }> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/experiments/`);
  }

  /**
   * Get a specific experiment
   */
  async getExperiment(experimentId: number): Promise<Experiment> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/experiments/${experimentId}/`);
  }

  /**
   * Create an experiment
   */
  async createExperiment(params: CreateExperimentParams): Promise<Experiment> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/experiments/`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Update an experiment
   */
  async updateExperiment(
    experimentId: number,
    params: Partial<CreateExperimentParams>
  ): Promise<Experiment> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/experiments/${experimentId}/`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  }

  /**
   * Delete an experiment
   */
  async deleteExperiment(experimentId: number): Promise<void> {
    const projectId = this.getProjectId();
    await this.request(`/projects/${projectId}/experiments/${experimentId}/`, {
      method: 'DELETE'
    });
  }

  /**
   * Get experiment results with metrics and exposure data
   */
  async getExperimentResults(experimentId: number): Promise<{
    insight: any[];
    filters: any;
    probability: Record<string, number>;
    significant: boolean;
    expected_loss?: number;
    variants: Array<{
      key: string;
      count: number;
      exposure: number;
      absolute_exposure: number;
    }>;
  }> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/experiments/${experimentId}/results/`);
  }

  // ==========================================================================
  // Surveys API
  // ==========================================================================

  /**
   * Get all surveys
   */
  async getSurveys(): Promise<{ results: Survey[] }> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/surveys/`);
  }

  /**
   * Get a specific survey
   */
  async getSurvey(surveyId: string): Promise<Survey> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/surveys/${surveyId}/`);
  }

  /**
   * Create a survey
   */
  async createSurvey(params: CreateSurveyParams): Promise<Survey> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/surveys/`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  /**
   * Update a survey
   */
  async updateSurvey(surveyId: string, params: Partial<CreateSurveyParams>): Promise<Survey> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/surveys/${surveyId}/`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  }

  /**
   * Delete a survey
   */
  async deleteSurvey(surveyId: string): Promise<void> {
    const projectId = this.getProjectId();
    await this.request(`/projects/${projectId}/surveys/${surveyId}/`, {
      method: 'DELETE'
    });
  }

  /**
   * Get survey response statistics
   */
  async getSurveyStats(surveyId: string): Promise<{
    total_responses: number;
    responses_by_question: Record<string, any>;
    completion_rate: number;
  }> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/surveys/${surveyId}/stats/`);
  }

  /**
   * Get aggregated statistics across all surveys
   */
  async getSurveysGlobalStats(): Promise<{
    total_surveys: number;
    total_responses: number;
    surveys_by_type: Record<string, number>;
    average_completion_rate: number;
  }> {
    const projectId = this.getProjectId();
    return this.request(`/projects/${projectId}/surveys/stats/`);
  }

  // ==========================================================================
  // Organization & Project API
  // ==========================================================================

  /**
   * Get organizations accessible to the user
   */
  async getOrganizations(): Promise<{ results: any[] }> {
    return this.request('/organizations/');
  }

  /**
   * Get organization details
   */
  async getOrganizationDetails(organizationId: string): Promise<{
    id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
    membership_level: number;
    available_features: string[];
    is_member_join_email_enabled: boolean;
  }> {
    return this.request(`/organizations/${organizationId}/`);
  }

  /**
   * Get projects accessible to the user
   */
  async getProjects(): Promise<{ results: any[] }> {
    return this.request('/projects/');
  }

  /**
   * Get event definitions
   */
  async getEventDefinitions(options: {
    search?: string;
    limit?: number;
  } = {}): Promise<{ results: any[] }> {
    const projectId = this.getProjectId();
    const params = new URLSearchParams();
    if (options.search) params.set('search', options.search);
    if (options.limit) params.set('limit', options.limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/projects/${projectId}/event_definitions/${query}`);
  }

  /**
   * Get property definitions
   */
  async getPropertyDefinitions(type?: 'event' | 'person'): Promise<{ results: any[] }> {
    const projectId = this.getProjectId();
    const query = type ? `?type=${type}` : '';
    return this.request(`/projects/${projectId}/property_definitions/${query}`);
  }

  // ==========================================================================
  // Insights Query API
  // ==========================================================================

  /**
   * Execute a query on an existing insight to get its results/data
   */
  async queryInsight(insightId: number, options?: {
    refresh?: boolean;
    from_dashboard?: number;
  }): Promise<any> {
    const projectId = this.getProjectId();
    const params = new URLSearchParams();
    if (options?.refresh) params.set('refresh', 'true');
    if (options?.from_dashboard) params.set('from_dashboard', options.from_dashboard.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/projects/${projectId}/insights/${insightId}/query/${query}`, {
      method: 'POST'
    });
  }

  // ==========================================================================
  // LLM Analytics API
  // ==========================================================================

  /**
   * Get total LLM daily costs for each model over a given number of days
   */
  async getLLMCosts(options?: {
    days?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    results: Array<{
      date: string;
      model: string;
      total_cost: number;
      total_tokens: number;
      input_tokens: number;
      output_tokens: number;
    }>;
    total_cost: number;
  }> {
    const projectId = this.getProjectId();
    const params = new URLSearchParams();
    if (options?.days) params.set('days', options.days.toString());
    if (options?.date_from) params.set('date_from', options.date_from);
    if (options?.date_to) params.set('date_to', options.date_to);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/projects/${projectId}/llm_observability/costs/${query}`);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a PostHog client instance
 *
 * @example
 * const client = createPostHogClient({
 *   apiKey: process.env.POSTHOG_API_KEY!,
 *   host: 'https://us.posthog.com', // or 'https://eu.posthog.com'
 *   projectId: '12345'
 * });
 */
export function createPostHogClient(config: PostHogConfig): PostHogClient {
  return new PostHogClient(config);
}

/**
 * Get PostHog configuration from environment variables
 */
export function getPostHogConfigFromEnv(): PostHogConfig {
  const apiKey = process.env.POSTHOG_API_KEY || process.env.POSTHOG_PERSONAL_API_KEY;
  const host = process.env.POSTHOG_HOST;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  if (!apiKey) {
    throw new Error(
      'PostHog API key not found. Set POSTHOG_API_KEY or POSTHOG_PERSONAL_API_KEY environment variable.\n' +
      'Get your API key from: https://posthog.com/settings/user-api-keys'
    );
  }

  return {
    apiKey,
    host,
    projectId
  };
}

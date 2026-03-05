/**
 * Railway Code Execution Client
 *
 * Direct connection to Railway GraphQL API without MCP server overhead.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 * @see https://docs.railway.com/guides/public-api
 */

// ============================================================================
// Configuration & Types
// ============================================================================

const RAILWAY_API_ENDPOINT = 'https://backboard.railway.com/graphql/v2';

export interface RailwayConfig {
  apiToken: string;
}

export interface RailwayError {
  message: string;
  extensions?: Record<string, any>;
}

// ============================================================================
// Project Types
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  isPublic?: boolean;
  prDeploys?: boolean;
  services?: { edges: Array<{ node: Service }> };
  environments?: { edges: Array<{ node: Environment }> };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  workspaceId?: string;
  isPublic?: boolean;
  prDeploys?: boolean;
  defaultEnvironmentName?: string;
  repo?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
  prDeploys?: boolean;
}

// ============================================================================
// Service Types
// ============================================================================

export interface Service {
  id: string;
  name: string;
  icon?: string;
  createdAt: string;
  projectId?: string;
}

export interface ServiceInstance {
  id: string;
  serviceName: string;
  startCommand?: string;
  buildCommand?: string;
  rootDirectory?: string;
  healthcheckPath?: string;
  region?: string;
  numReplicas?: number;
  restartPolicyType?: string;
  restartPolicyMaxRetries?: number;
  latestDeployment?: Deployment;
}

export interface CreateServiceInput {
  projectId: string;
  name: string;
  source?: {
    repo?: string;
    image?: string;
  };
  branch?: string;
  icon?: string;
  variables?: Record<string, string>;
}

export interface UpdateServiceInput {
  name?: string;
  icon?: string;
}

export interface UpdateServiceInstanceInput {
  startCommand?: string;
  buildCommand?: string;
  rootDirectory?: string;
  healthcheckPath?: string;
  healthcheckTimeout?: number;
  region?: string;
  numReplicas?: number;
  restartPolicyType?: string;
  restartPolicyMaxRetries?: number;
  cronSchedule?: string;
  sleepApplication?: boolean;
  dockerfilePath?: string;
  watchPatterns?: string[];
}

// ============================================================================
// Environment Types
// ============================================================================

export interface Environment {
  id: string;
  name: string;
  createdAt: string;
  isEphemeral?: boolean;
  serviceInstances?: { edges: Array<{ node: ServiceInstance }> };
}

export interface CreateEnvironmentInput {
  projectId: string;
  name: string;
  sourceEnvironmentId?: string;
  ephemeral?: boolean;
  skipInitialDeploys?: boolean;
  stageInitialChanges?: boolean;
}

// ============================================================================
// Deployment Types
// ============================================================================

export interface Deployment {
  id: string;
  status: DeploymentStatus;
  createdAt: string;
  url?: string;
  staticUrl?: string;
  meta?: Record<string, any>;
  canRedeploy?: boolean;
  canRollback?: boolean;
}

export type DeploymentStatus =
  | 'BUILDING'
  | 'DEPLOYING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CRASHED'
  | 'REMOVED'
  | 'REMOVING'
  | 'INITIALIZING'
  | 'SKIPPED'
  | 'WAITING'
  | 'QUEUED'
  | 'SLEEPING'
  | 'CANCELLED';

export interface DeploymentListInput {
  projectId: string;
  environmentId?: string;
  serviceId?: string;
  status?: {
    successfulOnly?: boolean;
  };
}

export interface DeploymentLog {
  timestamp: string;
  message: string;
  severity?: string;
}

export interface HttpLog {
  timestamp: string;
  requestId: string;
  method: string;
  path: string;
  httpStatus: number;
  totalDuration: number;
  srcIp?: string;
}

// ============================================================================
// Variable Types
// ============================================================================

export interface VariableUpsertInput {
  projectId: string;
  environmentId: string;
  serviceId?: string;
  name: string;
  value: string;
  skipDeploys?: boolean;
}

export interface VariableCollectionUpsertInput {
  projectId: string;
  environmentId: string;
  serviceId?: string;
  variables: Record<string, string>;
  replace?: boolean;
  skipDeploys?: boolean;
}

export interface VariableDeleteInput {
  projectId: string;
  environmentId: string;
  serviceId?: string;
  name: string;
}

// ============================================================================
// Domain Types
// ============================================================================

export interface ServiceDomain {
  domain: string;
}

export interface CustomDomain {
  id: string;
  status: {
    dnsRecords: Array<{
      hostlabel: string;
      requiredValue: string;
    }>;
  };
}

// ============================================================================
// Volume Types
// ============================================================================

export interface Volume {
  id: string;
  name?: string;
  mountPath?: string;
  sizeGB?: number;
}

// ============================================================================
// TCP Proxy Types
// ============================================================================

export interface TcpProxy {
  id: string;
  domain: string;
  proxyPort: number;
  applicationPort: number;
}

// ============================================================================
// Region Types
// ============================================================================

export interface Region {
  name: string;
  country: string;
  location: string;
}

// ============================================================================
// Workspace Types
// ============================================================================

export interface Workspace {
  id: string;
  name: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id?: string;
  name: string;
  email: string;
}

// ============================================================================
// Client Class
// ============================================================================

export class RailwayClient {
  private config: RailwayConfig;

  constructor(config: RailwayConfig) {
    this.config = config;

    if (!this.config.apiToken) {
      throw new Error(
        'Railway API token is required. Set RAILWAY_TOKEN environment variable.\n' +
        'Get your token from: https://railway.com/account/tokens'
      );
    }
  }

  /**
   * Execute a GraphQL query/mutation
   */
  private async graphql<T>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T> {
    const response = await fetch(RAILWAY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiToken}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Railway API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map((e: RailwayError) => e.message).join(', ');
      throw new Error(`Railway GraphQL error: ${errorMessages}`);
    }

    return result.data;
  }

  // ==========================================================================
  // User & Authentication
  // ==========================================================================

  /**
   * Get current authenticated user info
   */
  async me(): Promise<User> {
    const query = `query { me { name email } }`;
    const data = await this.graphql<{ me: User }>(query);
    return data.me;
  }

  /**
   * Get project token info (when using project token)
   */
  async getProjectTokenInfo(): Promise<{ projectId: string; environmentId: string }> {
    const query = `query { projectToken { projectId environmentId } }`;
    const data = await this.graphql<{ projectToken: { projectId: string; environmentId: string } }>(query);
    return data.projectToken;
  }

  // ==========================================================================
  // Workspace API
  // ==========================================================================

  /**
   * Get workspace details
   */
  async getWorkspace(workspaceId: string): Promise<Workspace> {
    const query = `
      query workspace($workspaceId: String!) {
        workspace(workspaceId: $workspaceId) {
          id
          name
        }
      }
    `;
    const data = await this.graphql<{ workspace: Workspace }>(query, { workspaceId });
    return data.workspace;
  }

  // ==========================================================================
  // Projects API
  // ==========================================================================

  /**
   * List all projects
   */
  async listProjects(workspaceId?: string): Promise<Project[]> {
    const query = workspaceId
      ? `
        query Projects($workspaceId: String!) {
          workspace(workspaceId: $workspaceId) {
            projects {
              edges {
                node {
                  id
                  name
                  description
                  createdAt
                  updatedAt
                }
              }
            }
          }
        }
      `
      : `
        query Projects {
          projects {
            edges {
              node {
                id
                name
                description
                createdAt
                updatedAt
              }
            }
          }
        }
      `;

    const data = await this.graphql<any>(query, workspaceId ? { workspaceId } : undefined);
    const edges = workspaceId ? data.workspace.projects.edges : data.projects.edges;
    return edges.map((edge: any) => edge.node);
  }

  /**
   * Get a specific project with services and environments
   */
  async getProject(projectId: string): Promise<Project> {
    const query = `
      query project($id: String!) {
        project(id: $id) {
          id
          name
          description
          createdAt
          updatedAt
          isPublic
          prDeploys
          services {
            edges {
              node {
                id
                name
              }
            }
          }
          environments {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `;
    const data = await this.graphql<{ project: Project }>(query, { id: projectId });
    return data.project;
  }

  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    const query = `
      mutation projectCreate($input: ProjectCreateInput!) {
        projectCreate(input: $input) {
          id
          name
          description
          createdAt
        }
      }
    `;
    const data = await this.graphql<{ projectCreate: Project }>(query, { input });
    return data.projectCreate;
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
    const query = `
      mutation projectUpdate($id: String!, $input: ProjectUpdateInput!) {
        projectUpdate(id: $id, input: $input) {
          id
          name
          description
        }
      }
    `;
    const data = await this.graphql<{ projectUpdate: Project }>(query, { id: projectId, input });
    return data.projectUpdate;
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<boolean> {
    const query = `
      mutation projectDelete($id: String!) {
        projectDelete(id: $id)
      }
    `;
    await this.graphql(query, { id: projectId });
    return true;
  }

  /**
   * Transfer project to another workspace
   */
  async transferProject(projectId: string, targetWorkspaceId: string): Promise<boolean> {
    const query = `
      mutation projectTransfer($projectId: String!, $input: ProjectTransferInput!) {
        projectTransfer(projectId: $projectId, input: $input)
      }
    `;
    await this.graphql(query, { projectId, input: { workspaceId: targetWorkspaceId } });
    return true;
  }

  // ==========================================================================
  // Services API
  // ==========================================================================

  /**
   * List all services in a project
   */
  async listServices(projectId: string): Promise<Service[]> {
    const query = `
      query project($id: String!) {
        project(id: $id) {
          services {
            edges {
              node {
                id
                name
                icon
                createdAt
              }
            }
          }
        }
      }
    `;
    const data = await this.graphql<{ project: { services: { edges: Array<{ node: Service }> } } }>(
      query,
      { id: projectId }
    );
    return data.project.services.edges.map(edge => edge.node);
  }

  /**
   * Get a specific service
   */
  async getService(serviceId: string): Promise<Service> {
    const query = `
      query service($id: String!) {
        service(id: $id) {
          id
          name
          icon
          createdAt
          projectId
        }
      }
    `;
    const data = await this.graphql<{ service: Service }>(query, { id: serviceId });
    return data.service;
  }

  /**
   * Get service instance (environment-specific config)
   */
  async getServiceInstance(serviceId: string, environmentId: string): Promise<ServiceInstance> {
    const query = `
      query serviceInstance($serviceId: String!, $environmentId: String!) {
        serviceInstance(serviceId: $serviceId, environmentId: $environmentId) {
          id
          serviceName
          startCommand
          buildCommand
          rootDirectory
          healthcheckPath
          region
          numReplicas
          restartPolicyType
          restartPolicyMaxRetries
          latestDeployment {
            id
            status
            url
            staticUrl
          }
        }
      }
    `;
    const data = await this.graphql<{ serviceInstance: ServiceInstance }>(query, {
      serviceId,
      environmentId,
    });
    return data.serviceInstance;
  }

  /**
   * Create a new service
   */
  async createService(input: CreateServiceInput): Promise<Service> {
    const query = `
      mutation serviceCreate($input: ServiceCreateInput!) {
        serviceCreate(input: $input) {
          id
          name
          icon
          createdAt
        }
      }
    `;
    const data = await this.graphql<{ serviceCreate: Service }>(query, { input });
    return data.serviceCreate;
  }

  /**
   * Update service metadata
   */
  async updateService(serviceId: string, input: UpdateServiceInput): Promise<Service> {
    const query = `
      mutation serviceUpdate($id: String!, $input: ServiceUpdateInput!) {
        serviceUpdate(id: $id, input: $input) {
          id
          name
          icon
        }
      }
    `;
    const data = await this.graphql<{ serviceUpdate: Service }>(query, { id: serviceId, input });
    return data.serviceUpdate;
  }

  /**
   * Update service instance (environment-specific config)
   */
  async updateServiceInstance(
    serviceId: string,
    environmentId: string,
    input: UpdateServiceInstanceInput
  ): Promise<boolean> {
    const query = `
      mutation serviceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
        serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
      }
    `;
    await this.graphql(query, { serviceId, environmentId, input });
    return true;
  }

  /**
   * Connect service to GitHub repo
   */
  async connectService(serviceId: string, repo: string, branch?: string): Promise<boolean> {
    const query = `
      mutation serviceConnect($id: String!, $input: ServiceConnectInput!) {
        serviceConnect(id: $id, input: $input) {
          id
        }
      }
    `;
    await this.graphql(query, { id: serviceId, input: { repo, branch } });
    return true;
  }

  /**
   * Disconnect service from repository
   */
  async disconnectService(serviceId: string): Promise<boolean> {
    const query = `
      mutation serviceDisconnect($id: String!) {
        serviceDisconnect(id: $id) {
          id
        }
      }
    `;
    await this.graphql(query, { id: serviceId });
    return true;
  }

  /**
   * Delete a service
   */
  async deleteService(serviceId: string): Promise<boolean> {
    const query = `
      mutation serviceDelete($id: String!) {
        serviceDelete(id: $id)
      }
    `;
    await this.graphql(query, { id: serviceId });
    return true;
  }

  // ==========================================================================
  // Environments API
  // ==========================================================================

  /**
   * List all environments in a project
   */
  async listEnvironments(projectId: string, isEphemeral?: boolean): Promise<Environment[]> {
    const query = `
      query environments($projectId: String!, $isEphemeral: Boolean) {
        environments(projectId: $projectId, isEphemeral: $isEphemeral) {
          edges {
            node {
              id
              name
              createdAt
            }
          }
        }
      }
    `;
    const data = await this.graphql<{ environments: { edges: Array<{ node: Environment }> } }>(
      query,
      { projectId, isEphemeral }
    );
    return data.environments.edges.map(edge => edge.node);
  }

  /**
   * Get a specific environment
   */
  async getEnvironment(environmentId: string): Promise<Environment> {
    const query = `
      query environment($id: String!) {
        environment(id: $id) {
          id
          name
          createdAt
          serviceInstances {
            edges {
              node {
                id
                serviceName
                latestDeployment {
                  id
                  status
                }
              }
            }
          }
        }
      }
    `;
    const data = await this.graphql<{ environment: Environment }>(query, { id: environmentId });
    return data.environment;
  }

  /**
   * Create a new environment
   */
  async createEnvironment(input: CreateEnvironmentInput): Promise<Environment> {
    const query = `
      mutation environmentCreate($input: EnvironmentCreateInput!) {
        environmentCreate(input: $input) {
          id
          name
        }
      }
    `;
    const data = await this.graphql<{ environmentCreate: Environment }>(query, { input });
    return data.environmentCreate;
  }

  /**
   * Rename an environment
   */
  async renameEnvironment(environmentId: string, name: string): Promise<boolean> {
    const query = `
      mutation environmentRename($id: String!, $input: EnvironmentRenameInput!) {
        environmentRename(id: $id, input: $input)
      }
    `;
    await this.graphql(query, { id: environmentId, input: { name } });
    return true;
  }

  /**
   * Delete an environment
   */
  async deleteEnvironment(environmentId: string): Promise<boolean> {
    const query = `
      mutation environmentDelete($id: String!) {
        environmentDelete(id: $id)
      }
    `;
    await this.graphql(query, { id: environmentId });
    return true;
  }

  // ==========================================================================
  // Deployments API
  // ==========================================================================

  /**
   * List deployments for a service
   */
  async listDeployments(
    input: DeploymentListInput,
    first?: number
  ): Promise<Deployment[]> {
    const query = `
      query deployments($input: DeploymentListInput!, $first: Int) {
        deployments(input: $input, first: $first) {
          edges {
            node {
              id
              status
              createdAt
              url
              staticUrl
            }
          }
        }
      }
    `;
    const data = await this.graphql<{ deployments: { edges: Array<{ node: Deployment }> } }>(
      query,
      { input, first }
    );
    return data.deployments.edges.map(edge => edge.node);
  }

  /**
   * Get a specific deployment
   */
  async getDeployment(deploymentId: string): Promise<Deployment> {
    const query = `
      query deployment($id: String!) {
        deployment(id: $id) {
          id
          status
          createdAt
          url
          staticUrl
          meta
          canRedeploy
          canRollback
        }
      }
    `;
    const data = await this.graphql<{ deployment: Deployment }>(query, { id: deploymentId });
    return data.deployment;
  }

  /**
   * Get latest active deployment
   */
  async getLatestDeployment(
    projectId: string,
    environmentId: string,
    serviceId: string
  ): Promise<Deployment | null> {
    const deployments = await this.listDeployments(
      {
        projectId,
        environmentId,
        serviceId,
        status: { successfulOnly: true },
      },
      1
    );
    return deployments.length > 0 ? deployments[0] : null;
  }

  /**
   * Deploy a service (trigger new deployment)
   */
  async deploy(
    serviceId: string,
    environmentId: string
  ): Promise<boolean> {
    const query = `
      mutation serviceInstanceDeployV2($serviceId: String!, $environmentId: String!) {
        serviceInstanceDeployV2(serviceId: $serviceId, environmentId: $environmentId)
      }
    `;
    await this.graphql(query, { serviceId, environmentId });
    return true;
  }

  /**
   * Redeploy a service
   */
  async redeploy(serviceId: string, environmentId: string): Promise<boolean> {
    const query = `
      mutation serviceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
        serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
      }
    `;
    await this.graphql(query, { serviceId, environmentId });
    return true;
  }

  /**
   * Redeploy from specific deployment
   */
  async redeployFromDeployment(deploymentId: string): Promise<Deployment> {
    const query = `
      mutation deploymentRedeploy($id: String!) {
        deploymentRedeploy(id: $id) {
          id
          status
        }
      }
    `;
    const data = await this.graphql<{ deploymentRedeploy: Deployment }>(query, { id: deploymentId });
    return data.deploymentRedeploy;
  }

  /**
   * Rollback to previous deployment
   */
  async rollback(deploymentId: string): Promise<Deployment> {
    const query = `
      mutation deploymentRollback($id: String!) {
        deploymentRollback(id: $id) {
          id
          status
        }
      }
    `;
    const data = await this.graphql<{ deploymentRollback: Deployment }>(query, { id: deploymentId });
    return data.deploymentRollback;
  }

  /**
   * Restart a deployment
   */
  async restartDeployment(deploymentId: string): Promise<boolean> {
    const query = `
      mutation deploymentRestart($id: String!) {
        deploymentRestart(id: $id)
      }
    `;
    await this.graphql(query, { id: deploymentId });
    return true;
  }

  /**
   * Stop a deployment
   */
  async stopDeployment(deploymentId: string): Promise<boolean> {
    const query = `
      mutation deploymentStop($id: String!) {
        deploymentStop(id: $id)
      }
    `;
    await this.graphql(query, { id: deploymentId });
    return true;
  }

  /**
   * Cancel a deployment
   */
  async cancelDeployment(deploymentId: string): Promise<boolean> {
    const query = `
      mutation deploymentCancel($id: String!) {
        deploymentCancel(id: $id)
      }
    `;
    await this.graphql(query, { id: deploymentId });
    return true;
  }

  /**
   * Remove a deployment
   */
  async removeDeployment(deploymentId: string): Promise<boolean> {
    const query = `
      mutation deploymentRemove($id: String!) {
        deploymentRemove(id: $id)
      }
    `;
    await this.graphql(query, { id: deploymentId });
    return true;
  }

  // ==========================================================================
  // Logs API
  // ==========================================================================

  /**
   * Get build logs for a deployment
   */
  async getBuildLogs(deploymentId: string, limit?: number): Promise<DeploymentLog[]> {
    const query = `
      query buildLogs($deploymentId: String!, $limit: Int) {
        buildLogs(deploymentId: $deploymentId, limit: $limit) {
          timestamp
          message
          severity
        }
      }
    `;
    const data = await this.graphql<{ buildLogs: DeploymentLog[] }>(query, { deploymentId, limit });
    return data.buildLogs;
  }

  /**
   * Get runtime logs for a deployment
   */
  async getDeploymentLogs(
    deploymentId: string,
    options?: {
      limit?: number;
      filter?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<DeploymentLog[]> {
    const query = `
      query deploymentLogs($deploymentId: String!, $limit: Int, $filter: String, $startDate: DateTime, $endDate: DateTime) {
        deploymentLogs(deploymentId: $deploymentId, limit: $limit, filter: $filter, startDate: $startDate, endDate: $endDate) {
          timestamp
          message
          severity
        }
      }
    `;
    const data = await this.graphql<{ deploymentLogs: DeploymentLog[] }>(query, {
      deploymentId,
      ...options,
    });
    return data.deploymentLogs;
  }

  /**
   * Get HTTP access logs for a deployment
   */
  async getHttpLogs(deploymentId: string, limit?: number): Promise<HttpLog[]> {
    const query = `
      query httpLogs($deploymentId: String!, $limit: Int) {
        httpLogs(deploymentId: $deploymentId, limit: $limit) {
          timestamp
          requestId
          method
          path
          httpStatus
          totalDuration
          srcIp
        }
      }
    `;
    const data = await this.graphql<{ httpLogs: HttpLog[] }>(query, { deploymentId, limit });
    return data.httpLogs;
  }

  /**
   * Get environment-level logs (all services)
   */
  async getEnvironmentLogs(
    environmentId: string,
    filter?: string
  ): Promise<Array<DeploymentLog & { tags?: { serviceId?: string; deploymentId?: string } }>> {
    const query = `
      query environmentLogs($environmentId: String!, $filter: String) {
        environmentLogs(environmentId: $environmentId, filter: $filter) {
          timestamp
          message
          severity
          tags {
            serviceId
            deploymentId
          }
        }
      }
    `;
    const data = await this.graphql<{ environmentLogs: Array<DeploymentLog & { tags?: any }> }>(
      query,
      { environmentId, filter }
    );
    return data.environmentLogs;
  }

  // ==========================================================================
  // Variables API
  // ==========================================================================

  /**
   * Get variables for a service/environment
   */
  async getVariables(
    projectId: string,
    environmentId: string,
    serviceId?: string,
    unrendered?: boolean
  ): Promise<Record<string, string>> {
    const query = `
      query variables($projectId: String!, $environmentId: String!, $serviceId: String, $unrendered: Boolean) {
        variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId, unrendered: $unrendered)
      }
    `;
    const data = await this.graphql<{ variables: Record<string, string> }>(query, {
      projectId,
      environmentId,
      serviceId,
      unrendered,
    });
    return data.variables;
  }

  /**
   * Get resolved variables for deployment
   */
  async getVariablesForDeployment(
    projectId: string,
    environmentId: string,
    serviceId: string
  ): Promise<Record<string, string>> {
    const query = `
      query variablesForServiceDeployment($projectId: String!, $environmentId: String!, $serviceId: String!) {
        variablesForServiceDeployment(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
      }
    `;
    const data = await this.graphql<{ variablesForServiceDeployment: Record<string, string> }>(
      query,
      { projectId, environmentId, serviceId }
    );
    return data.variablesForServiceDeployment;
  }

  /**
   * Set a single variable
   */
  async setVariable(input: VariableUpsertInput): Promise<boolean> {
    const query = `
      mutation variableUpsert($input: VariableUpsertInput!) {
        variableUpsert(input: $input)
      }
    `;
    await this.graphql(query, { input });
    return true;
  }

  /**
   * Set multiple variables at once
   */
  async setVariables(input: VariableCollectionUpsertInput): Promise<boolean> {
    const query = `
      mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }
    `;
    await this.graphql(query, { input });
    return true;
  }

  /**
   * Delete a variable
   */
  async deleteVariable(input: VariableDeleteInput): Promise<boolean> {
    const query = `
      mutation variableDelete($input: VariableDeleteInput!) {
        variableDelete(input: $input)
      }
    `;
    await this.graphql(query, { input });
    return true;
  }

  // ==========================================================================
  // Domains API
  // ==========================================================================

  /**
   * Generate a Railway domain for a service
   */
  async generateDomain(
    serviceId: string,
    environmentId: string
  ): Promise<ServiceDomain> {
    const query = `
      mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
        serviceDomainCreate(input: $input) {
          domain
        }
      }
    `;
    const data = await this.graphql<{ serviceDomainCreate: ServiceDomain }>(query, {
      input: { serviceId, environmentId },
    });
    return data.serviceDomainCreate;
  }

  /**
   * Add a custom domain
   */
  async addCustomDomain(
    serviceId: string,
    environmentId: string,
    domain: string
  ): Promise<CustomDomain> {
    const query = `
      mutation customDomainCreate($input: CustomDomainCreateInput!) {
        customDomainCreate(input: $input) {
          id
          status {
            dnsRecords {
              hostlabel
              requiredValue
            }
          }
        }
      }
    `;
    const data = await this.graphql<{ customDomainCreate: CustomDomain }>(query, {
      input: { serviceId, environmentId, domain },
    });
    return data.customDomainCreate;
  }

  // ==========================================================================
  // Volumes API
  // ==========================================================================

  /**
   * Create a volume
   */
  async createVolume(
    serviceId: string,
    environmentId: string,
    mountPath: string,
    name?: string
  ): Promise<Volume> {
    const query = `
      mutation volumeCreate($input: VolumeCreateInput!) {
        volumeCreate(input: $input) {
          id
        }
      }
    `;
    const data = await this.graphql<{ volumeCreate: Volume }>(query, {
      input: { serviceId, environmentId, mountPath, name },
    });
    return data.volumeCreate;
  }

  /**
   * Create a volume backup
   */
  async createVolumeBackup(volumeInstanceId: string): Promise<boolean> {
    const query = `
      mutation volumeInstanceBackupCreate($volumeInstanceId: String!) {
        volumeInstanceBackupCreate(volumeInstanceId: $volumeInstanceId)
      }
    `;
    await this.graphql(query, { volumeInstanceId });
    return true;
  }

  // ==========================================================================
  // TCP Proxies API
  // ==========================================================================

  /**
   * List TCP proxies for a service
   */
  async listTcpProxies(serviceId: string, environmentId: string): Promise<TcpProxy[]> {
    const query = `
      query tcpProxies($serviceId: String!, $environmentId: String!) {
        tcpProxies(serviceId: $serviceId, environmentId: $environmentId) {
          id
          domain
          proxyPort
          applicationPort
        }
      }
    `;
    const data = await this.graphql<{ tcpProxies: TcpProxy[] }>(query, { serviceId, environmentId });
    return data.tcpProxies;
  }

  // ==========================================================================
  // Regions API
  // ==========================================================================

  /**
   * List available regions
   */
  async listRegions(): Promise<Region[]> {
    const query = `
      query {
        regions {
          name
          country
          location
        }
      }
    `;
    const data = await this.graphql<{ regions: Region[] }>(query);
    return data.regions;
  }

  // ==========================================================================
  // Templates API
  // ==========================================================================

  /**
   * Deploy from a template
   */
  async deployTemplate(
    templateCode: string,
    projectId?: string,
    environmentId?: string,
    services?: Record<string, { variables?: Record<string, string> }>
  ): Promise<{ projectId: string; workflowId: string }> {
    const query = `
      mutation templateDeploy($input: TemplateDeployInput!) {
        templateDeploy(input: $input) {
          projectId
          workflowId
        }
      }
    `;
    const data = await this.graphql<{
      templateDeploy: { projectId: string; workflowId: string };
    }>(query, {
      input: { templateCode, projectId, environmentId, services },
    });
    return data.templateDeploy;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a Railway client instance
 *
 * @example
 * const railway = createRailwayClient({
 *   apiToken: process.env.RAILWAY_TOKEN!
 * });
 */
export function createRailwayClient(config: RailwayConfig): RailwayClient {
  return new RailwayClient(config);
}

/**
 * Get Railway configuration from environment variables
 */
export function getRailwayConfigFromEnv(): RailwayConfig {
  const apiToken = process.env.RAILWAY_TOKEN;

  if (!apiToken) {
    throw new Error(
      'Railway API token not found. Set RAILWAY_TOKEN environment variable.\n' +
      'Get your token from: https://railway.com/account/tokens'
    );
  }

  return { apiToken };
}

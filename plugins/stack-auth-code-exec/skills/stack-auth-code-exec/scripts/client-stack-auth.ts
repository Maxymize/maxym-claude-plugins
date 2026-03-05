/**
 * Stack Auth Code Execution Client
 *
 * Direct connection to Stack Auth documentation without MCP server overhead.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 * @see https://stack-auth.com
 */

// ============================================================================
// Types
// ============================================================================

export interface DocPage {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  relevance: number;
}

// ============================================================================
// Documentation Catalog
// Based on Stack Auth MCP list_available_docs output
// ============================================================================

export const DOCS_CATALOG: Record<string, DocPage[]> = {
  'getting-started': [
    { id: '/docs/overview', title: 'Overview', category: 'getting-started' },
    { id: '/docs/faq', title: 'FAQ', description: 'Frequently asked questions about Stack', category: 'getting-started' },
    { id: '/docs/getting-started/setup', title: 'Setup', category: 'getting-started' },
    { id: '/docs/getting-started/components', title: 'Components', description: 'Pre-built Next.js components', category: 'getting-started' },
    { id: '/docs/getting-started/users', title: 'Users', category: 'getting-started' },
    { id: '/docs/getting-started/production', title: 'Production', description: 'Steps to prepare Stack for production', category: 'getting-started' },
    { id: '/docs/getting-started/example-pages', title: 'Example Pages', category: 'getting-started' },
  ],
  'components': [
    { id: '/docs/components', title: 'Components Overview', category: 'components' },
    { id: '/docs/components/sign-in', title: '<SignIn />', category: 'components' },
    { id: '/docs/components/sign-up', title: '<SignUp />', category: 'components' },
    { id: '/docs/components/user-button', title: '<UserButton />', category: 'components' },
    { id: '/docs/components/account-settings', title: '<AccountSettings />', category: 'components' },
    { id: '/docs/components/credential-sign-in', title: '<CredentialSignIn />', category: 'components' },
    { id: '/docs/components/credential-sign-up', title: '<CredentialSignUp />', category: 'components' },
    { id: '/docs/components/forgot-password', title: '<ForgotPassword />', category: 'components' },
    { id: '/docs/components/magic-link-sign-in', title: '<MagicLinkSignIn />', category: 'components' },
    { id: '/docs/components/oauth-button', title: '<OAuthButton />', category: 'components' },
    { id: '/docs/components/oauth-button-group', title: '<OAuthButtonGroup />', category: 'components' },
    { id: '/docs/components/password-reset', title: '<PasswordReset />', category: 'components' },
    { id: '/docs/components/selected-team-switcher', title: '<SelectedTeamSwitcher />', category: 'components' },
    { id: '/docs/components/stack-handler', title: '<StackHandler />', category: 'components' },
    { id: '/docs/components/stack-provider', title: '<StackProvider />', category: 'components' },
    { id: '/docs/components/stack-theme', title: '<StackTheme />', category: 'components' },
  ],
  'concepts': [
    { id: '/docs/concepts/stack-app', title: 'Stack App', description: 'The most important object of your Stack project', category: 'concepts' },
    { id: '/docs/concepts/backend-integration', title: 'Backend Integration', description: 'Integrate Stack Auth with your server', category: 'concepts' },
    { id: '/docs/concepts/custom-user-data', title: 'Custom User Data', description: 'Store custom user metadata', category: 'concepts' },
    { id: '/docs/concepts/jwt', title: 'JWT Tokens', category: 'concepts' },
    { id: '/docs/concepts/team-selection', title: 'Team Selection', category: 'concepts' },
    { id: '/docs/concepts/user-onboarding', title: 'User Onboarding', description: 'Implementing user onboarding', category: 'concepts' },
  ],
  'auth-providers': [
    { id: '/docs/concepts/auth-providers', title: 'Auth Providers Overview', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/google', title: 'Google', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/github', title: 'GitHub', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/apple', title: 'Apple', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/facebook', title: 'Facebook', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/microsoft', title: 'Microsoft', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/discord', title: 'Discord', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/gitlab', title: 'GitLab', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/bitbucket', title: 'Bitbucket', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/linkedin', title: 'LinkedIn', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/spotify', title: 'Spotify', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/twitch', title: 'Twitch', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/x-twitter', title: 'X (Twitter)', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/passkey', title: 'Passkey', category: 'auth-providers' },
    { id: '/docs/concepts/auth-providers/two-factor-auth', title: 'Two-Factor Authentication (2FA)', category: 'auth-providers' },
  ],
  'customization': [
    { id: '/docs/customization/custom-pages', title: 'Custom Pages', category: 'customization' },
    { id: '/docs/customization/custom-styles', title: 'Custom Styles', category: 'customization' },
    { id: '/docs/customization/dark-mode', title: 'Dark Mode', category: 'customization' },
    { id: '/docs/customization/internationalization', title: 'Internationalization', category: 'customization' },
    { id: '/docs/customization/page-examples', title: 'Page Examples', category: 'customization' },
    { id: '/docs/customization/page-examples/sign-in', title: 'Sign-In Page Examples', category: 'customization' },
    { id: '/docs/customization/page-examples/sign-up', title: 'Sign-Up Page Examples', category: 'customization' },
    { id: '/docs/customization/page-examples/forgot-password', title: 'Forgot Password Examples', category: 'customization' },
    { id: '/docs/customization/page-examples/password-reset', title: 'Password Reset Examples', category: 'customization' },
  ],
  'apps': [
    { id: '/docs/apps/api-keys', title: 'API Keys', description: 'Create and manage API keys', category: 'apps' },
    { id: '/docs/apps/emails', title: 'Emails', description: 'Send custom emails', category: 'apps' },
    { id: '/docs/apps/oauth', title: 'OAuth', description: 'Managing third-party OAuth tokens', category: 'apps' },
    { id: '/docs/apps/orgs-and-teams', title: 'Orgs and Teams', description: 'Manage teams and members', category: 'apps' },
    { id: '/docs/apps/permissions', title: 'RBAC Permissions', category: 'apps' },
    { id: '/docs/apps/webhooks', title: 'Webhooks', category: 'apps' },
  ],
  'sdk': [
    { id: '/docs/sdk', title: 'SDK Overview', category: 'sdk' },
    { id: '/docs/sdk/overview-new', title: 'SDK Overview (New)', category: 'sdk' },
    { id: '/docs/sdk/hooks/use-stack-app', title: 'useStackApp', category: 'sdk' },
    { id: '/docs/sdk/hooks/use-user', title: 'useUser', category: 'sdk' },
    { id: '/docs/sdk/objects/stack-app', title: 'StackApp', category: 'sdk' },
  ],
  'sdk-types': [
    { id: '/docs/sdk/types/api-key', title: 'ApiKey', category: 'sdk-types' },
    { id: '/docs/sdk/types/connected-account', title: 'ConnectedAccount', category: 'sdk-types' },
    { id: '/docs/sdk/types/contact-channel', title: 'ContactChannel', category: 'sdk-types' },
    { id: '/docs/sdk/types/customer', title: 'Customer', category: 'sdk-types' },
    { id: '/docs/sdk/types/email', title: 'Email', category: 'sdk-types' },
    { id: '/docs/sdk/types/item', title: 'Item', category: 'sdk-types' },
    { id: '/docs/sdk/types/project', title: 'Project', category: 'sdk-types' },
    { id: '/docs/sdk/types/team', title: 'Team', category: 'sdk-types' },
    { id: '/docs/sdk/types/team-permission', title: 'TeamPermission', category: 'sdk-types' },
    { id: '/docs/sdk/types/team-profile', title: 'TeamProfile', category: 'sdk-types' },
    { id: '/docs/sdk/types/team-user', title: 'TeamUser', category: 'sdk-types' },
    { id: '/docs/sdk/types/user', title: 'User', category: 'sdk-types' },
  ],
  'rest-api': [
    { id: '/docs/rest-api/overview', title: 'API Reference', description: 'Complete REST API documentation', category: 'rest-api' },
    { id: '/api/overview', title: 'API Reference', description: 'Complete REST API documentation', category: 'rest-api' },
  ],
  'api-client': [
    { id: '/api/client/anonymous/auth/anonymous/sign-up', title: 'Sign up anonymously', category: 'api-client' },
    { id: '/api/client/api-keys/team-api-keys/get', title: 'List team API keys', category: 'api-client' },
    { id: '/api/client/api-keys/user-api-keys/get', title: 'List user API keys', category: 'api-client' },
    { id: '/api/client/sessions/auth/sessions', title: 'List sessions', category: 'api-client' },
    { id: '/api/client/teams/teams/get', title: 'List teams', category: 'api-client' },
    { id: '/api/client/users/users/me/get', title: 'Get current user', category: 'api-client' },
    { id: '/api/client/password/auth/password/sign-in', title: 'Sign in with password', category: 'api-client' },
    { id: '/api/client/password/auth/password/sign-up', title: 'Sign up with password', category: 'api-client' },
    { id: '/api/client/otp/auth/otp/sign-in', title: 'Sign in with OTP', category: 'api-client' },
  ],
  'api-server': [
    { id: '/api/server/users/users/get', title: 'List users', description: 'Lists all users in the project', category: 'api-server' },
    { id: '/api/server/users/users/post', title: 'Create user', category: 'api-server' },
    { id: '/api/server/users/users/user_id/get', title: 'Get user', category: 'api-server' },
    { id: '/api/server/users/users/user_id/patch', title: 'Update user', category: 'api-server' },
    { id: '/api/server/users/users/user_id/delete', title: 'Delete user', category: 'api-server' },
    { id: '/api/server/teams/teams/get', title: 'List teams', category: 'api-server' },
    { id: '/api/server/teams/teams/post', title: 'Create team', category: 'api-server' },
    { id: '/api/server/sessions/auth/sessions/post', title: 'Create session', category: 'api-server' },
    { id: '/api/server/others/emails/send-email', title: 'Send email', category: 'api-server' },
  ],
  'webhooks': [
    { id: '/api/webhooks/users/user.created', title: 'user.created', description: 'Triggered when a user is created', category: 'webhooks' },
    { id: '/api/webhooks/users/user.updated', title: 'user.updated', description: 'Triggered when a user is updated', category: 'webhooks' },
    { id: '/api/webhooks/users/user.deleted', title: 'user.deleted', description: 'Triggered when a user is deleted', category: 'webhooks' },
    { id: '/api/webhooks/teams/team.created', title: 'team.created', description: 'Triggered when a team is created', category: 'webhooks' },
    { id: '/api/webhooks/teams/team.updated', title: 'team.updated', description: 'Triggered when a team is updated', category: 'webhooks' },
    { id: '/api/webhooks/teams/team.deleted', title: 'team.deleted', description: 'Triggered when a team is deleted', category: 'webhooks' },
    { id: '/api/webhooks/teams/team_membership.created', title: 'team_membership.created', category: 'webhooks' },
    { id: '/api/webhooks/teams/team_membership.deleted', title: 'team_membership.deleted', category: 'webhooks' },
    { id: '/api/webhooks/teams/team_permission.created', title: 'team_permission.created', category: 'webhooks' },
    { id: '/api/webhooks/teams/team_permission.deleted', title: 'team_permission.deleted', category: 'webhooks' },
  ],
  'others': [
    { id: '/docs/others/cli-authentication', title: 'CLI Authentication', description: 'Authenticate CLI apps', category: 'others' },
    { id: '/docs/others/convex', title: 'Convex', description: 'Integrate with Convex', category: 'others' },
    { id: '/docs/others/self-host', title: 'Self-host', category: 'others' },
    { id: '/docs/others/supabase', title: 'Supabase', description: 'Integrate with Supabase RLS', category: 'others' },
  ],
};

// Flatten all docs for searching
export const ALL_DOCS: DocPage[] = Object.values(DOCS_CATALOG).flat();

// ============================================================================
// API Configuration
// ============================================================================

const STACK_AUTH_DOCS_BASE = 'https://docs.stack-auth.com';

// ============================================================================
// Local Functions (No Network)
// ============================================================================

/**
 * List all available documentation pages
 */
export function listDocs(): DocPage[] {
  return ALL_DOCS;
}

/**
 * List docs by category
 */
export function listDocsByCategory(category: string): DocPage[] {
  return DOCS_CATALOG[category] || [];
}

/**
 * Get all categories
 */
export function listCategories(): string[] {
  return Object.keys(DOCS_CATALOG);
}

/**
 * Search documentation by query (local, instant)
 */
export function searchDocs(query: string): SearchResult[] {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/).filter(w => w.length > 0);

  const results: SearchResult[] = [];

  for (const doc of ALL_DOCS) {
    let relevance = 0;
    const searchableText = `${doc.title} ${doc.description || ''} ${doc.id}`.toLowerCase();

    // Exact phrase match
    if (searchableText.includes(lowerQuery)) {
      relevance += 10;
    }

    // Individual word matches
    for (const word of words) {
      if (doc.title.toLowerCase().includes(word)) {
        relevance += 5;
      }
      if (doc.description?.toLowerCase().includes(word)) {
        relevance += 3;
      }
      if (doc.id.toLowerCase().includes(word)) {
        relevance += 2;
      }
    }

    if (relevance > 0) {
      results.push({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        relevance,
      });
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Check if a doc exists
 */
export function docExists(id: string): boolean {
  return ALL_DOCS.some(doc => doc.id === id);
}

/**
 * Get doc metadata (without fetching content)
 */
export function getDocMetadata(id: string): DocPage | null {
  return ALL_DOCS.find(doc => doc.id === id) || null;
}

// ============================================================================
// Network Functions (Fetch from Stack Auth)
// ============================================================================

/**
 * Fetch documentation page content by ID
 * This calls the Stack Auth documentation API
 */
export async function getDocById(id: string): Promise<DocPage> {
  // Normalize ID
  const normalizedId = id.startsWith('/') ? id : `/${id}`;

  // Check if doc exists in catalog
  const metadata = getDocMetadata(normalizedId);
  if (!metadata) {
    throw new Error(`Documentation page not found: ${id}`);
  }

  // Construct the docs URL
  // Stack Auth docs are typically at stack-auth.com/docs/...
  const url = `${STACK_AUTH_DOCS_BASE}${normalizedId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'StackAuth-CodeExec-Client/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch ${id}`);
    }

    const html = await response.text();

    // Extract main content from HTML (basic extraction)
    const content = extractContentFromHtml(html);

    return {
      ...metadata,
      content,
    };
  } catch (error) {
    throw new Error(`Failed to fetch doc ${id}: ${error}`);
  }
}

/**
 * Fetch multiple documentation pages in parallel
 */
export async function getDocsByIds(ids: string[]): Promise<DocPage[]> {
  return Promise.all(
    ids.map(id =>
      getDocById(id).catch(err => ({
        id,
        title: 'Error',
        category: 'error',
        content: `Error fetching: ${err.message}`,
      } as DocPage))
    )
  );
}

/**
 * Get Stack Auth setup instructions
 */
export async function getSetupInstructions(): Promise<DocPage> {
  return getDocById('/docs/getting-started/setup');
}

/**
 * Get documentation URL for browser
 */
export function getDocUrl(id: string): string {
  const normalizedId = id.startsWith('/') ? id : `/${id}`;
  return `${STACK_AUTH_DOCS_BASE}${normalizedId}`;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract main content from HTML
 * Basic extraction - removes scripts, styles, nav elements
 */
function extractContentFromHtml(html: string): string {
  // Remove script tags
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove nav, header, footer
  content = content.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
  content = content.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
  content = content.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');

  // Remove HTML tags but keep text
  content = content.replace(/<[^>]+>/g, ' ');

  // Clean up whitespace
  content = content.replace(/\s+/g, ' ').trim();

  // Limit content length
  if (content.length > 10000) {
    content = content.substring(0, 10000) + '...';
  }

  return content;
}

/**
 * Get quick reference for common tasks
 */
export function getQuickReference(topic: string): DocPage[] {
  const topicLower = topic.toLowerCase();

  const topicMap: Record<string, string[]> = {
    'setup': ['/docs/getting-started/setup', '/docs/overview'],
    'authentication': ['/docs/concepts/auth-providers', '/docs/components/sign-in', '/docs/components/sign-up'],
    'oauth': ['/docs/apps/oauth', '/docs/concepts/auth-providers/google', '/docs/concepts/auth-providers/github'],
    'teams': ['/docs/apps/orgs-and-teams', '/docs/concepts/team-selection'],
    'api': ['/docs/rest-api/overview', '/docs/concepts/backend-integration'],
    'components': ['/docs/components', '/docs/components/sign-in', '/docs/components/user-button'],
    'hooks': ['/docs/sdk/hooks/use-user', '/docs/sdk/hooks/use-stack-app'],
    'customization': ['/docs/customization/custom-styles', '/docs/customization/dark-mode'],
  };

  const ids = topicMap[topicLower] || [];
  return ids.map(id => getDocMetadata(id)).filter((doc): doc is DocPage => doc !== null);
}

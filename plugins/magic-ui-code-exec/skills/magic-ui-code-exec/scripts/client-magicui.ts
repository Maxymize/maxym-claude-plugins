/**
 * Magic UI Code Execution Client
 *
 * Direct connection to magicui.design API without MCP server overhead.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 */

const MAGICUI_REGISTRY_BASE = 'https://magicui.design/r';

// Component categories for organization
export type ComponentCategory =
  | 'components'
  | 'buttons'
  | 'backgrounds'
  | 'text-animations'
  | 'special-effects'
  | 'animations'
  | 'device-mocks';

export interface MagicUIComponent {
  name: string;
  type: string;
  description?: string;
  content?: string;
  install?: string;
  examples?: unknown[];
}

export interface ComponentRegistry {
  [key: string]: MagicUIComponent;
}

// Complete list of all Magic UI components organized by category
export const COMPONENT_CATALOG: Record<ComponentCategory, string[]> = {
  'components': [
    'marquee', 'terminal', 'hero-video-dialog', 'bento-grid', 'animated-list',
    'dock', 'globe', 'tweet-card', 'client-tweet-card', 'orbiting-circles',
    'avatar-circles', 'icon-cloud', 'animated-circular-progress-bar', 'file-tree',
    'code-comparison', 'scroll-progress', 'lens', 'pointer'
  ],
  'buttons': [
    'rainbow-button', 'shimmer-button', 'shiny-button', 'interactive-hover-button',
    'pulsating-button', 'ripple-button'
  ],
  'backgrounds': [
    'warp-background', 'flickering-grid', 'animated-grid-pattern', 'retro-grid',
    'ripple', 'dot-pattern', 'grid-pattern', 'interactive-grid-pattern'
  ],
  'text-animations': [
    'text-animate', 'line-shadow-text', 'aurora-text', 'number-ticker',
    'animated-shiny-text', 'animated-gradient-text', 'text-reveal', 'hyper-text',
    'word-rotate', 'typing-animation', 'scroll-based-velocity', 'flip-text',
    'box-reveal', 'sparkles-text', 'morphing-text', 'spinning-text'
  ],
  'special-effects': [
    'animated-beam', 'border-beam', 'shine-border', 'magic-card', 'meteors',
    'neon-gradient-card', 'confetti', 'particles', 'cool-mode', 'scratch-to-reveal'
  ],
  'animations': [
    'blur-fade'
  ],
  'device-mocks': [
    'safari', 'iphone-15-pro', 'android'
  ]
};

// Flatten catalog to get all component names
export const ALL_COMPONENTS: string[] = Object.values(COMPONENT_CATALOG).flat();

/**
 * Fetch a single component from the Magic UI registry
 *
 * @param componentName - Name of the component (e.g., 'marquee', 'shimmer-button')
 * @returns Component data including source code and installation instructions
 *
 * @example
 * const marquee = await getComponent('marquee');
 * console.log(marquee.content); // Source code
 * console.log(marquee.install); // Installation command
 */
export async function getComponent(componentName: string): Promise<MagicUIComponent> {
  const url = `${MAGICUI_REGISTRY_BASE}/${componentName}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch ${componentName}`);
    }

    const data = await response.json();

    // Extract component info from registry format
    return {
      name: componentName,
      type: data.type || 'registry:ui',
      description: data.description || '',
      content: extractSourceCode(data),
      install: generateInstallCommand(componentName),
      examples: data.examples || []
    };
  } catch (error) {
    throw new Error(`Failed to fetch component '${componentName}': ${error}`);
  }
}

/**
 * Extract source code from registry data
 */
function extractSourceCode(data: any): string {
  if (data.files && data.files.length > 0) {
    return data.files.map((f: any) => f.content).join('\n\n');
  }
  return data.content || '';
}

/**
 * Generate installation command for a component
 */
function generateInstallCommand(componentName: string): string {
  return `npx shadcn@latest add "https://magicui.design/r/${componentName}.json"`;
}

/**
 * Get multiple components at once
 *
 * @param componentNames - Array of component names
 * @returns Array of component data
 *
 * @example
 * const components = await getComponents(['marquee', 'shimmer-button', 'bento-grid']);
 */
export async function getComponents(componentNames: string[]): Promise<MagicUIComponent[]> {
  const results = await Promise.all(
    componentNames.map(name => getComponent(name).catch(err => ({
      name,
      type: 'error',
      description: `Error: ${err.message}`,
      content: '',
      install: '',
      examples: []
    })))
  );
  return results;
}

/**
 * List all available components
 *
 * @returns List of all component names with their categories
 */
export function listComponents(): { name: string; category: ComponentCategory }[] {
  const result: { name: string; category: ComponentCategory }[] = [];

  for (const [category, components] of Object.entries(COMPONENT_CATALOG)) {
    for (const name of components) {
      result.push({ name, category: category as ComponentCategory });
    }
  }

  return result;
}

/**
 * Get all components in a specific category
 *
 * @param category - Component category
 * @returns Array of component data for the category
 *
 * @example
 * const buttons = await getComponentsByCategory('buttons');
 */
export async function getComponentsByCategory(category: ComponentCategory): Promise<MagicUIComponent[]> {
  const componentNames = COMPONENT_CATALOG[category];
  if (!componentNames) {
    throw new Error(`Unknown category: ${category}`);
  }
  return getComponents(componentNames);
}

/**
 * Search components by name or description
 *
 * @param query - Search query (case-insensitive)
 * @returns Matching component names
 *
 * @example
 * const results = searchComponents('button'); // ['shimmer-button', 'rainbow-button', ...]
 */
export function searchComponents(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return ALL_COMPONENTS.filter(name => name.toLowerCase().includes(lowerQuery));
}

/**
 * Get installation commands for multiple components
 *
 * @param componentNames - Array of component names
 * @returns Combined installation command
 */
export function getInstallCommand(componentNames: string[]): string {
  const urls = componentNames.map(name => `"https://magicui.design/r/${name}.json"`);
  return `npx shadcn@latest add ${urls.join(' ')}`;
}

/**
 * Check if a component exists in the catalog
 */
export function componentExists(componentName: string): boolean {
  return ALL_COMPONENTS.includes(componentName);
}

/**
 * Get the category of a component
 */
export function getComponentCategory(componentName: string): ComponentCategory | null {
  for (const [category, components] of Object.entries(COMPONENT_CATALOG)) {
    if (components.includes(componentName)) {
      return category as ComponentCategory;
    }
  }
  return null;
}

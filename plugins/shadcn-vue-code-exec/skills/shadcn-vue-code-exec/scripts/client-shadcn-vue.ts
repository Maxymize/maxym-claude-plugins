/**
 * shadcn-vue Code Execution Client
 *
 * Direct connection to shadcn-vue.com registry API without MCP server overhead.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 */

const SHADCN_VUE_REGISTRY_BASE = 'https://www.shadcn-vue.com/r/styles/new-york';
const SHADCN_VUE_DOCS_BASE = 'https://www.shadcn-vue.com/docs';

// Component categories for organization
export type ComponentCategory =
  | 'forms'
  | 'layout'
  | 'feedback'
  | 'navigation'
  | 'data-display'
  | 'overlay'
  | 'charts'
  | 'misc';

export interface ShadcnVueFile {
  path: string;
  content: string;
  type: string;
  target?: string;
}

export interface ShadcnVueComponent {
  name: string;
  type: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: ShadcnVueFile[];
  install?: string;
}

// Complete list of all shadcn-vue components organized by category
export const COMPONENT_CATALOG: Record<ComponentCategory, string[]> = {
  'forms': [
    'button', 'button-group', 'checkbox', 'combobox', 'form', 'input',
    'input-group', 'input-otp', 'label', 'native-select', 'pin-input',
    'radio-group', 'select', 'slider', 'switch', 'tags-input', 'textarea',
    'toggle', 'toggle-group', 'field'
  ],
  'layout': [
    'accordion', 'aspect-ratio', 'card', 'carousel', 'collapsible',
    'resizable', 'separator', 'sidebar', 'table', 'tabs'
  ],
  'feedback': [
    'alert', 'alert-dialog', 'progress', 'skeleton', 'sonner', 'spinner',
    'stepper', 'toast', 'empty'
  ],
  'navigation': [
    'breadcrumb', 'command', 'context-menu', 'dropdown-menu', 'menubar',
    'navigation-menu', 'pagination'
  ],
  'data-display': [
    'avatar', 'badge', 'calendar', 'data-table', 'date-picker', 'hover-card',
    'scroll-area', 'tooltip', 'typography', 'kbd', 'item'
  ],
  'overlay': [
    'dialog', 'drawer', 'popover', 'sheet'
  ],
  'charts': [
    'chart', 'chart-area', 'chart-bar', 'chart-donut', 'chart-line', 'chart-radar'
  ],
  'misc': [
    'lens'
  ]
};

// Flatten catalog to get all component names
export const ALL_COMPONENTS: string[] = Object.values(COMPONENT_CATALOG).flat();

/**
 * Fetch a single component from the shadcn-vue registry
 *
 * @param componentName - Name of the component (e.g., 'button', 'accordion')
 * @returns Component data including source code and installation instructions
 *
 * @example
 * const button = await getComponent('button');
 * console.log(button.files[0].content); // Source code
 * console.log(button.install); // Installation command
 */
export async function getComponent(componentName: string): Promise<ShadcnVueComponent> {
  const url = `${SHADCN_VUE_REGISTRY_BASE}/${componentName}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch ${componentName}`);
    }

    const data = await response.json();

    return {
      name: data.name || componentName,
      type: data.type || 'registry:ui',
      dependencies: data.dependencies || [],
      registryDependencies: data.registryDependencies || [],
      files: data.files || [],
      install: generateInstallCommand(componentName)
    };
  } catch (error) {
    throw new Error(`Failed to fetch component '${componentName}': ${error}`);
  }
}

/**
 * Generate installation command for a component
 */
function generateInstallCommand(componentName: string): string {
  return `npx shadcn-vue@latest add ${componentName}`;
}

/**
 * Get multiple components at once
 *
 * @param componentNames - Array of component names
 * @returns Array of component data
 *
 * @example
 * const components = await getComponents(['button', 'input', 'card']);
 */
export async function getComponents(componentNames: string[]): Promise<ShadcnVueComponent[]> {
  const results = await Promise.all(
    componentNames.map(name => getComponent(name).catch(err => ({
      name,
      type: 'error',
      dependencies: [],
      registryDependencies: [],
      files: [],
      install: '',
      error: err.message
    } as ShadcnVueComponent)))
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
 * const formComponents = await getComponentsByCategory('forms');
 */
export async function getComponentsByCategory(category: ComponentCategory): Promise<ShadcnVueComponent[]> {
  const componentNames = COMPONENT_CATALOG[category];
  if (!componentNames) {
    throw new Error(`Unknown category: ${category}`);
  }
  return getComponents(componentNames);
}

/**
 * Search components by name
 *
 * @param query - Search query (case-insensitive)
 * @returns Matching component names
 *
 * @example
 * const results = searchComponents('button'); // ['button', 'button-group', 'toggle-button']
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
  return `npx shadcn-vue@latest add ${componentNames.join(' ')}`;
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

/**
 * Get the main source code file content from a component
 *
 * @param component - Component data from getComponent
 * @returns Main Vue file content or null if not found
 */
export function getMainFileContent(component: ShadcnVueComponent): string | null {
  // Find the main .vue file (not index.ts)
  const vueFile = component.files.find(f => f.path.endsWith('.vue'));
  return vueFile?.content || null;
}

/**
 * Get all file contents as a single string (useful for code review)
 *
 * @param component - Component data from getComponent
 * @returns Combined content of all files
 */
export function getAllFilesContent(component: ShadcnVueComponent): string {
  return component.files
    .map(f => `// === ${f.path} ===\n${f.content}`)
    .join('\n\n');
}

/**
 * Extract dependencies from multiple components (deduped)
 *
 * @param components - Array of component data
 * @returns Object with npm dependencies and registry dependencies
 */
export function extractDependencies(components: ShadcnVueComponent[]): {
  npm: string[];
  registry: string[];
} {
  const npmDeps = new Set<string>();
  const registryDeps = new Set<string>();

  for (const comp of components) {
    comp.dependencies?.forEach(d => npmDeps.add(d));
    comp.registryDependencies?.forEach(d => registryDeps.add(d));
  }

  return {
    npm: Array.from(npmDeps).sort(),
    registry: Array.from(registryDeps).sort()
  };
}

/**
 * Get the documentation URL for a component
 *
 * @param type - Type of component ('components' or 'charts')
 * @param name - Component name
 * @returns Documentation URL
 *
 * @example
 * const url = getComponentDocUrl('components', 'button');
 * // 'https://www.shadcn-vue.com/docs/components/button'
 */
export function getComponentDocUrl(type: 'components' | 'charts', name: string): string {
  return `${SHADCN_VUE_DOCS_BASE}/${type}/${name}`;
}

/**
 * Determine the doc type for a component based on its category
 *
 * @param componentName - Name of the component
 * @returns 'charts' if it's a chart component, 'components' otherwise
 */
export function getComponentDocType(componentName: string): 'components' | 'charts' {
  const category = getComponentCategory(componentName);
  return category === 'charts' ? 'charts' : 'components';
}

/**
 * Get documentation URLs for multiple components
 *
 * @param componentNames - Array of component names
 * @returns Array of objects with name and documentation URL
 *
 * @example
 * const docs = getComponentsDocUrls(['button', 'chart-area']);
 * // [{ name: 'button', url: '...', type: 'components' }, { name: 'chart-area', url: '...', type: 'charts' }]
 */
export function getComponentsDocUrls(componentNames: string[]): { name: string; url: string; type: 'components' | 'charts' }[] {
  return componentNames.map(name => {
    const type = getComponentDocType(name);
    return {
      name,
      url: getComponentDocUrl(type, name),
      type
    };
  });
}

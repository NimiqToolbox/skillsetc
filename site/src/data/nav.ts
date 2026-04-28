// Single source of truth for sidebar navigation.
// Order here drives the sidebar order and the prev/next links.

export interface NavItem {
  slug: string;
  label: string;
  description?: string;
}

export interface NavGroup {
  id: 'primitives' | 'reference';
  label: string;
  items: NavItem[];
}

export const nav: NavGroup[] = [
  {
    id: 'primitives',
    label: 'Primitives',
    items: [
      { slug: 'skills',                      label: 'Skills',                description: 'SKILL.md, progressive disclosure, authoring' },
      { slug: 'subagents',                   label: 'Subagents',             description: 'Isolated contexts, /agents, invocation' },
      { slug: 'hooks-mcp-memory-settings',   label: 'Hooks · MCP · Memory',  description: 'Lifecycle, transports, CLAUDE.md, settings' },
      { slug: 'comparison-and-decision-guide', label: 'Decision Guide',      description: 'When to use what — with worked examples' },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    items: [
      { slug: 'claude-code',                 label: 'Claude Code',           description: 'CLI · IDE · permissions · slash commands' },
      { slug: 'openai-codex',                label: 'OpenAI Codex',          description: 'CLI · Cloud · IDE · models · pricing' },
    ],
  },
];

export const flatNav: NavItem[] = nav.flatMap((g) => g.items);

export function findNeighbours(slug: string) {
  const idx = flatNav.findIndex((n) => n.slug === slug);
  return {
    prev: idx > 0 ? flatNav[idx - 1] : null,
    next: idx >= 0 && idx < flatNav.length - 1 ? flatNav[idx + 1] : null,
  };
}

export function findItem(slug: string) {
  return flatNav.find((n) => n.slug === slug) ?? null;
}

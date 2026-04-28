// Interactive decision-flow tree for /decide.
// Focused on picking the right primitive within Claude Code.

export type Accent = 'indigo' | 'amber' | 'success';

export interface QuestionOption {
  label: string;
  description?: string;
  next: string;
}

export interface QuestionNode {
  kind: 'question';
  id: string;
  question: string;
  subtitle?: string;
  options: QuestionOption[];
}

export interface ResultNode {
  kind: 'result';
  id: string;
  primitive: string;
  tagline: string;
  details: string[];
  link: { href: string; label: string };
  accent: Accent;
}

export type FlowNode = QuestionNode | ResultNode;

export const tree: Record<string, FlowNode> = {
  'q-automatic': {
    kind: 'question',
    id: 'q-automatic',
    question: 'Should this fire automatically every time something specific happens?',
    subtitle: 'Examples: every Edit triggers a linter, a session start kicks off setup, a Bash matching `git push` is blocked.',
    options: [
      { label: 'Yes — on every event of that kind', description: 'Reliable, harness-fired automation that Claude can\'t skip.', next: 'r-hook' },
      { label: 'No — only when relevant', next: 'q-external' },
    ],
  },
  'q-external': {
    kind: 'question',
    id: 'q-external',
    question: 'Are you exposing an external service as callable tools?',
    subtitle: 'A database, browser, dev tool, internal API — something Claude needs to talk to.',
    options: [
      { label: 'Yes — an external system', description: 'BigQuery, Playwright, Linear, GitHub APIs, internal services…', next: 'r-mcp' },
      { label: 'No — in-context behaviour', next: 'q-always-loaded' },
    ],
  },
  'q-always-loaded': {
    kind: 'question',
    id: 'q-always-loaded',
    question: 'Should Claude know this in every session for this project?',
    subtitle: 'Project conventions, architecture facts, naming rules — info that always applies.',
    options: [
      { label: 'Yes — load it on every session', next: 'q-path-scoped' },
      { label: 'No — only when relevant to a task', next: 'q-verbose' },
    ],
  },
  'q-path-scoped': {
    kind: 'question',
    id: 'q-path-scoped',
    question: 'Should it only load when working on certain files?',
    subtitle: 'Path-scoped rules apply only when the user is editing matching files.',
    options: [
      { label: 'Yes — only for specific globs', description: '"src/api/**/*.ts" → API rules; "tests/**" → testing rules.', next: 'r-rules' },
      { label: 'No — project-wide', next: 'r-claude-md' },
    ],
  },
  'q-verbose': {
    kind: 'question',
    id: 'q-verbose',
    question: 'Will the work produce verbose output you don\'t want in your main context?',
    subtitle: 'Test logs, search results, file dumps — things you only need a summary of.',
    options: [
      { label: 'Yes — return only a summary', description: 'Run tests, explore the codebase, verify a security claim.', next: 'q-different-model' },
      { label: 'No — keep the work in the main thread', next: 'q-reusable' },
    ],
  },
  'q-different-model': {
    kind: 'question',
    id: 'q-different-model',
    question: 'Need a different model, stricter tools, or an isolated git worktree?',
    options: [
      { label: 'Yes — customise the agent', description: 'Haiku for cheap exploration, Opus for hard reasoning, tools allowlist, worktree isolation.', next: 'r-subagent-custom' },
      { label: 'No — just isolate the context', next: 'r-subagent' },
    ],
  },
  'q-reusable': {
    kind: 'question',
    id: 'q-reusable',
    question: 'Is this a reusable workflow or knowledge artifact?',
    subtitle: 'Something Claude should auto-pick when relevant, or that the user invokes by name.',
    options: [
      { label: 'Yes — reusable across sessions', next: 'q-who-invokes' },
      { label: 'No — one-off', description: 'Just type it into the prompt, or add it to CLAUDE.md.', next: 'r-prompt' },
    ],
  },
  'q-who-invokes': {
    kind: 'question',
    id: 'q-who-invokes',
    question: 'Who should invoke it?',
    subtitle: 'Skills support three invocation modes via frontmatter.',
    options: [
      { label: 'Both — auto when relevant + manual /name', description: 'Standard skill behaviour. Claude auto-loads on description match; user can also type /name.', next: 'r-skill' },
      { label: 'Only the user, by /name', description: 'Hidden from auto-load. Add `disable-model-invocation: true`.', next: 'r-skill-manual' },
      { label: 'Only Claude (background knowledge)', description: 'Hide from /menu. Add `user-invocable: false`.', next: 'r-skill-background' },
    ],
  },

  // ────────────────────────── Results ──────────────────────────
  'r-hook': {
    kind: 'result',
    id: 'r-hook',
    primitive: 'Hook',
    tagline: 'A user-configured callback wired to a Claude Code lifecycle event.',
    details: [
      'Configured in `.claude/settings.json` under the `hooks` key',
      'Events: `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`, `SessionStart`, `SubagentStop`, `PreCompact`',
      'Fires reliably — the harness fires hooks, not Claude, so they cannot be skipped',
      'Block tool calls via exit code 2 or JSON `permissionDecision: "deny"`',
    ],
    link: { href: '/docs/hooks-mcp-memory-settings#1-hooks', label: 'Read the Hooks reference' },
    accent: 'indigo',
  },
  'r-mcp': {
    kind: 'result',
    id: 'r-mcp',
    primitive: 'MCP server',
    tagline: 'Model Context Protocol — exposes external services as callable tools.',
    details: [
      'Add via `claude mcp add` or in `.mcp.json` (project) / `~/.claude.json` (user)',
      'Transports: `stdio` (local process), `http`, `sse`',
      'Tools register as `mcp__<server>__<tool>` and can be matched in hooks/permissions',
      'Reference resources from prompts with `@server-name:resource-path`',
    ],
    link: { href: '/docs/hooks-mcp-memory-settings#2-mcp-model-context-protocol', label: 'Read the MCP reference' },
    accent: 'indigo',
  },
  'r-rules': {
    kind: 'result',
    id: 'r-rules',
    primitive: '.claude/rules/<name>.md',
    tagline: 'Path-scoped rules that load only when editing matching files.',
    details: [
      'Drop into `.claude/rules/api.md` with frontmatter `paths: ["src/api/**/*.ts"]`',
      'Loaded automatically when the user touches a matching file',
      'Same Markdown format as `CLAUDE.md`, just scoped',
      'Stack with `CLAUDE.md` for project-wide + path-scoped guidance',
    ],
    link: { href: '/docs/hooks-mcp-memory-settings#3-memory', label: 'Read the Memory reference' },
    accent: 'indigo',
  },
  'r-claude-md': {
    kind: 'result',
    id: 'r-claude-md',
    primitive: 'CLAUDE.md',
    tagline: 'Persistent project conventions Claude reads at every session start.',
    details: [
      'Project shared: `./CLAUDE.md` (committed) or `.claude/CLAUDE.md`',
      'Project personal: `./CLAUDE.local.md` (gitignored)',
      'User-wide: `~/.claude/CLAUDE.md`',
      'Imports with `@path/to/file` (max 5 hops); use `#` in chat to append on the fly',
    ],
    link: { href: '/docs/hooks-mcp-memory-settings#3-memory', label: 'Read the Memory reference' },
    accent: 'indigo',
  },
  'r-subagent': {
    kind: 'result',
    id: 'r-subagent',
    primitive: 'Subagent',
    tagline: 'An isolated agent context. Returns only a summary to your main thread.',
    details: [
      'Defined in `.claude/agents/<name>.md` (project) or `~/.claude/agents/<name>.md` (user)',
      'Frontmatter: `name`, `description` (drives auto-delegation), `tools`, `model`',
      'Built-ins: **Explore** (Haiku, read-only), **Plan**, **general-purpose**',
      'Verbose output stays in the subagent — your main context stays clean',
    ],
    link: { href: '/docs/subagents', label: 'Read the Subagents reference' },
    accent: 'indigo',
  },
  'r-subagent-custom': {
    kind: 'result',
    id: 'r-subagent-custom',
    primitive: 'Subagent (custom config)',
    tagline: 'A subagent tuned with model, tools, and isolation choices.',
    details: [
      '`model: haiku` for cheap exploration; `model: opus` for hard reasoning',
      '`tools: Read, Grep, Glob, Bash` to restrict; `disallowedTools: Write, Edit` to deny',
      '`isolation: worktree` runs in a temporary git worktree',
      '`memory: project` persists learnings across runs',
    ],
    link: { href: '/docs/subagents#2-configuration', label: 'See the full frontmatter reference' },
    accent: 'indigo',
  },
  'r-skill': {
    kind: 'result',
    id: 'r-skill',
    primitive: 'Skill',
    tagline: 'A reusable workflow auto-loaded by description, also user-invokable as /name.',
    details: [
      'Drop into `~/.claude/skills/<name>/SKILL.md` (user) or `.claude/skills/<name>/SKILL.md` (project)',
      'Frontmatter: `name` (gerund-form), `description` (third person, with trigger keywords)',
      'Body < 500 lines; details in sibling files',
      'Bundled scripts run via bash — only their **output** enters context',
    ],
    link: { href: '/docs/skills', label: 'Read the Skills reference' },
    accent: 'amber',
  },
  'r-skill-manual': {
    kind: 'result',
    id: 'r-skill-manual',
    primitive: 'Skill (manual-only)',
    tagline: "A user-only command. Claude won't auto-pick it.",
    details: [
      'Add `disable-model-invocation: true` to the SKILL.md frontmatter',
      'Description is **not** loaded into context — saves tokens',
      'Invoke only with `/name` typed by the user',
      'Great for `/deploy`, `/publish`, `/reset-db` — destructive or high-stakes operations',
    ],
    link: { href: '/docs/skills#6-how-a-skill-is-invoked', label: 'See the invocation control matrix' },
    accent: 'amber',
  },
  'r-skill-background': {
    kind: 'result',
    id: 'r-skill-background',
    primitive: 'Skill (background knowledge)',
    tagline: 'Loaded only when relevant — never user-callable.',
    details: [
      'Add `user-invocable: false` to the SKILL.md frontmatter',
      'Description is loaded into context, so Claude can decide when to use it',
      'Hidden from the `/` menu — not a user-typed command',
      'Great for "how the legacy auth system works" or domain conventions',
    ],
    link: { href: '/docs/skills#6-how-a-skill-is-invoked', label: 'See the invocation control matrix' },
    accent: 'amber',
  },
  'r-prompt': {
    kind: 'result',
    id: 'r-prompt',
    primitive: 'Just put it in the prompt or CLAUDE.md',
    tagline: "No primitive needed — it's a one-off instruction.",
    details: [
      'For a single-session adjustment: type it into the chat',
      'For project-wide one-offs: append to `.claude/CLAUDE.md`',
      'In chat, prefix a line with `#` to append it to memory inline',
    ],
    link: { href: '/docs/hooks-mcp-memory-settings#3-memory', label: 'Read about CLAUDE.md' },
    accent: 'success',
  },
};

export const startId = 'q-automatic';

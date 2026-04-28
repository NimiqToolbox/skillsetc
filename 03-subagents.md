# Claude Code Subagents — Reference

> **Sources:** https://docs.claude.com/en/docs/claude-code/sub-agents · https://code.claude.com/docs/en/sub-agents · https://www.anthropic.com/engineering/claude-code-best-practices

---

## 1. What a subagent is

A **subagent** is a specialised AI assistant that runs in an **isolated context** within a single Claude Code session. Each subagent has:

- Its own context window (a fresh start; main conversation is not visible by default)
- A custom system prompt
- An optional tool allowlist / denylist
- Optional model override
- Its own permission rules and (optionally) hooks
- Optionally, persistent cross-session memory

> *"Subagents are specialized AI assistants that handle specific types of tasks. Use one when a side task would flood your main conversation with search results, logs, or file contents you won't reference again: the subagent does that work in its own context and returns only the summary."* — official docs

### Subagent vs. Skill vs. Slash command vs. MCP tool

| Property | Subagent | Skill | Slash command (legacy) | MCP tool |
|---|---|---|---|---|
| Runs in | **Isolated** context | Same context | Same context | Same context |
| System prompt | Custom per agent | Injected guidance | None | None |
| Tools | Configurable allowlist/denylist | Inherited | N/A | Defines its own |
| Model override | Yes | Yes (`model:` field) | — | Decided by host |
| Auto-delegation | Description-based | Description-based | No | No |
| Persistent memory | Optional (`memory: user/project/local`) | No | No | N/A |
| Returns | Summary to main thread | Inline output | Inline output | Tool result |

---

## 2. Configuration

Subagents are Markdown files with YAML frontmatter.

### File locations & priority

| Source | Path | Priority |
|---|---|---|
| Managed settings | (org-deployed) | 1 (highest) |
| `--agents` CLI flag | `claude --agents '<json>'` | 2 |
| Project | `.claude/agents/<name>.md` | 3 |
| User | `~/.claude/agents/<name>.md` | 4 |
| Plugin | `<plugin>/agents/<name>.md` | 5 |

When the same `name` exists at multiple scopes, the higher-priority definition wins. Project agents are designed to be checked into git.

### Frontmatter (full reference)

```yaml
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability.
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
model: sonnet
permissionMode: default
maxTurns: 10
skills:
  - api-conventions
  - error-handling-patterns
mcpServers:
  - github
  - playwright:
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh"
memory: project
background: false
effort: high
isolation: worktree
color: blue
initialPrompt: "Start by reviewing the recent changes"
---

You are a senior code reviewer. Focus on quality, security, and maintainability.
…system prompt body…
```

| Field | Type | Default | Notes |
|---|---|---|---|
| `name` | string | required | Lowercase letters and hyphens; unique within scope |
| `description` | string | required | **The most important field** — drives auto-delegation |
| `tools` | comma list | inherits all | Allowlist. `Agent(worker, researcher)` restricts which subagents this one can spawn |
| `disallowedTools` | comma list | none | Denylist; removes from inherited or specified list |
| `model` | string | `inherit` | `sonnet`, `opus`, `haiku`, full ID (`claude-opus-4-7`), or `inherit` |
| `permissionMode` | string | `default` | `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns` | int | unlimited | Hard cap on agentic turns |
| `skills` | list | none | Skills preloaded into the subagent's context (full content, not just description) |
| `mcpServers` | list / refs | inherits | MCP servers; inline definitions are scoped to this agent |
| `hooks` | object | none | Lifecycle hooks scoped to subagent (`PreToolUse`, `PostToolUse`, `Stop`) |
| `memory` | string | none | `user`, `project`, or `local` for persistent memory |
| `background` | bool | `false` | If `true`, always runs as a background task |
| `effort` | string | inherits | `low`, `medium`, `high`, `xhigh`, `max` |
| `isolation` | string | none | `worktree` to run in a temporary git worktree |
| `color` | string | default | `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan` |
| `initialPrompt` | string | none | Auto-submitted first turn when this agent is the main session |

### System prompt body

The Markdown after frontmatter becomes the agent's system prompt. The agent does **not** receive Claude Code's default system prompt — only this body plus the working-directory environment.

> Important: `cd` inside subagent Bash calls does **not** persist between calls and does **not** affect the main conversation.

```markdown
---
name: security-reviewer
description: Reviews code for security vulnerabilities
tools: Read, Grep, Glob, Bash
model: opus
---

You are a senior security engineer. Review code for:
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication / authorisation flaws
- Secrets or credentials in code
- Insecure data handling

Provide specific line references and suggested fixes.
```

---

## 3. The `/agents` slash command

Run `/agents` to open a tabbed UI:

| Tab | Function |
|---|---|
| **Running** | Live subagent instances; open or stop running agents |
| **Library** | Browse, create, edit, delete subagents (built-in, user, project, plugin); see priority overrides |

### Creation flow

1. `/agents` → **Library** → **Create new agent**
2. Choose location: **Personal** (`~/.claude/agents/`) or **Project** (`.claude/agents/`)
3. Optionally **Generate with Claude** — describe the agent in plain English
4. Claude generates `name`, `description`, system prompt
5. Pick tools (read-only / all / custom), model, color
6. Configure memory scope
7. Press `s`/`Enter` to save, `e` to edit in your editor

### CLI alternatives

```bash
claude agents                                    # list grouped by source
claude --agent code-reviewer                     # run with subagent as main thread
claude --agents '{"reviewer":{"description":"…","prompt":"…","tools":["Read"]}}'
```

---

## 4. Built-in subagents (shipped with Claude Code)

| Name | Model | Tools | Use case |
|---|---|---|---|
| `Explore` | Haiku | Read-only (no Write/Edit) | File discovery, code search, codebase exploration. Specify thoroughness: `quick`, `medium`, `very thorough` |
| `Plan` | Inherits | Read-only | Codebase research during plan mode; prevents nested-subagent recursion |
| `general-purpose` | Inherits | All | Multi-step tasks needing exploration + action |
| `statusline-setup` | Sonnet | Read, Edit | Triggered by `/statusline` |
| `output-style-setup` | Sonnet | Read, Edit | Triggered by `/statusline-setup` flow |
| `claude-code-guide` | Haiku | Bash, Read, WebFetch, WebSearch | Answers questions about Claude Code features and Anthropic API |

> Many of these are why the harness "knows" things — when you ask "how do I configure a hook?" the `claude-code-guide` subagent fetches the answer from official docs without consuming your main context.

---

## 5. Invocation patterns

### A. Automatic delegation

Claude reads each subagent's `description` and decides whether to delegate based on the current task. To encourage automatic use, use phrases like *"proactively"* or *"use immediately after"*:

```yaml
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
```

### B. Natural-language invocation

```
Have the test-runner subagent fix any failing tests
Use the code-reviewer subagent to look at the auth changes
```

### C. `@`-mention guarantees

```
@"code-reviewer (agent)" look at the auth changes
```

Syntax variants:
- Local: `@agent-<name>`
- Plugin: `@agent-<plugin>:<name>`

### D. Whole-session subagent

Run a subagent as the **main thread** for the entire session:

```bash
claude --agent code-reviewer
claude --agent <plugin-name>:<agent-name>
```

Or set as project default:

```json
{ "agent": "code-reviewer" }
```

The default Claude Code system prompt is replaced. The agent name appears as `@<name>` in the startup header. If `initialPrompt` is set, it's auto-submitted as the first turn.

### E. Programmatic via the Agent tool

When an agent is the main thread, it can spawn subagents using the Agent tool (formerly named Task):

```yaml
tools: Agent(worker, researcher), Read, Bash    # allowlist of spawnable subagents
tools: Agent, Read, Bash                        # any subagent
```

To block specific agents instead, use `permissions.deny` in settings.

---

## 6. Parallel vs. sequential, foreground vs. background

### Parallel execution

```
Research the auth, database, and API modules in parallel using separate subagents
```

Each gets independent context; results return to the main conversation, which Claude synthesises.

> ⚠️ Many subagents returning verbose results can still consume significant main-context tokens. Ask for short summaries.

### Background execution

| Trigger | Effect |
|---|---|
| `background: true` in frontmatter | Agent always runs in background |
| User says "run this in the background" | One-off background |
| `Ctrl+B` while running | Background the running task |
| `export CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` | Disable globally |

Foreground subagents block until done and can pass permission prompts/clarifying questions through to you. Background subagents pre-approve permissions upfront; if a clarifying question is needed, the tool call fails but the subagent continues.

### Independent contexts

Each subagent:
- Starts with fresh context (except `context: fork` — see below)
- Cannot see main conversation history
- Has independent permissions, tool restrictions, MCP connections
- Has its own transcript at `~/.claude/projects/<project>/<sessionId>/subagents/agent-<agentId>.jsonl`
- Survives main-conversation compaction (transcripts are separate)

### Subagent nesting

> *"Subagents cannot spawn other subagents. If your workflow requires nested delegation, use Skills or chain subagents from the main conversation."*

Built-in `Plan` enforces this anti-recursion guarantee for plan mode. For multi-level coordination, use **Agent Teams** (separate feature) where each worker has its own context.

### Context-fork mode (skills)

Skills can declare `context: fork` to run in an isolated subagent context — useful for skills that produce verbose output you don't want in the main thread.

---

## 7. Best practices (from Anthropic)

### 1. Write detailed, action-flavoured descriptions

```yaml
# Good
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.

# Bad
description: Code reviewer
```

### 2. Single-responsibility agents

Each subagent should excel at **one** task. Don't build a "do-everything" agent.

### 3. Limit tool access

```yaml
# Good
tools: Read, Grep, Glob, Bash

# Risky (defaults to inheriting all tools)
# (no `tools` field)
```

### 4. Version-control project agents

Commit `.claude/agents/*.md` so the team benefits from improvements.

### 5. Use subagents for context-heavy research

> *"Use subagents when the task produces verbose output you don't need in your main context."*

```
Use a subagent to run the test suite and report only the failing tests with their error messages
```

### 6. Enable persistent memory for learning agents

```yaml
memory: project
```

Then in the body:
```markdown
Update your agent memory as you discover codepaths, patterns, library locations, and key architectural decisions. Consult memory before starting and update after completing.
```

### 7. Use hooks for fine-grained tool control

When `tools` allowlist isn't fine enough:

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
```

Exit code 2 from the hook blocks the operation.

---

## 8. Limits and trade-offs

### Latency from cold context

Subagents start with a fresh context and may need time to gather background. Not ideal for quick, targeted tasks or workflows that share a lot of context across phases (plan → implement → test).

### No persistent memory by default

Each invocation is fresh. Set `memory: user|project|local` to persist across runs, or use Agent Teams for sustained collaboration.

### Cost

Each subagent invocation is a separate API call with its own context setup. Parallel subagents = multiple concurrent calls. **Savings** come from routing exploration to Haiku and keeping verbose output out of the main thread.

### Subagents cannot spawn subagents

Workarounds:
- Chain subagents from the main conversation
- Use Skills for nested workflows in the same context
- Use Agent Teams for multi-level coordination

### Plugin subagents have restrictions

> *"For security reasons, plugin subagents do not support the `hooks`, `mcpServers`, or `permissionMode` frontmatter fields."*

To use those fields with a plugin's agent, copy the file into `.claude/agents/` or `~/.claude/agents/`.

### Context-window constraints

Subagents share the same context-window limits as the main conversation. For tasks that exceed it, use Agent Teams.

---

## 9. Hooks integration

### Subagent-scoped hooks (in frontmatter)

Run only while the subagent is active:

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh $TOOL_INPUT"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
```

When the subagent finishes, its `Stop` hooks fire as `SubagentStop` events at runtime.

### Project-scoped hooks reacting to subagent lifecycle

Configure in `.claude/settings.json`:

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "db-agent",
        "hooks": [
          { "type": "command", "command": "./scripts/setup-db-connection.sh" }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          { "type": "command", "command": "./scripts/cleanup-db-connection.sh" }
        ]
      }
    ]
  }
}
```

---

## 10. Subagent vs. Skill — quick decision

| Want this | Reach for |
|---|---|
| Reusable knowledge / workflow loaded into the **same** context | **Skill** |
| Self-contained investigation that returns a summary | **Subagent** |
| Tool-restriction enforcement | **Subagent** |
| Different model for one task (e.g., Haiku for cheap exploration) | **Subagent** with `model: haiku` |
| Run multiple independent analyses in parallel | **Multiple subagents** |
| Domain knowledge for the whole team | **Skill**, committed to `.claude/skills/` |
| Run a long-running build in an isolated git worktree | **Subagent** with `isolation: worktree` |
| One assistant pre-loaded with a different system prompt for the whole session | `claude --agent <name>` (subagent as main thread) |
| Frequent back-and-forth with main conversation | Stay in main thread, use a Skill |

### Concrete examples

| Scenario | Use |
|---|---|
| "Run tests and report only failures" | Subagent |
| "Review code for security issues" | Subagent |
| "Provide API design guidelines I reference constantly" | Skill |
| "Investigate auth system in parallel with implementation" | Subagent |
| "Add JSDoc comments following our style" | Skill (or main thread) |
| "Research + summarise in separate context" | Subagent |
| "Domain knowledge for the whole team" | Skill, committed |
| "Run multiple independent analyses in parallel" | Subagents |

For more detail and the full decision tree, see [`06-comparison-and-decision-guide.md`](06-comparison-and-decision-guide.md).

---

## 11. Complete example

```yaml
---
name: database-analyst
description: Execute read-only database queries to analyse data and generate reports. Use proactively for data analysis tasks.
tools: Bash
disallowedTools: Write, Edit
model: sonnet
permissionMode: default
maxTurns: 20
skills:
  - sql-best-practices
  - reporting-conventions
mcpServers:
  - bigquery
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
memory: project
background: false
effort: high
isolation: worktree
color: blue
initialPrompt: "Start by understanding the analysis requirement"
---

You are a database analyst specialising in SQL and BigQuery analysis.

When invoked:
1. Understand the data analysis requirement
2. Write efficient SQL queries with proper filters
3. Use BigQuery CLI tools when appropriate
4. Analyse and summarise results
5. Present findings clearly

Key practices:
- Optimised queries; avoid full-table scans
- Appropriate aggregations and joins
- Format results for readability
- Provide data-driven recommendations
```

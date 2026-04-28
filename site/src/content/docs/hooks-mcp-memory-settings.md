---
title: "Hooks, MCP, Memory & Settings"
description: Lifecycle hooks (events, types, JSON I/O), MCP transports and scopes, memory file precedence (CLAUDE.md), and settings layering.
eyebrow: Reference
order: 3
group: reference
sources:
  - https://docs.claude.com/en/docs/claude-code/hooks
  - https://docs.claude.com/en/docs/claude-code/hooks-guide
  - https://docs.claude.com/en/docs/claude-code/mcp
  - https://docs.claude.com/en/docs/claude-code/memory
  - https://docs.claude.com/en/docs/claude-code/settings
updated: 2026-04-28
---

## 1. Hooks

Hooks are user-configured shell commands (or HTTP/MCP/prompt/agent calls) that run on Claude Code lifecycle events. They are how you add **automatic** behaviour — something memory or skills can't do, because the harness fires hooks, not Claude.

### Hook events

| Event | Fires when |
|---|---|
| `SessionStart` | New session begins |
| `SessionEnd` | Session ends |
| `UserPromptSubmit` | User submits a prompt |
| `PreToolUse` | Before any tool runs |
| `PostToolUse` | After a tool finishes |
| `PermissionRequest` | A tool triggers a permission prompt |
| `Notification` | Claude raises a desktop notification |
| `Stop` | Claude finishes a response |
| `SubagentStop` | A subagent finishes (subagent-scoped `Stop` hooks fire as this) |
| `PreCompact` | Before auto-compaction summarises the conversation |
| `FileChanged` | A watched file changes |

### Hook types

| Type | What it does |
|---|---|
| `command` | Shell script — receives JSON on stdin, returns via exit codes / stdout |
| `http` | POST JSON to URL, receive results in response body |
| `mcp_tool` | Call a tool on a connected MCP server |
| `prompt` | Send a yes/no prompt to Claude |
| `agent` | Spawn a subagent for verification (experimental) |

### Configuration shape

In `.claude/settings.json` or any other settings file:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(rm *)",
            "command": "./.claude/hooks/validate.sh",
            "timeout": 30,
            "statusMessage": "Validating command…"
          }
        ]
      },
      {
        "matcher": "mcp__memory__*",
        "hooks": [
          {
            "type": "http",
            "url": "http://localhost:8080/validate",
            "timeout": 30,
            "headers": { "Authorization": "Bearer $TOKEN" },
            "allowedEnvVars": ["TOKEN"]
          }
        ]
      }
    ]
  }
}
```

### Exit codes (command hooks)

| Code | Meaning |
|---|---|
| `0` | Success — Claude Code parses JSON from stdout for control |
| `2` | Blocking error — stderr shown to Claude; tool call blocked |
| other | Non-blocking error — first stderr line shown in transcript |

### JSON output schema (exit 0)

Universal control fields:

```json
{
  "continue": false,
  "stopReason": "Build failed",
  "suppressOutput": false,
  "systemMessage": "Warning shown to user"
}
```

`PreToolUse`-specific permission decision:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny|ask|defer",
    "permissionDecisionReason": "reason text",
    "updatedInput": { "command": "rewritten command" },
    "additionalContext": "extra info shown to Claude"
  }
}
```

### Environment variables passed to hooks

| Var | Meaning |
|---|---|
| `$CLAUDE_PROJECT_DIR` | Project root |
| `$CLAUDE_PLUGIN_ROOT` | Plugin directory (in plugin-bundled hooks) |
| `$CLAUDE_PLUGIN_DATA` | Plugin data directory |

### Common patterns

#### Block dangerous git pushes

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git push *)",
            "command": "./.claude/hooks/check-branch.sh"
          }
        ]
      }
    ]
  }
}
```

`check-branch.sh` exits 2 to block, or prints JSON with `permissionDecision: "deny"`.

#### Auto-format on every Edit

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npx prettier --write \"$CLAUDE_LAST_FILE_PATH\"" }
        ]
      }
    ]
  }
}
```

#### Notify Slack when Claude finishes

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "./.claude/hooks/slack-notify.sh" }
        ]
      }
    ]
  }
}
```

### Why hooks instead of memory/skills?

> **Important:** the harness fires hooks — not Claude — so anything you want to happen *every* time (e.g., "run linter after every edit", "notify on every PR push") **must** be a hook. Asking Claude in `CLAUDE.md` to "always run the linter" is unreliable; configuring a `PostToolUse` hook is reliable.

---

## 2. MCP (Model Context Protocol)

> Source: https://docs.claude.com/en/docs/claude-code/mcp

MCP is the open protocol Claude Code uses to talk to external tool/resource providers (databases, APIs, browsers, dev tools, etc.).

### Adding an MCP server

```bash
# stdio (local process)
claude mcp add --transport stdio local-mcp ./mcp-server

# http
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer $TOKEN"

# SSE
claude mcp add --transport sse anthropic-docs https://docs-api.anthropic.com/mcp/
```

### Server commands

```bash
claude mcp list                # configured servers
claude mcp show <name>         # server details
claude mcp test <name>         # test connection
claude mcp remove <name>       # remove a server
```

In-session: `/mcp` opens an interactive picker.

### Scopes

| Scope | File | Applies to |
|---|---|---|
| **Local** | `~/.claude.json` | This machine |
| **Project** | `.mcp.json` (in repo) | Whole team |
| **User** | `~/.claude.json` | All your projects |

### Configuration shape (`.mcp.json` or `mcpServers` in settings)

```json
{
  "mcpServers": {
    "local-server": {
      "command": "python",
      "args": ["./server.py"],
      "transport": "stdio"
    },
    "http-server": {
      "url": "http://localhost:8000",
      "transport": "http"
    },
    "sse-server": {
      "url": "https://api.example.com/mcp",
      "transport": "sse",
      "headers": { "Authorization": "Bearer $API_TOKEN" }
    }
  }
}
```

### Transport types

| Transport | Use case |
|---|---|
| `stdio` | Local process; the most common form |
| `http` | Remote HTTP endpoint with bearer/OAuth auth |
| `sse` | Server-Sent Events |

### Resource references with `@`

You can reference MCP resources from inside a prompt:

```
@server-name:resource-path
@my-db:tables/users
```

### Per-session MCP overrides

```bash
claude --mcp-config ./mcp.json                # add servers
claude --mcp-config ./mcp.json --strict-mcp-config  # use ONLY these (ignore globals)
```

### Tool naming

MCP tools appear in the session as `mcp__<server>__<tool>`. You can pattern-match these in hook matchers (`mcp__memory__*`) and in permission rules (`Bash(mcp__github__*)`).

### Project trust

Project-scoped MCP servers (`.mcp.json`) only load when you explicitly trust the project.

---

## 3. Memory

> Source: https://docs.claude.com/en/docs/claude-code/memory

Claude Code automatically loads persistent instructions from `CLAUDE.md` files at session start. Use it for facts and conventions Claude should know **every time**.

### Loading hierarchy (highest precedence first)

| Layer | Path | Notes |
|---|---|---|
| 1. Managed policy | macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`, Linux/WSL `/etc/claude-code/CLAUDE.md`, Windows `C:\Program Files\ClaudeCode\CLAUDE.md` | Org-wide; cannot be overridden |
| 2. Project local | `./CLAUDE.local.md` | Personal, gitignored |
| 3. Project | `./CLAUDE.md` or `.claude/CLAUDE.md` | Team-shared, in git |
| 4. User | `~/.claude/CLAUDE.md` | All your projects |

> Files are **concatenated**, not overridden. Higher-precedence layers appear later in the combined prompt, which gives them more weight.

Claude walks **up** from the cwd, gathering every `CLAUDE.md` and `CLAUDE.local.md` it finds. Within a directory, `CLAUDE.local.md` is appended after `CLAUDE.md`.

### Imports with `@`

```markdown
# See @README.md for overview
# Also check @package.json for scripts
# Git workflow: @docs/git-guide.md
```

Imports use relative or absolute paths, resolved from the importing file. **Maximum 5-hop depth.**

### Path-scoped rules

Use `.claude/rules/*.md` for instructions that should only load when working on certain files:

```yaml
---
paths:
  - "src/api/**/*.ts"
  - "src/**/*.{ts,tsx}"
---

# API Development Rules
…
```

Folder structure:

```
.claude/
├── CLAUDE.md           # always loaded
└── rules/
    ├── code-style.md   # always loaded
    ├── testing.md
    └── api/
        └── design.md   # paths-scoped
```

### Auto memory

Claude Code can maintain a **machine-local** memory of learnings as you work, in `~/.claude/projects/<project>/memory/`:

```
memory/
├── MEMORY.md       # index — first 200 lines / 25 KB loaded at startup
├── debugging.md    # topic files, loaded on demand
├── patterns.md
└── …
```

What goes in auto memory:
- Build/test commands learned the hard way
- Conventions discovered during work
- API quirks
- User preferences for this project

What does **not** go in:
- Anything already in `CLAUDE.md`
- Code patterns derivable from the source
- Git history / who-changed-what
- Ephemeral task state

Toggle with `/memory` or set `"autoMemoryEnabled": false` in settings.

### Quick prefix `#` to append to memory

In a prompt, prefix a line with `#` to append it to memory:

```
# always run prettier --write before committing
```

---

## 4. Settings

> Source: https://docs.claude.com/en/docs/claude-code/settings

### Precedence (highest first)

1. **Managed settings** (MDM / system policies) — cannot be overridden
2. **Command-line arguments**
3. **Local project settings** — `.claude/settings.local.json` (gitignored)
4. **Shared project settings** — `.claude/settings.json` (in git)
5. **User settings** — `~/.claude/settings.json`

### Managed settings file paths

| OS | Path |
|---|---|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` (or plist) |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` (or HKLM registry) |
| Linux/WSL | `/etc/claude-code/managed-settings.json` |
| Drop-in dir | `managed-settings.d/*.json` (merged) |

### Filesystem layout

```
~/.claude/
├── settings.json              # user-level global settings
├── CLAUDE.md                  # user memory
├── agents/                    # user subagents
├── skills/                    # user skills
├── rules/                     # user rules
└── projects/                  # auto memory by project

.claude/                       # in repo
├── settings.json              # shared team settings
├── settings.local.json        # personal project overrides (gitignored)
├── CLAUDE.md                  # project memory
├── CLAUDE.local.md            # personal project memory (gitignored)
├── agents/                    # project subagents
├── skills/                    # project skills
├── rules/                     # project rules
├── hooks/                     # plugin-style hook scripts (referenced by hooks: in settings.json)
├── commands/                  # legacy custom commands
└── output-styles/             # custom output styles

~/.claude.json                 # OAuth tokens, MCP servers, caches, trust settings
.mcp.json                      # project-scoped MCP servers
```

### Common settings keys

```json
{
  "model": "claude-sonnet-4-6",
  "availableModels": ["sonnet", "haiku", "opus"],
  "effortLevel": "high",
  "defaultMode": "acceptEdits",
  "autoMemoryEnabled": true,
  "autoMemoryDirectory": "~/my-memory",
  "tui": "fullscreen",
  "editorMode": "vim",
  "language": "english",

  "permissions": {
    "allow":  ["Bash(npm run *)", "Read(~/.zshrc)"],
    "deny":   ["Bash(curl *)",   "Read(./.env)"],
    "ask":    ["Bash(git push *)"],
    "defaultMode": "acceptEdits"
  },

  "env": {
    "CUSTOM_VAR": "value"
  },

  "enabledPlugins": {
    "plugin-name@marketplace": true
  },

  "claudeMdExcludes": ["**/monorepo/CLAUDE.md"],

  "hooks": {
    "PreToolUse": [ /* hook definitions */ ]
  },

  "sandbox": {
    "enabled": true,
    "filesystem": {
      "allowWrite": ["/tmp/build"],
      "denyRead":   ["~/.aws/credentials"]
    }
  },

  "mcpServers": { /* see MCP section */ },

  "agent": "code-reviewer"
}
```

### Inspect at runtime

```
/status     # show active settings + their sources
/config     # quick UI to edit settings
```

### Per-session overrides

```bash
claude --settings ./extra-settings.json
claude --setting-sources user,project        # restrict which scopes load
```

---

## 5. Plugins (where they live)

A plugin packages skills, subagents, hooks, MCP servers, slash commands, and output styles into a single distributable.

### Install / list / remove

```bash
claude plugin install <name>@<marketplace>
claude plugin list
claude plugin uninstall <name>@<marketplace>
```

### Storage

```
~/.claude/plugins/<plugin>/
├── manifest.json
├── skills/
├── agents/
├── hooks/
├── commands/
└── mcp/
```

### Enable / disable per scope

```json
{
  "enabledPlugins": {
    "ultrareview@anthropic": true,
    "my-plugin@my-org": false
  }
}
```

### Plugin namespacing

| Resource | Reference |
|---|---|
| Skill | `/<plugin>:<skill>` |
| Subagent | `@agent-<plugin>:<agent>` |

### Restrictions on plugin subagents

> *"For security reasons, plugin subagents do not support the `hooks`, `mcpServers`, or `permissionMode` frontmatter fields."*

---

## 6. Quick reference: which file does what

| You want to… | Edit |
|---|---|
| Persistent project conventions Claude reads every session | `./CLAUDE.md` |
| Personal-only project notes (gitignored) | `./CLAUDE.local.md` |
| User-wide preferences | `~/.claude/CLAUDE.md` |
| File-scoped instructions (only when editing `src/api/**`) | `.claude/rules/<name>.md` with `paths:` |
| Block a tool, run a script automatically | `.claude/settings.json` → `hooks` |
| Add a database/API/browser as a tool | `.mcp.json` or `claude mcp add` |
| Allow `npm run *` without prompts | `.claude/settings.json` → `permissions.allow` |
| Switch default model for one project | `.claude/settings.json` → `model` |
| Cap which scopes load this session | `claude --setting-sources user,project` |
| Run a session in plan mode | `claude --permission-mode plan` |
| Run a session as a subagent | `claude --agent <name>` |
| Add machine-local learnings Claude should remember | Auto memory (or `#` prefix in chat) |

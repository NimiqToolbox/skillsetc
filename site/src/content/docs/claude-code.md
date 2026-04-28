---
title: Claude Code
description: Anthropic's official agentic coding tool — CLI, IDE extensions, desktop, and web. Surfaces, install, CLI flags, permission modes, keyboard shortcuts, and headless mode.
eyebrow: Reference
order: 5
group: reference
sources:
  - https://docs.claude.com/en/docs/claude-code/overview
  - https://docs.claude.com/en/docs/claude-code/quickstart
  - https://docs.claude.com/en/docs/claude-code/cli-reference
  - https://docs.claude.com/en/docs/claude-code/slash-commands
  - https://docs.claude.com/en/docs/claude-code/ide-integrations
  - https://docs.claude.com/en/docs/claude-code/permissions
updated: 2026-04-28
---

## 1. What Claude Code is

A single product, multiple surfaces:

| Surface | What it is |
|---|---|
| **Terminal CLI** | The `claude` command. Full-featured TUI, headless `-p` mode, the canonical reference for everything else. |
| **VS Code Extension** | Inline diffs, conversation history, `@`-mention files, multi-tab conversations, extended-thinking toggle. Install: search "Claude Code" in Extensions, or `code --install-extension anthropic.claude-code`. |
| **JetBrains plugin** | IntelliJ IDEA, PyCharm, WebStorm, GoLand, RubyMine, PhpStorm, AppCode. Install from JetBrains Marketplace. |
| **Desktop app** | macOS (Intel + Apple Silicon) and Windows (x64 + ARM64). Multiple sessions, scheduled tasks, visual diff review. Download at `claude.com/download`. |
| **Web app** | `claude.ai/code` — browser-based version with cloud-side execution. |

**Default model behavior:** Claude Code respects your subscription tier and the `model` setting. As of April 2026 the family is Opus 4.7 (1M context), Sonnet 4.6, Haiku 4.5. Switch with `/model` mid-session or `--model <id>` at launch.

---

## 2. Installation

> Source: https://docs.claude.com/en/docs/claude-code/quickstart

### macOS / Linux / WSL

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### Windows PowerShell

```powershell
irm https://claude.ai/install.ps1 | iex
```

### Windows CMD

```bat
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

### Homebrew (macOS)

```bash
brew install --cask claude-code            # stable channel (~1 week behind)
brew install --cask claude-code@latest     # latest release
brew upgrade claude-code                   # neither auto-updates
```

### WinGet (Windows)

```powershell
winget install Anthropic.ClaudeCode
winget upgrade Anthropic.ClaudeCode
```

> **Note:** Native installations auto-update in the background. Homebrew and WinGet do **not**. On native Windows, install Git for Windows so Claude Code can use Bash; without it, the shell tool falls back to PowerShell.

### First session

```bash
cd your-project
claude
```

Login is prompted on first use. Account types accepted: Claude Pro/Max, Anthropic Console (API), Bedrock, Vertex AI, Microsoft Foundry.

---

## 3. CLI flags & modes

> Source: https://docs.claude.com/en/docs/claude-code/cli-reference

### Top-level commands

| Command | Purpose |
|---|---|
| `claude` | Start interactive session in current directory |
| `claude "prompt"` | Start interactive session with an opening prompt |
| `claude -p "prompt"` | **Print mode** — non-interactive; runs once via SDK and exits |
| `claude -c` / `--continue` | Continue most recent conversation |
| `claude -r "<id>"` / `--resume "<id>"` | Resume a specific session by ID/name |
| `claude update` | Update to latest version |
| `claude auth login` | Sign in (`--email`, `--sso`, `--console`) |
| `claude auth logout` | Sign out |
| `claude auth status` | JSON status output |
| `claude mcp ...` | Manage MCP servers (see `04-hooks-mcp-memory-settings.md`) |
| `claude agents` | List subagents grouped by source without opening a session |
| `claude plugin install/list/uninstall` | Manage plugins |

### Frequently used flags

| Flag | Short | Purpose |
|---|---|---|
| `--print` | `-p` | Non-interactive single-shot mode |
| `--continue` | `-c` | Continue most recent conversation |
| `--resume "<id>"` | `-r` | Resume named session |
| `--model <id>` | | `sonnet`, `opus`, `haiku`, or full ID like `claude-opus-4-7` |
| `--effort <level>` | | `low`, `medium`, `high`, `xhigh`, `max` |
| `--permission-mode <mode>` | | `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions` |
| `--output-format <fmt>` | | `text`, `json`, `stream-json` (print mode only) |
| `--include-hook-events` | | Include hook events in `stream-json` output |
| `--include-partial-messages` | | Include partial streaming events |
| `--max-turns <n>` | | Limit agentic turns (print mode) |
| `--max-budget-usd <n>` | | Stop before spending threshold (print mode) |
| `--json-schema '<schema>'` | | Validated structured JSON output (print mode) |
| `--add-dir <paths>` | | Additional working directories during session |
| `--system-prompt "<text>"` | | Replace entire system prompt |
| `--system-prompt-file <path>` | | Load system prompt from file |
| `--append-system-prompt "<text>"` | | Append to default system prompt |
| `--append-system-prompt-file <path>` | | Append file contents to system prompt |
| `--tools "<list>"` | | Restrict tool availability |
| `--allowedTools "<list>"` | | Auto-approve listed tools |
| `--disallowedTools "<list>"` | | Block listed tools |
| `--dangerously-skip-permissions` | | Skip all prompts (use only in sandboxes) |
| `--allow-dangerously-skip-permissions` | | Add `bypassPermissions` to mode cycle without starting in it |
| `--bare` | | Skip hooks, skills, plugins, MCP, CLAUDE.md auto-discovery |
| `--name "<n>"` | `-n` | Set session display name |
| `--init` / `--init-only` | | Run init hooks (and exit, with `--init-only`) |
| `--exclude-dynamic-system-prompt-sections` | | Improve prompt-cache reuse across machines |
| `--settings <file/json>` | | Load extra settings |
| `--setting-sources <list>` | | Restrict which scopes are loaded (`user,project,local`) |
| `--mcp-config <files/json>` | | Load extra MCP servers |
| `--strict-mcp-config` | | Use only servers from `--mcp-config` |
| `--agent <name>` | | Run with a subagent as the main thread |
| `--agents '<json>'` | | Define subagents inline |
| `--ide` | | Auto-connect to IDE if running |
| `--verbose` / `--debug [cats]` / `--debug-file <path>` | | Logging |
| `--version` | `-v` | Print version |
| `--help` | | Help |

### Headless / SDK examples

```bash
claude -p "explain this codebase" --output-format json
cat error.log | claude -p "summarise the error and propose a fix"
claude -p --output-format stream-json --include-hook-events --max-turns 3 "run the tests and fix any failures"
claude -p --json-schema '{"type":"object","properties":{"summary":{"type":"string"},"risk":{"enum":["low","med","high"]}}}' "review this branch"
claude -p --max-budget-usd 5.00 "refactor the auth module"
```

---

## 4. Permission modes

> Source: https://docs.claude.com/en/docs/claude-code/permissions

| Mode | Behavior |
|---|---|
| `default` | Prompts on first use of each tool |
| `acceptEdits` | Auto-accepts file edits + safe FS commands (`mkdir`, `touch`, `mv`, `cp`, …) |
| `plan` | Read-only research; presents a plan, cannot modify or execute |
| `auto` | Auto-approves with background safety checks (research preview; gated by plan/admin) |
| `dontAsk` | Auto-denies anything not on `permissions.allow` allowlist |
| `bypassPermissions` | Skips prompts except for protected dirs (`.git`, `.claude`, `.vscode`, `.idea`, `.husky`) — use only in containers/VMs |

Set via:

```bash
claude --permission-mode plan
```

Or in settings:

```json
{ "defaultMode": "acceptEdits" }
```

**Cycle modes during a session:** press `Shift+Tab`.

**Per-tool rules** (in `.claude/settings.json`):

```json
{
  "permissions": {
    "allow":  ["Bash(npm run *)", "Read(~/.zshrc)"],
    "deny":   ["Bash(curl *)",   "Read(./.env)"],
    "ask":    ["Bash(git push *)"],
    "defaultMode": "acceptEdits"
  }
}
```

---

## 5. Keyboard shortcuts & input prefixes

### Terminal interactive mode

| Shortcut | Action |
|---|---|
| `Esc` | Interrupt Claude |
| `Esc` `Esc` | Show command history |
| `Ctrl+C` | Exit (with confirmation) |
| `Ctrl+B` | Send session to background |
| `Shift+Tab` | Cycle permission modes |
| `Tab` | Autocomplete commands and file paths |
| `↑` / `↓` | Navigate history |
| `Enter` | Submit |
| `Shift+Enter` | Multi-line input |
| `?` | Show shortcut help |

### Input prefixes

| Prefix | Effect |
|---|---|
| `/` | Slash command / skill |
| `@` | Reference a file or directory |
| `#` | Append to memory (CLAUDE.md) |
| `!` | Run a shell command directly |

### VS Code extension

| Shortcut | Action |
|---|---|
| `Cmd+Esc` / `Ctrl+Esc` | Toggle focus between editor and Claude |
| `Cmd+Shift+Esc` / `Ctrl+Shift+Esc` | Open new conversation tab |
| `Option+K` / `Alt+K` | Insert `@`-mention with current selection + line numbers |
| `Cmd+N` / `Ctrl+N` | New conversation (when `enableNewConversationShortcut` is on) |
| `Shift+Enter` | Multi-line |

---

## 6. Plan mode

> Source: https://docs.claude.com/en/docs/claude-code/permission-modes

Plan mode is a permission mode where Claude can read files but cannot modify them or execute commands. It produces a step-by-step plan for your approval.

```bash
claude --permission-mode plan
```

Or press `Shift+Tab` during a session.

In VS Code, plan mode opens the plan as a full markdown document with inline comment support before Claude executes.

**When to use:**
- Before a complex refactor
- Code-review workflows where planning precedes execution
- Sharing intent with a teammate before kicking off

---

## 7. Output styles, status line, vim mode

| Feature | How |
|---|---|
| **Vim mode** | `claude --vim`, or `editorMode: "vim"` in settings, or `/vim` mid-session |
| **Status line** | Customise via `/statusline` (uses the `statusline-setup` subagent) |
| **Output styles** | `.claude/output-styles/<name>/` (project) or `~/.claude/output-styles/<name>/` (user) |
| **TUI fullscreen** | `"tui": "fullscreen"` in settings |
| **Language** | `"language": "english"` |

---

## 8. Background tasks & queued messages

- Press `Ctrl+B` to background the current session.
- Resume foreground with `claude --continue` or by re-attaching.
- While Claude is processing, you can keep typing — messages queue and process in order.
- Disable background tasks entirely with `export CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`.

---

## 9. IDE integrations

> Source: https://docs.claude.com/en/docs/claude-code/ide-integrations · https://docs.claude.com/en/docs/claude-code/vs-code

### VS Code

- Marketplace ID: `anthropic.claude-code`
- CLI install: `code --install-extension anthropic.claude-code`
- Direct: `vscode:extension/anthropic.claude-code`

**Capabilities:** inline diffs (side-by-side), conversation history, multi-tab sessions, file `@`-mentions with line ranges, permission mode UI, extended-thinking toggle, Chrome integration for browser automation, plan mode as full markdown document.

### JetBrains

- Marketplace plugin ID: `27310-claude-code-beta-` (and updates)
- Supports IntelliJ IDEA, PyCharm, WebStorm, AppCode, GoLand, RubyMine, PhpStorm
- Capabilities: interactive diff viewer, selection-context sharing

### Desktop app

- macOS + Windows (x64 + ARM64)
- Schedule routines, manage multiple sessions, visual diff review
- `/desktop` from terminal hands a CLI session to the desktop app
- `/teleport` resumes a web session in the local terminal

### Connect a CLI session to your IDE

```bash
claude --ide
```

Or run `/ide` mid-session for diff viewing and diagnostics integration.

---

## 10. Cost & billing

> Source: https://docs.claude.com/en/docs/claude-code/overview

| Plan / channel | Notes |
|---|---|
| **Claude Pro** | Monthly subscription, generous rate limits |
| **Claude Max** | Highest tier, most powerful models |
| **Team / Enterprise** | SSO, central billing, managed settings |
| **Anthropic Console (API)** | Pay-as-you-go credits; auto-creates a "Claude Code" workspace on first login |
| **Amazon Bedrock** | Run Claude through AWS billing |
| **Google Vertex AI** | Run Claude through GCP billing |
| **Microsoft Foundry** | Run Claude through Azure billing |

In-session usage tracking:

```
/cost    # show session token use & spend
/usage   # extended thinking + API usage (VS Code)
/upgrade # upgrade subscription or check for app updates
```

---

## 11. Headless / SDK mode

Print mode (`-p`) is the canonical way to script Claude Code:

```bash
claude -p "summarise CHANGELOG.md"                                    # text out
claude -p "summarise CHANGELOG.md" --output-format json               # full JSON envelope
claude -p "summarise CHANGELOG.md" --output-format stream-json        # NDJSON event stream
claude -p --output-format stream-json --include-hook-events "..."     # include hook lifecycle
claude -p --no-session-persistence "one-shot, no rollout"             # don't save session
claude -p --max-turns 3 "fix the failing tests"                       # cap iterations
claude -p --max-budget-usd 5.00 "..."                                 # cap spend
claude -p --json-schema '{"type":"object","properties":{...}}' "..."  # structured output
```

Pipe stdin in:

```bash
cat patch.diff | claude -p "review this diff and flag risks"
echo "SELECT * FROM users" | claude -p "explain this SQL"
```

---

## 12. Slash commands (built-in)

> Source: https://docs.claude.com/en/docs/claude-code/slash-commands

| Command | Purpose |
|---|---|
| `/help` | Show available commands and features |
| `/clear` | Clear conversation history |
| `/compact` | Summarise to free context |
| `/init` | Generate or improve `CLAUDE.md` |
| `/memory` | Edit `CLAUDE.md`, `CLAUDE.local.md`, auto memory, rules |
| `/model` | Switch model |
| `/effort` | Adjust effort level |
| `/cost` | Token usage & spend |
| `/usage` | Extended thinking + API usage (VS Code) |
| `/resume` | Picker for previous sessions |
| `/rename` | Change session display name |
| `/login` / `/logout` | Auth |
| `/status` | Active settings + their sources |
| `/config` | Quick settings access |
| `/permissions` | Manage permission rules |
| `/add-dir` | Add working directories during session |
| `/export` | Export conversation/code |
| `/upgrade` | Subscription / app upgrade |
| `/release-notes` | Latest release notes |
| `/doctor` | Diagnostic checks |
| `/feedback` / `/bug` | Send feedback / report bugs |
| `/agents` | Subagent library (running, library) |
| `/mcp` | Manage MCP servers |
| `/hooks` | View / manage hooks |
| `/plugins` (or `/plugin`) | Manage plugins |
| `/pr-comments` | View PR comments (GitHub workflows) |
| `/review` | Code review (skill) |
| `/security-review` | Security review of pending changes (skill) |
| `/simplify` | Review changed code for reuse/quality (skill) |
| `/batch` | Plan + execute large changes across worktrees (skill) |
| `/loop` | Repeat a prompt/command on an interval (skill) |
| `/schedule` | Create/list/run scheduled remote agents (skill) |
| `/debug` | Detailed debug output (skill) |
| `/claude-api` | Build/debug Claude API code (skill) |
| `/vim` | Toggle vim mode |
| `/ide` | Connect to IDE |
| `/desktop` | Hand off to desktop app |
| `/remote-control` | Enable Remote Control mode |
| `/teleport` | Resume web session locally |
| `/statusline` | Configure status line |
| `/init-only` | Run init hooks and exit |

> Note: many of the more interesting commands (`/review`, `/loop`, `/schedule`, `/simplify`, `/batch`) are **skills**, not hardcoded commands. They live in `~/.claude/skills/<name>/SKILL.md` and you can override or replace them.

---

## 13. Plugins (overview — see `04-` for storage)

```bash
claude plugin install <name>@<marketplace>
claude plugin list
claude plugin uninstall <name>@<marketplace>
```

A plugin is a distributable bundle of:
- skills
- subagents
- hooks
- MCP servers
- slash commands
- output styles
- a marketplace manifest

Plugin-namespaced features use the form `<plugin>:<name>` (e.g., `@agent-myplugin:reviewer`).

---

## 14. Sandbox configuration

> Source: https://docs.claude.com/en/docs/claude-code/settings

Constrain bash and filesystem access in `settings.json`:

```json
{
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "allowRead":  ["/home/user/project"],
      "allowWrite": ["/tmp/build"],
      "denyRead":   ["~/.ssh", "~/.aws/credentials"]
    },
    "network": {
      "allowedDomains": ["github.com", "registry.npmjs.org"],
      "deniedDomains":  ["evil.com"]
    }
  }
}
```

---

## 15. Updating

```bash
claude update                # native installer
brew upgrade claude-code     # Homebrew
winget upgrade Anthropic.ClaudeCode  # WinGet
```

`/release-notes` shows the changelog.

---

## 16. Where things live (file paths)

| Item | Path |
|---|---|
| User settings | `~/.claude/settings.json` |
| Project shared settings | `.claude/settings.json` |
| Project local overrides (gitignored) | `.claude/settings.local.json` |
| User memory | `~/.claude/CLAUDE.md` |
| Project memory | `./CLAUDE.md` or `.claude/CLAUDE.md` |
| Project local memory (gitignored) | `./CLAUDE.local.md` |
| Project rules | `.claude/rules/*.md` |
| User rules | `~/.claude/rules/*.md` |
| User skills | `~/.claude/skills/<name>/SKILL.md` |
| Project skills | `.claude/skills/<name>/SKILL.md` |
| User subagents | `~/.claude/agents/<name>.md` |
| Project subagents | `.claude/agents/<name>.md` |
| Hooks | `.claude/settings.json` → `hooks` key |
| MCP (project) | `.mcp.json` |
| MCP (user, OAuth tokens, trust) | `~/.claude.json` |
| Output styles | `.claude/output-styles/` or `~/.claude/output-styles/` |
| Auto memory | `~/.claude/projects/<project>/memory/` |
| Custom commands (legacy) | `.claude/commands/<name>.md` |

For **detailed reference** on memory, hooks, MCP, and settings precedence, see [`04-hooks-mcp-memory-settings.md`](/docs/hooks-mcp-memory-settings).

# OpenAI Codex — Reference

> **Sources:** https://openai.com/codex/ · https://developers.openai.com/codex · https://developers.openai.com/codex/cli · https://developers.openai.com/codex/cli/reference · https://developers.openai.com/codex/cli/slash-commands · https://developers.openai.com/codex/cloud · https://developers.openai.com/codex/ide · https://developers.openai.com/codex/models · https://developers.openai.com/codex/pricing · https://developers.openai.com/codex/auth · https://developers.openai.com/codex/config-reference · https://developers.openai.com/codex/guides/agents-md · https://developers.openai.com/codex/skills · https://developers.openai.com/codex/subagents · https://developers.openai.com/codex/hooks · https://developers.openai.com/codex/rules · https://developers.openai.com/codex/mcp · https://developers.openai.com/codex/integrations/github · https://github.com/openai/codex · https://agents.md/

---

## 1. What Codex is (April 2026)

OpenAI Codex is **OpenAI's coding agent product family** — *"One agent for everywhere you code."* It is **not** the deprecated 2021 `code-davinci-002` API. The name "Codex" was relaunched in 2025 and now spans a unified set of surfaces sharing authentication, models, project memory (`AGENTS.md`), and configuration:

| Surface | What it is |
|---|---|
| **Codex CLI** (`codex`) | Terminal agent. Apache-2.0 source at `github.com/openai/codex`. ~96% Rust. npm pkg `@openai/codex`. |
| **Codex Desktop App** | Native macOS/Windows client with project sidebar, threads, in-app browser (browser automation), worktrees, code-review UI. Launched via `codex app`. |
| **Codex IDE Extension** | VS Code, Cursor, Windsurf, VS Code Insiders, JetBrains (IntelliJ, PyCharm, WebStorm, GoLand, Rider). |
| **Codex Cloud / Web** | `chatgpt.com/codex` — cloud-hosted parallel agent in isolated containers; opens GitHub PRs. |
| **GitHub Integration** | `@codex` mentions in PRs/issues; automatic PR review; `openai/codex-action` GitHub Action. |
| **iOS / Mobile** | Inside the ChatGPT iOS app — start tasks, view diffs, push PRs, with iOS Live Activities on the lock screen. Available on Android via ChatGPT. |
| **Other** | Slack, Linear integrations. |

> *"Codex is OpenAI's coding agent that can read, edit, and run code … in the background (including in parallel) using its own cloud environment."* — `developers.openai.com/codex/cloud`

---

## 2. Installation & quickstart (CLI)

### Install methods

```bash
# npm (cross-platform)
npm install -g @openai/codex

# Homebrew (macOS)
brew install --cask codex

# Direct binary — github.com/openai/codex/releases/latest
# - codex-aarch64-apple-darwin.tar.gz
# - codex-x86_64-apple-darwin.tar.gz
# - codex-x86_64-unknown-linux-musl.tar.gz
# - codex-aarch64-unknown-linux-musl.tar.gz
```

### Upgrade

```bash
npm i -g @openai/codex@latest
```

### Platforms

macOS, Windows (native PowerShell with sandbox; or via WSL2), Linux.

### First run

```bash
codex
```

Launches the TUI and prompts for authentication.

---

## 3. Authentication

> Source: https://developers.openai.com/codex/auth

Two methods:

### A. Sign in with ChatGPT (default)

Opens a browser; after sign-in, returns an access token to the CLI/IDE/app. Tokens auto-refresh during sessions. **Required for ChatGPT-plan-included Codex usage and is the only way to access certain models** (e.g., `gpt-5.5`).

Headless / device-code fallback:

```bash
codex login --device-auth
```

User visits `https://auth.openai.com/codex/device` and enters the one-time code (15-min expiry). Email/password ChatGPT accounts must have MFA enabled.

### B. API key

```bash
codex login --with-api-key
# or piped:
printenv OPENAI_API_KEY | codex login --with-api-key
```

API usage bills directly through the OpenAI Platform account at standard API rates.

### Credential storage

`~/.codex/auth.json` (plaintext) or OS keyring (auto mode tries keyring first, falls back). Docs warn: *"treat `~/.codex/auth.json` like a password."*

### Auth utility commands

```bash
codex login              # interactive
codex login --device-auth
codex login --with-api-key
codex login status
codex logout
```

---

## 4. CLI usage

> Source: https://developers.openai.com/codex/cli/reference

### Subcommands

| Command | Purpose |
|---|---|
| `codex` | Launch the terminal UI |
| `codex app` | Launch the Codex desktop app |
| `codex app-server` | Launch the Codex app server (for local development) |
| `codex apply` | Apply the latest diff from a Codex Cloud task to local working tree |
| `codex cloud` | Browse / execute Codex Cloud tasks from terminal |
| `codex exec` (alias `codex e`) | **Run Codex non-interactively** (headless / scriptable) |
| `codex fork` | Fork a previous interactive session into a new thread |
| `codex resume` | Continue a previous interactive session |
| `codex completion` | Generate shell-completion scripts (Bash/Zsh/Fish/PowerShell) |
| `codex features` | List feature flags / persistently enable-disable them |
| `codex mcp` | Manage MCP servers |
| `codex sandbox` | Run arbitrary commands inside Codex sandboxes |
| `codex login` / `codex logout` / `codex login status` | Auth |

### Global flags

| Flag | Values | Purpose |
|---|---|---|
| `--model, -m` | string | Override config model |
| `--sandbox, -s` | `read-only`, `workspace-write`, `danger-full-access` | Sandbox policy for shell ops |
| `--ask-for-approval, -a` | `untrusted`, `on-request`, `never` | When to pause for approval |
| `--full-auto` | flag | Shortcut for low-friction local work |
| `--cd, -C` | path | Working directory before processing |
| `--image, -i` | path | Attach image(s) to the prompt |
| `--config, -c` | `key=value` | Override config values (dot notation) |
| `--profile, -p` | string | Configuration profile to load |
| `--search` | flag | Enable live web search |
| `--remote` | ws/wss URL | Connect TUI to remote app-server |

### `codex exec` extras

| Flag | Purpose |
|---|---|
| `--json` | NDJSON event stream instead of formatted text |
| `--output-last-message, -o <file>` | Write the assistant's final message to a file |
| `--ephemeral` | Don't persist session rollouts |
| `--skip-git-repo-check` | Allow running outside a Git repo |

### Examples

```bash
codex                                        # interactive
codex "explain this codebase"
codex --image screenshot.png "explain this UI"
codex exec --json "run the tests and fix failures"
codex exec -o response.md "summarise the diff"
codex fork                                   # branch from previous session
codex resume                                 # resume the last session
```

### File context inside a session

- `@file` — attach files / directories
- `/mention` — slash command picker for files
- `$skill` — mention an installed skill

---

## 5. Approval & sandboxing

Codex distinguishes **approval policy** (when to pause and ask) from **sandbox mode** (what shell/file ops can touch).

### Sandbox modes (`--sandbox` / `sandbox_mode`)

| Mode | Behaviour |
|---|---|
| `read-only` | Read files; no writes or shell ops that modify the system |
| `workspace-write` | Write inside cwd; network and other FS regions restricted |
| `danger-full-access` | No sandboxing — full user privileges |

### Approval policy (`--ask-for-approval` / `approval_policy`)

| Policy | Behaviour |
|---|---|
| `untrusted` | Pause for approval on most tool calls |
| `on-request` | Approval only when escalation is needed |
| `never` | Never asks (combine with a tight sandbox) |

Granular booleans also exist: `sandbox_approval`, `rules`, `mcp_elicitations`, `request_permissions`, `skill_approval`.

### IDE extension UX modes

| Mode | What it means |
|---|---|
| **Chat** | Read-only conversation |
| **Agent** | Acts but asks before edits/commands |
| **Agent (Full Access)** | Equivalent to `danger-full-access` |

### `--full-auto` shortcut

Pairs `workspace-write` with `on-request`/`never` for fluid local work.

### Rules layer (Starlark `prefix_rule()`)

> Source: https://developers.openai.com/codex/rules

A filesystem-level command policy. Starlark `.rules` files in:

- `~/.codex/rules/default.rules` (user)
- `<repo>/.codex/rules/` (project, only when trusted)

```python
prefix_rule(
    pattern = ["gh", "pr", "view"],
    decision = "prompt",
    justification = "Viewing PRs is allowed with approval",
)
```

Decisions: `allow`, `prompt`, `forbidden`. **Most restrictive wins** when multiple match (`forbidden > prompt > allow`).

Codex parses shell scripts via tree-sitter, splitting on `&&`, `||`, `;`, `|` and evaluating each segment.

Test rules:

```bash
codex execpolicy check --pretty --rules <path> -- <command>
```

---

## 6. Configuration: `config.toml` and `AGENTS.md`

### `~/.codex/config.toml` (user) and `<repo>/.codex/config.toml` (project, requires trust)

Common keys:

```toml
model = "gpt-5.5"
model_provider = "openai"
model_context_window = 128000
model_reasoning_effort = "high"

approval_policy = "on-request"
sandbox_mode    = "workspace-write"
web_search      = "cached"             # "live", "disabled"
personality     = "friendly"

[features]
shell_tool      = true
web_search      = true
multi_agent     = true
memories        = true
unified_exec    = true
undo            = true
codex_hooks     = true                 # required to enable hooks

[windows]
sandbox = "elevated"

[shell_environment_policy]
inherit  = "none"
set      = { PATH = "/usr/bin" }
exclude  = ["AWS_*"]
```

### Profiles

```toml
model = "gpt-5.4"

[profiles.deep-review]
model = "gpt-5-pro"
model_reasoning_effort = "high"
```

Run with:

```bash
codex --profile deep-review
```

### Custom model providers

```toml
[model_providers.proxy]
name      = "OpenAI via LLM proxy"
base_url  = "http://proxy.example.com"
env_key   = "OPENAI_API_KEY"
```

Reserved provider IDs (cannot be reused): `openai`, `ollama`, `lmstudio`.

### CLI overrides

```bash
codex --model gpt-5.4
codex --config 'model="gpt-5.4"'
codex --config 'shell_environment_policy.include_only=["PATH","HOME"]'
```

### `CODEX_HOME` env var

Redirects the entire profile directory (useful for project-specific automation users):

```bash
CODEX_HOME=/srv/codex-runner codex …
```

### `AGENTS.md` — project memory

> Source: https://developers.openai.com/codex/guides/agents-md

The Codex equivalent of `CLAUDE.md`. Open standard at [agents.md](https://agents.md/) — also used by Cursor and others.

> *"Codex reads `AGENTS.md` files before doing any work. By layering global guidance with project-specific overrides, you can start each task with consistent expectations, no matter which repository you open."*

**Discovery / chain order:**

1. **Global scope** (`~/.codex` or `$CODEX_HOME`):
   `AGENTS.override.md` if present, else `AGENTS.md`.
2. **Project scope:** walks from Git root **down** to cwd, picking at most one file per directory (override preferred).
3. **Merge:** *"Codex concatenates files from the root down, joining them with blank lines. Files closer to your current directory override earlier guidance because they appear later in the combined prompt."*

**Size limit:** `project_doc_max_bytes` (default 32 KiB). Custom fallback filenames via `project_doc_fallback_filenames`.

**Scaffolding:**

```
/init
```

inside the CLI generates an `AGENTS.md` skeleton in the current directory.

---

## 7. Slash commands (CLI)

> Source: https://developers.openai.com/codex/cli/slash-commands

| Command | Purpose |
|---|---|
| `/permissions` | Set what Codex can do without asking |
| `/sandbox-add-read-dir` | Grant read access to extra dir (Windows only) |
| `/agent` | Switch active agent thread |
| `/apps` | Browse connectors/apps and insert into prompt |
| `/plugins` | Browse installed/discoverable plugins |
| `/clear` | Clear and start fresh |
| `/compact` | Summarise visible conversation to free tokens |
| `/copy` | Copy latest output |
| `/diff` | Show Git diff (incl. untracked) |
| `/exit`, `/quit` | Exit |
| `/experimental` | Toggle experimental features |
| `/feedback` | Send logs to maintainers |
| `/init` | Generate `AGENTS.md` scaffold |
| `/logout` | Sign out |
| `/mcp` | List configured MCP tools |
| `/mention` | Attach a file |
| `/model` | Choose active model + reasoning effort |
| `/fast` | Toggle Fast mode |
| `/plan` | Switch to plan mode (optional prompt) |
| `/personality` | Choose communication style |
| `/ps` | Show experimental background terminals |
| `/stop` | Stop all background terminals |
| `/fork` | Fork conversation into new thread |
| `/resume` | Resume saved conversation |
| `/new` | Start new conversation in same CLI session |
| `/review` | Review working tree |
| `/status` | Session config + token usage |
| `/debug-config` | Config-layer + requirements diagnostics |
| `/statusline` | Configure TUI status line |
| `/title` | Configure terminal-window/tab title |
| `/skills` | Skill picker (also `$<name>` to mention a skill) |
| `/approvals` | Legacy alias for `/permissions` |

---

## 8. Codex Cloud (`chatgpt.com/codex`)

> Source: https://developers.openai.com/codex/cloud

- Connect a GitHub account, then access at `chatgpt.com/codex`.
- Tasks run in **configured cloud containers** with repo access.
- **Parallel** — multiple tasks run simultaneously.
- **Pull-request creation** — Codex can convert completed tasks into PRs.
- **Internet access toggle** — admins control whether cloud Codex hits the public internet.
- **CLI bridge:**
  - `codex cloud` — browse/execute cloud tasks from terminal
  - `codex apply` — pull a cloud-generated diff into local working tree
- **Environments** — per-repo container definitions (setup steps, env vars). Larger VMs available on Business/Enterprise.

The IDE extension exposes the same: *"Cloud delegation: offload extended tasks to cloud environments while monitoring progress from the IDE."*

---

## 9. IDE extension

> Source: https://developers.openai.com/codex/ide

**Editors supported:**
- VS Code, Cursor, Windsurf, VS Code Insiders
- JetBrains: IntelliJ, PyCharm, WebStorm, GoLand, Rider

Marketplace listing on the VS Code Marketplace.

**Auth:** ChatGPT account or API key (same flow as CLI). **Auto-updates.**

**Features:**
- Context-aware prompting via open files, selections, `@file` references
- Inline model switching
- Reasoning levels: `low`, `medium`, `high`
- In-editor image generation/editing with reference assets
- Approval modes: **Chat / Agent / Agent (Full Access)**
- **Cloud delegation** to long-running cloud tasks
- Slash commands (subset overlapping the CLI)
- Native Windows sandbox or WSL2

**Shared state:** signing in with the same ChatGPT account ties IDE sessions, CLI sessions, the desktop app, and `chatgpt.com/codex` — so cloud tasks and resulting PRs can be reviewed/applied from any surface.

---

## 10. GitHub integration

> Source: https://developers.openai.com/codex/integrations/github

### Setup

1. Configure Codex Cloud with repo access (GitHub App).
2. In the Codex dashboard, toggle **Code review** for the repository.

### `@codex` mentions in PRs / issues

| Comment | Effect |
|---|---|
| `@codex review` | 👀 reaction; posts a standard GitHub code review on the PR |
| `@codex <anything else>` | *"Starts a cloud task using your pull request as context"* — can edit code, push commits, propose changes |

### Automatic reviews

Opt-in setting: posts a Codex review on every newly opened PR without an explicit `@codex review`.

### Severity defaults

Codex flags only **P0 and P1** issues unless `AGENTS.md` "Review guidelines" specify otherwise.

### Per-file guidance

Codex applies the **closest** `AGENTS.md` to each changed file — deeper-nested files override repo-level.

### `openai/codex-action`

A separate GitHub Action repo for running Codex inside Actions workflows.

---

## 11. Models (April 2026)

> Source: https://developers.openai.com/codex/models

| Model ID | Position | Notes |
|---|---|---|
| `gpt-5.5` | OpenAI's *"newest frontier model for complex coding, computer use, knowledge work, and research workflows in Codex."* | Default recommendation. **Currently only via ChatGPT sign-in (not API key).** |
| `gpt-5.4` | *"Flagship frontier model for professional work"* — coding + reasoning + tool use | Balanced; available via API and ChatGPT |
| `gpt-5.4-mini` | *"Fast, efficient mini model for responsive coding tasks and subagents."* | Uses **30%** of GPT-5.4's included limits; recommended for subagents |
| `gpt-5.3-codex` | *"Industry-leading coding model for complex software engineering."* | Previous top-tier coding |
| `gpt-5.3-codex-spark` | *"Text-only research preview model optimized for near-instant, real-time coding iteration."* | **ChatGPT Pro only** |
| `gpt-5.2` | *"Previous general-purpose model for coding and agentic tasks, including hard debugging tasks."* | Legacy fallback |

Other referenced: `gpt-5-pro` (used in deep-review profiles). Any model exposing OpenAI Chat Completions or Responses APIs can be plugged in via `[model_providers.*]`.

> Older interim IDs you may see in third-party docs (`gpt-5-codex`, `gpt-5.1-codex`, `codex-mini`, `codex-max`) are **superseded** by the matrix above.

Selection: `--model <id>`, `model = "..."` in `config.toml`, or `/model` slash command.

---

## 12. Plans & pricing

> Source: https://developers.openai.com/codex/pricing · https://chatgpt.com/codex/pricing/

| Plan | Price | Codex inclusion |
|---|---|---|
| Free | $0 | Quick tasks; limited |
| Go | $8/mo | Lightweight tasks |
| Plus | $20/mo | Codex on web, CLI, IDE, iOS. Cloud code review + Slack. GPT-5.5 + GPT-5.4. |
| Pro | $100 / $200 /mo | 5x or 20x Plus rate limits. Access to `gpt-5.3-codex-spark`. Promo: $100 → 10x Plus, $200 → 25x Plus, through May 31, 2026. |
| Business | Pay-as-you-go | Standard / usage seats; larger cloud-VM tier |
| Enterprise / Edu | Sales | Priority processing, SCIM, EKM, analytics, custom controls |

### 5-hour rate-limit windows (examples)

| Plan | GPT-5.5 | GPT-5.4 | GPT-5.4-mini |
|---|---|---|---|
| Plus | 15–80 | 20–100 | 60–350 |
| Pro 5x | 80–400 | 100–500 | 300–1,750 |
| Pro 20x | 300–1,600 | 400–2,000 | 1,200–7,000 |

### API token rates (Business / new Enterprise)

| Model | Input / 1M | Cached / 1M | Output / 1M |
|---|---|---|---|
| GPT-5.5 | 125 credits | 12.50 | 750 |
| GPT-5.4 | 62.50 | 6.25 | 375 |

### Plus/Pro local-message averages

- ~14 credits (GPT-5.5)
- ~7 (GPT-5.4)
- ~5 (GPT-5.3-Codex)

API-key auth bills directly through the OpenAI Platform account at standard API rates (no Codex surcharge).

---

## 13. MCP support in the CLI

> Source: https://developers.openai.com/codex/mcp

Codex CLI is a first-class MCP **client** supporting both transports.

### Add via CLI

```bash
codex mcp add <name> --env VAR=VALUE -- <stdio command>
codex mcp add context7 -- npx -y @upstash/context7-mcp
```

### TOML configuration in `~/.codex/config.toml`

#### stdio server

```toml
[mcp_servers."chrome-devtools"]
command              = "npx"
args                 = ["chrome-devtools-mcp@latest"]
env                  = { NODE_ENV = "production" }
cwd                  = "/abs/path"
startup_timeout_sec  = 10
tool_timeout_sec     = 60
enabled              = true
required             = false
enabled_tools        = ["search_docs", "fetch"]
disabled_tools       = []
```

#### HTTP server (with bearer token from env)

```toml
[mcp_servers.github]
url                  = "https://api.githubcopilot.com/mcp/"
bearer_token_env_var = "GITHUB_PAT_TOKEN"
http_headers         = { "X-Source" = "codex" }
env_http_headers     = { "X-Trace"  = "TRACE_ID" }
```

#### OAuth callback options

- `mcp_oauth_callback_port` — fixed callback port
- `mcp_oauth_callback_url` — custom callback URL

### Listing & managing

| Command | Effect |
|---|---|
| `/mcp` (in session) | List configured MCP tools |
| `codex mcp` | Outside-session management |

Project-scoped MCP servers can live in `<repo>/.codex/config.toml` but only load when the project is trusted.

---

## 14. Skills, Subagents, Hooks (Codex side)

### Skills

Codex implements the same `SKILL.md` open standard as Claude Code, plus an optional `agents/openai.yaml` for OpenAI-specific config:

```
my-skill/
├── SKILL.md
├── scripts/
├── references/
├── assets/
└── agents/
    └── openai.yaml
```

Activation: `/skills` picker or `$<name>` mention. *"Skills build on the open agent skills standard."*

### Subagents

Codex stores subagents at `~/.codex/agents/<name>.toml` (user) or `.codex/agents/` (project).

Built-ins: `default`, `worker`, `explorer`.

Required fields: `name`, `description`, `developer_instructions`.

Settings: `[agents] max_threads` (default 6), `max_depth` (default 1).

> **Important difference from Claude Code:** *"Codex only spawns a new agent when you explicitly ask it to."* Auto-delegation by description does **not** happen.

### Hooks

Configured in `config.toml` (`[[hooks.PreToolUse]]` arrays) or `~/.codex/hooks.json`. Requires `[features] codex_hooks = true`.

Hook events: `SessionStart`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `UserPromptSubmit`, `Stop`.

Hooks receive JSON on stdin (`session_id`, `transcript_path`, `cwd`, `hook_event_name`, `model`, `turn_id`) and can return:

```json
{ "decision": "block" }
```

or

```json
{ "permissionDecision": "deny" }
```

Multiple matchers run **concurrently**.

---

## 15. File paths summary

| Item | Path |
|---|---|
| User config | `~/.codex/config.toml` |
| Project config (trust required) | `<repo>/.codex/config.toml` |
| Auth / tokens | `~/.codex/auth.json` |
| User memory | `~/.codex/AGENTS.md` (or `AGENTS.override.md`) |
| Project memory | `<repo>/AGENTS.md` (chain from git root down) |
| User rules | `~/.codex/rules/default.rules` |
| Project rules | `<repo>/.codex/rules/` |
| User subagents | `~/.codex/agents/<name>.toml` |
| Project subagents | `<repo>/.codex/agents/<name>.toml` |
| User hooks JSON | `~/.codex/hooks.json` |
| Skills (if installed) | (depends on installer; mirror Claude `~/.claude/skills/` patterns) |
| Profile dir override | `$CODEX_HOME` |

---

## 16. Compared with Claude Code

See [`06-comparison-and-decision-guide.md`](06-comparison-and-decision-guide.md) for the full side-by-side. Highlights:

- **Cloud agent:** Codex has a first-class hosted runner at `chatgpt.com/codex`; Claude Code is local-first.
- **Sandbox:** Codex names three modes (`read-only` / `workspace-write` / `danger-full-access`) plus a Starlark `prefix_rule()` policy layer; Claude uses per-tool `allow`/`ask`/`deny` rules in settings.
- **Subagent invocation:** Codex spawns subagents only on **explicit user request**; Claude Code auto-delegates based on description.
- **Mobile:** Codex has iOS/Android via the ChatGPT app; Claude Code does not.
- **Source license:** Codex CLI is **Apache-2.0** (`github.com/openai/codex`); Claude Code is closed-source.
- **Default models (April 2026):** Codex defaults to `gpt-5.5` (ChatGPT-only) or `gpt-5.4`; Claude Code defaults to Sonnet 4.6 / Opus 4.7 depending on subscription.
- **GitHub PR review severity defaults:** Codex flags only P0/P1 unless told otherwise.
- **Memory file:** `AGENTS.md` (open standard) vs. `CLAUDE.md`. Both layer hierarchically from project root downward.

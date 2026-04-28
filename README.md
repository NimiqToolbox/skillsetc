# Skills, Subagents, Claude Code & OpenAI Codex — Comprehensive Reference

A consolidated, source-cited reference covering:

- **Claude Code** (Anthropic's official CLI / IDE extension / desktop / web coding agent)
- **Claude Skills** (the `SKILL.md` open standard)
- **Claude Code Subagents** (isolated, delegated agent contexts)
- **OpenAI Codex** (OpenAI's CLI / IDE / Cloud / GitHub coding-agent family)
- **Decision guide** — when to use a Skill vs. Subagent vs. Hook vs. Slash command, and Claude Code vs. Codex

All facts are sourced from official Anthropic and OpenAI documentation as of **April 2026**.

---

## Documents in this reference

| File | Topic |
|------|-------|
| [`01-claude-code.md`](01-claude-code.md) | Claude Code: surfaces, install, CLI flags, permission modes, keyboard shortcuts, IDE integrations, headless/SDK mode |
| [`02-skills.md`](02-skills.md) | Claude Skills: progressive disclosure, `SKILL.md` structure, frontmatter, bundled resources, scope, invocation, best practices, marketplace |
| [`03-subagents.md`](03-subagents.md) | Claude Code subagents: configuration, `/agents`, built-in types, invocation patterns, parallel execution, hooks integration |
| [`04-hooks-mcp-memory-settings.md`](04-hooks-mcp-memory-settings.md) | Hooks (events, types, JSON I/O), MCP (transports, scopes), memory (`CLAUDE.md`, rules, auto memory), settings precedence |
| [`05-openai-codex.md`](05-openai-codex.md) | OpenAI Codex: CLI, IDE, Cloud, GitHub, login, `AGENTS.md`, slash commands, sandboxing, models, pricing, MCP |
| [`06-comparison-and-decision-guide.md`](06-comparison-and-decision-guide.md) | Side-by-side comparison + decision tree for choosing the right primitive |

---

## Terminology cheat-sheet

| Term | What it is | Where it lives | Loaded into context |
|------|------------|----------------|---------------------|
| **Slash command** | A direct user-triggered prompt or skill | `.claude/commands/*.md` (legacy) or `.claude/skills/<name>/SKILL.md` | When the user types `/<name>` |
| **Skill** | Modular, filesystem-based capability with metadata + body + bundled resources | `~/.claude/skills/<name>/` or `.claude/skills/<name>/` | Description always; body when triggered |
| **Subagent** | Isolated agent context with its own system prompt, tools, and (optionally) model | `~/.claude/agents/<name>.md` or `.claude/agents/<name>.md` | Runs in separate context; only summary returns |
| **Hook** | Shell/HTTP/MCP/prompt callback wired to a Claude Code event | `.claude/settings.json` → `hooks` key | Not loaded into context — runs out-of-band |
| **MCP server** | External tool/resource provider via Model Context Protocol | `~/.claude.json`, `.mcp.json`, or settings | Tools registered into the session |
| **Memory (`CLAUDE.md`)** | Persistent project/user instructions | `./CLAUDE.md`, `~/.claude/CLAUDE.md`, `.claude/rules/*.md` | Always loaded at session start (hierarchical) |
| **Plugin** | Distributable bundle of skills + commands + hooks + MCP servers | `~/.claude/plugins/` | Once installed and enabled |

---

## Five-minute decision guide

| You want to… | Use this primitive |
|---|---|
| Add reusable knowledge or a workflow Claude should auto-pick when relevant | **Skill** (with a specific, trigger-rich `description`) |
| Run a verbose investigation (test logs, codebase exploration) without polluting your main context | **Subagent** (Explore, general-purpose, or a custom one) |
| Trigger something *every time* a tool runs, a session starts, or Claude finishes | **Hook** (in `settings.json`) — this is **not** something memory or a Skill can do |
| Expose external services (databases, APIs, browsers) as callable tools | **MCP server** |
| Keep persistent project conventions Claude reads at every startup | **`CLAUDE.md`** (or `.claude/rules/*.md` with `paths:` glob) |
| Run a one-off prompt the user fires by name (e.g., `/deploy`) | **Skill** with `disable-model-invocation: true` |
| Run a long task in a sandboxed, isolated git worktree | **Subagent** with `isolation: worktree` |
| Have one assistant pre-loaded with a different system prompt for the whole session | `claude --agent <name>` (subagent as main thread) |
| Schedule a recurring task | `/schedule` (cron-style) or `/loop` (in-session interval) |

For a more detailed flowchart, see [`06-comparison-and-decision-guide.md`](06-comparison-and-decision-guide.md).

---

## Quick comparison: Claude Code vs OpenAI Codex

| Capability | Claude Code | OpenAI Codex |
|---|---|---|
| Terminal CLI binary | `claude` | `codex` |
| Install | `curl https://claude.ai/install.sh \| bash`, `brew install --cask claude-code`, `winget install Anthropic.ClaudeCode` | `npm i -g @openai/codex`, `brew install --cask codex`, binary releases |
| IDE extensions | VS Code, JetBrains | VS Code (+ Cursor/Windsurf/Insiders), JetBrains |
| Desktop app | Yes (macOS/Windows) | Yes (macOS/Windows) — `codex app` |
| Cloud-hosted parallel agent | Limited (Managed Agents) | First-class — `chatgpt.com/codex` |
| Mobile | None | iOS (in ChatGPT app), Android |
| Project-memory file | `CLAUDE.md` | `AGENTS.md` (open standard) |
| Skills format | `SKILL.md` (open standard) | `SKILL.md` (open standard) |
| Subagents | `.claude/agents/<name>.md` (auto-delegated) | `.codex/agents/<name>.toml` (only on explicit user request) |
| Slash commands | 30+ built-in + skill-derived | 30+ built-in |
| MCP support | stdio + SSE + HTTP | stdio + HTTP, OAuth |
| Hooks | `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `SessionStart`, `Stop`, `SubagentStop`, `Notification`, `PreCompact` | `SessionStart`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `UserPromptSubmit`, `Stop` |
| Sandbox model | Per-tool permissions (`allow`/`ask`/`deny`) + sandbox config | Three named sandbox modes (`read-only`/`workspace-write`/`danger-full-access`) + Starlark `prefix_rule()` |
| Plan mode | `--permission-mode plan` / Shift+Tab | `/plan` slash command |
| Default models (Apr 2026) | Claude Opus 4.7 (1M), Sonnet 4.6, Haiku 4.5 | `gpt-5.5` (ChatGPT-only), `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.3-codex` |
| GitHub PR review | `@claude` mention, Claude Code Action | `@codex review`, `openai/codex-action` |
| Source license | Closed | **Apache-2.0** at `github.com/openai/codex` |

For a full feature-by-feature breakdown, see [`06-comparison-and-decision-guide.md`](06-comparison-and-decision-guide.md).

---

## Source URLs (root)

**Anthropic / Claude Code:**
- https://docs.claude.com/en/docs/claude-code/overview
- https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/sub-agents
- https://github.com/anthropics/skills

**OpenAI / Codex:**
- https://openai.com/codex/
- https://developers.openai.com/codex
- https://github.com/openai/codex
- https://chatgpt.com/codex
- https://agents.md/ (open `AGENTS.md` standard)

Each document in this reference cites the exact URL its facts come from.

# Comparison & Decision Guide

A consolidated decision aid for choosing between **Skills, Subagents, Hooks, MCP, and `CLAUDE.md`/`AGENTS.md`** within Claude Code, and for choosing between **Claude Code and OpenAI Codex** at the product level.

---

## Part 1 — Picking the right primitive (within Claude Code)

The five primitives, in order of conceptual scope:

| Primitive | Core idea | Lives in | Costs context tokens? |
|---|---|---|---|
| `CLAUDE.md` / rules | Persistent instructions Claude reads at every startup | `./CLAUDE.md`, `.claude/rules/` | Yes — always |
| **Skill** | Triggerable knowledge + workflow + bundled resources | `~/.claude/skills/`, `.claude/skills/` | Description always; body when triggered |
| **Subagent** | Isolated agent context, optional different model | `~/.claude/agents/`, `.claude/agents/` | Only the **summary** returns to main thread |
| **Hook** | Out-of-band script wired to a lifecycle event | `.claude/settings.json` → `hooks` | No — runs out of context |
| **MCP server** | External tool/resource provider | `.mcp.json`, `~/.claude.json`, settings | Tool descriptions are loaded; tool results are |

### Decision tree

```
Q1. Should this happen automatically every time something specific occurs
    (a tool runs, the session starts, Claude finishes)?
    └── YES → Use a HOOK. Memory and skills cannot guarantee automation.
    └── NO → continue

Q2. Does this expose an external system (DB, API, browser, dev tool) as
    callable tools?
    └── YES → Use an MCP SERVER.
    └── NO → continue

Q3. Should Claude know this in *every* session for this project, regardless
    of the topic?
    └── YES → Add to CLAUDE.md (or path-scoped rules in .claude/rules/).
    └── NO → continue

Q4. Is the work self-contained and verbose enough that you don't want its
    intermediate output (logs, search results, file contents) in your main
    context?
    └── YES → Use a SUBAGENT.
       └── If you also want a different model or a strict tool allowlist,
           still a SUBAGENT.
       └── If you want it in an isolated git worktree, SUBAGENT with
           isolation: worktree.
    └── NO → continue

Q5. Is this a reusable workflow or knowledge artifact that should auto-load
    when relevant, but stay in the main thread?
    └── YES → Use a SKILL.
       └── If only the user (not the model) should invoke it,
           add disable-model-invocation: true.
       └── If the description should auto-load context but the user
           shouldn't be able to /<name> it, add user-invocable: false.

Q6. Is it a one-off command the user fires by name (e.g., /deploy)?
    └── YES → SKILL with disable-model-invocation: true.
       (Legacy slash commands at .claude/commands/ also still work.)
```

### Side-by-side: when to reach for which

| You want to… | Primitive | Notes |
|---|---|---|
| Auto-run linter after every edit | **Hook** (`PostToolUse`) | Memory or skills won't reliably do this |
| Block dangerous bash like `rm -rf /` | **Hook** (`PreToolUse`) returning exit 2 | |
| Notify Slack when Claude finishes a task | **Hook** (`Stop`) | |
| Connect to BigQuery as a tool | **MCP server** | |
| Tell Claude how this monorepo is structured | **`CLAUDE.md`** at repo root | |
| Special instructions only for `src/api/**/*.ts` | **`.claude/rules/api.md`** with `paths:` glob | |
| Standard PDF/Excel/Word workflows | Use Anthropic's pre-built **Skills** (`pdf`, `xlsx`, `docx`, `pptx`) | |
| Guide for "how to fix a GitHub issue" | **Skill** with `argument-hint: "[issue-number]"` | |
| Run tests and report only failures, no logs | **Subagent** | Keeps logs out of main context |
| Investigate codebase before making changes | Built-in **Explore** subagent | Already shipped |
| Plan a complex change before implementing | Built-in **Plan** subagent or `--permission-mode plan` | |
| Refactor in an isolated git worktree | **Subagent** with `isolation: worktree` | |
| Run cheaper exploration with Haiku | **Subagent** with `model: haiku` | |
| Schedule a recurring task | `/schedule` (cron) or `/loop` (in-session) | Both are bundled skills |
| Run code review on every PR | Anthropic's `claude-code-review` GitHub Action + project subagents/skills | |

---

## Part 2 — Skills vs. Subagents (the most-confused pair)

| Question | Skill wins | Subagent wins |
|---|---|---|
| Should the work stay in the main conversation? | ✅ | ❌ |
| Should the work return only a summary? | ❌ | ✅ |
| Do you want auto-discovery via description? | ✅ | ✅ (both) |
| Do you want a different model? | ✅ (`model:`) | ✅ (`model:`) |
| Do you want a tool allowlist? | ✅ (`allowed-tools:`) | ✅ (stricter — `tools:` + `disallowedTools:`) |
| Do you want bundled scripts that run via bash? | ✅ (canonical pattern) | ❌ (subagent has tools, but bundling is skill territory) |
| Should the user be able to invoke it by name? | ✅ (`/<name>`) | ✅ (`@agent-<name>`) |
| Do you need persistent memory across runs? | ❌ | ✅ (`memory: project/user/local`) |
| Does it produce verbose output (logs, file dumps)? | ❌ — pollutes main thread | ✅ — main thread is protected |
| Are you willing to pay setup latency? | No | Yes |
| Is the work self-contained vs. needing back-and-forth? | Back-and-forth → skill | Self-contained → subagent |

**Combine them:** a subagent can `skills:` preload skills into its own context. Use this when an agent should know your API conventions or testing patterns.

```yaml
---
name: api-reviewer
description: Reviews API endpoints for compliance with our conventions
tools: Read, Grep, Glob, Bash
skills:
  - api-conventions
  - error-handling-patterns
---
```

---

## Part 3 — Claude Code vs. OpenAI Codex

### Feature-by-feature (April 2026)

| Capability | Claude Code | OpenAI Codex |
|---|---|---|
| **CLI binary** | `claude` | `codex` |
| **Install (npm)** | n/a | `npm i -g @openai/codex` |
| **Install (Homebrew)** | `brew install --cask claude-code` | `brew install --cask codex` |
| **Install (Win)** | `winget install Anthropic.ClaudeCode` | binary releases |
| **Cross-platform** | macOS, Linux, WSL, Win (native + WSL) | macOS, Linux, Win (native + WSL2) |
| **IDE extension** | VS Code, JetBrains | VS Code (+ Cursor / Windsurf / Insiders), JetBrains |
| **Desktop app** | macOS + Windows (`claude.com/download`) | macOS + Windows (`codex app`) |
| **Cloud-hosted parallel runner** | Limited (Managed Agents) | **First-class** (`chatgpt.com/codex`) |
| **GitHub PR integration** | `@claude` mention, `claude-code-action` | `@codex review`, `@codex …`, `openai/codex-action` |
| **Mobile** | None | iOS (in ChatGPT, Live Activities) + Android |
| **Slack / Linear** | Limited | Yes |
| **Auth** | Claude Pro/Max, Console (API key), Bedrock, Vertex, Foundry | ChatGPT sign-in (incl. device-code), API key (`OPENAI_API_KEY`) |
| **Project memory file** | `CLAUDE.md` (concatenated from cwd up) | `AGENTS.md` (concatenated from git-root down) — open standard |
| **Skills format** | `SKILL.md` (open standard) | `SKILL.md` (open standard) + optional `agents/openai.yaml` |
| **Subagent format** | `.md` with YAML frontmatter | `.toml` |
| **Subagent auto-delegation** | ✅ description-based | ❌ explicit user request only |
| **Subagent built-ins** | Explore, Plan, general-purpose, statusline-setup, output-style-setup, claude-code-guide | `default`, `worker`, `explorer` |
| **Slash commands** | 30+ built-in + skill-derived | 30+ built-in |
| **MCP support** | stdio + SSE + HTTP | stdio + HTTP, OAuth |
| **Hook events** | `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `Notification`, `Stop`, `SubagentStop`, `PreCompact`, `FileChanged` | `SessionStart`, `PreToolUse`, `PostToolUse`, `PermissionRequest`, `UserPromptSubmit`, `Stop` |
| **Sandbox model** | Per-tool allow/ask/deny rules + sandbox config | Three named modes (`read-only` / `workspace-write` / `danger-full-access`) + Starlark `prefix_rule()` |
| **Plan mode** | `--permission-mode plan`, Shift+Tab | `/plan` slash command |
| **Auto / agent modes** | acceptEdits / dontAsk / auto / bypassPermissions | Chat / Agent / Agent (Full Access); `--full-auto` shortcut |
| **Headless mode** | `claude -p`, `--output-format json|stream-json`, `--json-schema`, `--max-turns`, `--max-budget-usd` | `codex exec --json --output-last-message --ephemeral --skip-git-repo-check` |
| **Image input** | `@image.png`, paste | `--image`, paste |
| **Web search** | `WebSearch` tool | `--search`, `web_search = "cached" / "live" / "disabled"` |
| **Background tasks** | `Ctrl+B`; `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | `/ps`, `/stop` |
| **Resume / fork** | `claude -c`, `claude -r <id>` | `codex resume`, `codex fork` |
| **Profiles** | Settings layering | `[profiles.<name>]` in `config.toml` + `--profile` |
| **Default models (Apr 2026)** | Opus 4.7 (1M ctx), Sonnet 4.6, Haiku 4.5 | `gpt-5.5` (ChatGPT-only), `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.3-codex` |
| **Source license** | Closed | **Apache-2.0** at `github.com/openai/codex` |

### Conceptual differences

| Concept | Claude Code | Codex |
|---|---|---|
| **Memory file traversal direction** | Walks **up** from cwd (concatenated) | Walks **down** from git root (concatenated, deeper overrides) |
| **Subagent invocation** | Auto-delegates if description matches | Always requires explicit user invocation |
| **Sandbox vocabulary** | "Permission modes" with per-tool rule patterns | Two-axis: sandbox mode × approval policy + Starlark rules |
| **Cloud strategy** | Local-first; cloud lives in Anthropic Managed Agents (separate product) | Hybrid — `chatgpt.com/codex` is integrated into the same product surface |
| **Skill / subagent / hook ecosystem** | Built around `.claude/` directory, plugins marketplace | Built around `~/.codex/` and `.codex/`, plus Codex Cloud config |
| **PR review default severity** | All issues unless told otherwise | P0/P1 only by default |

### When to choose which

| Use case | Pick |
|---|---|
| You want first-class cloud parallel agents that open PRs unattended | **Codex** (`chatgpt.com/codex`) |
| You want a hosted runner you can `@codex review` from a PR comment without configuring infra | **Codex** |
| You're already on a ChatGPT plan and don't want a separate Anthropic plan | **Codex** |
| You want the longest context window (1M tokens with Opus 4.7) | **Claude Code** |
| You want sub-second slash-skill iteration in the terminal with `/loop` | **Claude Code** |
| You want subagents to *auto*-delegate to the right specialist based on description | **Claude Code** |
| You want fine-grained per-pattern permission rules (allowing `Bash(npm run *)` but not `Bash(npm publish *)`) | **Claude Code** |
| You want a Starlark policy file that team-leads can audit | **Codex** |
| You need mobile push-PR-from-phone | **Codex** (iOS) |
| You want open-source code for the CLI itself | **Codex** (Apache-2.0) |
| You want the largest standard library of bundled skills (PDF/Excel/Word/PPTX) on the API side | **Claude API** + Skills |
| You want a single tool that works in VS Code, JetBrains, and your CI runner | Either — both have all three |

### Feature-parity highlights (you can do these in *both*)

- Terminal CLI agent
- IDE extension (VS Code + JetBrains)
- Headless / scriptable mode
- Project memory file (`CLAUDE.md` / `AGENTS.md`)
- Skills (open `SKILL.md` standard)
- Subagents
- MCP client
- Hooks
- Plan mode
- Slash commands
- Image input
- Web search

---

## Part 4 — Workflow patterns

### A. Research → plan → implement → review (Claude Code)

```
1. Explore (subagent, Haiku)        — gather context, return summary
2. /plan                            — present a step-by-step plan
3. (user approves)
4. Implement                        — main thread
5. /security-review or /review      — bundled skills run on the diff
6. /pr-comments                     — fetch reviewer feedback
```

### B. The same workflow in Codex

```
1. /plan                            — switch to plan mode
2. (user approves)
3. (run agent — implement)
4. /review                          — review working tree
5. (push branch; @codex review on the PR for cloud-side review)
```

### C. Cross-tool: prepare repo for both

In your repo, ship **both** `CLAUDE.md` and `AGENTS.md` as the same file (symlink or copy). They're both Markdown with no required schema:

```bash
ln -s CLAUDE.md AGENTS.md
```

Both tools will pick up the same conventions.

### D. Skill-portable knowledge

A `SKILL.md` works across Claude Code, Codex CLI, Cursor, Gemini CLI, and more. To maximise portability:

- Use only the open-standard fields (`name`, `description`)
- Optional Codex-specific fields go in `agents/openai.yaml`
- Optional Claude Code fields like `disable-model-invocation` are silently ignored elsewhere
- Avoid embedding tool names ("use Bash") that may not exist on all surfaces — describe the operation instead

### E. Subagent dispatch in a complex repo

A common pattern: a `general-purpose` subagent orchestrates research while the main thread implements:

```
You (main)
 └─ "Research how the auth flow handles refresh tokens"
     └─ general-purpose subagent
         ├─ Read auth/*
         ├─ Grep for "refresh"
         └─ returns: "Token refresh logic lives in src/auth/refresh.ts:42…"
 (main continues with the summary)
```

This keeps grep output, file contents, and dead-end paths out of main context.

### F. Hooks for guardrails (universal)

Wire safety nets so Claude can't silently violate policy:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [
        { "type": "command", "if": "Bash(git push * --force*)", "command": "exit 2" }
      ]},
      { "matcher": "Bash", "hooks": [
        { "type": "command", "if": "Bash(rm -rf *)", "command": "./.claude/hooks/confirm-destructive.sh" }
      ]}
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write", "hooks": [
        { "type": "command", "command": "npx prettier --write \"$CLAUDE_LAST_FILE_PATH\"" }
      ]}
    ]
  }
}
```

---

## Part 5 — Quick-pick reference card

```
Need automatic behaviour on event?  → Hook
Need external service as a tool?    → MCP server
Need always-on project knowledge?   → CLAUDE.md / AGENTS.md
Need triggerable workflow + scripts → Skill
Need verbose work hidden + isolated → Subagent
Need a one-off named command        → Skill (disable-model-invocation: true)
Need a parallel cloud agent         → Codex Cloud (chatgpt.com/codex)
Need 1M token context               → Claude Opus 4.7
Need open-source CLI                → Codex CLI (Apache-2.0)
```

---

## Part 6 — Authoring quality checklist (universal)

Before publishing any skill, subagent, hook, or rule file, verify:

### Skills
- [ ] `description` is third-person, specific, includes trigger keywords
- [ ] `name` is gerund-form (`processing-pdfs`)
- [ ] Body < 500 lines
- [ ] References one level deep
- [ ] Forward slashes in all paths
- [ ] Scripts handle errors; no voodoo constants
- [ ] Tested with Haiku + Sonnet + Opus
- [ ] At least three evaluations exist

### Subagents
- [ ] `description` includes "use proactively" or "use immediately after" if you want auto-delegation
- [ ] `tools` allowlist is minimal
- [ ] `model` chosen deliberately (Haiku for cheap exploration; Opus for hard reasoning)
- [ ] System prompt body is focused and single-purpose
- [ ] Project agents committed to `.claude/agents/`
- [ ] If verbose: returns *only summaries*, not raw output, to main

### Hooks
- [ ] Idempotent — running twice doesn't break anything
- [ ] Time-bounded (`timeout` set)
- [ ] Doesn't leak secrets (use `allowedEnvVars`)
- [ ] Failure mode is documented (exit 2 to block, exit 0 to allow)
- [ ] Tested in `--bare` mode to confirm hook isn't masking a bug

### Rules / `CLAUDE.md` / `AGENTS.md`
- [ ] Concise — no boilerplate
- [ ] Time-insensitive ("we use Postgres", not "as of Q1 2026 we use Postgres")
- [ ] Path-scoped where possible (`.claude/rules/<name>.md` with `paths:`)
- [ ] No duplicates of information already in code

---

## Part 7 — Source URLs (for verification)

### Claude Code
- https://docs.claude.com/en/docs/claude-code/overview
- https://docs.claude.com/en/docs/claude-code/quickstart
- https://docs.claude.com/en/docs/claude-code/cli-reference
- https://docs.claude.com/en/docs/claude-code/slash-commands
- https://docs.claude.com/en/docs/claude-code/permissions
- https://docs.claude.com/en/docs/claude-code/settings
- https://docs.claude.com/en/docs/claude-code/hooks
- https://docs.claude.com/en/docs/claude-code/hooks-guide
- https://docs.claude.com/en/docs/claude-code/mcp
- https://docs.claude.com/en/docs/claude-code/memory
- https://docs.claude.com/en/docs/claude-code/ide-integrations
- https://docs.claude.com/en/docs/claude-code/sub-agents
- https://docs.claude.com/en/docs/claude-code/headless
- https://code.claude.com/docs/en/skills

### Skills
- https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
- https://docs.claude.com/en/docs/agents-and-tools/agent-skills/quickstart
- https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices
- https://github.com/anthropics/skills
- https://agentskills.io

### OpenAI Codex
- https://openai.com/codex/
- https://developers.openai.com/codex
- https://developers.openai.com/codex/cli/reference
- https://developers.openai.com/codex/cli/slash-commands
- https://developers.openai.com/codex/cloud
- https://developers.openai.com/codex/ide
- https://developers.openai.com/codex/auth
- https://developers.openai.com/codex/config-reference
- https://developers.openai.com/codex/guides/agents-md
- https://developers.openai.com/codex/skills
- https://developers.openai.com/codex/subagents
- https://developers.openai.com/codex/hooks
- https://developers.openai.com/codex/rules
- https://developers.openai.com/codex/mcp
- https://developers.openai.com/codex/integrations/github
- https://developers.openai.com/codex/models
- https://developers.openai.com/codex/pricing
- https://github.com/openai/codex
- https://agents.md/

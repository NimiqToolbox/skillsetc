---
title: Decision Guide
description: When to reach for a Skill, Subagent, Hook, MCP server, or memory file — with a decision tree, side-by-side comparisons, and battle-tested workflow patterns.
eyebrow: Reference
order: 4
group: reference
sources:
  - https://docs.claude.com/en/docs/claude-code/overview
  - https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
  - https://code.claude.com/docs/en/sub-agents
  - https://docs.claude.com/en/docs/claude-code/hooks
  - https://docs.claude.com/en/docs/claude-code/mcp
updated: 2026-04-28
---

## Why this guide exists

Five primitives, all built into Claude Code, and they overlap. A `CLAUDE.md` rule could in theory tell Claude to "always run the linter after editing" — but it won't reliably. A Hook will. A Skill could ship the same instructions as a Subagent — but they live in completely different contexts. The wrong choice means lost work, blown context budgets, or behaviour that silently drifts.

This guide gives you a deterministic answer for any "should this be a Skill or…?" question. Start with the [decision tree](#decision-tree), or jump to a worked example below.

## The five primitives at a glance

| Primitive | Core idea | Lives in | Costs context tokens? |
|---|---|---|---|
| `CLAUDE.md` / rules | Persistent instructions Claude reads at every startup | `./CLAUDE.md`, `.claude/rules/` | Yes — always |
| **Skill** | Triggerable knowledge + workflow + bundled resources | `~/.claude/skills/`, `.claude/skills/` | Description always; body when triggered |
| **Subagent** | Isolated agent context, optional different model | `~/.claude/agents/`, `.claude/agents/` | Only the **summary** returns to main thread |
| **Hook** | Out-of-band script wired to a lifecycle event | `.claude/settings.json` → `hooks` | No — runs out of context |
| **MCP server** | External tool/resource provider | `.mcp.json`, `~/.claude.json`, settings | Tool descriptions are loaded; tool results are |

## Decision tree

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

If you'd rather click through the questions, the [interactive decision flow](/decide) walks the same logic.

## When to reach for which

| You want to… | Primitive | Notes |
|---|---|---|
| Auto-run linter after every edit | **Hook** (`PostToolUse`) | Memory or skills won't reliably do this |
| Block dangerous bash like `rm -rf /` | **Hook** (`PreToolUse`) returning exit 2 | |
| Notify Slack when Claude finishes a task | **Hook** (`Stop`) | |
| Connect to BigQuery as a tool | **MCP server** | |
| Tell Claude how this monorepo is structured | **`CLAUDE.md`** at repo root | |
| Special instructions only for `src/api/**/*.ts` | **`.claude/rules/api.md`** with `paths:` glob | |
| Standard PDF/Excel/Word workflows | Anthropic's pre-built **Skills** (`pdf`, `xlsx`, `docx`, `pptx`) | |
| Guide for "how to fix a GitHub issue" | **Skill** with `argument-hint: "[issue-number]"` | |
| Run tests and report only failures, no logs | **Subagent** | Keeps logs out of main context |
| Investigate codebase before making changes | Built-in **Explore** subagent | Already shipped |
| Plan a complex change before implementing | Built-in **Plan** subagent or `--permission-mode plan` | |
| Refactor in an isolated git worktree | **Subagent** with `isolation: worktree` | |
| Run cheaper exploration with Haiku | **Subagent** with `model: haiku` | |
| Schedule a recurring task | `/schedule` (cron) or `/loop` (in-session) | Both are bundled skills |
| Run code review on every PR | `claude-code-review` GitHub Action + project subagents/skills | |

## Skills vs. Subagents

The pair people confuse most often. Both auto-discover by description, both can override the model, both can ship reusable behaviour. The deciding factor is *where the work happens*.

| Question | Skill wins | Subagent wins |
|---|---|---|
| Should the work stay in the main conversation? | ✅ | ❌ |
| Should the work return only a summary? | ❌ | ✅ |
| Auto-discovery via description? | ✅ | ✅ (both) |
| Different model? | ✅ (`model:`) | ✅ (`model:`) |
| Tool allowlist? | ✅ (`allowed-tools:`) | ✅ (stricter — `tools:` + `disallowedTools:`) |
| Bundled scripts that run via bash? | ✅ (canonical pattern) | ❌ (subagent has tools, but bundling is skill territory) |
| User-invokable by name? | ✅ (`/<name>`) | ✅ (`@agent-<name>`) |
| Persistent memory across runs? | ❌ | ✅ (`memory: project/user/local`) |
| Produces verbose output (logs, file dumps)? | ❌ — pollutes main thread | ✅ — main thread is protected |
| Willing to pay setup latency? | No | Yes |

**Combine them.** A subagent can pre-load skills into its own context — useful when an agent should know your API conventions before starting:

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

## Workflow patterns

### Research → plan → implement → review

```
1. Explore (subagent, Haiku)        — gather context, return summary
2. /plan                            — present a step-by-step plan
3. (user approves)
4. Implement                        — main thread
5. /security-review or /review      — bundled skills run on the diff
6. /pr-comments                     — fetch reviewer feedback
```

### Subagent dispatch in a complex repo

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

### Hooks for guardrails

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

### Skill-portable knowledge

A `SKILL.md` works across Claude Code, Codex CLI, Cursor, Gemini CLI, and others. To maximise portability:

- Use only the open-standard fields (`name`, `description`)
- Optional Codex-specific fields go in `agents/openai.yaml`
- Optional Claude Code fields like `disable-model-invocation` are silently ignored elsewhere
- Avoid embedding tool names ("use Bash") that may not exist on all surfaces — describe the operation instead

### Cross-tool memory

Ship `CLAUDE.md` and `AGENTS.md` as the same file (symlink or copy) so both Claude Code and OpenAI Codex pick up the same conventions:

```bash
ln -s CLAUDE.md AGENTS.md
```

## Quick reference card

```
Need automatic behaviour on event?   → Hook
Need external service as a tool?     → MCP server
Need always-on project knowledge?    → CLAUDE.md / .claude/rules/
Need triggerable workflow + scripts  → Skill
Need verbose work hidden + isolated  → Subagent
Need a one-off named command         → Skill (disable-model-invocation: true)
```

## Authoring checklist

Before shipping a skill, subagent, hook, or rule file, verify:

### Skills
- [ ] `description` is third-person, specific, includes trigger keywords
- [ ] `name` is gerund-form (`processing-pdfs`, not `pdf-helper`)
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
- [ ] Tested in `--bare` mode to confirm the hook isn't masking a bug

### Rules / `CLAUDE.md`
- [ ] Concise — no boilerplate
- [ ] Time-insensitive ("we use Postgres", not "as of Q1 2026 we use Postgres")
- [ ] Path-scoped where possible (`.claude/rules/<name>.md` with `paths:`)
- [ ] No duplicates of information already in code

## Sources

- [Claude Code overview](https://docs.claude.com/en/docs/claude-code/overview)
- [Agent Skills overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [Subagents](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [Hooks](https://docs.claude.com/en/docs/claude-code/hooks)
- [MCP](https://docs.claude.com/en/docs/claude-code/mcp)
- [Memory (`CLAUDE.md`)](https://docs.claude.com/en/docs/claude-code/memory)

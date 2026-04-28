---
title: Claude Skills
description: The SKILL.md open standard — progressive disclosure, frontmatter, bundled resources, scope, invocation, and authoring best practices.
eyebrow: Reference
order: 1
group: reference
sources:
  - https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview
  - https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices
  - https://docs.claude.com/en/docs/agents-and-tools/agent-skills/quickstart
  - https://code.claude.com/docs/en/skills
  - https://github.com/anthropics/skills
  - https://agentskills.io
updated: 2026-04-28
---

## 1. What a Skill is

> *"Agent Skills are modular capabilities that extend Claude's functionality. Each Skill packages instructions, metadata, and optional resources (scripts, templates) that Claude uses automatically when relevant."*
> — Anthropic, Agent Skills overview

A Skill is a directory with a `SKILL.md` file at its root. The `SKILL.md` contains YAML frontmatter (always loaded) and a Markdown body (loaded on demand). Sibling files — additional Markdown, scripts, templates, reference data — are loaded only when the body references them.

Skills share a single open standard (`agentskills.io`). The same `SKILL.md` works in **Claude Code**, **Codex CLI**, **Cursor**, **Gemini CLI**, **Antigravity IDE**, and others.

### How Skills compare to other primitives

| Feature | Skill | MCP tool | Slash command (legacy) | Subagent |
|---|---|---|---|---|
| Filesystem-based | ✅ | ❌ | ✅ | (orchestration unit) |
| Auto-discovered by description | ✅ | ❌ | ❌ | ❌ |
| Progressive disclosure | ✅ (3 levels) | ❌ | ❌ | ❌ |
| Bundled resources (scripts, refs) | ✅ | (remote) | limited | N/A |
| Loaded into | Same context | Tool registry | Same context | **Isolated** context |
| Run code | Via bash | Via remote process | N/A | Via tools |

> "Custom commands have been merged into skills. A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy` and work the same way." — `code.claude.com/docs/en/skills`

---

## 2. The progressive-disclosure model

A Skill is loaded in **three stages**, each more expensive than the last:

| Level | What loads | When | Token cost |
|---|---|---|---|
| **1. Metadata** | YAML frontmatter (`name`, `description`) | Always, at session start | ~100 tok / skill |
| **2. Instructions** | Markdown body of `SKILL.md` | When the skill is triggered | <5k tok |
| **3. Resources / scripts** | Sibling files referenced by the body; scripts run via bash | On demand, when referenced or executed | ~0 (script code never enters context — only its output) |

> *"When a Skill is triggered, Claude uses bash to read SKILL.md from the filesystem, bringing its instructions into the context window. If those instructions reference other files (like FORMS.md or a database schema), Claude reads those files too using additional bash commands. When instructions mention executable scripts, Claude runs them via bash and receives only the output (the script code itself never enters context)."*

**Implication:** you can ship megabytes of reference material in a Skill at zero startup cost — the description matters, not the body length.

---

## 3. `SKILL.md` structure

### Required frontmatter

```yaml
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---
```

| Field | Constraints |
|---|---|
| `name` | ≤ 64 chars; lowercase letters, numbers, hyphens only; no XML tags; cannot contain reserved words `anthropic` or `claude` |
| `description` | ≤ 1024 chars; non-empty; no XML tags. **Write in third person.** Include trigger phrases. |

**Naming convention** (Anthropic best practices): use the **gerund form** — `processing-pdfs`, `analyzing-spreadsheets`, `managing-databases`. Avoid generic names (`helper`, `utils`, `tools`).

**Description rules:**
- Always third person: ✅ "Processes Excel files and generates reports" — ❌ "I can help you process Excel files"
- Front-load the use case
- Include specific trigger phrases ("Use when …", "Use when the user mentions …")
- Single description field — Claude uses it to choose between potentially 100+ Skills

Good vs bad examples:

```yaml
# Good
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.

# Bad
description: Helps with documents
```

### Optional frontmatter (Claude Code extensions)

> Source: https://code.claude.com/docs/en/skills#frontmatter-reference

| Field | Type | Purpose |
|---|---|---|
| `when_to_use` | string | Extra context appended to description (combined ≤ 1,536 chars) |
| `argument-hint` | string | Autocomplete hint (e.g., `[issue-number]`) |
| `arguments` | string or list | Named positional arguments for `$name` substitution |
| `disable-model-invocation` | bool | If `true`, only manual `/<name>` works |
| `user-invocable` | bool | If `false`, hidden from `/` menu — only Claude can invoke |
| `allowed-tools` | string or list | Tools available without permission while skill is active |
| `model` | string | Override model when skill is active (`sonnet`, `opus`, `haiku`, `inherit`, full ID) |
| `effort` | string | Effort override (`low`, `medium`, `high`, `xhigh`, `max`) |
| `context` | string | Set to `fork` to run in an isolated subagent context |
| `agent` | string | Subagent type when `context: fork` is set |
| `hooks` | object | Hooks scoped to the skill's lifecycle |
| `paths` | string or list | Glob patterns limiting when the skill auto-activates |
| `shell` | string | `bash` (default) or `powershell` for inline shell injections |

### Body conventions

Recommended sections:
- **When to use** — concise trigger description
- **Quick start** — minimal ready-to-run example
- **Examples** — concrete input/output pairs
- **References** — links to deeper documentation files

Anthropic's hard guideline: **keep `SKILL.md` body under 500 lines.** Move details to sibling files.

### Minimal example

```yaml
---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
---

When explaining code, always include:

1. **Start with an analogy** — compare the code to something from everyday life
2. **Draw a diagram** — ASCII art for flow, structure, or relationships
3. **Walk through the code** — step-by-step
4. **Highlight a gotcha** — common mistake or misconception

Keep explanations conversational. For complex concepts, use multiple analogies.
```

### Example with optional fields

```yaml
---
name: fix-issue
description: Fix a GitHub issue
when_to_use: Activate for bug fixes and feature implementation
disable-model-invocation: true
allowed-tools: Bash(git add *) Bash(git commit *)
arguments: [issue-number]
---

Fix GitHub issue $ARGUMENTS[0]:

1. Read the issue description
2. Understand the requirements
3. Implement the fix
4. Write tests
5. Create a commit
```

---

## 4. Bundled resources (Level 3)

A Skill can ship a directory tree alongside `SKILL.md`:

```
pdf-processing/
├── SKILL.md            # required, main instructions
├── FORMS.md            # additional instructions, loaded on demand
├── REFERENCE.md        # API reference
├── EXAMPLES.md         # usage examples
├── scripts/
│   ├── analyze_form.py # executable script — only output enters context
│   ├── fill_form.py
│   └── validate.py
├── assets/
│   └── icon.png
└── templates/
    └── report_template.md
```

### Loading rules

**Additional Markdown:** referenced via standard markdown links from `SKILL.md`:

```markdown
- **Form filling**: see [FORMS.md](FORMS.md)
- **API reference**: see [REFERENCE.md](REFERENCE.md)
- **Examples**: see [EXAMPLES.md](EXAMPLES.md)
```

**Executable scripts:** instructed via bash:

```markdown
## Utility scripts

**analyze_form.py** — extract all form fields from a PDF:

\`\`\`bash
python scripts/analyze_form.py input.pdf > fields.json
\`\`\`

Output format:
\`\`\`json
{ "field_name": { "type": "text", "x": 100, "y": 200 } }
\`\`\`
```

The script code never enters the model's context — only its **output** does. This is how skills can ship deterministic helpers without paying tokens.

### Critical guidelines

1. **Always use forward slashes in paths**, even on Windows (`scripts/helper.py`, never `scripts\helper.py`).
2. **Keep references one level deep** from `SKILL.md`. Claude may use `head -100` to peek at deeply nested files and miss content.
3. **Solve, don't punt** — when writing scripts for Skills, handle errors rather than passing them back to the model. Document any "voodoo constants."
4. **Descriptive filenames** — `form_validation_rules.md`, not `doc2.md`.

### Domain-organised pattern

For multi-domain skills, organise reference files so only relevant ones load:

```
bigquery-skill/
├── SKILL.md
└── reference/
    ├── finance.md
    ├── sales.md
    ├── product.md
    └── marketing.md
```

`SKILL.md` then says "for finance metrics, see `reference/finance.md`" so Claude only loads the file matching the user's question.

---

## 5. Where Skills live & how they are discovered

> Source: https://code.claude.com/docs/en/skills#where-skills-live

| Scope | Path | Applies to | Priority |
|---|---|---|---|
| Enterprise / managed | (managed settings location) | All users in org | **Highest** |
| Personal | `~/.claude/skills/<name>/SKILL.md` | All your projects | Medium |
| Project | `.claude/skills/<name>/SKILL.md` | This project only | Low |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Where plugin enabled | Namespaced (`<plugin>:<name>`) |

When the same `name` exists at multiple scopes, **enterprise > personal > project**. Plugin skills are namespaced and can never collide. **If a skill and a legacy command share a name, the skill wins.**

### Live change detection

> *"Claude Code watches skill directories for file changes. Adding, editing, or removing a skill under `~/.claude/skills/`, the project `.claude/skills/`, or a `.claude/skills/` inside an `--add-dir` directory takes effect within the current session without restarting. Creating a top-level skills directory that did not exist when the session started requires restarting."*

### Nested directory discovery (monorepos)

> *"When you work with files in subdirectories, Claude Code automatically discovers skills from nested `.claude/skills/` directories. For example, if you're editing a file in `packages/frontend/`, Claude Code also looks for skills in `packages/frontend/.claude/skills/`."*

### Skills from `--add-dir`

`--add-dir` grants file access; for skills it also auto-loads `.claude/skills/` inside the added directory.

---

## 6. How a Skill is invoked

### 1. Automatic (model-decided)

If `disable-model-invocation` is **not** set, Claude loads a skill when:
1. The skill's `description` matches the user's request
2. Claude judges it relevant

### 2. Explicit (user-typed)

```
/skill-name
```

The user types `/<name>` — Claude loads and follows the skill.

### 3. Programmatic (Skill tool call)

Claude can invoke the Skill tool directly with parameters.

### Invocation control matrix

| Frontmatter | User can `/<name>` | Claude auto-loads | Description in context |
|---|---|---|---|
| (default) | ✅ | ✅ | ✅ |
| `disable-model-invocation: true` | ✅ | ❌ | ❌ |
| `user-invocable: false` | ❌ | ✅ | ✅ |

**Manual-only deploy script:**
```yaml
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
---

Deploy $ARGUMENTS to production:
1. Run tests
2. Build
3. Push to deployment target
```

**Background knowledge that's not user-callable:**
```yaml
---
name: legacy-system-context
description: How the legacy authentication system works
user-invocable: false
---

The legacy system uses LDAP for authentication...
```

### Skill content lifecycle in a session

> *"When you or Claude invoke a skill, the rendered SKILL.md content enters the conversation as a single message and stays there for the rest of the session. Claude Code does not re-read the skill file on later turns, so write guidance that should apply throughout a task as standing instructions rather than one-time steps."*

### Auto-compaction behaviour

> *"Auto-compaction carries invoked skills forward within a token budget. When the conversation is summarised to free context, Claude Code re-attaches the most recent invocation of each skill after the summary, keeping the first 5,000 tokens of each. Re-attached skills share a combined budget of 25,000 tokens."*

So if you invoke many skills in one long session, the oldest ones may be dropped after compaction.

---

## 7. Authoring best practices (from Anthropic)

### Conciseness

> *"The context window is a public good. … Default assumption: Claude is already very smart."*

A 50-token skill body is often more effective than a 150-token one that re-explains basics.

### Right level of freedom

| Task fragility | Specificity |
|---|---|
| Multiple valid approaches | Text-based guidelines (high freedom) |
| Preferred pattern, some variation OK | Pseudocode / parameterised scripts (medium) |
| Fragile or specific sequence required | Specific scripts (low freedom) |

### Test with all your target models

Skills are additions to the underlying model. Run your skill with Haiku, Sonnet, and Opus — what works for one may need more detail for another.

### Description-writing rules

- Specific keywords > vague summaries
- Both **what** and **when** in the same description
- Third person, always
- Front-load the key use case

### Common pitfalls

- **Time-sensitive info** ("if you're doing this before August 2025…") — wraps in `<details>` instead.
- **Inconsistent terminology** — pick "API endpoint" and stick with it (don't drift to "API route").
- **Too many options** — recommend one approach with explicit escape hatches.
- **Deep reference chains** — keep references one level from `SKILL.md`.

### Evaluation-first development

1. Run Claude on representative tasks **without** the skill — find the gaps.
2. Write three evaluations covering those gaps.
3. Establish a baseline performance.
4. Write the **minimum** instructions needed to pass.
5. Iterate.

Example evaluation:
```json
{
  "skills": ["pdf-processing"],
  "query": "Extract all text from this PDF and save it to output.txt",
  "files": ["test-files/document.pdf"],
  "expected_behavior": [
    "Reads the PDF file using an appropriate library",
    "Extracts text from all pages",
    "Saves to output.txt"
  ]
}
```

### Iterative refinement with Claude

1. Solve a task with Claude A using normal prompting.
2. Identify the reusable pattern.
3. Ask Claude A to draft the skill.
4. Review for conciseness; trim explanations.
5. Test on similar tasks with a fresh Claude B.
6. Observe; refine; repeat.

### Pre-publish checklist (Anthropic)

- [ ] Description is specific and includes trigger keywords
- [ ] Description covers both what + when
- [ ] `SKILL.md` body < 500 lines
- [ ] Detailed material lives in sibling files
- [ ] No time-sensitive info
- [ ] Consistent terminology
- [ ] Concrete examples (not abstract)
- [ ] References are one level deep
- [ ] Workflows have clear steps
- [ ] Scripts handle errors (no punting)
- [ ] No "voodoo constants"
- [ ] Required packages verified as available
- [ ] All paths use forward slashes
- [ ] At least three evaluations
- [ ] Tested with Haiku + Sonnet + Opus

---

## 8. Anthropic-published skills

### Pre-built (claude.ai + Claude API)

| Skill ID | Purpose |
|---|---|
| `pptx` | PowerPoint creation, editing, analysis |
| `xlsx` | Excel analysis, pivot tables, charts |
| `docx` | Word creation, editing, formatting |
| `pdf` | Generate formatted PDFs |

These are referenced by `skill_id` in the API `container` parameter:

```python
response = client.beta.messages.create(
    model="claude-opus-4-7",
    max_tokens=4096,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={
        "skills": [{"type": "anthropic", "skill_id": "pptx", "version": "latest"}]
    },
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
    messages=[{"role": "user", "content": "Create a presentation..."}],
)
```

Required beta headers:
- `code-execution-2025-08-25`
- `skills-2025-10-02`
- `files-api-2025-04-14` (if uploading files)

### Open-source repository

`https://github.com/anthropics/skills` — examples and reference skills:
- **claude-api skill** — bundles up-to-date Claude API reference for 8 SDK languages (auto-included in Claude Code)
- **document-skills** (pdf, docx, xlsx)
- **example-skills** (brand-guidelines, pdf-processing, etc.)
- **skill-creator** — a skill that helps you author skills

You can register the repo as a Claude Code Plugin marketplace and install plugins from it.

### Built-in skills shipped with Claude Code

These appear in the slash-command menu and are implemented as skills:

- `/review` — review a pull request
- `/security-review` — security review of pending changes
- `/simplify` — review changed code for reuse, quality, efficiency
- `/batch` — research and execute large changes across worktrees
- `/loop` — repeat a prompt or command on an interval
- `/schedule` — manage scheduled remote agents
- `/claude-api` — build/debug Anthropic SDK code
- `/init` — generate `CLAUDE.md`
- `/keybindings-help`, `/update-config`, `/fewer-permission-prompts` — assistants for configuring the harness

---

## 9. Where Skills work (surfaces)

| Surface | Pre-built | Custom | Storage | Sharing |
|---|---|---|---|---|
| **Claude Code** | ✗ | ✅ | `~/.claude/skills/`, `.claude/skills/` | Per-user or check into repo |
| **Claude API** | ✅ | ✅ | API uploads via `/v1/skills` | Workspace-wide |
| **claude.ai** | ✅ | ✅ | Settings → Features → upload zip | Per-user only (no central admin) |

**Cross-surface caveat:** uploads do **not** sync. Skills uploaded to claude.ai must be separately uploaded to the API and vice versa. Claude Code skills are filesystem-based and separate.

### Runtime constraints by surface

| Surface | Network | Package install | Notes |
|---|---|---|---|
| **claude.ai** | Varies (admin-controlled) | — | Per-user uploads |
| **Claude API** | ❌ none | ❌ none (only pre-installed packages) | Code execution container, sandboxed |
| **Claude Code** | ✅ full | ✅ (local install only — global discouraged) | Filesystem-based |

---

## 10. Limitations

### Description budget

Skill descriptions are loaded into context at startup so Claude knows what's available. The budget is **1% of the context window**, with an 8,000-character fallback. With many skills, descriptions get truncated and may lose the trigger keywords Claude needs.

Raise the budget:

```bash
export SLASH_COMMAND_TOOL_CHAR_BUDGET=16000
```

### Token costs (summary)

| Aspect | Cost |
|---|---|
| Skill metadata (Level 1) | ~100 tok / skill, pre-loaded |
| `SKILL.md` body (Level 2) | <5k tok, loaded when triggered |
| Sibling files (Level 3) | 0 until accessed |
| Bundled scripts | Output only — code never loaded |
| Unused references | 0 |

### Security

> *"We strongly recommend using Skills only from trusted sources: those you created yourself or obtained from Anthropic. Skills provide Claude with new capabilities through instructions and code, and while this makes them powerful, it also means a malicious Skill can direct Claude to invoke tools or execute code in ways that don't match the Skill's stated purpose."*

- Audit all files (`SKILL.md`, scripts, assets) before installing
- Skills fetching from external URLs are particularly risky — fetched content can contain prompt-injection
- Treat installation like installing software: only from trusted sources

---

## 11. Authoring workflow (Claude Code)

### Step 1 — make the directory

```bash
mkdir -p ~/.claude/skills/explain-code
```

### Step 2 — write `SKILL.md`

```markdown
---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
---

When explaining code, always include:

1. **Analogy** — compare to everyday life
2. **Diagram** — ASCII flow or structure
3. **Walk-through** — step by step
4. **Gotcha** — what to watch for

Keep explanations conversational.
```

### Step 3 — test

- Explicit: `/explain-code src/auth/login.ts`
- Automatic: ask "How does this code work?" — Claude should pick it up via the description.

### Step 4 — share

| Audience | How |
|---|---|
| Just you | Keep in `~/.claude/skills/` |
| Your team | Move to `.claude/skills/` and commit to git |
| Your org | Deploy via [managed settings](https://code.claude.com/docs/en/settings) |
| Public | Bundle in a Plugin and publish a marketplace |

---

## 12. Decision: when to use a Skill

Use a **Skill** when:
- You have a reusable workflow or knowledge artifact you want available across sessions
- Description-based auto-discovery is more useful than a memorised slash command
- You want to ship deterministic helper scripts (forms, validators, generators) without paying tokens
- You want one open standard that works across Claude, Codex, Cursor, etc.

Use a **Subagent** instead when:
- The task produces verbose intermediate output (logs, search results) you don't want in your main thread
- You need a different model, different tools, or stricter permissions for the task
- The work can complete and return only a summary

Use a **Hook** instead when:
- You need an action to fire **automatically** on every tool call, prompt submission, session start, etc.
- You need to *block* a tool call based on its inputs

Use **`CLAUDE.md`** instead when:
- The information should be loaded into **every** session for this project — there is no "trigger phrase" because it's always relevant.

See [`06-comparison-and-decision-guide.md`](/docs/comparison-and-decision-guide) for the full decision tree.

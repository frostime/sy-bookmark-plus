### 🎯 快速导航

- **项目信息与约定**：[.sspec/project.md](.sspec/project.md)
- **技术规范文档**：[.sspec/spec-docs/](.sspec/spec-docs/)
- **SSPEC 工作流 SKILL**：[.github/skills/sspec/SKILL.md](.github/skills/sspec/SKILL.md)

### 📚 核心技术文档

| 文档 | 适用场景 |
|------|---------|
| [整体架构](.sspec/spec-docs/architecture.md) | 理解整体结构、数据流、生命周期 |
| [SolidJS 组件系统](.sspec/spec-docs/solidjs-components.md) | 修改 UI 组件、优化性能、排查响应式问题 |
| [数据模型与存储](.sspec/spec-docs/data-model.md) | 修改数据结构、理解思源 API 集成、排查数据一致性问题 |
| [Dock 视图系统](.sspec/spec-docs/dock-views.md) | 添加新视图、理解视图生命周期、排查内存泄漏 |

**完整索引**：[.sspec/spec-docs/README.md](.sspec/spec-docs/README.md)

---

<!-- SSPEC:START -->
# .sspec Agent Protocol

SSPEC_SCHEMA::9.1

## 0. Overview

SSPEC is a doc-driven collaboration workflow. Planning, tracking, and handover live in `.sspec/`.

**Goal**: Any Agent resumes work in 30 seconds from `.sspec/`.

```
.sspec/
├── project.md     # Identity, conventions, notes
├── spec-docs/     # Formal specs (architecture, APIs)
├── changes/<n>/   # spec.md | tasks.md | handover.md [+ reference/]
├── requests/      # User intent records
├── tmp/           # Informal drafts
└── asks/          # Q&A decision records
```

---

## 1. Agent Procedure

`read(project.md)` → classify → dispatch:

SSPEC activation signals (enter Change Workflow §2 if any is true):
- User provides/references a request file (for example `.sspec/requests/...`)
- User explicitly asks to start SSPEC/change workflow
- User uses SSPEC directives (for example `@resume`, `@change`, `@handover`)

| Input | Action |
|-------|--------|
| Directive (`@resume`, `@handover`, etc.) | Execute → §5 Shortcuts |
| Request (attached or described) | Assess scale → Change Workflow §2 |
| Resume existing change | `read(handover→tasks→spec)` → continue |
| Micro task (≤3 files, ≤30min, obvious) | Do directly, no change needed |

**Background rules**:
- Important discovery → write to `handover.md` immediately
- Project-wide discovery (convention, gotcha, cross-cutting) → also append to `project.md` Notes
- Long session (>30 exchanges) → checkpoint `handover.md`
- Uncertain → `@ask` (30s question < hours of rework)
- User rejects tool call → STOP → `@ask` reason

---

## 2. Change Workflow

### Development Lifecycle

Each phase has a dedicated SKILL. Read it before starting.

```text
[Request]
   |
   v
[Research]  (understand + clarify; @ask mid-research for ambiguities)
   |
   v
[Design]    -- @ask gate (MANDATORY) --> "Align understanding + solution"
   |
   v
[Plan]      -- @ask gate (LIGHTWEIGHT) --> "Confirm task breakdown"
   |
   v
[Implement] -- @ask gate (MANDATORY) --> "Done for this round, please review"
   |
   v
[Review]    -- user feedback --> (if not satisfied, return to Implement)
   |
   +-- satisfied --> [Handover]
```

Flow rules:
- Follow phase order from `Request` to `Handover`.
- Any `@ask` gate is a hard checkpoint: ask user first (`question` if available, else `sspec ask`).
- `@ask` is a closed loop: if not approved, return to the required phase, update, and ask again.
- `Implement` and `Review` are coupled: deliver -> ask -> feedback -> implement -> ask again, until satisfied.

**Handover** is lifecycle-critical. Trigger it:
- At session end (MANDATORY)
- Mid-session when context is long (>30 exchanges)
- When switching between major phases
- Before any context-losing event (compression, interruption)

### Phase → SKILL → Files

| Phase | SKILL | Reads | Writes | Checkpoint |
|-------|-------|-------|--------|------------|
| **Research** | `sspec-research` | code, project.md, spec-docs | reference/, handover.md | `question` for mid-research clarifications (no formal gate) |
| **Design** | `sspec-design` | research findings, code | spec.md (A+B) | **@ask align** (MANDATORY) |
| **Plan** | `sspec-plan` | spec.md B | tasks.md | @ask confirm breakdown (LIGHTWEIGHT) |
| **Implement** | `sspec-implement` | spec.md B, tasks.md | code, tasks.md progress | **@ask "done for this round, please review"** (MANDATORY) |
| **Review** | `sspec-review` | user feedback | tasks.md (feedback tasks) | feedback loop: not satisfied -> Implement; satisfied -> Handover |
| **Handover** | `sspec-handover` | everything | handover.md, project.md | — |

### Scale Assessment (in Design phase)

| Scale | Criteria | Path |
|-------|----------|------|
| Micro | ≤3 files, ≤30min, trivially reversible | Do directly |
| Single | ≤1 week, ≤15 files, ≤20 tasks | `sspec change new <name>` |
| Multi | >1 week OR >15 files OR >20 tasks | `sspec change new <name> --root` → sub-changes |

### Status Transitions

| From | Trigger | To |
|------|---------|-----|
| PLANNING | user approves design+plan | DOING |
| DOING | all tasks `[x]` | REVIEW |
| DOING | missing info | BLOCKED |
| DOING | scope changed | PLANNING |
| REVIEW | accepted | DONE |
| REVIEW | needs changes | DOING |

**FORBIDDEN**: PLANNING→DONE, DOING→DONE — never skip REVIEW.

---

## 3. Consultation (@ask)

`@ask` means the Agent proactively asks the User a question, through:
- Built-in tools such as `AskUserQuestion` (e.g. `vscode/askQuestion`, `opencode/question`)
- The `sspec ask` CLI tool

**Choose by question type**:

| Question type | Tool |
|---|---|
| Simple, bounded — yes/no, pick from options, quick confirm | `question` tool |
| Complex, open-ended — requires context, involves tradeoffs, or worth recording | `sspec ask` |
| Phase gates (Design align, Implement review) | `sspec ask` (mandatory) |
| Mid-research in-flight clarification | `question` tool |

If no `question`-like tool is available → use `sspec ask` for all cases.

**For complex context**: If the question references a large design draft, research findings, or analysis → write that content to `.sspec/tmp/` and link it from the question body. Confirmed valuable materials can be moved to `change/reference/` later.

At phase gates: Design + Implement are mandatory, Plan is lightweight, Review loops until satisfied.

📚 Full workflow, patterns, and content rules: `sspec-ask` SKILL

---

## 4. Spec-Docs

Spec-docs store architecture knowledge that should outlive a single change.

Create/update spec-docs when:
- A change produces architectural knowledge (interfaces, data models, patterns)
- When the agent discovers knowledge too complex for `project.md` Notes
- When user explicitly requests documentation

Scenarios:

| Scenario | Trigger | Action |
|----------|---------|--------|
| Post-change update | Change is DONE, with architecture impact | Agent proactively `@ask`: "Should I update/create spec-doc for X?" |
| User-initiated | User requests spec-doc creation | If small → do directly; if large → may need its own change |

📚 Full guidelines: `write-spec-doc` SKILL

---

## 5. Reference

### Directive Shortcuts

| Shortcut | Action |
|----------|--------|
| `@change <n>` | Load `handover→tasks→spec`, continue; OR create if not exists `<n>` |
| `@resume` | Same as `@change` for active change |
| `@handover` | Execute `sspec-handover` |
| `@sync` | Update tasks.md/handover.md to match reality |
| `@argue` | **STOP** -> assess scope (§2 Review) |

### CLI Quick Reference

Run `sspec <command> --help` for full options.

| Command | Use |
|---------|-----|
| `sspec change new <name>` | Create a change |
| `sspec change new <name> --root` | Create a root change |
| `sspec change new --from <path>` | Create change from request file |
| `sspec change list` / `find <name>` | Locate active changes |
| `sspec change archive <path>` | Archive completed change |
| `sspec ask create <topic>` + `sspec ask prompt <path>` | Create and ask |
| `sspec request list` / `sspec ask list` | List requests/asks |
| `sspec doc new "<name>"` | Create spec-doc |
| `sspec tool mdtoc <file>` | Pre-scan Markdown |

### SKILL System

Read the SKILL for the current phase (`sspec-research`, `sspec-design`, `sspec-plan`, `sspec-implement`, `sspec-review`, `sspec-handover`, `sspec-ask`, `sspec-mdtoc`, `write-spec-doc`).
If a SKILL says "read [file](...)" -> **MUST** read it.

### Template Markers

| Marker | Meaning | Action |
|--------|---------|--------|
| `<!-- @RULE: ... -->` | Standards reminder | Read and follow. |
| `<!-- @REPLACE -->` | Anchor for first edit | Replace with content |
| `[ ]` / `[x]` | Task todo / done | Update as work progresses |
<!-- SSPEC:END -->

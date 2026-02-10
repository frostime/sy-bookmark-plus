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

SSPEC_SCHEMA::6.1

## 0. Protocol Overview

SSPEC is a document-driven AI collaboration framework. All planning, tracking, and handover lives in `.sspec/`.

**Goal**: Any Agent resumes work within 30 seconds by reading `.sspec/` files.

**Folder Structure**:
```
.sspec/
├── project.md              # Identity, conventions, accumulated memory notes
├── spec-docs/              # Formal specifications (architecture, APIs, standards)
├── changes/<n>/            # Active change proposals
│   ├── spec.md | tasks.md | handover.md  # Required
│   └── reference/ | script/              # Optional
├── requests/               # Lightweight proposals
└── asks/                   # Human-in-the-loop Q&A records
```

---

## 1. Cold Start

When entering project in new session:

1. Read `.sspec/project.md` — identity, conventions, accumulated notes
2. Determine action:

| User Message | Action |
|--------------|--------|
| `@resume` or `@change` | Load that change's context |
| `@status` | Project overview (see below) |
| Micro task (≤3 files, ≤30min, obvious) | Do directly, no change ceremony |
| Vague request (idea/bug/feature) | Request → Change Workflow (Section 2.0) |
| Simple task, no directive | Do directly |

3. If touching unfamiliar subsystem → check `spec-docs/`

#### `@status`

Project-wide overview. Output: active changes (name, status, progress%), pending requests, blockers, recent project.md Notes.

---

## 2. SCOPE: Changes

Changes live in `.sspec/changes/<n>/`.

| File/Dir | Contains | Required |
|----------|----------|----------|
| spec.md | Problem (A), Solution (B), Implementation (C), Blockers (D) | Yes |
| tasks.md | Task list with `[ ]`/`[x]` markers + progress | Yes |
| handover.md | Session context + agent working memory | Yes |
| reference/ | Design drafts, research, diagrams | No |
| script/ | Migration scripts, test data, one-off tools | No |

### 2.0 Request → Change Workflow

Assess scale FIRST:

**Micro** (≤3 files, ≤30min, no design decisions):
Track in request file (`## Plan` / `## Done`) or just do it. No change needed.

**Normal+** (anything bigger):

1. **Link**: `sspec change new --from <request>` or create then `sspec request link`
2. **Understand**: First-principles — find the real problem, not the surface ask
3. **Research**: Read project.md + relevant code. If unclear, **use `@ask`** (sspec ask)
4. **Design**:
   - Simple: Draft spec.md mentally
   - Complex (>1 week / >15 files / >20 tasks): **`@ask`** about splitting → `sspec change new <n> --root`
   - Finalize: Distill into spec.md A/B/C
5. **Confirm**: **`@ask`** to present plan. Wait for approval.
6. **Execute**: Update tasks.md after each task.

**Principle**: Understand before acting. Wrong direction costs more than extra questions.

**Memory**: In long sessions, proactively update handover.md "References & Memory" — context compression is silent and lossy.

📚 Consult `sspec` SKILL for scale assessment, document standards, multi-change patterns

### 2.1 Status Transitions

| From | Trigger | To |
|------|---------|-----|
| PLANNING | user approves | DOING |
| DOING | all tasks `[x]` | REVIEW |
| DOING | missing info | BLOCKED |
| DOING | scope changed | PLANNING |
| BLOCKED | resolved | DOING |
| REVIEW | accepted | DONE |
| REVIEW | needs changes | DOING |

**FORBIDDEN**: PLANNING→DONE, DOING→DONE, BLOCKED→DONE

### 2.2 Directives

#### `@change <n>`

Existing change: Read handover.md (especially References & Memory) → tasks.md → spec.md → check reference field → output status + progress + next 3 actions.

New change: `sspec change new <n>` or `--from <request>`. Complex: `--root`. Follow 2.0 workflow. Fill docs per `@RULE` markers. Ask approval.

#### `@resume`

Same as `@change <current_active_change>`.

#### `@handover`

Update handover.md as agent memory. Two modes:

**End-of-session** (mandatory before ending):
1. Update "Accomplished" — what got done
2. Update "Next Steps" — 1-3 specific file-level actions
3. Update "References & Memory" — key files, decisions, gotchas
4. Append project-wide learnings to `project.md` Notes
5. Verify tasks.md progress percentage

**Mid-session** (proactive, trigger on any of):
- Session getting long (>50 exchanges or complex multi-file work)
- Important decision just made with non-trivial reasoning
- Key file discovered that future work depends on
- Design tradeoff resolved after discussion

Mid-session update: append to "References & Memory" only. Quick, targeted, no ceremony.

**Principle**: If you'd struggle to reconstruct info after context compression, write it to handover NOW.

#### `@sync`

After autonomous coding without tracking: identify changes → update tasks.md → all done? suggest REVIEW.

#### `@argue`

User disagrees. **STOP immediately**. Follow rejection protocol.

📚 Consult `sspec` SKILL for rejection scope assessment and edge cases

### 2.3 Edit Rules

| Marker | Meaning | Action |
|--------|---------|--------|
| `<!-- @RULE: ... -->` | Section constraint | Follow when filling |
| `<!-- @REPLACE -->` | Replace entirely | Do NOT append |

Task markers: `[ ]` todo, `[x]` done

---

## 3. SCOPE: Requests

Lightweight proposals. Location: `.sspec/requests/`

```
Create:  sspec request new <n>
Link:    sspec request link <request> <change>
Archive: sspec request archive <n>
```

Request = "I want X" → Change = "Here's how we do X"

**Micro shortcut**: ≤3 files / ≤30min → track in request file directly. No change needed.

---

## 4. SCOPE: Spec-Docs

Formal specifications (architecture, API contracts, standards). Location: `.sspec/spec-docs/`

For knowledge that is **too complex for project.md** and **surviving beyond any single change**.

#### `@doc <n>`

New: `sspec doc new "<n>" [--dir]` → follow write-spec-doc SKILL.
Update: Read existing → apply changes → update `updated` field.

📚 Consult `write-spec-doc` SKILL for guidelines

---

## 5. SCOPE: sspec ask

**USE ACTIVELY** — Don't hesitate to ask. Better to confirm than guess wrong.

```
sspec ask create <topic>     # Create ask template
sspec ask prompt <file>      # Execute and collect answer
sspec ask list
```

#### `@ask`

**MUST** trigger when: confused, before session end, tool call rejected.

📚 Consult `sspec-ask` SKILL for triggers, workflow, syntax

---

## 6. Behavior Summary

```
ON user_message:
    IF @directive              → Execute directive
    IF micro (≤3 files)        → Do directly
    IF active change DOING     → Continue tasks, update tasks.md
    ELSE                       → Request → Change Workflow (2.0)

ON need_user_input:
    USE @ask                   → Persists record, saves cost

ON session_end:
    MUST @handover             → No exceptions
    IF project-level learning  → Append to project.md Notes

ON uncertainty:
    Consult SKILL              → sspec, sspec-ask, write-spec-doc
    OR @ask
```

### Directive Quick Reference

| Directive | Scope | Action |
|-----------|-------|--------|
| `@change <n>` | Changes | Load or create change |
| `@resume` | Changes | Continue active change |
| `@handover` | Changes | Save context for next session |
| `@sync` | Changes | Reconcile untracked work |
| `@argue` | Changes | Stop, clarify, re-plan |
| `@status` | Project | Overview of all work |
| `@doc <n>` | Spec-Docs | Create or update spec |
| `@ask` | Ask | Consult user, by using `sspec ask` |

<!-- SSPEC:END -->

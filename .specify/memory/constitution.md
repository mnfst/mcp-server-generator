<!--
Sync Impact Report - Constitution Update

Version Change: 1.0.0 → 1.1.0
Constitution Type: MINOR (Materially expanded guidance on code quality, documentation, and simplicity)

Modified Principles:
- II. Code Quality Standards → Expanded with explicit readability and understanding requirements
- III. Documentation as Code → Expanded with "Documentation for Understanding" emphasis, inline documentation requirements
- V. Specification-Driven Development → Enhanced clarity on understanding before implementation

Added Sections:
- New subsection in Code Quality Standards: "Code Must Be Understandable"
- New subsection in Documentation as Code: "Inline Documentation Standards"
- Enhanced Quality Gates with readability checks

Removed Sections: None

Templates Status:
✅ plan-template.md - Constitution Check section already aligned with enhanced principles
✅ spec-template.md - User story structure already supports understanding requirements
✅ tasks-template.md - Phase-based organization already supports code quality gates
✅ agent-file-template.md - No changes required, generic guidance maintained

Follow-up TODOs: None
-->

# POC Origin Constitution

## Core Principles

### I. Modularity First

Every feature and component MUST be designed for independent operation and testing.
Components MUST have clear boundaries with well-defined interfaces. Services, models,
and utilities MUST be self-contained with minimal cross-dependencies. Each module MUST
be independently testable without requiring the entire system.

**Rationale**: Modularity enables parallel development, independent testing, incremental
delivery, and easier maintenance. It prevents tightly-coupled systems that become
difficult to modify and scale.

### II. Code Quality Standards

#### Simplicity Over Cleverness

Code MUST prioritize simplicity over cleverness. Implementations MUST follow YAGNI
(You Aren't Gonna Need It) principles—build only what is needed now, not what might
be needed later. Avoid premature abstractions, over-engineering, and unnecessary
complexity. Three similar lines of code are better than a premature abstraction.

**Rationale**: Simple code is easier to understand, test, debug, and maintain. Complexity
must be justified by concrete current needs, not hypothetical future requirements.
Every abstraction carries cognitive overhead and maintenance cost.

#### Code Must Be Understandable

Code MUST be written for human comprehension first, machine execution second. Variable
names MUST be descriptive and reveal intent (e.g., `userEmail` not `ue`, `calculateTotalPrice`
not `calc`). Functions MUST do one thing and do it well. Complex logic MUST be broken
into smaller, named functions that document their purpose through their names. Code
that requires explanation MUST include inline comments explaining WHY, not WHAT.

**Rationale**: Code is read far more often than it is written. Future maintainers
(including your future self) must be able to understand the code's purpose and logic
without extensive archaeology. Clear code reduces onboarding time, prevents bugs from
misunderstanding, and makes refactoring safer.

### III. Documentation as Code

#### Living Documentation Requirement

Every feature MUST have living documentation that evolves with the code. Documentation
MUST include user scenarios, API contracts, data models, and quickstart guides.
Documentation is not optional—it is a deliverable equal in importance to code.
Specifications MUST exist before implementation begins.

**Rationale**: Documentation ensures shared understanding across teams and time.
Specification-driven development prevents costly rework and misaligned implementations.
Living documentation (kept alongside code) stays relevant unlike separate wiki pages
that quickly become outdated.

#### Documentation for Understanding

Documentation MUST answer three critical questions for every feature:
1. **WHY does this exist?** (Purpose, business value, problem being solved)
2. **WHAT does it do?** (User scenarios, capabilities, boundaries)
3. **HOW do I use it?** (Quickstart, examples, API contracts)

Documentation MUST be written for someone unfamiliar with the codebase. Avoid jargon
without definition. Include concrete examples for every major capability. Link related
documentation to create a web of understanding.

**Rationale**: Great documentation enables team scalability and reduces cognitive load.
New team members should be productive quickly. Documentation that answers WHY helps
future maintainers make informed decisions about changes without breaking original intent.

#### Inline Documentation Standards

Complex functions (>20 lines or >2 levels of nesting) MUST include docstring comments
explaining purpose, parameters, return values, and any non-obvious behavior. Non-trivial
algorithms MUST include comments explaining the approach and referencing sources if
applicable. Magic numbers MUST be replaced with named constants that explain their meaning.
Regular expressions MUST include comments explaining what they match.

**Rationale**: Inline documentation captures context that external documentation cannot.
It prevents "tribal knowledge" where critical understanding exists only in developers'
heads. Good inline documentation makes debugging faster and refactoring safer.

### IV. Incremental Delivery

Features MUST be broken into independently testable user stories with clear priorities
(P1, P2, P3). Each user story MUST deliver standalone value and be independently
deployable. The highest priority story (P1) MUST define the Minimum Viable Product (MVP).
Development MUST proceed story-by-story, completing and validating each before moving
to the next.

**Rationale**: Incremental delivery enables early feedback, reduces risk, allows
parallel development, and ensures every checkpoint produces a deployable, testable
artifact. Smaller increments are easier to test, review, and debug.

### V. Specification-Driven Development

Implementation MUST NOT begin before design artifacts are complete and understood.
Required design artifacts: feature specification (spec.md), implementation plan (plan.md),
data model (data-model.md for data-heavy features), and API contracts (contracts/
directory for endpoints/interfaces). The /speckit.plan workflow MUST be completed
before coding starts.

**Understanding Checkpoint**: Before writing code, developers MUST be able to explain
the feature's purpose, describe all user stories, list key entities and their relationships,
and identify potential edge cases. If any of these cannot be clearly explained, design
artifacts need clarification before proceeding.

**Rationale**: Upfront design prevents misaligned implementations, reduces rework,
enables better architectural decisions, and provides a roadmap for implementation.
Design artifacts serve as living documentation and facilitate team alignment. Understanding
before implementation prevents expensive false starts and architectural dead ends.

## Development Workflow

All features MUST follow the Speckit workflow:

1. **Specification Phase**: Use `/speckit.specify` to create spec.md with user stories,
   requirements, and acceptance criteria. User stories MUST be prioritized and
   independently testable.

2. **Planning Phase**: Use `/speckit.plan` to generate design artifacts including plan.md,
   research.md, data-model.md, and contracts/. The Constitution Check gate MUST pass
   before proceeding.

3. **Understanding Checkpoint**: Review all design artifacts and ensure the feature
   purpose, user value, technical approach, and edge cases are clearly understood.
   Clarify any ambiguities before task generation.

4. **Task Generation**: Use `/speckit.tasks` to generate dependency-ordered tasks.md
   organized by user story. Tasks MUST support independent story implementation.

5. **Implementation Phase**: Use `/speckit.implement` or execute tasks manually.
   Complete foundational phase before any user story work. Implement user stories
   in priority order (P1 → P2 → P3), validating each independently.

6. **Validation Phase**: Use `/speckit.analyze` to verify cross-artifact consistency
   after task generation or significant changes.

## Quality Gates

**Constitution Check Gate** (mandatory before Phase 0 research, re-check after Phase 1):
- All principles MUST be satisfied or violations explicitly justified in the
  Complexity Tracking table
- Violations require documented rationale and proof that simpler alternatives
  were considered and rejected
- Code readability requirements MUST be verified (descriptive names, single-purpose
  functions, appropriate comments)

**Specification Gate** (mandatory before planning):
- User stories MUST be prioritized and independently testable
- Functional requirements MUST be clear and unambiguous (or marked NEEDS CLARIFICATION)
- Success criteria MUST be measurable and technology-agnostic
- Documentation MUST answer WHY, WHAT, and HOW for the feature

**Design Gate** (mandatory before task generation):
- Implementation plan MUST define concrete project structure (no placeholder options)
- Technical context MUST specify language, frameworks, testing approach
- Contracts MUST be documented for all external interfaces
- All design artifacts MUST be understandable by someone new to the project

**Implementation Gate** (mandatory before story completion):
- Each user story MUST be independently testable
- Code MUST follow Code Quality Standards (simplicity, YAGNI, understandability)
- Complex functions MUST have inline documentation
- Complexity MUST be justified if it violates constitution principles

**Readability Gate** (applied during code review):
- Variable and function names MUST be descriptive and reveal intent
- Functions MUST be single-purpose and reasonably sized (<50 lines preferred)
- Complex logic MUST include explanatory comments
- Magic numbers MUST be replaced with named constants

## Governance

This constitution supersedes all other development practices and preferences. When in
doubt, refer to this document. Amendments require:

1. Documented proposal with rationale for change
2. Review of impact on existing templates and workflows
3. Update to CONSTITUTION_VERSION following semantic versioning
4. Sync Impact Report documenting all affected artifacts
5. Updates to dependent templates (plan, spec, tasks, commands)

**Versioning Policy**:
- MAJOR: Backward-incompatible principle removal or redefinition
- MINOR: New principle/section added or materially expanded guidance
- PATCH: Clarifications, wording fixes, non-semantic refinements

**Compliance Review**: All PRs, feature specifications, and design documents MUST verify
compliance with this constitution. Constitution Check gates enforce this requirement.

**Complexity Justification**: Any deviation from constitutional principles MUST be
documented in the Complexity Tracking table with clear rationale and proof that simpler
alternatives were considered.

**Runtime Guidance**: Use `.specify/templates/agent-file-template.md` as the foundation
for creating agent-specific development guidance when needed.

**Version**: 1.1.0 | **Ratified**: 2025-11-20 | **Last Amended**: 2025-11-20

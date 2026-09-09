# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Confirm each gate below, or record a justified violation in Complexity Tracking.

- [ ] **I. UI only**: no transport, session, storage, queueing, history, encoding,
      cart math, or voice orchestration added to this repository. Logic that belongs
      to `@weni/webchat-service` is linked to a service issue instead.
- [ ] **II. Presentational core**: no component imports or receives
      `WeniWebchatService`; service adaptation stays in composables.
- [ ] **III. Multi-instance**: no module-level mutable state, singletons, globals,
      fixed DOM ids, or self-derived storage keys; teardown is explicit.
- [ ] **IV. Variants and slots**: differences between consumers are props, variants,
      or slots; no per-consumer component forks and no consumer names in identifiers.
- [ ] **V. Unnnic only**: colours, spacing, radii, typography, and icons come from
      Unnnic tokens and components; no hardcoded values.
- [ ] **VI. Versioned contract**: public API changes are additive, or a MAJOR bump
      plus `CHANGELOG.md` migration note is planned.
- [ ] **VII. Parity tracked**: any capability gap versus `webchat-react` is recorded.
- [ ] **VIII. Tests**: component variants, slot contracts, and concurrent-instance
      behaviour are covered in the same change.
- [ ] **Constraints**: no hardcoded user-facing copy, no router or store dependency,
      no new runtime dependency that Unnnic or the service already covers.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Component library (DEFAULT for this repository)
src/
├── components/          # Presentational Vue components (Principle II)
├── composables/         # Service adaptation layer (useWebchatService, ...)
├── types/               # Public types re-exported from the service
└── index.ts             # The public contract (Principle VI)

# Tests are colocated with the unit under test, e.g.
# src/components/__tests__/SomeComponent.spec.ts

# [REMOVE IF UNUSED] Option 2: Single project
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 3: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 4: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

<!--
SYNC IMPACT REPORT
==================
Version change: (unversioned template) → 1.0.0
Bump rationale: Initial ratification. The prior file was the unfilled Spec Kit
scaffold with no adopted governance, so this is the first enforceable version.

Modified principles (template slot → adopted principle):
- [PRINCIPLE_1_NAME] (example: Library-First)              → I. UI Only, Logic Belongs to webchat-service
- [PRINCIPLE_2_NAME] (example: CLI Interface)              → II. Presentational Core, Connected Edges
- [PRINCIPLE_3_NAME] (example: Test-First NON-NEGOTIABLE)  → III. Multi-Instance by Construction
- [PRINCIPLE_4_NAME] (example: Integration Testing)        → IV. Variants and Slots, Never Forks
- [PRINCIPLE_5_NAME] (example: Observability)              → V. Unnnic Is the Only Design Source
- (new slot, not in template)                              → VI. The Public API Is a Versioned Contract
- (new slot, not in template)                              → VII. Parity With webchat-react Is Tracked, Never Assumed
- (new slot, not in template)                              → VIII. Components Ship With Tests

Explicitly rejected template examples: CLI Interface (this package has no CLI
surface) and mandatory red-green TDD (tests are required in the same pull request,
but test-first authoring is not enforced).

Added sections:
- Technology and Dependency Constraints (filled [SECTION_2_NAME] / [SECTION_2_CONTENT])
- Development Workflow and Quality Gates (filled [SECTION_3_NAME] / [SECTION_3_CONTENT])

Removed sections: none.

Templates and docs requiring updates:
- ✅ .specify/templates/plan-template.md (Constitution Check gates + library structure option)
- ✅ .specify/templates/tasks-template.md (testing note aligned to Principle VIII, library paths)
- ✅ README.md (references constitution and consumer scope)
- ✅ .specify/templates/spec-template.md (reviewed, no change required: user-value
     focused and does not conflict with any adopted principle)
- ✅ .specify/templates/checklist-template.md (reviewed, no change required)

Follow-up TODOs: none. All placeholder tokens resolved.
-->

# Platform Webchat Components Constitution

`@weni/platform-webchat-components` is the Vue component library for webchat
experiences inside the VTEX CX Platform. Its only consumers are internal VTEX
products: `agent-builder-webapp` (Preview and agent version comparison) and
`chats-webapp` (Live Desk Copilot).

This package is deliberately **not** a template for external customers. Customers
clone and customise `webchat-react`, which keeps its own design and its own
release cadence. This library exists because the CX Platform is Vue, uses the
Unnnic design system, and needs host-owned injection points that a React bundle
cannot provide.

## Core Principles

### I. UI Only, Logic Belongs to webchat-service

This package renders state and reports intent. It MUST NOT own behaviour that any
other webchat consumer would also need.

Forbidden in this repository: WebSocket or transport code, session creation or
restoration, browser storage reads and writes, message queueing or retry, history
merging, file or audio encoding, cart totals and discount math, and voice session
orchestration (speech-to-text, text-to-speech, echo guarding, chunking).

When a feature needs any of the above, the logic MUST land in
`@weni/webchat-service` and be consumed from here. A pull request that adds such
logic locally MUST be rejected, even when the service change is slower to ship.

Rationale: `chats-webapp` was forced to copy roughly 575 lines of `VoiceService`
from `webchat-react` because the service did not export it. Duplication is what
happens when domain logic hides inside a UI layer, and it is the exact failure this
library exists to stop. `@weni/webchat-service` v1.10.1 already owns connection,
session, state, history, file, and recording concerns; voice orchestration and cart
math are known gaps that MUST be closed in the service, not reproduced here.

### II. Presentational Core, Connected Edges

Components MUST receive data through props and report intent through emits and
slots. A component MUST NOT import `WeniWebchatService`, accept a service instance
as a prop, subscribe to service events, or read module state.

Adapting the service to reactive Vue state is the job of composables (for example
`useWebchatService`), which are a separate and optional entry point. A consumer MUST
be able to render every component without the service present.

Rationale: `chats-webapp` maps service messages into its own `AssistantMessage`
shape through `src/services/assistant/messageMapper.ts`. Binding components to the
service event stream or to service message types would lock that consumer out of the
library and recreate the duplication this package is meant to remove. It also keeps
component tests free of transport mocks.

### III. Multi-Instance by Construction

Every component and composable MUST support an unbounded number of simultaneous,
fully independent instances on one screen.

Module-level mutable state, singletons, service locators, global registries,
`window` or `document` globals, fixed DOM `id` attributes, and hardcoded storage
keys are forbidden. All state MUST live inside a component instance or inside a
single composable call. Anything that touches persistence MUST take a
caller-supplied namespace rather than deriving a key itself. Composables MUST clean
up every listener, timer, and stream in `onUnmounted` (or an explicit dispose
returned to the caller) so that an unmounted instance leaves nothing behind.

Rationale: Agent Builder renders two previews side by side against two different
connections, and Live Desk keeps one connection per open room. `chats-webapp`
already had to reach into `service.session.sessionKey` to avoid cross-room storage
collisions; that workaround is evidence that implicit global keys break as soon as
instance count exceeds one.

### IV. Variants and Slots, Never Forks

Where Agent Builder and Live Desk need different presentation for the same concept,
that difference MUST be expressed as props or named variants on a single component,
and host-specific UI MUST enter through named slots.

Creating a second component that duplicates an existing one for a single consumer is
forbidden. Consumer names MUST NOT leak into component or file names; variants MUST
describe the presentation, not the product that requested it. A component MUST NOT
branch on which application is rendering it.

Rationale: the two message composers differ only in placeholder copy, button colour,
and which extra controls appear. Agent Builder additionally needs its own "view logs"
block above each agent message, and Live Desk needs suggestion chips below the
thread. Those are injection points, not reasons to fork a component.

### V. Unnnic Is the Only Design Source

Colours, spacing, radii, typography, shadows, and icons MUST come from
`@weni/unnnic-system` components and design tokens. Hardcoded hex colours, raw pixel
spacing, and bespoke icon markup are forbidden; where a token genuinely does not
exist, the token MUST be added to Unnnic rather than worked around here.

Unnnic primitives MUST be preferred over reimplementation: when Unnnic ships a
button, chip, dropdown, or modal that fits, this library MUST use it. Styles MUST be
scoped to the component. This library MUST NOT redistribute or vendor Unnnic.

Rationale: these components render inside CX Platform screens and must be
indistinguishable from the surrounding product. This is also the clearest line
between this package and `webchat-react`, which follows customer-facing design
instead.

### VI. The Public API Is a Versioned Contract

Everything re-exported from `src/index.ts` is public; everything else is internal and
MUST NOT be deep-imported by consumers. The package follows semantic versioning.

Props, emits, slot names, slot scope payloads, and composable return shapes are part
of the contract. Additive changes ship as MINOR. Renaming or removing any of them,
or changing a default that alters rendered output, is a MAJOR change and MUST ship
with a `CHANGELOG.md` entry that states the migration. Every release MUST have a
`CHANGELOG.md` entry and a git tag.

Rationale: two applications with independent release cadences depend on this package.
An unannounced contract change is a production break in a product owned by another
team.

### VII. Parity With webchat-react Is Tracked, Never Assumed

Divergence from `webchat-react` is expected and acceptable for presentation; silent
divergence in capability is not.

Every webchat capability that exists in `webchat-react` and is absent here MUST be
recorded as a known gap in repository documentation. Automated synchronisation may
open pull requests that port a React component to Vue, but such a pull request MUST
NOT be merged without human review and MUST NOT be auto-merged.

Rationale: the main risk accepted when this library was approved is that the two UI
layers drift apart. Tracking parity explicitly is the mitigation that made the
trade-off acceptable.

### VIII. Components Ship With Tests

Every new or changed component and composable MUST ship tests in the same pull
request. Component tests MUST cover each variant and each slot contract. Composable
tests MUST cover mount, teardown, and at least two concurrent instances, using a
fake or stubbed service rather than a live connection.

Coverage MUST NOT drop on touched files, and CI MUST be green before merge. Strict
red-green TDD is NOT required.

Rationale: this package has no application to smoke-test it. Tests are the only
signal that a change is safe for both consumers, and the multi-instance requirement
in Principle III is the kind of guarantee that silently regresses without a test.

## Technology and Dependency Constraints

The stack is Vue 3 with the Composition API and `<script setup>`, TypeScript in
strict mode, Vite in library mode for builds, `vue-tsc` for type generation, and
Vitest with `@vue/test-utils` for tests. Node MUST be 22.12 or newer, matching
`agent-builder-webapp`. Linting uses `@weni/eslint-config` with Prettier; styling
uses scoped SCSS.

`vue`, `@weni/unnnic-system`, and `@weni/webchat-service` MUST be declared as peer
dependencies and MUST NOT be bundled into the published output. The `vue` peer range
MUST stay compatible with the `^3.4.8` floor that Unnnic itself requires. The
`@weni/unnnic-system` peer range MUST remain satisfiable by both consumers, which are
currently on `^3.24.3` (`chats-webapp`) and `^3.30.0` (`agent-builder-webapp`).
The published package MUST provide ESM output and generated type declarations.

Runtime dependencies MUST be kept near zero. A dependency MUST NOT be added when
Unnnic, `@weni/webchat-service`, or a small local utility already covers the need.

This library MUST NOT contain hardcoded user-facing copy. All labels, placeholders,
and messages MUST arrive through props, because both consumers own their own
`vue-i18n` catalogues and translation pipelines. This library MUST NOT depend on a
router, on Pinia, or on any host application store.

## Development Workflow and Quality Gates

The default branch is `main`. Branch names follow `<type>/<short-kebab-description>`.
Commits follow Conventional Commits with a scope, for example
`feat(input): add manager selector variant`. Related changes belong in a single
atomic commit.

Every change requires a pull request and at least one human review. A pull request
MUST state which principles it touches when it changes a public contract, a variant,
or a slot. CI MUST pass lint, type-check, tests, and build before merge.

Design changes MUST reference the source Figma node so that reviewers can verify
fidelity. When a change is blocked because logic must move to
`@weni/webchat-service` first, the pull request MUST link the corresponding service
issue rather than working around the boundary.

## Governance

This constitution governs the Spec Kit `specify`, `plan`, `analyze`, `tasks`, and
`implement` workflows in this repository and supersedes conflicting habits or stale
documentation.

Amendments require a pull request that updates `.specify/memory/constitution.md`,
bumps the version (MAJOR for a removed or redefined principle, MINOR for a new
principle or materially expanded guidance, PATCH for wording and clarifications),
sets Last Amended to the date of the change, and states the reason for the amendment.

Reviewers MUST reject any plan or implementation that puts domain logic in this
repository instead of `@weni/webchat-service`, passes a service instance into a
component, introduces module-level mutable state or a fixed storage key, forks a
component per consumer, hardcodes colours, spacing, or user-facing copy, or changes a
public contract without a version bump and changelog entry.

**Version**: 1.0.0 | **Ratified**: 2026-09-09 | **Last Amended**: 2026-09-09

# Implementation Plan: CX Platform Webchat Component Set

**Branch**: `001-webchat-component-set` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-webchat-component-set/spec.md`

## Summary

Bootstrap `@weni/platform-webchat-components` from an empty repository and deliver the
webchat conversation blocks that Agent Builder and Live Desk both need: a thread, a
composer with two presentation variants, standalone suggestions, a cart, and a spoken
mode panel, plus a service adaptation layer behind a separate entry point.

The approach is presentational components composed from Unnnic primitives, driven
entirely by props, reporting intents through emits, and accepting host content through
named slots. The conversation model is owned by this library and normalised, with one
adapter absorbing the service's inconsistencies. Composables live behind
`./composables` so that importing components never pulls `@weni/webchat-service` into
a consumer's graph.

Research produced two findings that changed the shape of this plan. First, Unnnic
3.30.0 already ships `unnnicAudioRecorder`, `unnnicCarousel`, `unnnicChatText`,
`unnnicCollapse`, and `unnnicEmojiPicker`, so several blocks are composition rather
than new code. Second, four `webchat-react` capabilities fall outside this spec, two of
which look like omissions rather than exclusions; those are recorded rather than
silently absorbed.

## Technical Context

**Language/Version**: TypeScript 5.8 in strict mode, Vue 3 with Composition API and
`<script setup>`

**Primary Dependencies**: peers `vue@^3.4.8`, `@weni/unnnic-system@>=3.30.0 <4`,
`@weni/webchat-service@^1.10.3`; runtime `marked` and `dompurify` for sanitised
message markdown

**Storage**: none owned by this library. Any persistence takes a caller-supplied
namespace, per FR-018

**Testing**: Vitest with `@vue/test-utils`, `@vitest/coverage-istanbul` to match both
consumers, `vitest-axe` for the accessibility gate

**Target Platform**: evergreen browsers, consumed by Vue 3 single-page applications
built with Rspack

**Project Type**: component library, published to public npm as ESM with generated
declarations

**Performance Goals**: a 500-message thread stays scrollable and accepts typing
without perceptible stalling, per SC-007

**Constraints**: no domain logic, no user-facing copy, no router or store dependency,
no bundled peer dependencies, unbounded simultaneous instances

**Scale/Scope**: five public components, two public composables, two consuming
products, roughly 21 `webchat-react` components at parity

Full reasoning for each choice, including alternatives rejected, is in
[research.md](./research.md). No NEEDS CLARIFICATION items remain.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Initial evaluation and post-design re-evaluation reached the same result. One
deviation is recorded in Complexity Tracking; every other gate passes.

- [x] **I. UI only**: no transport, session, storage, queueing, history, encoding,
      cart math, or voice orchestration added to this repository. Cart totals and
      spoken-mode phases arrive as props, per FR-036 and FR-042. The two service gaps
      are recorded in the spec's Dependencies, and stories 6 and 7 are sequenced last
      so the logic lands in the service first.
- [x] **II. Presentational core**: no component imports or receives
      `WeniWebchatService`. Enforced structurally rather than by review: the service
      is reachable only through the `./composables` entry point, and nothing under `.`
      imports from it. The model's type surface is compile-time only, so components
      pull no runtime value from the service either.
- [x] **III. Multi-instance**: no module-level mutable state, singletons, globals,
      fixed DOM ids, or self-derived storage keys. `useWebchatService` receives the
      service instance rather than constructing it, removes every subscription in
      `onUnmounted`, and exposes `dispose` for callers outside a component scope.
      Covered by the dedicated multi-instance and teardown tests in the quickstart.
- [x] **IV. Variants and slots**: the two composer arrangements are `compact` and
      `expanded` on one component, and `capabilities` is independent of variant so no
      control needs a new variant. Host UI enters through `message-before`,
      `message-after`, `leading`, `trailing`, and `above`. No consuming product is
      named in any identifier, and no component branches on which application renders
      it. A whole-message override slot was deliberately left out; the reasoning is in
      the contract.
- [x] **V. Unnnic only**: colours, spacing, radii, typography, and icons come from
      Unnnic tokens, consumed through its `./tokens/*` subpath exports and SCSS entry.
      Thirteen Unnnic primitives are composed rather than reimplemented, listed in
      research D9. No hardcoded hex values or raw pixel spacing. Figma nodes for the
      three blocks that have approved designs are recorded in the contract.
- [x] **VI. Versioned contract**: this is the initial `0.x` surface, so there is
      nothing to break yet. The versioning table in the contract fixes the rules going
      forward, including the one non-obvious case: a new required member of any
      `labels` object is MAJOR.
- [x] **VII. Parity tracked**: `PARITY.md` at bootstrap classifies all 45
      `webchat-react` components as ported, intentionally excluded, or an open gap, with
      four open gaps identified during research.
- [x] **VIII. Tests**: every component ships tests for each variant and each slot
      contract; composables ship tests for mount, teardown, and two concurrent
      instances against a stubbed service. Named test targets are in the quickstart.
- [ ] **Constraints**: no hardcoded user-facing copy, no router or store dependency,
      no new runtime dependency that Unnnic or the service already covers.

The final gate is the one that does not pass cleanly. Copy, router, and store are all
satisfied: wording arrives through required `labels` objects, which makes a missing
label a compile error rather than a review catch, and nothing depends on a router or
store. The dependency clause is where the deviation sits, and it is recorded below.

## Project Structure

### Documentation (this feature)

```text
specs/001-webchat-component-set/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── public-api.md    # Phase 1 output
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks, not created here)
```

### Source Code (repository root)

The repository currently contains no `package.json` and no `src/`, so this layout is
created by the bootstrap work rather than extended.

```text
src/
├── components/
│   ├── PwcThread/            # thread, message kinds, indicators
│   ├── PwcComposer/          # compact and expanded variants
│   ├── PwcSuggestions/       # standalone attendant suggestions
│   ├── PwcCart/              # cart presentation
│   └── PwcVoicePanel/        # spoken mode presentation
├── composables/
│   ├── useWebchatService.ts  # the only service-aware module
│   ├── fromServiceMessage.ts # normalisation, publicly exported
│   └── index.ts              # the ./composables entry point
├── internal/
│   └── useThreadScroll.ts    # anchoring; not part of the public contract
├── types/
│   └── index.ts              # the owned conversation model
├── styles/                   # Unnnic token usage, scoped SCSS
└── index.ts                  # the public contract

.storybook/                   # catalogue configuration
PARITY.md                     # webchat-react parity tracking
CHANGELOG.md                  # required per release by Principle VI
```

Tests are colocated with the unit under test, for example
`src/components/PwcThread/__tests__/PwcThread.spec.ts`.

**Structure Decision**: the component library layout from the template, with two
additions. `src/internal/` exists so that shared helpers have an unambiguous home that
is visibly outside the public contract, which matters because Principle VI makes
everything re-exported from `src/index.ts` public and everything else off-limits to
deep imports. `src/composables/index.ts` exists as its own entry point so the
separation demanded by Principle II is enforced by the module graph rather than by
convention: components under `src/components/` cannot reach the service without
importing across a boundary that a lint rule can forbid.

## Complexity Tracking

> Filled because the Constraints gate does not pass cleanly.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Two runtime dependencies, `marked` and `dompurify`, against the near-zero guidance in the constitution's Technology and Dependency Constraints | Agents already emit markdown, and `webchat-react` already renders it with these exact two libraries. Unnnic has no markdown renderer and the service does not format text, so nothing in the existing stack covers the need. Not rendering markdown would be a visible capability regression against the implementation Principle VII requires parity with. | Pushing markdown to each consumer through a slot recreates the duplication this library exists to remove, and duplicates the sanitisation decision, which is the part with security consequences. Rendering plain text only is a capability regression. A local sanitiser is a well-known source of injection bugs and is not what the constitution means by a small local utility. |

## Sequencing

Story priority from the spec drives order, with one adjustment: bootstrap comes first
because the repository has no build.

1. **Bootstrap** — `package.json`, Vite library mode, Vitest, ESLint, Storybook,
   `PARITY.md`, `CHANGELOG.md`, the owned model in `src/types/`, and CI.
2. **US1, thread** (P1) — the model, message kinds, indicators, scroll anchoring.
3. **US2, composer** (P2) — both variants, capabilities, recording presentation.
4. **US3, independence** (P3) — the multi-instance and teardown guarantees, plus
   `useWebchatService` and the shared-composer scenario.
5. **US4, host content** (P4) — the two message slots.
6. **US5, offered replies** (P5) — preset replies, options, products, suggestions.
7. **US6, cart** (P6) — blocked on cart behaviour landing in the service.
8. **US7, spoken mode** (P7) — blocked on voice session behaviour landing in the
   service.

Steps 7 and 8 can be built as presentation ahead of their service dependencies, since
FR-036 and FR-042 forbid this library from owning that logic anyway. What they cannot
do is be validated end to end, which the quickstart records as a known limit.

## Open items for the user, not blockers

Research surfaced two capabilities in `webchat-react` that this spec does not cover
and that look like omissions rather than deliberate exclusions: **calls to action**
(`CallToAction`) and **conversation starters** (`ConversationStarters`, with
`getStarters` and `clearStarters` already exposed by the service). Calls to action were
named explicitly as a required capability when this library was scoped.

Both are recorded in `PARITY.md` as open gaps, which satisfies FR-048. Neither is
added to scope here, because the spec is what decides scope. If they belong in this
feature, the spec needs an amendment before implementation reaches story 5.

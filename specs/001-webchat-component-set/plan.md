# Implementation Plan: CX Platform Webchat Component Set

**Branch**: `001-webchat-component-set` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-webchat-component-set/spec.md`

## Summary

Bootstrap `@weni/platform-webchat-components` from an empty repository and deliver
every block that appears inside a CX Platform webchat conversation: the thread and its
message forms in two presentations, the composer in two variants, per-message actions,
offerings and suggestions, the product set, the cart, and spoken mode. A service
adaptation layer sits behind a separate entry point.

The approach is presentational components driven entirely by props, reporting intents
through emits, accepting host content through named slots, and built from Unnnic
tokens. The conversation model is owned by this library and normalised, with one
adapter absorbing the service's inconsistencies. Composables live behind
`./composables` so that importing components never pulls `@weni/webchat-service` into
a consumer's graph.

Scope is drawn by a single rule: everything inside the chat is in, the widget shell is
out. That rule closed every open question about parity with the customer-facing
implementation, and it excluded conversation starters, which neither consuming product
needs.

## Technical Context

**Language/Version**: TypeScript 5.8 in strict mode, Vue 3 with Composition API and
`<script setup>`

**Primary Dependencies**: peers `vue@^3.4.8`, `@weni/unnnic-system@>=3.30.0 <4`,
`@weni/webchat-service@^1.10.3`; runtime `marked` and `dompurify` for sanitised
message text

**Storage**: none owned by this library. Any persistence takes a caller-supplied
namespace, per FR-021

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

**Scale/Scope**: ten public components, two public composables, two consuming
products, 28 in-scope `webchat-react` components at parity

Full reasoning for each choice, including alternatives rejected, is in
[research.md](./research.md). No NEEDS CLARIFICATION items remain.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

One deviation is recorded in Complexity Tracking; every other gate passes.

- [x] **I. UI only**: no transport, session, storage, queueing, history, encoding,
      cart math, or voice orchestration added to this repository. Line totals,
      subtotals, discounts, and spoken-mode phases all arrive as props, per FR-053 and
      FR-059. The two service gaps are recorded in the spec's Dependencies, and
      stories 7 and 8 are sequenced last so the logic lands in the service first.
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
      `expanded`, the two message arrangements are `bubble` and `assistant`, and the
      product set has `actionable` and `record` modes, each on one component. Host UI
      enters through `message-before`, `message-after`, `leading`, `trailing`, and
      `above`. No consuming product is named in any identifier, and no component
      branches on which application renders it. A whole-message override slot was
      deliberately left out; the reasoning is in the contract.
- [x] **V. Unnnic only**: every colour, space, radius, typography value, and shadow
      comes from Unnnic tokens through its `./tokens/*` subpath exports and SCSS entry.
      Unnnic *components* are used where the approved design is that component, which
      Code Connect confirms for button, chip, and icon. Where the design is bespoke,
      the block is built from tokens; research D9 records which and why. Principle V's
      "that fits" clause is what governs, and the design decides fit.
- [x] **VI. Versioned contract**: this is the initial `0.x` surface, so there is
      nothing to break yet. The versioning table in the contract fixes the rules going
      forward, including the one non-obvious case: a new required member of any
      `labels` object is MAJOR.
- [x] **VII. Parity tracked**: `PARITY.md` at bootstrap classifies all 45
      `webchat-react` components against the scope rule. With the rule applied there
      are no open gaps, which is what makes SC-011 checkable.
- [x] **VIII. Tests**: every component ships tests for each variant and each slot
      contract; composables ship tests for mount, teardown, and two concurrent
      instances against a stubbed service. Named test targets are in the quickstart.
- [ ] **Constraints**: no hardcoded user-facing copy, no router or store dependency,
      no new runtime dependency that Unnnic or the service already covers.

The final gate is the one that does not pass cleanly. Copy, router, and store are all
satisfied: wording arrives through required `labels` objects, which makes a missing
label a compile error rather than a review catch, and nothing depends on a router or
store. The dependency clause is where the deviation sits, recorded below.

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
│   ├── PwcThread/            # thread, scroll anchoring, indicators
│   ├── PwcMessage/           # bubble and assistant presentations, all message kinds
│   ├── PwcMessageActions/    # copy, send, rate
│   ├── PwcComposer/          # compact and expanded variants
│   ├── PwcSuggestions/       # standalone attendant suggestions
│   ├── PwcProductSet/        # horizontal product cards, actionable or record
│   ├── PwcProductDetail/     # one product expanded
│   ├── PwcCart/              # cart panel, lines, summary, submission
│   ├── PwcCartIndicator/     # item count, opens the cart
│   └── PwcVoicePanel/        # spoken mode presentation
├── composables/
│   ├── useWebchatService.ts  # the only service-aware module
│   ├── fromServiceMessage.ts # normalisation, publicly exported
│   └── index.ts              # the ./composables entry point
├── internal/
│   ├── useThreadScroll.ts    # anchoring; not part of the public contract
│   └── renderMessageText.ts  # markdown with sanitisation
├── types/
│   └── index.ts              # the owned conversation model
├── styles/
│   └── tokens.scss           # Unnnic token usage; no literal values
└── index.ts                  # the public contract

.storybook/                   # catalogue and usage documentation
PARITY.md                     # webchat-react parity tracking
.changeset/                   # unreleased notes; CHANGELOG.md is generated on version
```

Tests are colocated with the unit under test, for example
`src/components/PwcThread/__tests__/PwcThread.spec.ts`. Each component directory also
holds its stories and its documentation page, since FR-066 requires the catalogue to
explain use and not only display state.

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
| Two runtime dependencies, `marked` and `dompurify`, against the near-zero guidance in the constitution's Technology and Dependency Constraints | Agents already emit formatted text, and the customer-facing implementation already renders it with these exact two libraries. Unnnic has no markdown renderer and the service does not format text, so nothing in the existing stack covers the need. FR-011 additionally requires neutralising executable markup, which is a security requirement rather than a formatting nicety. | Pushing formatting to each consumer through a slot recreates the duplication this library exists to remove, and duplicates the sanitisation decision, which is the part with security consequences. Rendering plain text only is a capability regression. A local sanitiser is a well-known source of injection bugs and is not what the constitution means by a small local utility. |

## Sequencing

Story priority from the spec drives order, with two adjustments: bootstrap comes first
because the repository has no build, and most components are **extracted** rather than
written, because `chats-webapp`'s `staging` branch already ships around twenty of them
in the target stack. Research D13 records what exists and what extraction still has to
change.

Extraction is not copying. Each component needs the same four adaptations: wording
moves from `$t(...)` calls to required `labels` props, the transport types give way to
the owned model, product-specific names generalise into presentations, and the Agent
Builder variants get added. A task that extracts a component is not done until those
four are true of it.

Three components need more than that, and reading them changed the effort estimate.
The composer holds its own draft, validates files itself, and raises a global alert,
all of which have to come apart before FR-030 and FR-001 hold. The cart **computes its
line totals locally**, which Principle I forbids here, so that arithmetic moves to
`@weni/webchat-service` instead of coming across. And the thread's scroll behaviour is
half present: `useAutoScroll.ts` handles auto-advance and a return-to-newest control,
but nothing anywhere preserves the reading position when earlier history is prepended.
Research D13 tabulates this per component.

`@weni/webchat-service` itself needs two additions before stories 7 and 8 can be
wired up, specified in
[contracts/service-requirements.md](./contracts/service-requirements.md).

1. **Bootstrap** — `package.json`, Vite library mode, Vitest, ESLint, Storybook with
   documentation pages, `PARITY.md`, Changesets, the owned model in `src/types/`,
   the Unnnic token layer, and CI.
2. **US1, thread and messages** (P1) — the model, every message kind, both
   presentations, indicators, scroll anchoring, sanitised text.
3. **US2, composer** (P2) — both variants, capabilities, audio and camera recording
   presentation.
4. **US3, independence** (P3) — the multi-instance and teardown guarantees, plus
   `useWebchatService` and the shared-composer scenario.
5. **US4, host content** (P4) — the two message slots.
6. **US5, offerings and actions** (P5) — preset replies, options, suggestions, calls
   to action, and per-message copy, send, and rating.
7. **US6, products** (P6) — the product set in both modes, standalone and inside a
   message, plus product detail and inline presentation.
8. **US7, cart** (P7) — indicator, lines, steppers, summary, submission. Blocked on
   cart behaviour landing in the service.
9. **US8, spoken mode** (P8) — blocked on voice session behaviour landing in the
   service.

Steps 8 and 9 can be built as presentation ahead of their service dependencies, since
FR-053 and FR-059 forbid this library from owning that logic anyway. What they cannot
do is be validated end to end, which the quickstart records as a known limit.

Story 6 must precede story 7 even though products are lower value on their own,
because the cart reuses the product card and the line presentation.

## Decisions taken during planning

Three things changed shape once the approved designs and the scope rule were applied.
They are recorded here because each reverses an earlier decision in this plan's own
history.

**Unnnic is a token source first.** An earlier draft proposed composing thirteen
Unnnic primitives. The designs showed that inverted: they are built from Unnnic
variables throughout, but Code-Connect to only three Unnnic components. The carousel
in particular is a bespoke product-card strip, not `unnnicCarousel`. Principle V's
"that fits" clause is what resolves this, and research D9 records each case.

**Conversation starters are out.** They were added to scope in the previous round as
"opening prompts", with requirements and a component. Neither consuming product needs
them, so they are removed rather than built unused. Camera recording moved the other
way: previously excluded for want of a design, now included because it is inside the
chat and the service already supports it.

**The designs added four capabilities the spec had missed**: per-message actions,
a second message presentation, the product set living inside a message, and the cart
being a panel with a count indicator and a summary rather than a flat list. Research
D12 records what each came from.

## Questions closed by reading the existing code

Three open items from the previous round are resolved, none by guessing.

**Message width** is 75% of the thread, the same for both directions. `chats-webapp`
already uses that value, and it is what the Figma pixel measurements approximate on
the frame they were drawn in, so the 360-against-350 difference was mock noise rather
than intent. Research D14 has the reasoning, including why 90% was not chosen.

**Audio recording** does not use `unnnicAudioRecorder`. `chats-webapp` ships
`AudioRecordingBar.vue`, a bespoke timer with a pulsing indicator and a discard
control, built from Unnnic tokens. That is the behaviour carried over.

**The product set has no item limit.** Neither the customer-facing implementation nor
Live Desk's carousel caps anything. The ten-item annotation in Figma is WhatsApp's
delivery limit, which constrains whoever composes the outbound message, not a
component that displays a set. FR-046 now says the set renders everything supplied.

## Remaining risks

`staging` is under continuous delivery, so the extraction base moves while this work
happens. The mitigation is to extract early and in one pass per component rather than
letting the library and the branch drift, and it is an argument for starting with the
components Live Desk is least likely to keep changing.

The cart is the sharper risk. Its arithmetic lives in the component today, so
extracting it is blocked on the service gaining that behaviour, and shipping the cart
presentation before then would leave a component that cannot be wired up. Story 7
already sits behind that dependency, but it is worth naming that the dependency is now
evidenced rather than assumed: `Cart.vue` computes line totals in a local helper.

One open item for the design of the composer: `chats-webapp` puts attachment and audio
recording behind one popover menu, while the Agent Builder design shows them as two
adjacent buttons separated by a divider. Both are approved in their own product, so
this is a genuine variant difference rather than a mistake, and it is resolved when
story 2 reconciles the two arrangements.

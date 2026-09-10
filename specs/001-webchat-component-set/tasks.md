---
description: "Task list for the CX Platform Webchat Component Set"
---

# Tasks: CX Platform Webchat Component Set

**Input**: Design documents from `/specs/001-webchat-component-set/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: REQUIRED. Constitution Principle VIII mandates that every new or changed
component and composable ships tests in the same change, covering each variant, each
slot contract, and concurrent-instance behaviour. Test-first authoring is not enforced.

**Organization**: Tasks are grouped by user story so each can be implemented and
tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story the task belongs to
- Exact file paths are included in every task

## A note on extraction

Most components are **extracted** from `chats-webapp`'s `staging` branch rather than
written from scratch, per research D13. Tasks that extract name their source. An
extraction task is not complete until all four adaptations hold for the component:

1. No `$t(...)` call remains; wording arrives through a required `labels` prop.
2. No import from `@/services/assistant/types`; the owned model is used instead.
3. No consuming product is named in an identifier; differences are variants.
4. The Agent Builder arrangement is supported, not only the Live Desk one.

Source paths are relative to `chats-webapp` at
`src/components/chats/ContactInfo/Redesign/DeskCopilot/`, abbreviated below as
`«copilot»`, and `src/composables/assistant/`, abbreviated as `«composables»`.

## Path conventions

Component code in `src/components/<Name>/<Name>.vue`, tests in
`src/components/<Name>/__tests__/<Name>.spec.ts`, stories in
`src/components/<Name>/<Name>.stories.ts`, usage documentation in
`src/components/<Name>/<Name>.mdx`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Turn an empty repository into one that builds, tests, lints, and publishes

- [ ] T001 Create `package.json` with name `@weni/platform-webchat-components`, ESM `exports` map for `.`, `./composables`, and `./style.css`, peers `vue@^3.4.8`, `@weni/unnnic-system@>=3.30.0 <4`, `@weni/webchat-service@^1.10.3`, runtime deps `marked` and `dompurify`, and `engines.node >=22.12.0`
- [ ] T002 Configure Vite library mode in `vite.config.ts` with all three peers externalised and ESM output only
- [ ] T003 [P] Configure strict TypeScript in `tsconfig.json` and declaration emit via `vue-tsc` in the build script
- [ ] T004 [P] Configure ESLint with `@weni/eslint-config` and Prettier in `eslint.config.js`
- [ ] T005 [P] Configure Vitest with `@vue/test-utils`, `jsdom`, and `@vitest/coverage-istanbul` in `vitest.config.ts`
- [ ] T006 [P] Add `vitest-axe` and register its matchers in `vitest.setup.ts`
- [ ] T007 Configure Storybook with the Vite builder and `@storybook/addon-a11y` in `.storybook/main.ts`, loading Unnnic styles in `.storybook/preview.ts`
- [ ] T008 [P] Create `CHANGELOG.md` seeded with the unreleased section required by Principle VI
- [ ] T009 [P] Create `PARITY.md` classifying all 45 `webchat-react` components as in scope, widget shell, conversation starters, or generic primitive, per research D10
- [ ] T010 Add CI workflow running lint, typecheck, test, and build in `.github/workflows/ci.yml`

**Checkpoint**: `npm run build`, `npm test`, `npm run lint`, and `npm run dev` all succeed on an empty source tree

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The owned model, the token layer, and the boundary enforcement that every story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T011 Define the complete conversation model in `src/types/index.ts`: `Message` discriminated union with all ten kinds, `MessageBase`, `MessageDirection`, `DeliveryState`, `MessagePresentation`, `MessageActions`, `MessageRating`, `Thread`, `PeerActivity`, `HistoryState`, `PresetReply`, `ReplyOption`, `Suggestion`, `CallToAction`, `Product`, `ProductSection`, `ProductSetMode`, `CartLine`, `CartQuantities`, `CartSummary`, `Cart`, `ComposerVariant`, `ComposerCapabilities`, `RecordingState`, `AgentConfigOption`, `VoicePhase`, `VoiceState`, `StorageNamespace`, per [data-model.md](./data-model.md)
- [ ] T012 [P] Create the Unnnic token layer in `src/styles/tokens.scss`, importing `@weni/unnnic-system/src/assets/scss/unnnic.scss` and exposing nothing of its own
- [ ] T013 [P] Create the public entry point `src/index.ts` exporting types only, to be extended per story
- [ ] T014 [P] Create the composables entry point `src/composables/index.ts`, empty of implementation for now
- [ ] T015 Add an ESLint `no-restricted-imports` rule forbidding anything under `src/components/**` from importing `@weni/webchat-service`, enforcing Principle II by the module graph
- [ ] T016 [P] Create the stubbed service test double in `src/test/stubService.ts`, exposing `on`, `off`, `getState`, `getMessages`, and a listener count for teardown assertions
- [ ] T017 [P] Create sentinel label fixtures in `src/test/labels.ts` so SC-006 can assert that no text outside the sentinels renders
- [ ] T018 [P] Create the Storybook documentation page template in `.storybook/DocsPage.mdx` covering purpose, props, events, slots, and a copyable integration example, as FR-066 requires

**Checkpoint**: Model compiles under strict mode, the boundary lint rule fails a deliberate violation, and the doc template renders

---

## Phase 3: User Story 1 - Read a conversation (Priority: P1) 🎯 MVP

**Goal**: A full conversation renders: every message form in either presentation, indicators, delivery states, formatted text, history loading, and scroll behaviour

**Independent Test**: Supply a fixed set of messages covering every form in both presentations and verify each renders legibly in order with correct attribution, timestamp, and delivery state, with no composer or other block mounted

### Tests for User Story 1

- [ ] T019 [P] [US1] Test message ordering, sender distinction, duplicate-`id` deduplication, grouping of consecutive same-sender messages, and the absence of date separators in `src/components/PwcThread/__tests__/PwcThread.spec.ts`
- [ ] T020 [P] [US1] Test that content capable of executing renders inert: formatted text with executing markup neutralised in `src/internal/__tests__/renderMessageText.spec.ts`, and a URL whose scheme is neither `http` nor `https` rejected as non-activatable in `src/internal/__tests__/isActivatableUrl.spec.ts`
- [ ] T021 [P] [US1] Test every message kind including `unsupported` and empty content in `src/components/PwcMessage/__tests__/PwcMessage.kinds.spec.ts`
- [ ] T022 [P] [US1] Test both presentations render the same message data differently in `src/components/PwcMessage/__tests__/PwcMessage.presentation.spec.ts`
- [ ] T023 [P] [US1] Test pending, delivered, read, and failed delivery states, and that none of the indicators is interactive, in `src/components/PwcMessage/__tests__/PwcMessage.delivery.spec.ts`
- [ ] T024 [P] [US1] Test that streaming text grows without remounting the message, asserting instance identity is preserved, in `src/components/PwcMessage/__tests__/PwcMessage.streaming.spec.ts`
- [ ] T025 [P] [US1] Test auto-advance within threshold, no movement when scrolled back, wheel-up leaving the bottom immediately, and reading-position preservation on history prepend in `src/internal/__tests__/useThreadScroll.spec.ts`
- [ ] T026 [P] [US1] Test composing and working indicators are distinct and mutually exclusive in `src/components/PwcThread/__tests__/PwcThread.indicators.spec.ts`
- [ ] T027 [P] [US1] Test that `request-earlier` fires once at the start of loaded history and that loading is presented in `src/components/PwcThread/__tests__/PwcThread.history.spec.ts`
- [ ] T028 [P] [US1] Axe assertions for the thread in both presentations in `src/components/PwcThread/__tests__/PwcThread.a11y.spec.ts`

### Implementation for User Story 1

- [ ] T029 [P] [US1] Implement sanitised formatted-text rendering with `marked` and `dompurify` in `src/internal/renderMessageText.ts`, and the shared scheme guard permitting only `http` and `https` in `src/internal/isActivatableUrl.ts`, used by every URL-bearing element per FR-011
- [ ] T030 [P] [US1] Extract the audio message presentation from `«copilot»/assistant/media/AudioMessage.vue` into `src/components/PwcMessage/parts/MessageAudio.vue`
- [ ] T031 [P] [US1] Extract the image message presentation from `«copilot»/assistant/media/ImageMessage.vue` into `src/components/PwcMessage/parts/MessageImage.vue`, adding the load-failure state
- [ ] T032 [P] [US1] Extract the document message presentation from `«copilot»/assistant/media/FileMessage.vue` into `src/components/PwcMessage/parts/MessageDocument.vue`
- [ ] T033 [P] [US1] Implement the video message presentation in `src/components/PwcMessage/parts/MessageVideo.vue`, referencing `webchat-react`'s `MessageVideo.jsx` since no approved design covers it
- [ ] T034 [P] [US1] Implement the location message presentation in `src/components/PwcMessage/parts/MessageLocation.vue`, referencing `webchat-react` behaviour
- [ ] T035 [P] [US1] Implement the placed-order message presentation in `src/components/PwcMessage/parts/MessageOrder.vue`, referencing `webchat-react`'s `MessageOrder.jsx`, displaying supplied totals without arithmetic
- [ ] T036 [P] [US1] Implement the unrecognised-form presentation in `src/components/PwcMessage/parts/MessageUnsupported.vue`, preserving the message's position in the thread
- [ ] T037 [US1] Implement `src/components/PwcMessage/PwcMessage.vue` merging `«copilot»/assistant/AiMessage.vue` and `HumanMessage.vue` into the `assistant` and `bubble` presentations, with a 75% width cap on both directions and the asymmetric corner, dispatching to the parts from T030 to T036 (depends on T029 to T036)
- [ ] T038 [US1] Add delivery state and timestamp presentation to `src/components/PwcMessage/PwcMessage.vue`, which neither source component has
- [ ] T039 [P] [US1] Extract the composing indicator from `«copilot»/assistant/TypingIndicator.vue` into `src/components/PwcThread/parts/ComposingIndicator.vue`
- [ ] T040 [P] [US1] Extract the working indicator from `«copilot»/assistant/ThinkingIndicator.vue` into `src/components/PwcThread/parts/WorkingIndicator.vue`
- [ ] T041 [US1] Extract scroll behaviour from `«composables»/useAutoScroll.ts` into `src/internal/useThreadScroll.ts`, keeping the programmatic-scroll flag, the wheel-up gesture handling, the 100px threshold, and the return-to-newest control, and **adding** reading-position preservation on history prepend, which no existing implementation has
- [ ] T042 [US1] Implement `src/components/PwcThread/PwcThread.vue` from `«copilot»/assistant/AssistantMessageList.vue`, adding the scroll container, the `UnnnicSkeletonLoading` history placeholders, the empty state, the return-to-newest control, and the `request-earlier` emit (depends on T037, T039, T040, T041)
- [ ] T043 [US1] Export `PwcThread`, `PwcMessage`, and their label types from `src/index.ts`
- [ ] T044 [P] [US1] Write stories covering every message kind, both presentations, and every delivery state in `src/components/PwcMessage/PwcMessage.stories.ts`
- [ ] T045 [P] [US1] Write stories covering empty, loading, indicators, and a long conversation in `src/components/PwcThread/PwcThread.stories.ts`
- [ ] T046 [P] [US1] Write usage documentation in `src/components/PwcThread/PwcThread.mdx` and `src/components/PwcMessage/PwcMessage.mdx`

**Checkpoint**: A conversation renders end to end from supplied data, independently testable and reviewable in Storybook

---

## Phase 4: User Story 2 - Send a message (Priority: P2)

**Goal**: A composer in two variants that reports sending, attaching, and recording as intents

**Independent Test**: Mount the composer alone in each variant, type a message, and verify the send intent fires once with the typed content and each variant shows exactly the controls its design specifies

### Tests for User Story 2

- [ ] T047 [P] [US2] Test that `send` fires once with trimmed text and never for empty or whitespace-only content in `src/components/PwcComposer/__tests__/PwcComposer.spec.ts`
- [ ] T048 [P] [US2] Test that the text is controlled through `v-model` and that the parent can clear it, in `src/components/PwcComposer/__tests__/PwcComposer.controlled.spec.ts`
- [ ] T049 [P] [US2] Test each variant shows exactly its specified controls and that `capabilities` disables independently of variant in `src/components/PwcComposer/__tests__/PwcComposer.variants.spec.ts`
- [ ] T050 [P] [US2] Test that a line break grows the field to the bounded height without sending in `src/components/PwcComposer/__tests__/PwcComposer.autogrow.spec.ts`
- [ ] T051 [P] [US2] Test that every message-producing control is unavailable while `disabled` in `src/components/PwcComposer/__tests__/PwcComposer.disabled.spec.ts`
- [ ] T052 [P] [US2] Test the audio recording bar presents elapsed time and reports both finish and discard in `src/components/PwcComposer/__tests__/AudioRecordingBar.spec.ts`
- [ ] T053 [P] [US2] Test camera recording presents its capture and reports finish and discard in `src/components/PwcComposer/__tests__/CameraRecording.spec.ts`
- [ ] T054 [P] [US2] Test that oversized and disallowed files emit a rejection intent rather than raising an alert, in `src/components/PwcComposer/__tests__/PwcComposer.attach.spec.ts`
- [ ] T055 [P] [US2] Axe assertions for both composer variants in `src/components/PwcComposer/__tests__/PwcComposer.a11y.spec.ts`

### Implementation for User Story 2

- [ ] T056 [P] [US2] Extract the recording bar from `«copilot»/assistant/AudioRecordingBar.vue` into `src/components/PwcComposer/parts/AudioRecordingBar.vue`, keeping the pulsing indicator and the `mm:ss` timer
- [ ] T057 [P] [US2] Implement camera recording presentation in `src/components/PwcComposer/parts/CameraRecording.vue`, referencing `webchat-react`'s `CameraRecording.jsx` since no approved design covers it
- [ ] T058 [US2] Implement `src/components/PwcComposer/PwcComposer.vue` from `«copilot»/assistant/AssistantInput.vue`, keeping the state-swapping structure, converting the internal draft to a controlled `v-model`, and replacing the `UnnnicCallAlert` file validation with an emitted rejection intent (depends on T056, T057)
- [ ] T059 [US2] Add the `expanded` variant to `src/components/PwcComposer/PwcComposer.vue`: adjacent mic and attach buttons with a divider instead of the popover menu, the agent-configuration selector, and the emphasised voice affordance, per the Agent Builder design
- [ ] T060 [US2] Export `PwcComposer` and its label and capability types from `src/index.ts`
- [ ] T061 [P] [US2] Write stories for both variants, every capability combination, both recording states, and the disabled state in `src/components/PwcComposer/PwcComposer.stories.ts`
- [ ] T062 [P] [US2] Write usage documentation in `src/components/PwcComposer/PwcComposer.mdx`

**Checkpoint**: Both composer variants work standalone and match their approved designs

---

## Phase 5: User Story 3 - Show several conversations at once (Priority: P3)

**Goal**: Unbounded independent instances on one screen, clean teardown, and one composer able to drive several conversations

**Independent Test**: Mount three conversation surfaces with disjoint message sets, drive each independently, verify no leakage, then unmount one and verify the others are unaffected

### Tests for User Story 3

- [ ] T063 [P] [US3] Test three simultaneous threads with disjoint messages, indicators, and persisted values show zero leakage in `src/components/PwcThread/__tests__/PwcThread.multiInstance.spec.ts`
- [ ] T064 [P] [US3] Test that unmounting removes every listener, timer, and observer, asserting the stub's listener count returns to its pre-mount value, in `src/composables/__tests__/useWebchatService.teardown.spec.ts`
- [ ] T065 [P] [US3] Test two concurrent `useWebchatService` calls share no state in `src/composables/__tests__/useWebchatService.concurrent.spec.ts`
- [ ] T066 [P] [US3] Test one composer driving two threads, each tracking its own delivery state, in `src/composables/__tests__/sharedComposer.spec.ts`
- [ ] T067 [P] [US3] Test that switching a surface to a different conversation leaves no residue of the previous one in `src/components/PwcThread/__tests__/PwcThread.switch.spec.ts`
- [ ] T068 [P] [US3] Test the service adapter against every inconsistency tabulated in the data model, including `id`/`ID`, the four direction spellings, the string order timestamp, the undeclared `order` kind, and the undeclared `cta_message`, in `src/composables/__tests__/fromServiceMessage.spec.ts`

### Implementation for User Story 3

- [ ] T069 [US3] Implement the service message adapter in `src/composables/fromServiceMessage.ts`, accepting `unknown` and validating, per the adaptation table in [data-model.md](./data-model.md)
- [ ] T070 [US3] Implement `src/composables/useWebchatService.ts` taking a caller-supplied service instance and optional `storageNamespace`, returning read-only `thread` and `connection` plus the action set, removing every subscription in `onUnmounted` and exposing `dispose` (depends on T069)
- [ ] T071 [US3] Export both composables from `src/composables/index.ts` and verify the `.` entry point pulls no service import, per T015
- [ ] T072 [P] [US3] Write a story mounting three independent threads side by side in `src/components/PwcThread/PwcThread.multiInstance.stories.ts`
- [ ] T073 [P] [US3] Write a story mounting two threads driven by one shared composer in `src/components/PwcComposer/PwcComposer.shared.stories.ts`

**Checkpoint**: The scenario the library exists for, two previews driven by one input, works and is proven by test

---

## Phase 6: User Story 4 - Add product-specific content to a message (Priority: P4)

**Goal**: A consuming product can place its own content above and below any individual message

**Independent Test**: Supply host content for messages matching a chosen condition and verify it appears for exactly those messages, receives the message, and reserves no space when absent

### Tests for User Story 4

- [ ] T074 [P] [US4] Test that `message-before` and `message-after` render for exactly the matching messages, receive the message in slot scope, and reserve no space when absent, in `src/components/PwcThread/__tests__/PwcThread.slots.spec.ts`
- [ ] T075 [P] [US4] Test that expanding host content above a message does not disturb the reading position of that message in `src/components/PwcThread/__tests__/PwcThread.slotGrowth.spec.ts`

### Implementation for User Story 4

- [ ] T076 [US4] Add the `message-before` and `message-after` scoped slots to `src/components/PwcThread/PwcThread.vue`, forwarding the message in slot scope
- [ ] T077 [US4] Make `src/internal/useThreadScroll.ts` tolerate content height changes from host slots without losing the anchored message
- [ ] T078 [P] [US4] Write a story standing in for Agent Builder's execution trace, using `UnnnicCollapse` above agent messages, in `src/components/PwcThread/PwcThread.hostContent.stories.ts`

**Checkpoint**: Agent Builder can adopt the thread without any change to the shared blocks

---

## Phase 7: User Story 5 - Act on what the conversation offers (Priority: P5)

**Goal**: Preset replies, options, suggestions, calls to action, and per-message copy, send, and rating

**Independent Test**: Supply each offering shape, activate one in each, and verify the correct choice is reported exactly once, distinguishing send-immediately from edit-first and message-sending from leaving the conversation

### Tests for User Story 5

- [ ] T079 [P] [US5] Test preset reply selection reports the chosen reply once in `src/components/PwcMessage/__tests__/PwcMessage.presetReplies.spec.ts`
- [ ] T080 [P] [US5] Test option list selection reports the option and closes the list in `src/components/PwcMessage/__tests__/PwcMessage.options.spec.ts`
- [ ] T081 [P] [US5] Test suggestions distinguish send-immediately from edit-first and that long wording wraps rather than clipping in `src/components/PwcSuggestions/__tests__/PwcSuggestions.spec.ts`
- [ ] T082 [P] [US5] Test the call to action renders as a real link opening in a new context, also emits activation, and does neither while disabled, without a destination, or with a scheme other than `http` or `https`, in `src/components/PwcMessage/__tests__/PwcMessage.callToAction.spec.ts`
- [ ] T083 [P] [US5] Test each message action renders only when its flag is set, that the row collapses otherwise, that copy carries the text, and that a supplied rating shows as chosen, in `src/components/PwcMessageActions/__tests__/PwcMessageActions.spec.ts`
- [ ] T084 [P] [US5] Axe assertions for suggestions and message actions in `src/components/PwcSuggestions/__tests__/PwcSuggestions.a11y.spec.ts`

### Implementation for User Story 5

- [ ] T085 [P] [US5] Implement preset replies in `src/components/PwcMessage/parts/PresetReplies.vue` using `UnnnicChip`, referencing `webchat-react`'s `QuickReplies.jsx`
- [ ] T086 [P] [US5] Implement the selectable option list in `src/components/PwcMessage/parts/ReplyOptions.vue`, referencing `webchat-react`'s `ListMessage.jsx`
- [ ] T087 [P] [US5] Implement the call to action in `src/components/PwcMessage/parts/CallToAction.vue` as a link that also emits, referencing `webchat-react`'s `CallToAction.jsx`
- [ ] T088 [P] [US5] Extract suggestions from `«copilot»/assistant/SuggestionChips.vue` into `src/components/PwcSuggestions/PwcSuggestions.vue`, adding the edit-first intent alongside send-immediately
- [ ] T089 [US5] Implement `src/components/PwcMessageActions/PwcMessageActions.vue` from the actions row in `«copilot»/assistant/AiMessage.vue`, moving the rating out of local state into a supplied prop and turning the clipboard write into an emitted intent
- [ ] T090 [US5] Wire the parts from T085 to T089 into `src/components/PwcMessage/PwcMessage.vue` and re-emit their intents from `src/components/PwcThread/PwcThread.vue` with the message identity attached
- [ ] T091 [US5] Export `PwcSuggestions` and `PwcMessageActions` from `src/index.ts`
- [ ] T092 [P] [US5] Write stories for every offering shape and every message-action combination in `src/components/PwcSuggestions/PwcSuggestions.stories.ts` and `src/components/PwcMessageActions/PwcMessageActions.stories.ts`
- [ ] T093 [P] [US5] Write usage documentation in `src/components/PwcSuggestions/PwcSuggestions.mdx` and `src/components/PwcMessageActions/PwcMessageActions.mdx`

**Checkpoint**: The Copilot is usable: an attendant can act on what the assistant offers

---

## Phase 8: User Story 6 - Browse and choose products (Priority: P6)

**Goal**: A product set that works inside a message and standalone, in actionable and record modes

**Independent Test**: Supply products with and without images and promotional prices, in both modes, and verify each card presents correctly, paging works, and actions are reported only in the actionable mode

### Tests for User Story 6

- [ ] T094 [P] [US6] Test card presentation for missing image, promotional price, and over-long name in `src/components/PwcProductSet/__tests__/ProductCard.spec.ts`
- [ ] T095 [P] [US6] Test paging controls appear only on overflow and each hides at its own edge in `src/components/PwcProductSet/__tests__/PwcProductSet.paging.spec.ts`
- [ ] T096 [P] [US6] Test `actionable` reports add, remove, increment, and decrement while `record` offers no action at all, in `src/components/PwcProductSet/__tests__/PwcProductSet.modes.spec.ts`
- [ ] T097 [P] [US6] Test that every product supplied is reachable with no cap applied in `src/components/PwcProductSet/__tests__/PwcProductSet.noLimit.spec.ts`
- [ ] T098 [P] [US6] Test the same component renders inside a message and standalone with only its mode differing, satisfying SC-012, in `src/components/PwcProductSet/__tests__/PwcProductSet.reuse.spec.ts`
- [ ] T099 [P] [US6] Test that unmounting removes the scroll listener, the resize listener, and the `ResizeObserver` in `src/components/PwcProductSet/__tests__/PwcProductSet.teardown.spec.ts`
- [ ] T100 [P] [US6] Test sections, inline product, and expanded detail in `src/components/PwcProductDetail/__tests__/PwcProductDetail.spec.ts`

### Implementation for User Story 6

- [ ] T101 [P] [US6] Extract the quantity stepper from `«copilot»/assistant/ProductQuantityControls.vue` into `src/components/PwcProductSet/parts/QuantityControls.vue`
- [ ] T102 [P] [US6] Extract the product card from `«copilot»/assistant/ProductCarouselCard.vue` into `src/components/PwcProductSet/parts/ProductCard.vue`, adding the record mode that renders no actions
- [ ] T103 [US6] Extract the product set from `«copilot»/assistant/ProductCarousel.vue` into `src/components/PwcProductSet/PwcProductSet.vue`, keeping the scroll-state syncing, hover-revealed paging, and full `onUnmounted` teardown, and replacing the `getQuantity` function prop with the `CartQuantities` record (depends on T101, T102)
- [ ] T104 [P] [US6] Extract titled sections from `«copilot»/assistant/ProductListSections.vue` into `src/components/PwcProductSet/parts/ProductSections.vue`
- [ ] T105 [P] [US6] Implement the inline product presentation in `src/components/PwcProductSet/parts/InlineProduct.vue`, referencing `webchat-react`'s `InlineProduct.jsx`
- [ ] T106 [US6] Implement `src/components/PwcProductDetail/PwcProductDetail.vue`, referencing `webchat-react`'s `ProductDetails.jsx`
- [ ] T107 [US6] Wire the product set into the `products` message kind in `src/components/PwcMessage/PwcMessage.vue` and re-emit its intents from the thread (depends on T103)
- [ ] T108 [US6] Export `PwcProductSet` and `PwcProductDetail` from `src/index.ts`
- [ ] T109 [P] [US6] Write stories for both modes, sections, inline, detail, and a set large enough to page in `src/components/PwcProductSet/PwcProductSet.stories.ts`
- [ ] T110 [P] [US6] Write usage documentation in `src/components/PwcProductSet/PwcProductSet.mdx`

**Checkpoint**: Products work inside a message and standalone, proving the reuse FR-041 requires

---

## Phase 9: User Story 7 - Review and submit a cart (Priority: P7)

**Goal**: A cart indicator, a cart panel with lines and steppers, a supplied summary, and submission

**⚠️ BLOCKED**: Presentation can be built and reviewed now, but wiring requires the CartManager specified in [contracts/service-requirements.md](./contracts/service-requirements.md). No arithmetic may be written here.

**Independent Test**: Supply items with prices and discounts, exercise quantity changes and removal, and verify displayed values reflect exactly what was supplied and every change is reported

### Tests for User Story 7

- [ ] T111 [P] [US7] Test the indicator presents the count and reports the request to open in `src/components/PwcCartIndicator/__tests__/PwcCartIndicator.spec.ts`
- [ ] T112 [P] [US7] Test each line presents image, name, promotional price, quantity, and line total from supplied values in `src/components/PwcCart/__tests__/PwcCart.lines.spec.ts`
- [ ] T113 [P] [US7] Test that decrementing from one reports removal rather than a zero quantity in `src/components/PwcCart/__tests__/PwcCart.quantity.spec.ts`
- [ ] T114 [P] [US7] Test the summary displays supplied subtotal, discount, and total verbatim, **including when the total disagrees with the lines**, in `src/components/PwcCart/__tests__/PwcCart.summary.spec.ts`
- [ ] T115 [P] [US7] Test the empty state shows and submission is unavailable in `src/components/PwcCart/__tests__/PwcCart.empty.spec.ts`
- [ ] T116 [P] [US7] Axe assertions for the cart panel and indicator in `src/components/PwcCart/__tests__/PwcCart.a11y.spec.ts`

### Implementation for User Story 7

- [ ] T117 [P] [US7] Extract the indicator from `«copilot»/assistant/CartBadge.vue` into `src/components/PwcCartIndicator/PwcCartIndicator.vue`
- [ ] T118 [US7] Extract the cart panel from `«copilot»/Cart.vue` into `src/components/PwcCart/PwcCart.vue`, **removing the local line-total arithmetic** so every monetary value is supplied, and reusing the stepper from T101 (depends on T101, T117)
- [ ] T119 [US7] Export `PwcCart` and `PwcCartIndicator` from `src/index.ts`
- [ ] T120 [P] [US7] Write stories for empty, single line, promotional pricing, and a discounted summary in `src/components/PwcCart/PwcCart.stories.ts`
- [ ] T121 [P] [US7] Write usage documentation in `src/components/PwcCart/PwcCart.mdx`, stating plainly that all monetary values are supplied and none are computed

**Checkpoint**: The cart presents and reports correctly against supplied state; wiring waits on the service

---

## Phase 10: User Story 8 - Converse by voice (Priority: P8)

**Goal**: Spoken mode phases, partial transcript, input level, failure, and exit

**⚠️ BLOCKED**: Presentation can be built and reviewed now, but wiring requires the VoiceService specified in [contracts/service-requirements.md](./contracts/service-requirements.md). No capture, transcription, or synthesis may be written here.

**Independent Test**: Drive the block through every phase and failure state as supplied input and verify each is presented distinctly and that exit reports once from any phase

### Tests for User Story 8

- [ ] T122 [P] [US8] Test each phase presents distinctly and that only one is ever active in `src/components/PwcVoicePanel/__tests__/PwcVoicePanel.phases.spec.ts`
- [ ] T123 [P] [US8] Test the partial transcript is displayed and replaced as revised in `src/components/PwcVoicePanel/__tests__/PwcVoicePanel.transcript.spec.ts`
- [ ] T124 [P] [US8] Test the input level indication responds to supplied values in `src/components/PwcVoicePanel/__tests__/PwcVoicePanel.level.spec.ts`
- [ ] T125 [P] [US8] Test failures present the supplied reason and always offer a way out in `src/components/PwcVoicePanel/__tests__/PwcVoicePanel.failure.spec.ts`
- [ ] T126 [P] [US8] Test that exit reports exactly once from every phase in `src/components/PwcVoicePanel/__tests__/PwcVoicePanel.exit.spec.ts`
- [ ] T127 [P] [US8] Test that unmounting mid-session leaves no timer or animation frame running in `src/components/PwcVoicePanel/__tests__/PwcVoicePanel.teardown.spec.ts`

### Implementation for User Story 8

- [ ] T128 [P] [US8] Extract the voice affordance from `«copilot»/assistant/VoiceModeButton.vue` into `src/components/PwcComposer/parts/VoiceModeButton.vue`, supporting both the emphasised and outlined presentations
- [ ] T129 [P] [US8] Implement the input level visualisation in `src/components/PwcVoicePanel/parts/InputLevel.vue`, referencing `webchat-react`'s `WaveformVisualizer.jsx`
- [ ] T130 [US8] Extract the panel from `«copilot»/assistant/VoiceModePanel.vue` into `src/components/PwcVoicePanel/PwcVoicePanel.vue`, driven entirely by the supplied `VoiceState` (depends on T129)
- [ ] T131 [US8] Extract the failure presentation from `«copilot»/assistant/VoiceModeError.vue` into `src/components/PwcVoicePanel/parts/VoiceFailure.vue`, taking the reason as supplied data rather than carrying wording
- [ ] T132 [US8] Wire the panel, failure, and button into the composer's state swap in `src/components/PwcComposer/PwcComposer.vue` (depends on T128, T130, T131)
- [ ] T133 [US8] Export `PwcVoicePanel` from `src/index.ts`
- [ ] T134 [P] [US8] Write stories for every phase and failure state in `src/components/PwcVoicePanel/PwcVoicePanel.stories.ts`
- [ ] T135 [P] [US8] Write usage documentation in `src/components/PwcVoicePanel/PwcVoicePanel.mdx`

**Checkpoint**: Every block in the set exists, is documented, and is reviewable

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: The criteria that span the whole set

- [ ] T136 [P] Add the no-hardcoded-copy sweep asserting that every component rendered with sentinel labels shows no other text, satisfying SC-006, in `src/test/__tests__/noHardcodedCopy.spec.ts`
- [ ] T137 [P] Add the 500-message performance benchmark gating SC-007 in `src/components/PwcThread/__tests__/PwcThread.performance.spec.ts`
- [ ] T138 [P] Add a token sweep failing the build on any literal colour, pixel spacing, or radius in `src/**/*.vue`, enforcing FR-060
- [ ] T139 Verify the built package externalises all three peers and ships no copy of Vue, Unnnic, or the service, per the consumer smoke test in [quickstart.md](./quickstart.md)
- [ ] T140 Update `PARITY.md` marking every in-scope capability as delivered, satisfying SC-011
- [ ] T141 Write the integration guide in `README.md` covering installation, the two entry points, and a first-screen example, supporting SC-005
- [ ] T142 Write the `0.1.0` entry in `CHANGELOG.md` and tag the release, per Principle VI
- [ ] T143 Run the full [quickstart.md](./quickstart.md) validation and record the result for each success criterion

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies, starts immediately
- **Foundational (Phase 2)**: depends on Setup, **blocks every user story**
- **US1 (Phase 3)**: depends on Foundational
- **US2 (Phase 4)**: depends on Foundational; independent of US1
- **US3 (Phase 5)**: depends on US1 and US2, because its guarantees are about those blocks
- **US4 (Phase 6)**: depends on US1
- **US5 (Phase 7)**: depends on US1
- **US6 (Phase 8)**: depends on US1
- **US7 (Phase 9)**: depends on US6 for the stepper and card, **and on the service CartManager for wiring**
- **US8 (Phase 10)**: depends on US2 for the composer state swap, **and on the service VoiceService for wiring**
- **Polish (Phase 11)**: depends on every story intended for the release

### The two dependencies outside this repository

Stories 7 and 8 can be **built and reviewed** without the service work, because
FR-053 and FR-059 forbid this library from owning that logic anyway. They cannot be
**validated end to end** until [contracts/service-requirements.md](./contracts/service-requirements.md)
is satisfied. Start that work in parallel with Phase 1 if a second person is available;
it is on the critical path for a complete release and nothing here unblocks it.

### Parallel opportunities

- T003 through T006, T008, and T009 run in parallel within Setup
- T012, T013, T014, T016, T017, and T018 run in parallel within Foundational
- Every test task within a story is parallel, since each writes its own file
- T030 through T036 are parallel: seven independent message parts
- US2 can run alongside US1 once Foundational completes, since they share no file
- US4, US5, and US6 can run in parallel once US1 completes, though all three touch
  `PwcMessage.vue` at their integration step, so T090 and T107 must serialise

### Serialisation points worth watching

Three files are written by more than one story and must not be edited concurrently:
`src/components/PwcMessage/PwcMessage.vue` (T037, T038, T090, T107),
`src/components/PwcThread/PwcThread.vue` (T042, T076, T090), and `src/index.ts`
(T043, T060, T091, T108, T119, T133).

---

## Implementation Strategy

### MVP

Phases 1, 2, and 3. That delivers a conversation that renders every message form in
both presentations, which is immediately useful for reviewing an agent run and is the
foundation every other story builds on.

### First genuinely valuable increment

Add Phases 4 and 5. At that point Agent Builder's version comparison works: two
threads, one composer, independent delivery states. That is the scenario the library
was approved for, so it is the right moment to stop and validate with a real consumer.

### Then

Phase 6 unblocks Agent Builder's execution trace, Phase 7 makes the Copilot usable,
and Phase 8 completes commerce browsing. Phases 9 and 10 follow the service work.

### Parallel team strategy

With two people: one takes US1 and its dependents (US4, US5, US6), the other takes US2
and then the service work specified in `service-requirements.md`, which is the longest
pole and the only one that cannot be shortened from inside this repository.

---

## Notes

- Every task names its file, and every extraction task names its source.
- An extraction task is not done until all four adaptations listed at the top hold.
- Tests are required in the same change as the component, per Principle VIII.
- Commit per task or per logical group, using Conventional Commits with a scope.
- Stop at any checkpoint to validate a story independently.

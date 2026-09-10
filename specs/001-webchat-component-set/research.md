# Phase 0 Research: CX Platform Webchat Component Set

**Feature**: [spec.md](./spec.md) | **Date**: 2026-09-10

All decisions below were verified against the actual state of the surrounding
repositories rather than assumed. Where a fact could not be verified locally, that is
stated explicitly.

## Verified starting conditions

| Fact | Value | How verified |
|------|-------|--------------|
| This repository's source state | No `package.json`, no `src/`. Only `.specify`, `.cursor`, `specs`, `README.md` | Directory listing |
| Local toolchain | Node v22.12.0, npm 10.9.0 | `node --version`, `npm --version` |
| Unnnic version available | 3.30.0, ESM + UMD, ships `.d.ts` and token subpath exports | `node_modules/@weni/unnnic-system/package.json` |
| Agent Builder declares | `vue: 3.5.11`, `@weni/unnnic-system: ^3.30.0` | `package.json` |
| Live Desk declares | `vue: ^3.1.0`, `@weni/unnnic-system: ^3.24.3` | `package.json` |
| Either consumer declares the service | **No.** Neither lists `@weni/webchat-service` | `package.json` of both |
| Either consumer uses a component catalogue | **No.** No Storybook or Histoire in either | `devDependencies` of both |
| Consumer test stack | Vitest, `@vue/test-utils`, `@vitest/coverage-istanbul` in both | `devDependencies` of both |
| Registry | Public npm; no `.npmrc` in any repository | Filesystem check |
| `webchat-react` real package name | `@weni/webchat-template-react` v1.12.1-0 | `package.json` |
| `webchat-react` service pin | `@weni/webchat-service: 1.10.3`, pinned exactly | `peerDependencies` |

Two of these change the plan materially and are worth stating plainly. Neither
consumer has a component catalogue today, so introducing one is new tooling for the
team rather than an existing convention being followed. And neither consumer declares
the service in `main`, which matches what was said earlier about the Live Desk work
not having landed yet, but it means the composable layer has no consumer that can
integrate it on day one.

## D1: Repository bootstrap

**Decision**: Vite in library mode with `vue-tsc` for declarations, Vitest with
`@vue/test-utils` and `@vitest/coverage-istanbul`, `@weni/eslint-config` with
Prettier, scoped SCSS through `sass`. ESM-only output plus generated `.d.ts`. Node
pinned to `>=22.12.0` via `engines`.

**Rationale**: The constitution already fixes most of this. The one open choice was
the coverage provider, and istanbul was chosen over v8 because both consumers already
use `@vitest/coverage-istanbul`, so coverage numbers stay comparable across the three
repositories rather than shifting when a component moves between them.

**Alternatives considered**: Rollup, which is what `webchat-service` uses, was
rejected because Vite in library mode is Rollup underneath with the Vue SFC and SCSS
pipeline already wired. Rspack, which both consumers use for their applications, has
no comparable library-mode story and would need hand-built Vue SFC and declaration
steps.

## D2: Component catalogue

**Decision**: Storybook with the Vite builder, plus `@storybook/addon-a11y`.

**Rationale**: FR-047 requires every block to be inspectable in every variant and
state without running a consuming product, SC-009 requires design review against that
catalogue, and SC-005 requires a first integration to be possible from the catalogue
and docs alone. This library also has no host application to smoke-test it, which
Principle VIII names as the reason tests carry so much weight here. Storybook is the
only option that covers per-variant isolation, a11y feedback, and a browsable
reference in one tool.

**Alternatives considered**: Histoire is Vue-native and lighter, but its ecosystem has
stalled and it has no equivalent accessibility integration, which would leave SC-008
without authoring-time feedback. A plain Vite demo application costs no dependencies
but gives no per-variant isolation and would itself become an untested app to
maintain. Vitest browser-mode snapshots gate regressions but nobody can browse them,
so they fail FR-047 outright.

**Cost accepted**: this is new tooling for the team. It is confined to
`devDependencies` and never reaches published output, so it does not touch the
near-zero runtime dependency constraint.

## D3: Accessibility automation

**Decision**: `vitest-axe` assertions inside component tests as the CI gate, with
`@storybook/addon-a11y` for feedback while authoring.

**Rationale**: SC-008 demands that every block pass automated checks with no
violations, which needs a deterministic gate that fails a pull request. The Storybook
addon reports interactively and cannot fail CI on its own, so it complements rather
than replaces the test-level assertion.

**Alternatives considered**: Storybook test-runner against stories would reuse the
stories as the a11y corpus, which is appealing, but it requires a running browser in
CI and would make the a11y gate the slowest job in the pipeline for a library this
size. Revisit if story count grows past the point where duplicating cases in tests is
the larger cost.

## D4: Message text formatting

**Decision**: Adopt `marked` and `dompurify` as runtime dependencies, and render
message text as sanitised markdown.

**Rationale**: `webchat-react` already renders agent output as markdown using exactly
these two libraries, so agents emit markdown today. Not rendering it would be a
visible capability regression against the implementation this library must stay at
parity with. Unnnic has no markdown renderer and the service does not format text,
so nothing already in the stack covers this.

**Alternatives considered**: Pushing markdown rendering out to each consumer through a
slot was rejected because it recreates precisely the duplication this library exists
to remove, and worse, it duplicates the sanitisation decision, which is the part with
security consequences. Rendering plain text only was rejected as a capability
regression. Writing a local sanitiser was rejected outright; hand-rolled HTML
sanitisation is a well-known source of injection bugs and is not what the
constitution means by a small local utility.

**Recorded as a deviation**: this is the only planned departure from keeping runtime
dependencies near zero, and it is logged in the plan's Complexity Tracking so
reviewers see the reasoning rather than discovering two dependencies in a diff.

## D5: Conversation data contract

**Decision**: The library defines its own normalised message model as a discriminated
union keyed by message kind. The type surface is compile-time only, expressed as
string-literal unions, so no component imports a runtime value from the service. A
single adapter in the composable layer converts a service message into the model.

**Rationale**: This is the resolution already recorded as FR-004. The service's
published `Message` interface declares identity twice (`id` and `ID`, the latter
annotated as history compatibility), declares direction twice (a four-valued
`direction` covering two concepts, plus a separate `sender`), omits the `order` form
its own builders emit, declares `timestamp` as a number where `buildOrderMessage`
writes a string, and marks nearly every field optional. Rendering directly from that
shape would put the same defensive branching in every block. Keeping the type surface
compile-time only additionally makes Principle II literally true: a consumer can
render every component with the service absent, not merely unused.

**Alternatives considered**: Re-exporting the service's types would remove the adapter
but would freeze the service's backward-compatibility baggage into this library's
public contract, which Principle VI then makes a MAJOR-version cost to change. A
per-thread adapter callback in the public API was rejected as premature: it doubles
the supported integration paths, and the single normalised model already lets a
consumer with its own shape map in one place.

**Unknown forms**: FR-009 requires a message the library does not recognise to stay
accounted for. The model carries an explicit `unsupported` kind holding the original
payload, so an unrecognised form is a rendering decision rather than a dropped array
entry.

## D6: Scroll behaviour

**Decision**: Manual, threshold-based anchoring. Track the reader's distance from the
newest message and auto-advance only while that distance is within a small threshold.
When older history is prepended, capture scroll height and offset before insertion
and restore the offset after, so the reader's viewport stays on the same message.

**Rationale**: FR-013 has two opposing halves, advancing for a new message and never
moving a reader who scrolled back, and only an explicit intent signal distinguishes
them. Distance from the bottom is that signal.

**Alternatives considered**: CSS `overflow-anchor` handles some prepend cases natively
but gives no control over when to advance and behaves inconsistently across engines
for programmatic insertion. Scrolling every new message into view was rejected because
it actively fights a reader who is reading history, which is the failure FR-013 names.

## D7: Long conversation rendering

**Decision**: Plain rendering with a stable key per message identity, no windowing.
Gate SC-007 with a benchmark covering a 500-message thread.

**Rationale**: The spec already scopes windowing out unless the target is missed, and
the benchmark is what turns that from an assumption into a decision that can be
revisited on evidence. The stable key matters beyond performance: FR-010 requires a
streaming message not to remount as its content grows, which an index-based key would
break.

**Alternatives considered**: Adopting windowing up front was rejected because it
conflicts with the scroll-anchoring work in D6 and with host-owned content of unknown
height from FR-006, and there is no evidence yet that it is needed.

## D8: Peer dependency ranges

**Decision**:

| Peer | Range | Reasoning |
|------|-------|-----------|
| `vue` | `^3.4.8` | The floor Unnnic itself requires, per the constitution |
| `@weni/unnnic-system` | `>=3.30.0 <4` | 3.30.0 is the version whose component inventory was actually verified |
| `@weni/webchat-service` | `^1.10.3` | Matches what `webchat-react` pins; raised when cart and voice land |

**Rationale on the Unnnic floor**: Live Desk declares `^3.24.3`, which is lower than
the chosen floor, but that range already resolves to 3.30.x on install, so Live Desk
needs a lockfile refresh rather than a manifest change. The floor is set at 3.30.0
because that is the only version whose component inventory could be inspected;
`chats-webapp` has no installed `node_modules` for Unnnic locally, so claiming
compatibility with 3.24.3 would be an unverified assertion.

**Open risk**: neither consumer declares the service today. The composable layer is
therefore built against `webchat-service` 1.10.3's published surface (`init`,
`connect`, `getState`, `getMessages`, `sendMessage`, `sendAttachment`, `sendAudio`,
`getHistory`, `start/stop/cancelRecording`, `on`/`off`) with no consumer able to
validate it end to end until one adopts it.

## D9: Unnnic primitives to compose rather than rebuild

Principle V requires preferring Unnnic primitives, and the 3.30.0 inventory turns out
to cover far more of this feature than expected. These exist and should be composed:

| Need | Unnnic primitive |
|------|------------------|
| Audio recording UI in the composer | `unnnicAudioRecorder` |
| Horizontally browsable products | `unnnicCarousel` |
| Chat text presentation | `unnnicChatText` |
| Host-owned expandable trace | `unnnicCollapse` |
| Suggestions and preset replies | `unnnicChip` |
| Agent configuration selector | `unnnicDropdown` with `unnnicDropdownItem`, or `unnnicSelectSmart` |
| Composer text entry | `unnnicTextArea` |
| Buttons and icon buttons | `unnnicButton`, `unnnicButtonIcon` |
| Icons | `unnnicIcon` |
| History loading placeholder | `unnnicSkeletonLoading` |
| Attachment picking | `unnnicDropArea`, `unnnicUploadArea` |
| Emoji entry | `unnnicEmojiPicker` |

This materially reduces the amount of new component code, and it is a stronger
Principle V position than styling bespoke elements with tokens. Each of these still
needs verification against the approved design before adoption; where a primitive
does not fit the design, the finding belongs in the task that discovers it.

## D10: Parity baseline with webchat-react

FR-048 and SC-011 require gaps to be recorded rather than discovered later. The
`webchat-react` source contains 45 components, which classify as follows.

**Covered by this spec**: `MessagesList`, `MessageContainer`, `MessageText`,
`MessageImage`, `MessageVideo`, `MessageAudio`, `MessageDocument`, `TypingIndicator`,
`ThinkingIndicator`, `InputBox`, `InputFile`, `AudioRecorder`, `QuickReplies`,
`ListMessage`, `Cart`, `EmptyCart`, `CounterControls`, `PriceDisplay`,
`VoiceModeButton`, `VoiceModeError`, `WaveformVisualizer`.

**Intentionally excluded**, because they are widget chrome for a customer's own site
and the CX Platform supplies its own surrounding screen: `Launcher`, `Header`,
`Widget`, `PoweredBy`, `AlreadyInUse`, `ThemeProvider`, `Tooltip`, `Badge`, `Avatar`,
`Icon`, `Button`, `Radio`. Also excluded: `CameraRecording`, which the spec already
scopes out.

**Gaps this spec does not cover**, which need a decision before the parity document
can claim to be current:

| Capability | `webchat-react` components | Service support |
|------------|---------------------------|-----------------|
| Call to action | `CallToAction` | — |
| Conversation starters | `ConversationStarters`, `ConversationStarterButton` | Yes: `getStarters`, `clearStarters` |
| Product browsing beyond a carousel | `ProductCatalog`, `ProductDetails`, `InlineProduct`, `ShowItems` | — |
| Order message presentation | `MessageOrder` | Yes: `buildOrderMessage` |

Call to action and conversation starters are worth flagging rather than filing
quietly. Calls to action were named explicitly as a required capability when this
library was scoped, and the service already exposes a starters API, so both look like
spec omissions rather than deliberate exclusions.

**Decision**: record all four in `PARITY.md` at bootstrap, and treat the first two as
requiring a spec amendment before implementation reaches them. Do not expand scope
inside this plan; the spec is the place that decides what is in scope.

## D11: Theming

**Decision**: No theming interface in this library.

**Rationale**: Unnnic 3.30.0 exports `Theme` as `'light' | 'dark'` and
`ThemePreference` adding `'system'`, and drives theming through its own tokens. Adding
a second mechanism here would let a block disagree with the screen around it, which is
the opposite of what Principle V is for. This confirms the assumption the spec already
recorded.

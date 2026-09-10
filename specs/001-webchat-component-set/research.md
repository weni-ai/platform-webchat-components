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
Confirmed by the user as the intended tool.

**Rationale**: FR-066 requires every block to be inspectable in every variant and
state *and* documented for use, without running a consuming product or reading library
source. SC-009 requires design review against that catalogue and SC-005 requires a
first integration to be possible from it alone. This library also has no host
application to smoke-test it, which Principle VIII names as the reason tests carry so
much weight here. Storybook is the only option that covers per-variant isolation, a11y
feedback, prose documentation, and a browsable reference in one tool.

**Consequence for authoring**: because FR-066 asks for a usage playbook and not only a
gallery, every block needs a documentation page alongside its stories, covering what
it is for, its props and events, and a copyable integration example. Stories alone
would satisfy design review but not SC-005.

**Precedent**: Unnnic itself publishes a Storybook at `unnnic.stg.cloud.weni.ai`,
linked from the Figma component descriptions. Matching that convention makes this
library's catalogue familiar to the same audience.

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

## D9: Unnnic is a token source first, a component source second

**Decision**: Take every colour, space, radius, typography value, and shadow from
Unnnic tokens, without exception. Take Unnnic *components* only where the approved
design actually is that component. Where the design is bespoke, build the block from
tokens rather than bending a primitive to fit.

**Rationale**: An earlier version of this research proposed composing thirteen Unnnic
primitives, on the reasoning that Principle V prefers primitives over
reimplementation. Reading the approved designs showed that reasoning was inverted. The
designs are built almost entirely from Unnnic *variables* — `--space-1` through
`--space-7`, `--radius-2`, `--background/bg-base`, `--background/bg-base-soft`,
`--background/bg-accent-plain`, `--border/border-base`, `--foreground/fg-base`,
`--foreground/fg-emphasized`, `--foreground/fg-muted`, `--gray/gray-1`, `Shadow/shadow-1`
— while only three components are actually Code-Connected to Unnnic.

Principle V already anticipates this: it requires using an Unnnic primitive "that
fits". The approved design is what decides fit, and for most of this feature the
answer is that nothing fits, because the design is specific to the CX Platform chat.

**What the designs actually Code-Connect to Unnnic**:

| Unnnic component | Where the design uses it |
|------------------|--------------------------|
| `UnnnicButton` | Composer controls, product card send, carousel paging, cart actions |
| `UnnnicChip` | Attendant suggestions |
| `UnnnicIcon` | Every icon |

**What must be built from tokens, despite an Unnnic component existing**:

| Block | Unnnic component that exists | Why it is not used |
|-------|------------------------------|--------------------|
| Product set | `unnnicCarousel` | The design is a 136px product card strip with per-card actions and an edge paging control, not a slide carousel |
| Message | `unnnicChatText` | Two bespoke presentations are required: an asymmetric bubble with one square corner, and an assistant block with icon, heading, and bordered panel |
| Composer | `unnnicTextArea` | The design is a bordered container with a divider and a control row, not a text area with a label |
| Cart | — | No equivalent exists |
| Audio recording | `unnnicAudioRecorder` | Needs verification against the design before either adopting or rejecting |

**Alternatives considered**: Using `unnnicCarousel` and restyling it was rejected
because the design differs structurally, not cosmetically, and overriding a design
system component's internals is worse for upgrades than owning the markup. Building
everything bespoke including buttons and chips was rejected because it discards
consistency where the design genuinely is the Unnnic component.

**Open verification**: `unnnicAudioRecorder` is the one primitive whose fit is
genuinely unknown, because no approved design shows the recording state. It is
checked against the customer-facing implementation's behaviour when story 2 is built.

## D10: Parity baseline with webchat-react

The scope rule is now explicit: everything inside the chat is in scope, and the widget
shell is not. Applying that to the 45 components in the `webchat-react` source gives a
clean split with no judgement calls left open.

**In scope**, because they are inside the chat:

| Group | Components |
|-------|-----------|
| Thread and messages | `MessagesList`, `MessageContainer`, `MessageText`, `MessageImage`, `MessageVideo`, `MessageAudio`, `MessageDocument`, `MessageOrder` |
| Indicators | `TypingIndicator`, `ThinkingIndicator` |
| Composing | `InputBox`, `InputFile`, `AudioRecorder`, `CameraRecording` |
| Offerings | `QuickReplies`, `ListMessage`, `CallToAction` |
| Products | `ProductCatalog`, `ProductDetails`, `InlineProduct`, `ShowItems` |
| Cart | `Cart`, `EmptyCart`, `CounterControls`, `PriceDisplay` |
| Spoken mode | `VoiceModeButton`, `VoiceModeError`, `WaveformVisualizer` |

**Out of scope, widget shell**: `Launcher`, `Header`, `Widget`, `PoweredBy`,
`AlreadyInUse`, `ThemeProvider`. The CX Platform supplies its own surrounding screen.

**Out of scope, conversation starters**: `ConversationStarters`,
`ConversationStarterButton`. Neither consuming product needs them. The service's
`getStarters` and `clearStarters` stay unused by this feature.

**Not components, absorbed elsewhere**: `Button`, `Icon`, `Radio`, `Avatar`, `Badge`,
`Tooltip` are generic primitives. Per D9 these come from Unnnic where the design uses
Unnnic, and are internal markup otherwise.

**Two reversals from the previous round**, both worth stating because they contradict
earlier decisions in this same document:

- `CameraRecording` was previously excluded on the grounds that no approved design
  offers it. The scope rule overrides that: it is inside the chat, the service already
  supports it, and leaving it out would be a capability regression.
- Conversation starters were previously **added** to scope as "opening prompts", with
  FR-052 and a dedicated component. They are now removed again. Neither product needs
  them, and building an unused block would be scope for its own sake.

**Reading the source settled two things** that guesswork would have got wrong. A call
to action reaches the UI as `message.cta_message` with `display_text` and `url`, a
field absent from the service's published `Message` interface, which is further
evidence for D5. And the product card carries a promotional price shown as a struck
original beside the payable amount, which is a presentation rule rather than a
calculation, so it stays inside FR-053's prohibition on computing money.

**Decision**: `PARITY.md` at bootstrap lists all 45 components against these four
classifications. With the scope rule applied there are no open gaps, which is what
makes SC-011 checkable rather than aspirational.

## D12: What the approved designs added that the spec had missed

Seven Figma nodes were read: two for Agent Builder's version comparison, five for Live
Desk. Four capabilities appeared in them that no prior version of the spec covered.

**Per-message actions**. The Live Desk Copilot puts a row of actions under each
assistant reply: copy, send onward, and thumbs up or down. This is how the attendant
actually uses the Copilot, so its absence would have made the Copilot unusable. Added
as FR-038 and FR-039.

**Two message presentations, not one**. Agent Builder uses asymmetric chat bubbles
aligned by sender, with one square corner on the sender's side. Live Desk's Copilot
uses an entirely different arrangement: an icon and a heading above a bordered content
panel. The same message data has to render either way, which is a variant on one
component rather than two components. Added as FR-012.

**The product set lives inside a message**. It appears in two situations: inside an
assistant reply where each card has add-to-cart and remove actions, and inside an
already-sent bubble where it is a record with no actions. This is what makes FR-041's
standalone availability a requirement rather than a nicety, and it generalises to
FR-008.

**The cart is a panel, not a list**. It has a count indicator that opens it, per-line
quantity steppers with a line total, and a summary of subtotal, discount, and total
before the submit action. The earlier spec had a flat list with one total. Added as
FR-048 through FR-050.

One design annotation is a hard constraint rather than a note: the product set is
limited to ten items per message, because that is what WhatsApp accepts. The
annotation also asks what other platforms allow, which is why FR-046 forbids silently
dropping the excess and the spec treats the limit as supplied configuration rather
than a constant.

**Design references**:

| Block | File | Node |
|-------|------|------|
| Agent Builder thread with execution trace | `ztq89Rzy2SktUXmJYEBP4d` | `321:4373` |
| Agent Builder composer | `ztq89Rzy2SktUXmJYEBP4d` | `321:4400` |
| Live Desk Copilot reply with actions | `ieaAtsfIB7ymGfTUZ7aGpV` | `104:33766` |
| Live Desk product set inside a reply | `ieaAtsfIB7ymGfTUZ7aGpV` | `117:8421` |
| Live Desk cart panel | `ieaAtsfIB7ymGfTUZ7aGpV` | `117:9543` |
| Live Desk order placed and cart link | `ieaAtsfIB7ymGfTUZ7aGpV` | `120:14933` |
| Live Desk product set as a sent record | `ieaAtsfIB7ymGfTUZ7aGpV` | `214:5777` |

One inconsistency to resolve with design rather than guess: the Agent Builder thread
sets the outbound bubble to a 360px maximum width and the inbound bubble to 350px.
Nothing in the design suggests the difference is intentional.

## D11: Theming

**Decision**: No theming interface in this library.

**Rationale**: Unnnic 3.30.0 exports `Theme` as `'light' | 'dark'` and
`ThemePreference` adding `'system'`, and drives theming through its own tokens. Adding
a second mechanism here would let a block disagree with the screen around it, which is
the opposite of what Principle V is for. This confirms the assumption the spec already
recorded.

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
pinned to `>=26.0.0` via `engines`. The floor started at 22.12 to match
`agent-builder-webapp` and was later raised to 26. Release notes are queued as
Changesets; `CHANGELOG.md` is generated on version.

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
it actively fights a reader who is reading history, which is the failure FR-016 names.

**Half of this already exists.** `chats-webapp`'s `useAutoScroll.ts` implements the
auto-advance half, with a 100px threshold rather than the 64px assumed here, so the
default moves to 100px to match behaviour a real product has already tuned. It carries
two details worth keeping. It tracks programmatic scrolls with a flag so its own
`scrollTop` write does not read back as the reader scrolling away. And it treats an
upward wheel gesture as leaving the bottom immediately, rather than waiting for the
scroll position to prove it, so auto-advance does not fight a reader mid-gesture.

It also exposes a `showGoToBottom` flag and a `scrollToBottom` action, which is a
capability the spec had missed: a way back to the newest message while reading
history. FR-016 now includes it.

**What it does not do** is preserve the reading position when earlier history is
prepended. Nothing in either implementation does, so that half of FR-016 and the
history request in FR-017 remain new work.

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

**Which Unnnic components are actually used**, combining what the designs Code-Connect
with what `chats-webapp` already imports:

| Unnnic component | Where |
|------------------|-------|
| `UnnnicButton` | Composer controls, product card actions, carousel paging, cart actions, message actions |
| `UnnnicIcon` | Every icon, including the assistant's `bi:stars` and the cart's image placeholder |
| `UnnnicChip` | Attendant suggestions |
| `UnnnicSkeletonLoading` | History loading placeholders in the thread |
| `UnnnicPopover` family | The composer's attachment menu |
| `UnnnicToolTip` | Rating affordances |

`UnnnicCallAlert` is also used by `chats-webapp`'s composer for file validation errors,
but it does not come across: it is a global side effect and it carries wording, which
FR-001 and FR-003 both rule out. Validation failures become emitted intents instead.

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

**`unnnicAudioRecorder` is resolved, and rejected.** It was the one primitive whose
fit was unknown. `chats-webapp`'s `staging` branch already ships
`AudioRecordingBar.vue`, built bespoke from Unnnic SCSS tokens rather than from that
primitive: a `mm:ss` timer preceded by a pulsing dot in `$unnnic-color-fg-critical`,
plus a tertiary `UnnnicButton` with a `close` icon to discard. Finishing happens
through the composer's own send control, not inside the bar. That is the behaviour to
carry over, so no Unnnic recorder is used.

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

One design annotation looked like a hard constraint but is not one for this library:
the product set is annotated as limited to ten items per message, because that is what
WhatsApp accepts, and the annotation asks what other platforms allow. Neither existing
implementation caps anything. `webchat-react` has no product limit anywhere in its
source, and `chats-webapp`'s `ProductCarousel.vue` renders every product it is given,
relying on horizontal scroll with paging controls that appear on hover and hide at
each edge. The ten-item cap is a constraint on what may be *delivered* in one WhatsApp
message, which belongs to whoever composes the outbound message, not to a component
that displays a set. FR-046 therefore states that the set renders everything supplied.

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

## D13: chats-webapp's staging branch is the seed, not a blank page

**Decision**: Build this library by extracting and generalising the Desk Copilot
components already on `chats-webapp`'s `staging` branch, rather than writing them from
scratch and migrating later.

**What is already there**, under
`src/components/chats/ContactInfo/Redesign/DeskCopilot/`, in Vue 3 with `<script
setup>`, TypeScript, and Unnnic SCSS tokens, most with colocated tests:

| Area | Components |
|------|-----------|
| Messages | `AiMessage`, `HumanMessage`, `AssistantMessageList`, `SummaryMessage`, `media/AudioMessage`, `media/FileMessage`, `media/ImageMessage` |
| Composing | `AssistantInput`, `AudioRecordingBar` |
| Indicators | `ThinkingIndicator`, `TypingIndicator` |
| Offerings | `SuggestionChips` |
| Products | `ProductCarousel`, `ProductCarouselCard`, `ProductListSections`, `ProductQuantityControls` |
| Cart | `Cart`, `CartBadge` |
| Spoken mode | `VoiceModeButton`, `VoiceModeError`, `VoiceModePanel` |
| Other | `Disclaimer` |

**Rationale**: this is close to the entire scope of this feature, already written in
the target stack, already reviewed, and already exercised by tests. The quality is
what this library needs: `ProductCarousel.vue` removes its scroll listener, its resize
listener, and its `ResizeObserver` in `onUnmounted`, which is exactly the teardown
Principle III demands and the kind of detail a from-scratch rewrite tends to miss.
Rewriting would discard that and then have to rediscover it.

It also changes the migration story. The earlier plan had `chats-webapp` adopting the
library after it was built, which meant writing each component twice. Extracting means
`chats-webapp` replaces its local copy with an import, and Agent Builder gets a
component that has already run in a real product.

**What extraction still has to do.** Reading the five most structural components
showed the gap is larger than a rename, and in three places the existing code does
something this library is not allowed to do. Four adaptations apply to everything:

- Remove `$t(...)` calls. Every component reaches into `vue-i18n` directly, which
  FR-003 forbids; wording becomes required `labels` props.
- Replace `@/services/assistant/types` with the owned model from FR-004. The current
  types are the transport shape, carrying `product_retailer_id`, `price` as
  `string | number`, and `quickReplies` as bare strings.
- Generalise naming away from the consuming product: `AiMessage` and `HumanMessage`
  become one component with the `assistant` and `bubble` presentations, per Principle
  IV.
- Add the Agent Builder variants, which do not exist there.

Beyond that, per component:

| Component | What is missing or must change |
|-----------|-------------------------------|
| `AssistantMessageList` | Owns no scroll behaviour itself, but `useAutoScroll.ts` does, so auto-advance is extraction after all. What is genuinely missing is preserving the reading position when earlier history is prepended, which nothing implements, plus delivery states, timestamps, and per-message slots. |
| `AssistantInput` | Holds its draft internally, so FR-030's controlled text is a change, not a config. It validates file size and type itself and raises `UnnnicCallAlert`, which is both a side effect and hardcoded wording; both become emitted intents. Its attachment control is a popover menu rather than the separate mic and attach buttons the Agent Builder design shows, so the two arrangements have to reconcile as variants. |
| `AiMessage` | Holds the thumbs rating in local state and writes to the clipboard itself. Both move out: FR-039 supplies the rating as data and FR-001 makes copying an emitted intent. |
| `Cart` | **Computes line totals locally.** Principle I forbids that here, so the arithmetic moves to `@weni/webchat-service` rather than coming across. This is the clearest evidence yet for the cart dependency the spec already records. |
| `ProductCarousel` | Closest to library-ready. Its `getQuantity` function prop becomes a plain record, because a function is opaque to reactivity tracking and a quantity changed elsewhere would not reliably re-render the card. |

The composer's structure is worth carrying over deliberately: it swaps itself entirely
for the recording bar, the voice panel, or the voice error, rather than nesting them.
That keeps each state's markup independent and is why the recording bar can be a small
component with only a timer and a discard control.

**Alternatives considered**: writing from scratch and letting `chats-webapp` migrate
later was the previous plan. It is rejected now that the code is known to exist: it
would duplicate work already done, and it would leave two implementations diverging
during the build. Vendoring the files unchanged was rejected because the four
adaptations above are precisely what separates an application component from a library
component.

**Risk**: `staging` is a moving branch under continuous delivery, so extraction targets
a moving base. This is an argument for extracting early rather than late.

**Revised expectation**: extraction saves most of the product, cart, media, indicator,
and voice presentation work, which is the bulk by component count. It saves little on
the thread, because the scroll behaviour that FR-016 and FR-017 describe does not
exist anywhere yet, and it saves less than it appears on the composer and the cart,
where the existing behaviour has to be taken apart before it can be reused.

## D14: Message width is a proportion, not a fixed size

**Decision**: Bubbles take `max-width: 75%` of the thread's width, the same value for
both directions.

**Rationale**: the Figma inconsistency, 360px outbound against 350px inbound, turns
out to be a red herring. `chats-webapp` already sets `max-width: 75%` on both
`HumanMessage` and `AiMessage`, and 75% is what those Figma pixel values approximate:
on the 452px frame they were drawn in, 360px is 80% and 350px is 77%. So the pixel
difference is mock-drawing noise, and a single proportion reproduces the intent.

A proportion is also the only thing that works for a library. Agent Builder renders
two threads side by side in narrow columns, while Live Desk uses a panel of its own
width. A fixed 360px would overflow the first and under-use the second.

**Why not 90%**: a wider cap weakens the cue that a bubble does not span the full
width, which is what makes direction legible before the reader parses alignment. It
also pushes line length past comfortable reading at panel widths. 75% keeps both, and
has the advantage of already being the value in the code.

**Worth revisiting if** a consuming product ever renders a thread at full page width,
where 75% would produce very long lines. A readability ceiling alongside the
proportion would solve it, but neither consumer has that layout today and adding it
now would be a guess.

## D11: Theming

**Decision**: No theming interface in this library.

**Rationale**: Unnnic 3.30.0 exports `Theme` as `'light' | 'dark'` and
`ThemePreference` adding `'system'`, and drives theming through its own tokens. Adding
a second mechanism here would let a block disagree with the screen around it, which is
the opposite of what Principle V is for. This confirms the assumption the spec already
recorded.

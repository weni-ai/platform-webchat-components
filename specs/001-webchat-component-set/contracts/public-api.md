# Public API Contract

**Feature**: [spec.md](../spec.md) | **Model**: [data-model.md](../data-model.md)

Everything in this document is the versioned contract described by Principle VI.
Props, emits, slot names, slot scope payloads, and composable return shapes are all
part of it. Anything not listed here is internal and must not be deep-imported.

## Entry points

```json
{
  ".": "components and types",
  "./composables": "service adaptation",
  "./style.css": "compiled styles"
}
```

The split is not cosmetic. Importing `.` must never pull `@weni/webchat-service` into
a consumer's graph, which is what makes Principle II literally true rather than merely
intended: a consumer can render every component with the service absent, not just
unused. The service-aware code lives behind `./composables` and nothing in `.` imports
from it.

## Naming

Components use the `Pwc` prefix. Earlier notes sketched the composer as `PwcInput`; it
is named `PwcComposer` because "input" collides with `unnnicInput` in a file that
imports both, and because the spec's own language throughout is "composer".

Per Principle IV no identifier names a consuming product. Variants describe the
presentation instead, so `compact` and `expanded` replace what would otherwise have
been `desk-copilot` and `agent-builder`, and `bubble` and `assistant` describe the two
message presentations.

## How wording is enforced

Every component takes a required `labels` object rather than individual optional
label props. This turns FR-003 from a review convention into a compile error: a
consumer that forgets a label cannot build. It also means adding a label to a
component is a MAJOR change, since it breaks every existing `labels` object, so new
labels should arrive as optional members of the existing object.

Content that comes from the conversation — message text, a product name, a call to
action's wording — is data on the model, not a label. Only chrome is a label.

## Component overview

| Component | Purpose | Requirements |
|-----------|---------|--------------|
| `PwcThread` | The conversation, its messages, indicators, and scroll | FR-009 to FR-017 |
| `PwcMessage` | One message in either presentation; used by the thread and available alone | FR-010 to FR-014, FR-012 |
| `PwcMessageActions` | Copy, send, and rate a message | FR-038, FR-039 |
| `PwcComposer` | Writing and sending, in two variants | FR-024 to FR-030 |
| `PwcSuggestions` | Standalone attendant suggestions | FR-032, FR-033 |
| `PwcProductSet` | Horizontal product cards, actionable or record | FR-040 to FR-046 |
| `PwcProductDetail` | One product expanded | FR-047 |
| `PwcCart` | Cart panel with lines, summary, and submission | FR-049 to FR-053 |
| `PwcCartIndicator` | Item count and a request to open the cart | FR-048 |
| `PwcVoicePanel` | Spoken mode phases | FR-054 to FR-059 |

`PwcMessage`, `PwcMessageActions`, `PwcProductSet`, and `PwcProductDetail` are all
exported in their own right as well as being used internally, per FR-008. The product
set is the case that forced the rule: the approved designs place it inside an assistant
reply and inside a sent bubble, and Live Desk needs it in its own layout too.

## PwcThread

Renders a conversation. Owns scroll behaviour and nothing else.

**Props**

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `thread` | `Thread` | yes | FR-009 |
| `locale` | `string` | yes | Timestamp formatting, FR-018 |
| `presentation` | `MessagePresentation` | no, default `'bubble'` | FR-012 |
| `labels` | `ThreadLabels` | yes | FR-003 |
| `autoAdvanceThresholdPx` | `number` | no, default `100` | Distance from newest message within which new arrivals advance the view, FR-016. The default matches the value `chats-webapp` already tuned in production |

```ts
interface ThreadLabels {
  empty: string;
  loadingEarlier: string;
  peerComposing: string;
  peerWorking: string;
  deliveryPending: string;
  deliveryDelivered: string;
  deliveryRead: string;
  deliveryFailed: string;
  openDocument: string;
  unsupportedMessage: string;
  mediaLoadFailed: string;
  goToNewest: string;
}
```

**Emits**

| Event | Payload | Notes |
|-------|---------|-------|
| `request-earlier` | — | Reader reached the start of loaded history, FR-017 |
| `select-preset-reply` | `{ messageId, replyId }` | FR-031 |
| `select-option` | `{ messageId, optionId }` | FR-034 |
| `select-product` | `{ messageId, productId }` | FR-040 |
| `add-product-to-cart` | `{ messageId, productId }` | FR-045 |
| `remove-product` | `{ messageId, productId }` | FR-045 |
| `open-document` | `{ messageId, url }` | FR-010 |
| `activate-call-to-action` | `{ messageId, url }` | Reported in addition to navigating, FR-036 |
| `message-action` | `{ messageId, action: 'copy' \| 'send' \| 'rate', rating?: MessageRating }` | FR-038 |

**Slots**

| Slot | Scope | Notes |
|------|-------|-------|
| `message-before` | `{ message: Message }` | Host content above a message, FR-006 |
| `message-after` | `{ message: Message }` | Host content below a message, FR-006 |
| `empty` | — | Overrides `labels.empty` presentation |

There is deliberately **no** slot that replaces a whole message. A full override would
be the shortest path back to each product rendering its own bubbles, which is the
duplication this library exists to end. It is also the kind of API that is additive to
add later and MAJOR to remove, so the cautious order is to leave it out and add it if
a real case appears that variants and the two injection slots cannot serve.

**Behaviour that is part of the contract**

- Messages render in the order supplied; the component does not sort. FR-009
- Consecutive messages from the same sender are grouped by the component itself, from
  the flat list; `Thread` carries no grouping. No date separators are inserted. FR-009
- A message keyed by `id` is never remounted as `streaming` content grows. FR-013
- A new message advances the view only while the reader is within
  `autoAdvanceThresholdPx` of the newest message. FR-016
- A control to return to the newest message appears while the reader is away from it,
  using `labels.goToNewest`. FR-016
- An upward wheel gesture stops auto-advance immediately, without waiting for the
  scroll position to confirm it, so the thread never fights a reader mid-gesture.
- Prepending earlier history preserves the reader's viewport position. FR-016
- A duplicate `id` renders once. Edge case in the spec.
- `kind: 'unsupported'` occupies a position using `labels.unsupportedMessage`. FR-010

**Design references**: Agent Builder thread and execution trace,
[Versionamento de Agentes 321-4373](https://figma.com/design/ztq89Rzy2SktUXmJYEBP4d/Versionamento-de-Agentes?node-id=321-4373).
Live Desk assistant presentation,
[Live Desk — Sales 104-33766](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=104-33766).

## PwcMessage

One message. Exported separately so a consuming product can place a single message
outside a thread.

**Props**: `message: Message`, `locale: string`, `presentation: MessagePresentation`
(default `'bubble'`), `labels: MessageLabels` (required).

**Emits**: the same message-scoped events the thread re-emits, without the `messageId`
wrapper since the component renders exactly one message.

**Presentation behaviour**

| | `bubble` | `assistant` |
|---|---|---|
| Layout | Aligned by direction, one square corner on the sender's side | Icon and heading above a bordered panel |
| Timestamp and delivery | Inside the bubble, bottom-aligned | Not shown |
| Actions | Not shown | Below the panel |

**On the corner asymmetry**: the approved design squares the corner nearest the
sender, which is what makes direction readable without relying on alignment alone.
That matters for FR-064, since alignment is a spatial cue that collapses at narrow
widths.

**Width**: bubbles cap at 75% of the thread's width, the same for both directions. A
proportion rather than a fixed size, because Agent Builder renders two threads in
narrow side-by-side columns while Live Desk uses a panel of its own width. Research
D14 records why the Figma pixel values do not contradict this.

## PwcMessageActions

**Props**: `actions: MessageActions`, `labels: MessageActionsLabels` (required),
`disabled?: boolean`.

```ts
interface MessageActionsLabels {
  copy: string;
  send: string;
  rateHelpful: string;
  rateUnhelpful: string;
}
```

**Emits**: `copy`, `send`, and `rate` with `MessageRating`.

Each action renders only when its flag is set, and the row collapses rather than
reserving space, per FR-038. The current `rating` renders as chosen, per FR-039; the
component does not hold that state, so a consuming product that ignores the emit will
see the rating stay unchanged, which is correct rather than a bug.

**Design references**: copy and rating,
[104-33766](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=104-33766);
send and rating,
[117-8421](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=117-8421);
copy and send together,
[120-14933](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=120-14933).

## PwcComposer

**Props**

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `modelValue` | `string` | yes | Controlled text, FR-030 |
| `variant` | `ComposerVariant` | no, default `'compact'` | FR-005 |
| `capabilities` | `ComposerCapabilities` | no, all `true` | FR-026 |
| `disabled` | `boolean` | no, default `false` | FR-029 |
| `recording` | `RecordingState` | no, default `{ status: 'idle' }` | FR-027 |
| `agentConfigOptions` | `AgentConfigOption[]` | no | Selector hidden when absent, FR-028 |
| `selectedAgentConfigId` | `string` | no | FR-028 |
| `maxHeightPx` | `number` | no, default `120` | Bounded growth, FR-024 |
| `labels` | `ComposerLabels` | yes | FR-003 |

**Emits**: `update:modelValue`, `send` with the trimmed text, `attach` with `File[]`,
`start-audio-recording`, `start-camera-recording`, `finish-recording`,
`discard-recording`, `enter-voice-mode`, `update:selectedAgentConfigId`.

`send` is never emitted for empty or whitespace-only text, per FR-025.

**Slots**: `leading` and `trailing` for host controls beside the built-in ones,
`above` for a host region such as suggestions.

**Variant behaviour**

| | `compact` | `expanded` |
|---|---|---|
| Attachment | yes | yes |
| Audio recording | no | yes |
| Agent config selector | no | when options supplied |
| Voice affordance | outlined | filled and emphasised |

`capabilities` is independent of `variant` so any control can be switched off in
either arrangement. This is what keeps FR-026 from multiplying the variant count.

**Design references**

- `expanded`: [Versionamento de Agentes 321-4400](https://figma.com/design/ztq89Rzy2SktUXmJYEBP4d/Versionamento-de-Agentes?node-id=321-4400)
- `compact`: [Live Desk — Sales 104-33766](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=104-33766)

## PwcSuggestions

Standalone replies offered to an attendant. Separate from `PresetReply`, which is
attached to a message, because FR-032 requires distinguishing sending immediately from
editing first.

**Props**: `suggestions: Suggestion[]`, `labels: SuggestionsLabels` (required),
`disabled?: boolean`.

**Emits**: `send` and `edit`, each with `{ id, text }`.

Overflow wraps and stays reachable without truncating wording, per FR-033 and the
spec's edge case about suggestions several sentences long. The approved design wraps
rather than scrolling, which is why long suggestions grow the region instead of
clipping.

**Design reference**: [Live Desk — Sales 117-8421](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=117-8421)

## PwcProductSet

The block that most needed to be standalone. It appears inside an assistant reply with
per-card actions, inside a sent bubble as a record, and on its own.

**Props**

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `products` | `Product[]` | yes | FR-040 |
| `mode` | `ProductSetMode` | no, default `'record'` | FR-045 |
| `locale` | `string` | yes | Money formatting, FR-018 |
| `currency` | `string` | yes | FR-018 |
| `quantities` | `CartQuantities` | no, default `{}` | Quantity per product already in the cart, FR-045 |
| `labels` | `ProductSetLabels` | yes | FR-003 |

**Emits**: `select` with `{ productId }`, and in `actionable` mode `add`, `remove`,
`increment`, and `decrement`, each with `{ productId }`.

**Behaviour that is part of the contract**

- Cards keep a fixed width so a long name truncates rather than reshaping the row.
  FR-043
- A product without `imageUrl` shows a placeholder of the same dimensions. FR-042
- `promotionalPrice` renders beside a struck-through `unitPrice`. FR-042
- Paging controls appear only when the track overflows, and each hides at its own
  edge. FR-044
- Every product supplied is reachable; no cap is applied. FR-046
- In `record` mode no card renders an action. FR-045
- A product with a non-zero entry in `quantities` shows that quantity with controls to
  change it. FR-045

**On `quantities` as a plain record**: Live Desk's existing carousel takes a
`getQuantity(productId)` function instead. A record is preferred here because a
function prop is opaque to Vue's reactivity tracking, so a quantity change elsewhere
does not reliably re-render the card; a record does. The information is identical.

**Why the default mode is `record`**: the safer default is the one that cannot cause
an accidental cart mutation. A consumer that forgets to set the mode gets a read-only
set, not buttons that fire intents nobody is handling.

**Reference implementation**: `chats-webapp`'s `ProductCarousel.vue` on `staging`,
whose scroll-state syncing, hover-revealed paging, and `onUnmounted` teardown of its
scroll listener, resize listener, and `ResizeObserver` are carried over as-is.

**Design references**: actionable,
[117-8421](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=117-8421);
record, [214-5777](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=214-5777).

## PwcProductDetail

**Props**: `product: Product`, `locale: string`, `currency: string`,
`labels: ProductDetailLabels` (required).

**Emits**: `add-to-cart` with `{ productId }`, `back`.

Presents the full name, description, and price that the card truncates, per FR-047.

## PwcCartIndicator

**Props**: `count: number`, `labels: CartIndicatorLabels` (required).

**Emits**: `open`.

Separate from `PwcCart` because the approved design places it in the screen's header
while the cart itself is a panel. Coupling them would force a consuming product to
mount the whole cart to show a count.

**Design reference**: [Live Desk — Sales 117-9543](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=117-9543)

## PwcCart

**Props**: `cart: Cart`, `locale: string`, `labels: CartLabels` (required),
`disabled?: boolean`.

```ts
interface CartLabels {
  empty: string;
  subtotal: string;
  discount: string;
  total: string;
  submit: string;
  increase: string;
  decrease: string;
  remove: string;
  back: string;
}
```

**Emits**

| Event | Payload | Notes |
|-------|---------|-------|
| `change-quantity` | `{ productId, quantity }` | Never emits `0`, FR-051 |
| `remove-line` | `{ productId }` | Emitted instead of quantity `0`, FR-051 |
| `submit` | `{ lines: CartLine[] }` | Unavailable while empty, FR-052 |
| `back` | — | Returns to the conversation |

**Slots**: `empty`.

Line totals, subtotal, discount, and total are displayed verbatim. The component
performs no arithmetic on money, per FR-053 and Principle I, including the case where
the supplied total disagrees with the lines.

**Design reference**: [Live Desk — Sales 117-9543](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=117-9543)

## PwcVoicePanel

**Props**: `state: VoiceState`, `labels: VoiceLabels` (required).

Failure wording is not in `labels` because FR-057 requires the reason to come from
`state.failureReason`, which the consumer supplies per failure.

**Emits**: `exit`, exactly once from any phase, per FR-058.

The component captures no audio, runs no transcription, and synthesises no speech, per
FR-059 and Principle I.

## Composables

Behind `./composables`. This is the only place aware of `@weni/webchat-service`.

### `useWebchatService`

```ts
function useWebchatService(
  service: WeniWebchatService,
  options?: { storageNamespace?: StorageNamespace },
): {
  thread: Readonly<Ref<Thread>>;
  connection: Readonly<Ref<ConnectionState>>;
  send: (text: string) => Promise<void>;
  sendAttachment: (file: File) => Promise<void>;
  sendAudio: (audio: Blob) => Promise<void>;
  requestEarlier: () => Promise<void>;
  startRecording: () => Promise<void>;
  finishRecording: () => Promise<void>;
  discardRecording: () => void;
  dispose: () => void;
};
```

**Contract guarantees**

- The service instance is supplied by the caller and never constructed here, so the
  caller controls how many connections exist. Principle III.
- Every subscription registered through `service.on` is removed in `onUnmounted`, and
  `dispose` does the same for callers outside a component scope. FR-022, Principle III.
- No module-level state: two calls in one screen share nothing. FR-019, FR-020.
- `storageNamespace` is required for any persistence and is never derived here.
  FR-021.
- `thread` is read-only; mutation goes through the returned actions, so a component
  can never be the thing that changes conversation state. Principle II.

### `fromServiceMessage`

```ts
function fromServiceMessage(serviceMessage: unknown): Message;
```

Public deliberately. A consumer that keeps its own state, which is what `chats-webapp`
does with `AssistantMessage`, needs the normalisation without adopting the whole
composable. This is the single place that reconciles the service's competing identity
and direction fields, its string-versus-number timestamp, its undeclared `order` form,
and its undeclared `cta_message`, exactly as tabulated in the data model. The parameter
is `unknown` rather than the service's `Message` because the declared type does not
match what the service actually emits, so validating is part of this function's job.

## Versioning notes

| Change | Version impact |
|--------|----------------|
| New component, new optional prop, new emit, new slot | MINOR |
| New required member of any `labels` interface | MAJOR: breaks every existing object |
| New `Message` kind | MINOR: `unsupported` already absorbs unknowns for older consumers |
| New `MessageActions` flag | MINOR: flags are optional and default to absent |
| Renaming a variant or a presentation | MAJOR |
| Changing a default that alters rendered output | MAJOR, per Principle VI |

The `labels` row is the trap worth remembering. Requiring the object buys compile-time
enforcement of FR-003, and the cost is that wording additions must be optional
members to stay MINOR.

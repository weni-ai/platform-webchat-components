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

Components use the `Pwc` prefix. Earlier notes sketched this composer as `PwcInput`;
it is named `PwcComposer` here because "input" collides with `unnnicInput` in a file
that imports both, and because the spec's own language throughout is "composer".

Per Principle IV no identifier names a consuming product. Variants describe the
presentation instead, so `expanded` and `compact` replace what would otherwise have
been `agent-builder` and `desk-copilot`.

## How wording is enforced

Every component takes a required `labels` object rather than individual optional
label props. This turns FR-003 from a review convention into a compile error: a
consumer that forgets a label cannot build. It also means adding a label to a
component is a MAJOR change, since it breaks every existing `labels` object, so new
labels should arrive as optional members of the existing object.

## PwcThread

Renders a conversation. Owns scroll behaviour and nothing else.

**Props**

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `thread` | `Thread` | yes | FR-008 |
| `locale` | `string` | yes | Timestamp formatting, FR-015 |
| `labels` | `ThreadLabels` | yes | FR-003 |
| `autoAdvanceThresholdPx` | `number` | no, default `64` | Distance from newest message within which new arrivals advance the view, FR-013 |

```ts
interface ThreadLabels {
  empty: string;
  loadingEarlier: string;
  peerComposing: string;
  peerWorking: string;
  deliveryPending: string;
  deliveryDelivered: string;
  deliveryFailed: string;
  retry: string;
  openDocument: string;
  unsupportedMessage: string;
  mediaLoadFailed: string;
}
```

**Emits**

| Event | Payload | Notes |
|-------|---------|-------|
| `request-earlier` | — | Reader reached the start of loaded history, FR-014 |
| `select-preset-reply` | `{ messageId: string; replyId: string }` | FR-028 |
| `select-option` | `{ messageId: string; optionId: string }` | FR-031 |
| `select-product` | `{ messageId: string; productId: string }` | FR-032 |
| `retry-message` | `{ messageId: string }` | Failed outbound message, FR-011 |
| `open-document` | `{ messageId: string; url: string }` | FR-009 |

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

- Messages render in the order supplied; the component does not sort. FR-008
- A message keyed by `id` is never remounted as `streaming` content grows. FR-010
- A new message advances the view only while the reader is within
  `autoAdvanceThresholdPx` of the newest message. FR-013
- Prepending earlier history preserves the reader's viewport position. FR-013
- A duplicate `id` renders once. Edge case in the spec.
- `kind: 'unsupported'` occupies a position using `labels.unsupportedMessage`. FR-009

## PwcComposer

**Props**

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `modelValue` | `string` | yes | Controlled text, FR-027 |
| `variant` | `ComposerVariant` | no, default `'compact'` | FR-005 |
| `capabilities` | `ComposerCapabilities` | no, all `true` | FR-023 |
| `disabled` | `boolean` | no, default `false` | FR-026 |
| `recording` | `RecordingState` | no, default `{ status: 'idle' }` | FR-024 |
| `agentConfigOptions` | `AgentConfigOption[]` | no | Selector hidden when absent, FR-025 |
| `selectedAgentConfigId` | `string` | no | FR-025 |
| `maxHeightPx` | `number` | no, default `120` | Bounded growth, FR-021 |
| `labels` | `ComposerLabels` | yes | FR-003 |

```ts
interface ComposerLabels {
  placeholder: string;
  send: string;
  attach: string;
  startRecording: string;
  finishRecording: string;
  discardRecording: string;
  enterVoiceMode: string;
  agentConfig: string;
}
```

**Emits**

| Event | Payload | Notes |
|-------|---------|-------|
| `update:modelValue` | `string` | FR-027 |
| `send` | `string` | Never emitted for empty or whitespace-only text, FR-022 |
| `attach` | `File[]` | FR-023 |
| `start-recording` | — | FR-023 |
| `finish-recording` | — | FR-024 |
| `discard-recording` | — | FR-024 |
| `enter-voice-mode` | — | FR-023 |
| `update:selectedAgentConfigId` | `string` | FR-025 |

**Slots**: `leading` and `trailing` for host controls beside the built-in ones,
`above` for a host region such as suggestions.

**Variant behaviour**

| | `compact` | `expanded` |
|---|---|---|
| Attachment | yes | yes |
| Audio recording | no | yes |
| Agent config selector | no | when options supplied |
| Voice affordance | non-emphasised | emphasised |

`capabilities` is independent of `variant` so any control can be switched off in
either arrangement. This is what keeps FR-023 from multiplying the variant count.

**Design references** (Principle V requires these on any design change)

- `expanded`: [Versionamento de Agentes, node 321-4207](https://figma.com/design/ztq89Rzy2SktUXmJYEBP4d/Versionamento-de-Agentes?node-id=321-4207)
- `compact`: [Live Desk — Sales, node 201-12618](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=201-12618)

## PwcSuggestions

Standalone replies offered to an attendant. Separate from `PresetReply`, which is
attached to a message, because FR-029 requires distinguishing sending immediately from
editing first.

**Props**: `suggestions: Suggestion[]`, `labels: SuggestionsLabels` (required),
`disabled?: boolean`.

```ts
interface SuggestionsLabels {
  sendNow: string;
  editFirst: string;
}
```

**Emits**: `send` with `{ id: string; text: string }`, `edit` with
`{ id: string; text: string }`.

Overflow stays reachable without truncating wording, per FR-030 and the spec's edge
case about suggestions several sentences long.

**Design reference**: [Live Desk — Sales, node 201-12614](https://figma.com/design/ieaAtsfIB7ymGfTUZ7aGpV/Live-Desk---Sales?node-id=201-12614)

## PwcCart

**Props**: `cart: Cart`, `locale: string`, `labels: CartLabels` (required),
`disabled?: boolean`.

```ts
interface CartLabels {
  empty: string;
  total: string;
  discount: string;
  submit: string;
  increase: string;
  decrease: string;
  remove: string;
}
```

**Emits**

| Event | Payload | Notes |
|-------|---------|-------|
| `change-quantity` | `{ productId: string; quantity: number }` | Never emits `0`, FR-034 |
| `remove-line` | `{ productId: string }` | Emitted instead of quantity `0`, FR-034 |
| `submit` | `{ lines: CartLine[] }` | Unavailable while empty, FR-035 |

**Slots**: `empty`.

Totals and discounts are displayed verbatim. The component performs no arithmetic on
money, per FR-036 and Principle I.

## PwcVoicePanel

**Props**: `state: VoiceState`, `labels: VoiceLabels` (required).

```ts
interface VoiceLabels {
  starting: string;
  listening: string;
  working: string;
  replying: string;
  exit: string;
}
```

Failure wording is not in `labels` because FR-040 requires the reason to come from
`state.failureReason`, which the consumer supplies per failure.

**Emits**: `exit`, exactly once from any phase, per FR-041.

The component captures no audio, runs no transcription, and synthesises no speech, per
FR-042 and Principle I.

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
  `dispose` does the same for callers outside a component scope. FR-019, Principle III.
- No module-level state: two calls in one screen share nothing. FR-016, FR-017.
- `storageNamespace` is required for any persistence and is never derived here.
  FR-018.
- `thread` is read-only; mutation goes through the returned actions, so a component
  can never be the thing that changes conversation state. Principle II.

### `fromServiceMessage`

```ts
function fromServiceMessage(serviceMessage: unknown): Message;
```

Public deliberately. A consumer that keeps its own state, which is what `chats-webapp`
does with `AssistantMessage`, needs the normalisation without adopting the whole
composable. This is the single place that reconciles the service's competing identity
and direction fields, its string-versus-number timestamp, and its undeclared `order`
form, exactly as tabulated in the data model. The parameter is `unknown` rather than
the service's `Message` because the declared type does not match what the service
actually emits, so validating is part of this function's job.

## Versioning notes

| Change | Version impact |
|--------|----------------|
| New component, new optional prop, new emit, new slot | MINOR |
| New required member of any `labels` interface | MAJOR: breaks every existing object |
| New `Message` kind | MINOR: `unsupported` already absorbs unknowns for older consumers |
| Renaming a variant | MAJOR |
| Changing a default that alters rendered output | MAJOR, per Principle VI |

The `labels` row is the trap worth remembering. Requiring the object buys compile-time
enforcement of FR-003, and the cost is that wording additions must be optional
members to stay MINOR.

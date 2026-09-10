# Phase 1 Data Model: CX Platform Webchat Component Set

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

This model is the contract described by FR-004: owned by this library, normalised so
each concept appears exactly once, and expressed only at compile time so no component
imports a runtime value from `@weni/webchat-service`.

## Normalisation rules

These rules are what "normalised" means concretely, and every type below follows them.

1. **Identity is one field.** `id` is required. The service's `id`/`ID` pair collapses
   into it during adaptation.
2. **Direction is one field with two values.** `direction` is `'inbound' | 'outbound'`.
   The service's four-valued `direction` and its separate `sender` both collapse into
   it.
3. **Time is one type.** `timestamp` is a number of milliseconds. The service's
   string-valued order timestamp is coerced during adaptation.
4. **Optional means absent-is-meaningful.** A field is optional only where absence
   carries information, such as `deliveryState`, which exists for outbound messages
   only.
5. **Kind is the discriminant.** Every message narrows by `kind`, so a component
   renders one shape rather than probing for fields.
6. **No wording.** No type carries a label, placeholder, or error string. Per FR-003
   all wording arrives through props.

## Message

The central entity. A discriminated union on `kind`.

```ts
type MessageDirection = 'inbound' | 'outbound';
type DeliveryState = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageBase {
  id: string;
  direction: MessageDirection;
  timestamp: number;
  /** Outbound only; absence means delivery is not tracked for this message. */
  deliveryState?: DeliveryState;
  /** True while content is still arriving. Drives FR-010 without remounting. */
  streaming?: boolean;
  presetReplies?: PresetReply[];
  callToAction?: CallToAction;
}

type Message =
  | (MessageBase & { kind: 'text'; text: string })
  | (MessageBase & { kind: 'image'; url: string; caption?: string })
  | (MessageBase & { kind: 'video'; url: string; caption?: string })
  | (MessageBase & { kind: 'audio'; url: string; durationMs?: number })
  | (MessageBase & { kind: 'document'; url: string; fileName: string; sizeBytes?: number; mimeType?: string })
  | (MessageBase & { kind: 'options'; text: string; options: ReplyOption[] })
  | (MessageBase & { kind: 'products'; products: Product[] })
  | (MessageBase & { kind: 'unsupported'; raw: unknown });
```

**Validation rules**, each traceable to a requirement:

| Rule | Source |
|------|--------|
| `id` unique within a thread; a repeated `id` is reported once and not rendered twice | Edge case: same identity supplied twice |
| `deliveryState` only meaningful when `direction` is `'outbound'` | FR-011 |
| `kind: 'unsupported'` preserves `raw` and still occupies a position in the thread | FR-009, edge case: unrecognised form |
| `streaming` may only be true for `kind: 'text'` | FR-010 |
| `text` may be empty; the block renders an empty state rather than collapsing | Edge case: message carries no content |
| Media `url` that fails to load is presented as a failure, not omitted | Edge case: broken image |

**Why `unsupported` is a member rather than a filter**: dropping unknown messages
would leave a silent hole in a conversation, which the spec calls out explicitly. As a
union member the gap becomes a rendering decision with a test.

## Thread

What a conversation surface receives. This is a value object, not a store; per
Principle II the consuming product owns the state.

```ts
interface Thread {
  messages: Message[];          // chronological, oldest first
  peerActivity?: PeerActivity;  // absent when the peer is idle
  history: HistoryState;
}

type PeerActivity = 'composing' | 'working';   // FR-012 requires these be distinct

interface HistoryState {
  hasEarlier: boolean;   // drives FR-014's request signal
  loadingEarlier: boolean;
}
```

`peerActivity` is one optional field rather than two booleans so that "composing" and
"working" cannot both be true, which would have no meaningful presentation.

## Preset replies and offered options

Three distinct concepts that the spec keeps separate because they behave differently.

```ts
interface PresetReply {   // attached to a message; FR-028
  id: string;
  label: string;
}

interface ReplyOption {   // a selectable list; FR-031
  id: string;
  label: string;
  description?: string;
}

interface Suggestion {    // standalone, offered to an attendant; FR-029
  id: string;
  text: string;
}
```

`Suggestion` carries `text` rather than `label` because its content is a full draft
reply that can be moved into the composer for editing, whereas a `PresetReply` label
is a short affordance the reader picks. Keeping them separate is what lets FR-029
distinguish sending immediately from editing first.

## Calls to action and opening prompts

```ts
interface CallToAction {   // attached to a message; FR-049
  label: string;
  url: string;
  disabled?: boolean;
}

/** Wording is the identity, because it is sent verbatim. FR-052. */
type OpeningPrompt = string;

type OpeningPromptsDensity = 'compact' | 'full';
```

`CallToAction` sits on `MessageBase` rather than on the text variant alone. The
customer-facing implementation only attaches it to text messages, but nothing about
the concept is text-specific and FR-049 is written about messages generally, so
restricting it would be a limit this model invents.

**Validation rules**:

| Rule | Source |
|------|--------|
| A call to action with no `url` is not presented, and reports nothing | Edge case: no destination |
| While `disabled`, it leads nowhere and reports no activation | FR-051 |
| Activation both navigates in a new context and reports | FR-050 |
| Prompts are presented only while `messages` is empty | FR-052 |
| Duplicate prompt wording collapses to one entry, since wording is the identity | Edge case: identical wording |

**Why `OpeningPrompt` is a bare string**: the customer-facing implementation keys
prompts by their own text and sends that text verbatim, so the wording already is the
identity. Wrapping it in an object with a generated `id` would mean synthesising a
value this feature receives no source for, which is the pattern FR-004 exists to
prevent. The cost is that two identical prompts cannot be distinguished, which the
validation rule above resolves by collapsing them.

## Product and cart

```ts
interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  /** Minor units, e.g. cents. Avoids float drift in a value the library only displays. */
  unitPrice: number;
  promotionalPrice?: number;
}

interface CartLine {
  product: Product;
  quantity: number;      // always >= 1; see the removal rule below
}

interface Cart {
  lines: CartLine[];
  /** Supplied, never computed here. FR-036 and Principle I. */
  total: number;
  discount?: number;
  currency: string;      // ISO 4217, used with the supplied locale for FR-015
}
```

**Validation rules**:

| Rule | Source |
|------|--------|
| `quantity` is never 0; decrementing from 1 reports removal instead | FR-034 |
| `total` and `discount` are displayed verbatim and never recomputed | FR-036, Principle I |
| Money is carried in minor units and formatted with the supplied locale and currency | FR-015 |
| An empty `lines` array makes submission unavailable | FR-035 |

**Why money is in minor units**: the library only displays these values, so the
integer representation costs nothing and removes a class of rounding disagreement
between what the service computes and what the screen shows.

## Composer

```ts
type ComposerVariant = 'compact' | 'expanded';

interface AgentConfigOption {
  id: string;
  label: string;
}

interface ComposerCapabilities {
  attachment: boolean;
  audioRecording: boolean;
  voiceMode: boolean;
}

type RecordingState =
  | { status: 'idle' }
  | { status: 'recording'; elapsedMs: number };
```

**On the variant names**: Principle IV forbids consumer names in identifiers, so the
variants describe presentation rather than the product that asked for it. `expanded`
is the fuller arrangement with audio recording, the agent configuration selector, and
an emphasised voice affordance, which is what the Agent Builder design specifies.
`compact` is the plainer arrangement, which is what the Live Desk design specifies.
Capabilities are a separate field from the variant so either arrangement can have any
control disabled, satisfying FR-023 without multiplying variants.

## Spoken mode

```ts
type VoicePhase = 'starting' | 'listening' | 'working' | 'replying' | 'failed';

interface VoiceState {
  phase: VoicePhase;
  /** Revised in place while listening; FR-038. */
  partialTranscript?: string;
  /** Normalised 0..1 input level; FR-039. */
  inputLevel?: number;
  /** Present only when phase is 'failed'; wording supplied by the consumer. */
  failureReason?: string;
}
```

`phase` is a single enum rather than independent booleans because FR-037 requires the
phases to be visually distinct, which only holds if exactly one is active.

## Persistence namespace

```ts
/** Supplied by the consuming product; never derived here. FR-018, Principle III. */
type StorageNamespace = string;
```

Any block or composable that persists anything takes this value. Deriving a key
locally is what caused the cross-room collision that `chats-webapp` had to work around
by reaching into `service.session.sessionKey`, and Principle III forbids repeating it.

## Adaptation from the service

One function, in the composable layer, is the only place aware of the service's shape.
It is the single point that absorbs every inconsistency recorded in the spec's
Assumptions.

| Service field | Model field | Reconciliation |
|---------------|-------------|----------------|
| `id` or `ID` | `id` | Prefer `id`; fall back to `ID`; synthesise if both absent |
| `direction` (`incoming`/`outgoing`/`in`/`out`) and `sender` (`response`/`client`) | `direction` | Map all six spellings onto two values; `direction` wins when both are present |
| `type` plus the undeclared `order` form | `kind` | Map known forms; anything unmapped becomes `unsupported` with `raw` retained |
| `timestamp` (number, or string for orders) | `timestamp` | Coerce to number |
| `status` | `deliveryState` | `'error'` becomes `'failed'`; applied to outbound messages only |
| `text` and `caption` | `text` or `caption` per kind | Media caption goes to `caption`, not `text` |
| `quick_replies` | `presetReplies` | Rename to the model's convention |
| `cta_message` (`display_text`, `url`) | `callToAction` (`label`, `url`) | Undeclared in the service's `Message` interface but emitted in practice; dropped when `url` is absent |
| `metadata`, `hidden`, `persisted`, `__customFields` | not exposed | Transport concerns; excluded from the contract |

`cta_message` is worth noting as further evidence for the decision in FR-004: the field
is consumed by the customer-facing implementation and does not appear in the service's
published `Message` interface at all. A contract that adopted the declared type would
not have had a place to put it.

Because this function is the only consumer of the service's shape, correcting the
service's declarations later changes one file rather than every block.

## Entity relationships

```text
Thread
 ├── Message[]                      (chronological)
 │    ├── PresetReply[]             (optional, kind-independent)
 │    ├── CallToAction              (optional, kind-independent)
 │    ├── ReplyOption[]             (kind: 'options')
 │    └── Product[]                 (kind: 'products')
 ├── PeerActivity                   (optional)
 └── HistoryState

Cart ── CartLine[] ── Product

Composer ── ComposerVariant + ComposerCapabilities + RecordingState
         └── AgentConfigOption[]    (optional)

VoiceState                          (independent of Thread)

Suggestion[]                        (independent of Thread; offered to an attendant)

OpeningPrompt[]                     (independent of Thread; offered only while empty)
```

`Suggestion[]` and `VoiceState` sit outside `Thread` deliberately: both are about the
attendant's or speaker's current situation rather than the conversation's record, and
coupling them to `Thread` would force a consumer to rebuild a thread object to change
a voice phase.

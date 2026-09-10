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
   all wording arrives through props. Content that comes from the conversation, such
   as message text or a product name, is data rather than wording.
7. **Money is never computed.** Every monetary value is supplied and displayed
   verbatim, per FR-053 and Principle I.

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
  /** True while content is still arriving. Drives FR-013 without remounting. */
  streaming?: boolean;
  presetReplies?: PresetReply[];
  callToAction?: CallToAction;
  /** Actions offered upon the message itself. FR-038. */
  actions?: MessageActions;
}

type Message =
  | (MessageBase & { kind: 'text'; text: string })
  | (MessageBase & { kind: 'image'; url: string; caption?: string })
  | (MessageBase & { kind: 'video'; url: string; caption?: string })
  | (MessageBase & { kind: 'audio'; url: string; durationMs?: number })
  | (MessageBase & { kind: 'document'; url: string; fileName: string; sizeBytes?: number; mimeType?: string })
  | (MessageBase & { kind: 'location'; latitude: number; longitude: number; address?: string })
  | (MessageBase & { kind: 'options'; text: string; options: ReplyOption[] })
  | (MessageBase & { kind: 'products'; text?: string; products: Product[] })
  | (MessageBase & { kind: 'order'; lines: CartLine[]; total: number; currency: string })
  | (MessageBase & { kind: 'unsupported'; raw: unknown });
```

**Validation rules**, each traceable to a requirement:

| Rule | Source |
|------|--------|
| `id` unique within a thread; a repeated `id` renders once | Edge case: same identity supplied twice |
| `deliveryState` only meaningful when `direction` is `'outbound'` | FR-014 |
| `kind: 'unsupported'` preserves `raw` and still occupies a position in the thread | FR-010 |
| `streaming` may only be true for `kind: 'text'` | FR-013 |
| `text` may be empty; the block renders an empty state rather than collapsing | Edge case: message carries no content |
| Media `url` that fails to load is presented as a failure, not omitted | Edge case: broken image |
| `kind: 'text'` content is rendered as formatted text with executable markup neutralised | FR-011 |

**Why `unsupported` is a member rather than a filter**: dropping unknown messages
would leave a silent hole in a conversation, which the spec calls out explicitly. As a
union member the gap becomes a rendering decision with a test.

**Why `order` carries `CartLine[]`**: a placed order is a cart at the moment it was
submitted. Reusing the type means the same line presentation serves both, and it makes
explicit that an order's total is supplied rather than recomputed from its lines.

## Message presentation

```ts
/** FR-012. Chosen by the consuming product; the message data is identical. */
type MessagePresentation = 'bubble' | 'assistant';
```

`bubble` is the asymmetric, sender-aligned bubble that both products use for the
conversation with the customer. `assistant` is the icon, heading, and bordered panel
arrangement that Live Desk's Copilot uses. Per Principle IV these are presentations,
not products, so neither name references a consuming application.

## Message actions

```ts
type MessageRating = 'helpful' | 'unhelpful';

interface MessageActions {   // FR-038, FR-039
  copy?: boolean;
  send?: boolean;
  rate?: boolean;
  /** The rating already given, if any. Presented as chosen. */
  rating?: MessageRating;
}
```

Each action is individually optional because the approved designs differ: one Copilot
reply offers copy and rating, another offers send and rating. Modelling them as three
independent flags rather than a preset list is what lets FR-038 be satisfied without a
variant per combination.

`rating` is stored on the actions rather than emitted-and-forgotten because FR-039
requires a given rating to stay visible, and per Principle II the component cannot
hold that state itself.

## Preset replies, options, and suggestions

Three distinct concepts that the spec keeps separate because they behave differently.

```ts
interface PresetReply {   // attached to a message; FR-031
  id: string;
  label: string;
}

interface ReplyOption {   // a selectable list; FR-034
  id: string;
  label: string;
  description?: string;
}

interface Suggestion {    // standalone, offered to an attendant; FR-032
  id: string;
  text: string;
}
```

`Suggestion` carries `text` rather than `label` because its content is a full draft
reply that can be moved into the composer for editing, whereas a `PresetReply` label
is a short affordance the reader picks. Keeping them separate is what lets FR-032
distinguish sending immediately from editing first.

## Call to action

```ts
interface CallToAction {   // attached to a message; FR-035
  label: string;
  url: string;
  disabled?: boolean;
}
```

`CallToAction` sits on `MessageBase` rather than on the text variant alone. The
customer-facing implementation only attaches it to text messages, but nothing about
the concept is text-specific and FR-035 is written about messages generally, so
restricting it would be a limit this model invents.

| Rule | Source |
|------|--------|
| A call to action with no `url` is not presented and reports nothing | Edge case: no destination |
| While `disabled`, it leads nowhere and reports no activation | FR-037 |
| Activation both navigates in a new context and reports | FR-036 |

## Product

```ts
interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  /** As supplied, in the currency's own units. Never converted or recomputed. */
  unitPrice: number;
  /** When present, `unitPrice` is shown struck through and this is the payable amount. */
  promotionalPrice?: number;
}

/** FR-045. Actionable inside an assistant reply; a record inside a sent message. */
type ProductSetMode = 'actionable' | 'record';

interface ProductSection {   // FR-047
  title: string;
  products: Product[];
}
```

| Rule | Source |
|------|--------|
| Missing `imageUrl` shows a placeholder occupying the same space | FR-042 |
| A `name` too long for the card is truncated, not wrapped past the card | FR-043 |
| `promotionalPrice` renders beside a struck-through `unitPrice` | FR-042 |
| Every product supplied is reachable; no cap is applied | FR-046 |
| In `record` mode no card offers any action | FR-045 |
| In `actionable` mode a product in the cart shows and can change its quantity | FR-045 |

**On price representation**: an earlier version of this model held money in minor
units as an integer. That was wrong for this data. The catalogue supplies
`price` and `sale_price` as `string | number` holding decimal amounts, so minor units
would require multiplying by one hundred, and multiplying money is a computation this
library is forbidden from doing by FR-053 and Principle I. The adapter coerces to a
number and nothing else touches the value; formatting is left to the locale and
currency the consumer supplies.

**On the per-message limit**: there is none here. The approved design annotates ten
products per message because that is WhatsApp's limit, but that constrains delivery,
not display, and neither existing implementation caps anything.

## Cart

```ts
interface CartLine {
  product: Product;
  quantity: number;      // always >= 1; see the removal rule below
  /** Supplied, never computed here. FR-053. */
  lineTotal: number;
}

/** Quantity per product, for the actionable product set. FR-045. */
type CartQuantities = Readonly<Record<string, number>>;

interface CartSummary {
  subtotal: number;
  discount?: number;
  total: number;
}

interface Cart {
  lines: CartLine[];
  summary: CartSummary;
  currency: string;      // ISO 4217, used with the supplied locale for FR-018
}
```

| Rule | Source |
|------|--------|
| `quantity` is never 0; decrementing from 1 reports removal instead | FR-051 |
| `lineTotal`, `subtotal`, `discount`, and `total` are displayed verbatim | FR-053 |
| The count on the cart indicator comes from the supplied lines | FR-048 |
| An empty `lines` array shows the empty state and disables submission | FR-052 |
| A `total` disagreeing with the lines is displayed as supplied, not corrected | Edge case, FR-053 |

That last rule deserves its own note. It looks wrong to display a total that does not
match its lines, but the alternative is worse: recomputing would put pricing rules in
a presentation layer, which Principle I forbids outright and which would produce a
number that silently disagrees with what the customer is actually charged. A
disagreement is a defect in the supplier, and hiding it here would make it harder to
find.

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
  cameraRecording: boolean;
  voiceMode: boolean;
}

type RecordingState =
  | { status: 'idle' }
  | { status: 'recording-audio'; elapsedMs: number }
  | { status: 'recording-camera'; elapsedMs: number };
```

**On the variant names**: Principle IV forbids consumer names in identifiers, so the
variants describe presentation rather than the product that asked for it. `expanded`
is the fuller arrangement with audio recording, the agent configuration selector, and
an emphasised voice affordance, which is what the Agent Builder design specifies.
`compact` is the plainer arrangement, which is what the Live Desk design specifies.
Capabilities are a separate field from the variant so either arrangement can have any
control disabled, satisfying FR-026 without multiplying variants.

`RecordingState` distinguishes audio from camera because FR-027 requires different
progress presentation for each: elapsed time for audio, a preview for camera.

## Spoken mode

```ts
type VoicePhase = 'starting' | 'listening' | 'working' | 'replying' | 'failed';

interface VoiceState {
  phase: VoicePhase;
  /** Revised in place while listening; FR-055. */
  partialTranscript?: string;
  /** Normalised 0..1 input level; FR-056. */
  inputLevel?: number;
  /** Present only when phase is 'failed'; wording supplied by the consumer. */
  failureReason?: string;
}
```

`phase` is a single enum rather than independent booleans because FR-054 requires the
phases to be visually distinct, which only holds if exactly one is active.

## Thread

What a conversation surface receives. A value object, not a store; per Principle II
the consuming product owns the state.

```ts
interface Thread {
  messages: Message[];          // chronological, oldest first
  peerActivity?: PeerActivity;  // absent when the peer is idle
  history: HistoryState;
}

type PeerActivity = 'composing' | 'working';   // FR-015 requires these be distinct

interface HistoryState {
  hasEarlier: boolean;   // drives FR-017's request signal
  loadingEarlier: boolean;
}
```

`peerActivity` is one optional field rather than two booleans so that "composing" and
"working" cannot both be true, which would have no meaningful presentation.

## Persistence namespace

```ts
/** Supplied by the consuming product; never derived here. FR-021, Principle III. */
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
| `type`, plus the undeclared `order` form | `kind` | Map known forms; anything unmapped becomes `unsupported` with `raw` retained |
| `timestamp` (number, or string for orders) | `timestamp` | Coerce to number |
| `status` | `deliveryState` | `'error'` becomes `'failed'`; applied to outbound messages only |
| `text` and `caption` | `text` or `caption` per kind | Media caption goes to `caption`, not `text` |
| `quick_replies` | `presetReplies` | Rename to the model's convention. Live Desk currently carries these as bare strings while the service types them as objects; the adapter accepts both and normalises to the object form |
| `product_retailer_id` | `Product.id` | The catalogue's identifier becomes the model's identity |
| `price`, `sale_price` (`string \| number`) | `unitPrice`, `promotionalPrice` | Coerced to number; the decimal amount is preserved, not converted |
| `cta_message` (`display_text`, `url`) | `callToAction` (`label`, `url`) | Undeclared in the service's `Message` interface but emitted in practice; dropped when `url` is absent |
| `metadata.latitude`, `metadata.longitude`, `metadata.address` | `location` fields | The service carries location in `metadata` rather than as typed fields |
| `order.product_items` | `order` lines | Line totals are taken as supplied, never multiplied out |
| `metadata`, `hidden`, `persisted`, `__customFields` | not exposed | Transport concerns; excluded from the contract |

`cta_message` is worth noting as further evidence for the decision in FR-004: the field
is consumed by the customer-facing implementation and does not appear in the service's
published `Message` interface at all. A contract that adopted the declared type would
not have had a place to put it.

**What the adapter does not produce**: `actions`, `MessagePresentation`, and
`ProductSetMode` have no source in the service. They are decisions the consuming
product makes about how to present a message, not facts about the message, so they are
supplied alongside the thread rather than derived from it.

## Entity relationships

```text
Thread
 ├── Message[]                      (chronological)
 │    ├── PresetReply[]             (optional, kind-independent)
 │    ├── CallToAction              (optional, kind-independent)
 │    ├── MessageActions            (optional, kind-independent)
 │    ├── ReplyOption[]             (kind: 'options')
 │    ├── Product[]                 (kind: 'products')
 │    └── CartLine[]                (kind: 'order')
 ├── PeerActivity                   (optional)
 └── HistoryState

Cart ── CartLine[] ── Product
     └── CartSummary

Product[] ── ProductSetMode         (also usable standalone; FR-041)

Composer ── ComposerVariant + ComposerCapabilities + RecordingState
         └── AgentConfigOption[]    (optional)

VoiceState                          (independent of Thread)

Suggestion[]                        (independent of Thread; offered to an attendant)
```

`Suggestion[]` and `VoiceState` sit outside `Thread` deliberately: both are about the
attendant's or speaker's current situation rather than the conversation's record, and
coupling them to `Thread` would force a consumer to rebuild a thread object to change
a voice phase.

`Product[]` appears twice on purpose. It is reachable through a message of kind
`products` and usable on its own, which is the reuse FR-041 requires and SC-012
verifies.

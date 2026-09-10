# Required of `@weni/webchat-service`

**Feature**: [spec.md](../spec.md) | **Depends on**: this document being satisfied
before stories 7 and 8 can be completed

This is the contract this feature needs **from** the service, not one it provides. It
exists because the constitution's Principle I forbids cart arithmetic and voice
session orchestration from living in a UI package, while both are currently
implemented inside UI packages. Until the service owns them, the cart and spoken mode
components can be built and reviewed but not wired up.

Two additions are needed: a **CartManager** and a **VoiceService**. Both already exist
as working code in places they should not be, so this is relocation and hardening
rather than invention.

## Why this is urgent rather than tidy

The voice implementation is the clearest case of the cost. `webchat-react` holds 2,909
lines across eleven files under `src/services/voice/`, and `chats-webapp`'s `staging`
branch holds **the same eleven files**, copied verbatim:

| File | Lines in `webchat-react` | Present in `chats-webapp` |
|------|--------------------------|---------------------------|
| `VoiceService.js` | 576 | yes |
| `TTSPlayer.js` | 604 | yes |
| `STTConnection.js` | 352 | yes |
| `AudioCapture.js` | 348 | yes |
| `errors.js` | 235 | yes |
| `EchoGuard.js` | 208 | yes |
| `config.js` | 185 | yes |
| `SessionGuard.js` | 172 | yes |
| `TextChunker.js` | 133 | yes |
| `sanitizeForTTS.js` | 55 | yes |
| `index.js` | 21 | yes |

Every future fix to echo suppression, chunking, or session guarding has to be made
twice and kept in step by hand. A third consumer would make it three times. The
constitution cites this duplication as the reason this library exists; the same
reasoning applies to the service.

---

## 1. CartManager

### What exists today

`chats-webapp` implements the whole cart in
`src/composables/assistant/useProductCart.ts`, with pricing helpers in
`src/services/assistant/currency.ts`. `webchat-react` has almost nothing: its
`ChatContext.jsx` keeps a bare `useState({})` and a `clearCart` function, which is why
its cart cannot do what Live Desk's does.

Everything in `useProductCart.ts` is framework-agnostic domain logic wearing Vue
clothing. Strip the `ref` and `computed` wrappers and what remains is a cart model
with no Vue in it at all. That is what should move.

### Required behaviour

**State**: products keyed by identity, each with a quantity of at least one. A
quantity reaching zero removes the entry rather than storing a zero.

**Derived values**, all of which the UI is forbidden from computing:

| Value | Rule |
|-------|------|
| `items` | Entries with a quantity above zero |
| `totalQuantity` | Sum of quantities |
| `subtotal` | Sum of unit price times quantity, using the full price |
| `discount` | Sum of the saving per line, counted only where a sale price exists and is strictly below the full price |
| `total` | Subtotal minus discount, floored at zero |
| `currency` | The cart's currency |

The floor on `total` and the strictness of the sale-price comparison are both in the
current implementation and both should survive the move. They are the kind of detail
that gets lost in a rewrite and produces a negative total in front of a customer.

**Operations**: add, set quantity, increment, decrement, remove, clear, and produce
the order payload for submission.

**Price parsing**: the catalogue supplies `price` and `sale_price` as `string | number`
holding decimal amounts. Parsing belongs here, with the parsed value exposed, so that
neither this library nor any consumer re-implements it. Amounts stay in the currency's
own units; converting to minor units would be arithmetic on money performed outside
the one place allowed to do it.

**Currency**: the current implementation reads the currency from the first item and
falls back to `BRL`. A hardcoded regional default does not belong in a shared service.
The currency should be supplied to the manager, with a mixed-currency cart treated as
an error rather than silently totalled, since a total across currencies is meaningless.

### Required events and payload

`chats-webapp` contains `src/services/assistant/cartCount.ts`, forty lines whose only
job is to dig a count out of a cart payload that might be a number, or an object with
`count`, or an object with `items`, or an object with `data.count`, or an object with
`data.items`. That file is a symptom: the service already emits a cart update whose
shape is not guaranteed.

The service should emit a cart update carrying the cart state in one declared shape,
which makes `cartCount.ts` deletable. Deleting it is a good acceptance test for this
work.

### What this unblocks

Story 7 and requirements FR-048 through FR-053. The cart component presents lines,
quantities, line totals, and the summary, and reports every change as an intent. It
performs no arithmetic, which is only possible once these values arrive from
somewhere.

Note that `chats-webapp`'s `Cart.vue` currently computes its line totals in a local
helper. That is acceptable in an application and forbidden in this library, so the
component cannot be extracted until this manager exists.

---

## 2. VoiceService

### What exists today

The eleven files listed above, in both UI packages, in full. The orchestration covers
microphone capture, a speech-to-text connection, text-to-speech playback, chunking
text for playback, sanitising text before it is spoken, echo suppression, session
guarding, an error taxonomy, and configuration.

`chats-webapp` wraps them in `src/composables/assistant/useVoiceMode.ts`;
`webchat-react` wraps them in `src/hooks/useVoiceMode.js`. The wrappers differ, the
services do not.

### Required behaviour

The service should own the session and expose its phase, not its internals. The
component contract in this feature needs exactly four things, and no more:

| Exposed | Used by |
|---------|---------|
| Current phase: starting, listening, working, replying, or failed | FR-054 |
| Partial transcript, revised as speech is understood | FR-055 |
| Captured input level, normalised | FR-056 |
| Failure reason, in a form the consumer can map to its own wording | FR-057 |

Plus the operations to enter and leave a session, and to retry after a recoverable
failure.

**Error taxonomy**: `errors.js` already distinguishes recoverable from unrecoverable
failures, and `chats-webapp`'s composer branches on `recoverable` to decide whether to
offer a retry. That distinction is part of the contract, not an implementation detail,
so it should be part of what the service exposes.

**Wording**: the current error objects carry `message` and `suggestion` strings. Those
must not cross into the UI, because FR-003 requires all wording to come from the
consuming product. The service should expose a code the consumer maps; it may keep the
strings for logging.

**Instance scope**: the service must support several concurrent voice sessions on one
page without shared state, because Principle III applies to anything this library
composes. Whether the current implementation holds module-level state is the first
thing to check when moving it.

### What this unblocks

Story 8 and requirements FR-054 through FR-059, and it removes the duplication above.

---

## Sequencing against this feature

Neither addition blocks the start of work. Stories 1 through 6 have no dependency on
either, and the cart and spoken mode **presentation** can be built and reviewed
against supplied state, because FR-053 and FR-059 require exactly that.

What is blocked is wiring, and therefore end-to-end validation. The quickstart already
records this as a known validation limit.

The useful order is: CartManager first, because story 7 comes first and the work is
smaller and better understood; VoiceService second, because it is large, and because
the duplication it removes is a cost already being paid rather than a new capability.

## Suggested acceptance for the service work

- `chats-webapp` deletes its copy of `src/services/voice/` and imports from the
  service instead, with no behaviour change.
- `chats-webapp` deletes `src/services/assistant/cartCount.ts`, because the payload
  shape is now declared.
- `chats-webapp`'s `useProductCart.ts` becomes a thin reactive wrapper over the
  manager, holding no arithmetic.
- The service's published type declarations describe both additions accurately, which
  the existing declarations do not manage for messages today.

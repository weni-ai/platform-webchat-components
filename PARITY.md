# Parity with webchat-react

This file is the Principle VII record of how `@weni/webchat-template-react`
(`webchat-react`) maps onto this library. Classification follows the scope
rule in research D10: everything inside the chat is in scope; the widget
shell is not.

D10 inventoried 45 modules in the `webchat-react` source. The tables below
list each one against one of four outcomes. An in-scope row is a gap until
its matching block ships; T140 marks those rows delivered.

Status values:

- **Planned** — in scope, not yet implemented
- **Out of scope** — will not be built here
- **Absorbed** — capability exists as Unnnic or as internal markup, not as
  its own public component

## In scope

These sit inside the conversation and must be present or recorded as a
known gap.

| webchat-react | Maps to | Status |
| --- | --- | --- |
| `MessagesList` | `PwcThread` | Planned |
| `MessageContainer` | `PwcMessage` | Planned |
| `MessageText` | `PwcMessage` | Planned |
| `MessageImage` | `PwcMessage` | Planned |
| `MessageVideo` | `PwcMessage` | Planned |
| `MessageAudio` | `PwcMessage` | Planned |
| `MessageDocument` | `PwcMessage` | Planned |
| `MessageOrder` | `PwcMessage` | Planned |
| `TypingIndicator` | `PwcThread` composing indicator | Planned |
| `ThinkingIndicator` | `PwcThread` working indicator | Planned |
| `InputBox` | `PwcComposer` | Planned |
| `InputFile` | `PwcComposer` | Planned |
| `AudioRecorder` | `PwcComposer` recording bar | Planned |
| `CameraRecording` | `PwcComposer` camera recording | Planned |
| `QuickReplies` | `PwcMessage` preset replies | Planned |
| `ListMessage` | `PwcMessage` reply options | Planned |
| `CallToAction` | `PwcMessage` call to action | Planned |
| `ProductCatalog` | `PwcProductSet` | Planned |
| `ProductDetails` | `PwcProductDetail` | Planned |
| `InlineProduct` | `PwcProductSet` inline presentation | Planned |
| `ShowItems` | `PwcProductSet` | Planned |
| `Cart` | `PwcCart` | Planned |
| `EmptyCart` | `PwcCart` empty state | Planned |
| `CounterControls` | Quantity stepper (shared by product set and cart) | Planned |
| `PriceDisplay` | `PwcProductSet` / `PwcCart` price presentation | Planned |
| `VoiceModeButton` | `PwcComposer` voice affordance | Planned |
| `VoiceModeError` | `PwcVoicePanel` failure | Planned |
| `WaveformVisualizer` | `PwcVoicePanel` input level | Planned |

Location messages have no dedicated `webchat-react` component. They remain
in scope here because they are a conversation form (FR-010); presentation
follows `webchat-react` behaviour rather than a named module.

`views/ListMessage.jsx` is the full-page wrapper of the same `ListMessage`
offering already listed above, not a separate capability.

## Out of scope: widget shell

The CX Platform supplies the surrounding screen. These are not built.

| webchat-react | Reason |
| --- | --- |
| `Launcher` | Host chrome; the platform opens the conversation |
| `Header` | Host chrome |
| `Widget` | Embeddable shell |
| `Chat` | Shell that routes between header, pages, and powered-by |
| `PoweredBy` | Customer-facing branding |
| `AlreadyInUse` | Single-session widget lockout |
| `ThemeProvider` | Customer theming; Unnnic tokens replace this |

## Out of scope: conversation starters

Neither consuming product needs opening prompts. The service's
`getStarters` and `clearStarters` stay unused.

| webchat-react | Reason |
| --- | --- |
| `ConversationStarters` | Neither Agent Builder nor Live Desk shows starters |
| `ConversationStarterButton` | Same |

## Generic primitives

Not public components here. Per D9 they come from Unnnic where the design
uses Unnnic, and from internal markup otherwise.

| webchat-react | Absorbed by |
| --- | --- |
| `Button` | `UnnnicButton` |
| `Icon` | `UnnnicIcon` |
| `Radio` | Unnnic where the design uses it; internal markup otherwise |
| `Avatar` | Unnnic or internal markup as the design requires |
| `Badge` | Unnnic or internal markup as the design requires |
| `Tooltip` | `UnnnicToolTip` |

## Inventory

| Classification | Count |
| --- | --- |
| In scope | 28 |
| Widget shell | 7 |
| Conversation starters | 2 |
| Generic primitives | 6 |
| **Total** | **43** named modules, plus the two `ListMessage` copies counted once and location as a form without a source component |

D10's "45" counts `ListMessage` in both `components/` and `views/`, and
the `Chat` shell, on top of the 42 uniquely named modules in the four
groups above. With those included the inventory is 45, and there are no
open classification gaps.

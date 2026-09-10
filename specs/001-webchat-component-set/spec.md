# Feature Specification: CX Platform Webchat Component Set

**Feature Branch**: `001-webchat-component-set`

**Created**: 2026-09-09

**Last Updated**: 2026-09-10

**Status**: Draft

**Input**: User description: "Full component set for the CX Platform webchat: conversation thread, composer, suggested replies, products, cart, and voice mode, at parity for both consumers (Agent Builder and Live Desk). Everything that lives inside the chat is in scope; the surrounding widget wrapper and conversation starters are not."

## Overview

Weni's CX Platform has two products that need to present a webchat conversation:
Agent Builder, where a builder tests an agent and compares two agent versions side
by side, and Live Desk, where a human attendant is assisted by a Copilot while
serving a customer. Today each product builds this presentation itself, which means
the same conversation experience is being written twice and drifts apart.

This feature delivers one shared set of conversation building blocks that both
products assemble into their own screens. Scope is drawn around the conversation
itself: everything that appears inside the chat is included, and the widget shell that
a customer's own website would need is not.

## Glossary

- **Consuming product**: an internal Weni CX Platform application that assembles
  these blocks into a screen. Currently Agent Builder and Live Desk.
- **Conversation**: one ordered exchange of messages tied to a single connection.
- **Conversation surface**: one visible conversation on screen. A screen may show
  several at once.
- **Host-owned UI**: content a consuming product supplies to appear inside a block,
  such as Agent Builder's execution trace above an agent message.
- **Presentation variant**: a named preset that changes how a block looks or which
  controls it offers, without changing what the block does.
- **Customer-facing implementation**: the existing React webchat that customers embed
  in their own sites. It is the reference for any block with no approved design of its
  own, and the baseline for capability parity.

## Scope

**In scope**: everything that appears inside the chat. The message thread and every
message form, the composer, indicators, offered replies and suggestions, calls to
action, per-message actions, product presentation, the cart, and spoken mode.

**Out of scope**: the widget shell a customer's own site needs, which the CX Platform
supplies itself. This means the launcher, the widget frame and its header, the
attribution footer, the session-in-use notice, and theme provision. Conversation
starters are also excluded, because neither consuming product needs them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a conversation (Priority: P1)

A person looking at a CX Platform screen can read a full webchat conversation:
every message in order, who sent it, when, whether it is still being delivered, and
whether the other side is currently composing or working on a reply. Messages arrive
in many forms, including text that streams in progressively, images, video, audio,
documents, locations, and placed orders, and each form is legible and actionable.

Two presentations of a message are needed. One is the familiar chat bubble, aligned
by sender, which both products use for the conversation with the customer. The other
is an assistant block, where an icon and a heading sit above a bordered panel of
content, which Live Desk's Copilot uses for what it tells the attendant.

**Why this priority**: Every other story renders inside or below the thread. It is
also the only story that delivers standalone value with no other block present: a
read-only transcript is immediately useful for reviewing an agent run.

**Independent Test**: Supply a fixed set of messages covering every supported form in
both presentations and verify each renders legibly in the correct order with the
correct sender attribution, timestamp, and delivery state, with no composer or other
block mounted.

**Acceptance Scenarios**:

1. **Given** a conversation containing an inbound and an outbound text message,
   **When** the thread is displayed, **Then** the two messages appear in
   chronological order and are visually distinguishable by sender.
2. **Given** a message whose content is still arriving progressively, **When**
   further content arrives, **Then** the visible text grows without the message
   losing its position in the thread.
3. **Given** an outbound message that has not yet been delivered, **When** delivery
   succeeds, **Then** its state indicator changes to delivered without the message
   re-entering the thread.
4. **Given** an outbound message whose delivery fails, **When** the thread is
   displayed, **Then** the failure is visible and distinguishable from a pending
   message.
5. **Given** an image, a video, an audio recording, a document, a location, and a
   placed order, **When** each is displayed, **Then** the recipient can preview, play,
   or open it in place, or reach it through an explicit action for documents.
6. **Given** text containing emphasis, lists, and links, **When** it is displayed,
   **Then** the formatting is rendered and any embedded markup that could execute is
   neutralised.
7. **Given** the other side begins composing, **When** the thread is displayed,
   **Then** an activity indicator appears and is removed once composing stops.
8. **Given** the other side is working on a reply, **When** the thread is displayed,
   **Then** a working indicator appears that is distinct from the composing one.
9. **Given** a conversation longer than the visible area, **When** a new message
   arrives while the reader is at the latest message, **Then** the thread advances
   to show it; **When** the reader has scrolled up to read history, **Then** the
   thread does not yank them away from what they are reading.
10. **Given** earlier history exists beyond what is loaded, **When** the reader
    reaches the top of the thread, **Then** the thread reports that more history is
    wanted and shows that loading is in progress.
11. **Given** the assistant presentation, **When** a message is displayed, **Then** an
    icon and a heading sit above a bordered panel holding the content, and the same
    message data in the bubble presentation renders as an aligned bubble instead.

---

### User Story 2 - Send a message (Priority: P2)

A person can write and send a message from a composer that matches the product they
are in. They can attach a file, record an audio message, record from the camera, and
see clearly when sending is unavailable. Agent Builder's composer additionally offers
a selector for choosing which agent configuration to address, and its voice affordance
is emphasised; Live Desk's composer is deliberately plainer.

**Why this priority**: It turns the read-only thread into a conversation. It is the
second-most requested block and both products already have an approved design for it.

**Independent Test**: Mount the composer alone in each presentation variant, type a
message, and verify the send intent is reported once with the typed content, that
attachment and recording intents are reported, and that each variant shows exactly the
controls its design specifies.

**Acceptance Scenarios**:

1. **Given** an empty composer, **When** the person types text and confirms sending,
   **Then** the send intent is reported exactly once carrying the typed text.
2. **Given** an empty composer, **When** the person attempts to send, **Then** no
   send intent is reported.
3. **Given** a composer, **When** the person inserts a line break, **Then** the
   composer grows to fit the content up to a bounded height and does not send.
4. **Given** the fuller presentation variant, **When** it is displayed, **Then** it
   offers audio recording, attachment, an agent-configuration selector, and an
   emphasised voice affordance.
5. **Given** the plainer presentation variant, **When** it is displayed, **Then** it
   offers attachment and a non-emphasised voice affordance, and does not show an
   agent-configuration selector.
6. **Given** an agent-configuration selector with several options, **When** the
   person picks one, **Then** the selection is reported and reflected in the control.
7. **Given** sending is unavailable, **When** the composer is displayed, **Then**
   every control that would produce a message is visibly and functionally
   unavailable.
8. **Given** an audio recording is in progress, **When** the composer is displayed,
   **Then** elapsed recording time is visible and the person can both finish and
   discard the recording.
9. **Given** camera recording is offered and in progress, **When** it is displayed,
   **Then** the person can see what is being captured and can both finish and discard.
10. **Given** any composer, **When** it is displayed, **Then** all of its wording
    comes from what the consuming product supplied, with no wording built into the
    block itself.

---

### User Story 3 - Show several conversations at once (Priority: P3)

A screen can present more than one conversation at the same time, each with its own
messages, its own activity indicators, its own delivery states, and its own
composer, with no leakage between them. A consuming product can also drive several
conversations from a single shared composer, so that one typed message reaches all
of them.

**Why this priority**: This is the requirement that motivated the whole library.
Agent Builder's version comparison shows two conversations side by side driven by one
composer, and Live Desk keeps a conversation per open room. It is separated from
stories 1 and 2 because it is a guarantee about those blocks rather than a new block.

**Independent Test**: Mount three conversation surfaces with disjoint message sets
simultaneously, drive each independently, and verify that no state, indicator, or
stored value from one appears in another; then unmount one and verify the remaining
two are unaffected.

**Acceptance Scenarios**:

1. **Given** three conversation surfaces mounted together, **When** a message is
   added to the first, **Then** the second and third are unchanged.
2. **Given** two conversation surfaces, **When** the first shows an activity
   indicator, **Then** the second does not.
3. **Given** several conversation surfaces that persist anything between visits,
   **When** each is given a distinct identity by the consuming product, **Then**
   none of them can read or overwrite another's persisted values.
4. **Given** several mounted conversation surfaces, **When** one is removed from the
   screen, **Then** it stops all of its own activity and the others keep working.
5. **Given** two conversation surfaces and one shared composer, **When** a message
   is sent from the shared composer, **Then** both conversations receive it and each
   tracks its own delivery state for it.
6. **Given** a conversation surface is switched to a different conversation, **When**
   the switch completes, **Then** it shows only the new conversation's messages and
   no residue of the previous one.

---

### User Story 4 - Add product-specific content to a message (Priority: P4)

A consuming product can place its own content directly above or below any individual
message without modifying the shared blocks. Agent Builder uses this to show a summary
of the agent's execution above each agent reply, expandable to full detail.

**Why this priority**: Without it, Agent Builder cannot adopt the shared thread at
all, because its execution trace is the main reason its preview exists. It ranks
after the multi-conversation guarantee because Agent Builder needs both, and the
guarantee is the harder constraint.

**Independent Test**: Mount the thread, supply arbitrary host-owned content for
messages matching a chosen condition, and verify the content appears in the intended
position for exactly those messages and that the thread's own rendering is unchanged.

**Acceptance Scenarios**:

1. **Given** host-owned content supplied for inbound messages only, **When** the
   thread is displayed, **Then** that content appears on every inbound message and
   on no outbound message.
2. **Given** host-owned content, **When** it is supplied, **Then** it receives the
   message it is attached to, so it can render details specific to that message.
3. **Given** no host-owned content is supplied, **When** the thread is displayed,
   **Then** messages render with no reserved gap or placeholder.
4. **Given** host-owned content placed above a message, **When** the person expands
   it, **Then** the thread accommodates the growth without disturbing the reading
   position of the message it belongs to.

---

### User Story 5 - Act on what the conversation offers (Priority: P5)

Instead of typing, the person can act on what the conversation puts in front of them.
This covers preset replies attached to a message, standalone suggestions offered to an
attendant, a selectable list of options, and a call to action that leads somewhere
outside the conversation.

It also covers acting on an assistant's reply itself. Live Desk's attendant can copy
what the Copilot drafted, send it to the customer as it stands, or rate it as helpful
or unhelpful so the assistant can improve.

**Why this priority**: It is the first group that is genuinely product-specific rather
than shared, so it can follow the common ones. Live Desk's Copilot needs it to be
useful, but the Copilot is still usable with typed replies only.

**Independent Test**: Supply each offering shape, activate one in each, and verify the
correct choice is reported exactly once, distinguishing sending immediately from
editing first, and distinguishing an offering that sends a message from one that leads
outside the conversation.

**Acceptance Scenarios**:

1. **Given** a message with attached preset replies, **When** the person picks one,
   **Then** that reply's identity is reported exactly once.
2. **Given** standalone suggestions offered to an attendant, **When** the attendant
   chooses to send one directly, **Then** a send-immediately intent is reported.
3. **Given** standalone suggestions offered to an attendant, **When** the attendant
   chooses to refine one, **Then** an edit-first intent is reported and no message is
   sent.
4. **Given** more offered replies than fit the available width, **When** they are
   displayed, **Then** all remain reachable without clipping their wording.
5. **Given** a selectable list of options, **When** the person opens it and picks an
   option, **Then** that option is reported and the list closes.
6. **Given** a message carrying a call to action, **When** the person activates it,
   **Then** they reach the destination in a new context without losing the
   conversation, and the activation is reported so the consuming product can act on it.
7. **Given** a call to action, **When** it is displayed, **Then** it is recognisable as
   leading outside the conversation rather than as sending a reply.
8. **Given** an assistant reply with actions offered, **When** the person copies it,
   **Then** a copy intent is reported carrying the reply's text.
9. **Given** an assistant reply with actions offered, **When** the person sends it,
   **Then** a send intent is reported carrying the reply's identity.
10. **Given** an assistant reply with actions offered, **When** the person rates it
    helpful or unhelpful, **Then** the rating is reported and the chosen rating is
    shown as selected.
11. **Given** an assistant reply where only some actions apply, **When** it is
    displayed, **Then** only those actions are offered, with no gap left by the others.

---

### User Story 6 - Browse and choose products (Priority: P6)

In a commerce conversation, products appear inside the conversation itself. The person
can browse a horizontal set of product cards, see each product's image, name, and
price including any promotion, move through the set, open a product for more detail,
and add one to the cart or remove it.

The same product set appears in two situations that must look consistent: offered to
an attendant inside an assistant reply, where each card can be acted on, and inside a
message already sent to the customer, where the set is a record and carries no actions.

**Why this priority**: It is the entry point to the cart, so it must land before it.
It is also the block with the most reuse pressure, since the same product set has to
work inside a message, which is why it is available on its own rather than only as
part of the thread.

**Independent Test**: Supply a set of products with and without images and with and
without promotional prices, in both the actionable and the record situation, and
verify each card presents its details correctly, that moving through the set works,
and that each action is reported exactly once in the actionable situation and not
offered in the record one.

**Acceptance Scenarios**:

1. **Given** a set of products, **When** it is displayed, **Then** each card shows the
   product's image, name, and price, with the name truncated rather than pushing the
   card out of shape.
2. **Given** a product with a promotional price, **When** its card is displayed,
   **Then** the original price is shown struck through alongside the price now
   payable.
3. **Given** a product with no image, **When** its card is displayed, **Then** a
   placeholder occupies the same space so the cards stay aligned.
4. **Given** more products than fit the available width, **When** the set is
   displayed, **Then** the person can move through it and the control to do so appears
   only while there is more to reach.
5. **Given** the actionable situation, **When** the person adds a product to the cart,
   **Then** the addition is reported carrying the product.
6. **Given** the actionable situation, **When** the person removes a product from the
   set, **Then** the removal is reported carrying the product.
7. **Given** the record situation, **When** the set is displayed, **Then** no card
   offers any action.
8. **Given** a set of many products, **When** it is displayed, **Then** every product
   supplied is reachable, with no cap applied by the presentation itself.
9. **Given** a product opened for more detail, **When** it is displayed, **Then** its
   full name, description, and price are legible, and returning to the set is possible.
10. **Given** a single product referenced inside a text message, **When** it is
    displayed, **Then** it appears inline with its identifying details rather than as a
    full card.

---

### User Story 7 - Review and submit a cart (Priority: P7)

The person can see how many items the cart holds at a glance, open it, review the
items collected so far, adjust how many of each they want, remove items, see what they
will pay including any discount, and submit the order into the conversation.

**Why this priority**: It serves a narrower set of conversations than the blocks
above, and it depends on cart behaviour that does not exist in the shared logic layer
yet, so it cannot be completed before that dependency is resolved.

**Independent Test**: Supply a set of items with prices and discounts, exercise
quantity changes and removal, and verify the displayed quantities, line totals,
summary, and discount reflect the supplied values and that every change and the
submission are reported as intents.

**Acceptance Scenarios**:

1. **Given** a cart holding items, **When** the cart indicator is displayed, **Then**
   it shows how many items are held and opening it is possible.
2. **Given** a cart with several items, **When** it is displayed, **Then** each item
   shows its image, name, unit price including any promotion, quantity, and the total
   for that line.
3. **Given** an item in the cart, **When** the person increases or decreases its
   quantity, **Then** the change is reported carrying the item and the new quantity.
4. **Given** an item at quantity one, **When** the person decreases it, **Then** a
   removal intent is reported rather than a zero quantity.
5. **Given** an item in the cart, **When** the person removes it outright, **Then** a
   removal intent is reported.
6. **Given** a cart with items, **When** it is displayed, **Then** a summary shows the
   subtotal, any discount, and the total, each taken from the values supplied.
7. **Given** a cart with at least one item, **When** the person submits it, **Then**
   a submission intent is reported carrying the current items.
8. **Given** an empty cart, **When** it is displayed, **Then** its empty state is
   shown and submission is unavailable.
9. **Given** displayed money amounts, **When** they are shown, **Then** they are
   formatted according to the locale and currency the consuming product supplied.

---

### User Story 8 - Converse by voice (Priority: P8)

The person can switch the conversation into a spoken mode, see clearly which phase
it is in, follow what has been understood of their speech so far, recover from
failures, and leave the mode to return to typing.

**Why this priority**: It is the most complex block and reaches the fewest
conversations. It depends on voice session behaviour that does not exist in the
shared logic layer yet, so it is sequenced last.

**Independent Test**: Drive the block through every phase and failure state as
supplied input and verify each is distinctly presented, that partial understanding is
displayed as it changes, and that the exit intent is reported from any phase.

**Acceptance Scenarios**:

1. **Given** voice mode is unavailable for a conversation, **When** the composer is
   displayed, **Then** its voice affordance is unavailable.
2. **Given** voice mode is entered, **When** it is starting up, **Then** the
   start-up phase is presented distinctly from active listening.
3. **Given** voice mode is listening, **When** partial understanding of the person's
   speech is supplied, **Then** it is displayed and replaced as it is revised.
4. **Given** voice mode is listening, **When** it is displayed, **Then** an
   indication of captured sound level is visible so the person can tell they are
   being heard.
5. **Given** voice mode is replying aloud, **When** it is displayed, **Then** the
   replying phase is presented distinctly from listening.
6. **Given** voice mode fails, **When** it is displayed, **Then** the failure is
   presented with the reason the consuming product supplied and a way to leave the
   mode.
7. **Given** voice mode in any phase, **When** the person leaves it, **Then** an
   exit intent is reported exactly once.

---

### Edge Cases

- What happens when a message arrives in a form the block set does not recognise?
  It must remain accounted for in the thread rather than silently vanishing, so the
  reader is not shown a conversation with an invisible hole in it.
- What happens when a message carries no content, or content that fails to load,
  such as a broken image or an unplayable recording?
- What happens when a conversation has no messages at all? Each consuming product
  wants its own wording for that state.
- What happens when hundreds of messages are supplied at once, for example when a
  long history is restored?
- What happens when a person sends messages faster than they are acknowledged?
- What happens when supplied wording is far longer than the design anticipated, such
  as a suggestion of several sentences or a product name that does not wrap?
- What happens when a conversation surface is removed from the screen while a
  recording, playback, or voice session is still active?
- What happens when the same message identity is supplied twice?
- What happens when the reading direction, font size, or available width differs
  substantially from the reference designs?
- What happens when a call to action has no destination, or a destination that cannot
  be reached?
- What happens when text formatting arrives containing markup that would execute if
  rendered as-is?
- What happens when a product set holds far more products than fit, given that no cap
  is applied?
- What happens when a product has no price, or a promotional price above the original?
- What happens when a cart's supplied total disagrees with the sum of its lines?

## Requirements *(mandatory)*

### Functional Requirements

**Composition and contract**

- **FR-001**: Every block MUST receive the data it displays from the consuming
  product and MUST report every person-initiated action back to it as an intent,
  without carrying out that action itself.
- **FR-002**: Every block MUST be usable without any connection or conversation
  logic present, so that a consuming product can render it from data it already holds.
- **FR-003**: Blocks MUST NOT contain any wording shown to a person. All labels,
  placeholders, empty states, error wording, and accessible names MUST be supplied by
  the consuming product.
- **FR-004**: The block set MUST own and define the conversation data contract it
  renders, rather than adopting the shape produced by the shared logic layer. The
  contract MUST be normalised, meaning each concept is expressed exactly once and a
  field is optional only where its absence carries meaning. A consuming product that
  keeps its own message shape MUST be able to map into the contract in a single place.
  Translating the shared logic layer's shape into the contract MUST be supplied as part
  of this feature, so that no consuming product writes that translation itself and the
  shared layer's redundant fields are reconciled in exactly one place rather than
  inside every block.
- **FR-005**: Where the two consuming products need the same block to look or behave
  differently, that difference MUST be offered as a named presentation variant of one
  block. Separate blocks per product MUST NOT be provided.
- **FR-006**: A consuming product MUST be able to place its own content above and
  below any individual message, and that content MUST receive the message it is
  attached to.
- **FR-007**: Every intent a block reports MUST be reported exactly once per person
  action, and MUST carry enough information to identify what the action applied to.
- **FR-008**: Blocks that appear nested inside another block MUST also be available on
  their own, so a consuming product can place them in its own layout. This applies at
  minimum to the product set, which appears inside a message and must also be usable
  outside one.

**Conversation presentation**

- **FR-009**: The thread MUST present messages in chronological order and MUST make
  sender direction visually unambiguous.
- **FR-010**: The thread MUST present text, image, video, audio, document, location,
  and placed-order messages, and MUST keep any message whose form it does not
  recognise accounted for rather than dropping it.
- **FR-011**: Message text MUST render supplied formatting, including emphasis, lists,
  and links, and MUST neutralise any markup capable of executing before display.
- **FR-012**: A message MUST be presentable either as a bubble aligned by sender or as
  an assistant block with an icon and heading above a bordered content panel, chosen by
  the consuming product without changing the message data.
- **FR-013**: The thread MUST present text that arrives progressively without
  reordering or remounting the message as content grows.
- **FR-014**: The thread MUST distinguish pending, delivered, read, and failed delivery
  for outbound messages.
- **FR-015**: The thread MUST present activity indicators for the other side
  composing and for the other side working on a reply, and these MUST be distinct.
- **FR-016**: The thread MUST advance to a newly arrived message when the reader is
  already at the latest message, and MUST NOT move the reader when they have scrolled
  back to read history.
- **FR-017**: The thread MUST report when the reader has reached the start of loaded
  history so more can be requested, and MUST be able to present that loading is in
  progress.
- **FR-018**: Timestamps and money amounts MUST be formatted using the locale and
  currency supplied by the consuming product.

**Independence between conversations**

- **FR-019**: Every block MUST support an unbounded number of simultaneous instances
  on one screen, each holding entirely separate state.
- **FR-020**: No block MUST share mutable state between its instances, and no block
  MUST rely on a browser-wide or document-wide identifier that two instances could
  collide on.
- **FR-021**: Any block that persists anything between visits MUST derive its storage
  identity from a value the consuming product supplies, and MUST NOT choose that
  identity itself.
- **FR-022**: When a block is removed from the screen it MUST stop all of its own
  ongoing activity, including recordings, playback, timers, and voice sessions.
- **FR-023**: A consuming product MUST be able to drive several conversations from one
  shared composer, and each conversation MUST track its own delivery state
  independently for the resulting message.

**Composing**

- **FR-024**: The composer MUST support multi-line text entry that grows to fit
  content up to a bounded height, and MUST distinguish confirming a send from
  inserting a line break.
- **FR-025**: The composer MUST NOT report a send intent for content that is empty or
  only whitespace.
- **FR-026**: The composer MUST offer attaching a file, recording an audio message,
  recording from the camera, and entering spoken mode, and MUST allow each to be
  individually unavailable.
- **FR-027**: While a recording is in progress the composer MUST present its progress
  and MUST offer both finishing and discarding it. For audio this means elapsed time;
  for camera this means what is being captured.
- **FR-028**: The composer MUST offer a selector for choosing which agent
  configuration a message addresses, and MUST be usable with that selector absent.
- **FR-029**: When sending is unavailable, every composer control that would produce a
  message MUST be presented and behave as unavailable.
- **FR-030**: The composer MUST support having its text content controlled by the
  consuming product, so that one composer can serve several conversations.

**Offerings and per-message actions**

- **FR-031**: Preset replies attached to a message MUST be selectable, and the
  selection MUST be reported identifying the chosen reply.
- **FR-032**: Standalone suggestions MUST distinguish a request to send immediately
  from a request to place the suggestion into the composer for editing.
- **FR-033**: Offered replies MUST remain reachable and legible when there are more of
  them than fit the available width.
- **FR-034**: A selectable list of options MUST be presentable, and choosing an option
  MUST be reported.
- **FR-035**: A message MUST be able to carry a call to action that leads to a
  destination outside the conversation, presented so that it is distinguishable from
  an offering that sends a reply.
- **FR-036**: Activating a call to action MUST take the person to its destination in a
  new context, so the conversation is not replaced, and MUST also report the activation
  so the consuming product can record or intercept it.
- **FR-037**: A call to action MUST be presentable as unavailable, and while
  unavailable MUST NOT lead anywhere or report an activation.
- **FR-038**: A message MUST be able to offer actions upon itself, covering at minimum
  copying its text, sending it onward, and rating it helpful or unhelpful. Each action
  MUST be individually omittable, and the set MUST report which action was taken.
- **FR-039**: A rating, once given, MUST be presented as chosen until the consuming
  product supplies a different value.

**Products**

- **FR-040**: A horizontally browsable set of products MUST be presentable, showing
  each product's image, name, and price, and MUST report when a product is selected.
- **FR-041**: The product set MUST be available on its own as well as inside a message,
  because both consuming products need it in both positions.
- **FR-042**: A product with a promotional price MUST show the original price struck
  through alongside the price now payable, and a product with no image MUST show a
  placeholder occupying the same space.
- **FR-043**: A product name too long for its card MUST be truncated rather than
  distorting the card.
- **FR-044**: The product set MUST offer a way to move through products that do not
  fit, and that control MUST appear only while there is more to reach.
- **FR-045**: The product set MUST support an actionable presentation and a record
  presentation. In the actionable presentation each card can be added to the cart or
  removed, a product already in the cart shows its quantity and allows that quantity
  to be changed from the card, and every action is reported. In the record
  presentation no card offers any action.
- **FR-046**: The product set MUST present every product supplied, without a cap of
  its own. Any per-message limit a delivery platform imposes belongs to whoever
  composes the outbound message, not to the presentation.
- **FR-047**: A single product MUST be presentable inline within a message, a product
  MUST be presentable in expanded detail with its full name, description, and price,
  and a set of products grouped into titled sections MUST be presentable.

**Cart**

- **FR-048**: A cart indicator MUST present how many items the cart holds and MUST
  report a request to open the cart.
- **FR-049**: The cart MUST present each item with its image, name, unit price
  including any promotion, quantity, and line total.
- **FR-050**: The cart MUST present a summary of the subtotal, any discount, and the
  total, from the values supplied.
- **FR-051**: The cart MUST report quantity changes and item removals as intents, and
  MUST report a removal rather than a zero quantity when the last unit is removed.
- **FR-052**: The cart MUST report a submission intent carrying the current items, and
  MUST make submission unavailable while empty.
- **FR-053**: The cart MUST NOT compute prices, line totals, subtotals, discounts, or
  totals; it MUST present the values supplied to it.

**Spoken mode**

- **FR-054**: Spoken mode MUST present start-up, listening, working, and replying as
  visually distinct phases.
- **FR-055**: Spoken mode MUST present partial understanding of speech as it is
  supplied and replace it as it is revised.
- **FR-056**: Spoken mode MUST present an indication of captured sound level while
  listening.
- **FR-057**: Spoken mode MUST present failures using the reason supplied and MUST
  always offer a way to leave the mode.
- **FR-058**: Spoken mode MUST report an exit intent exactly once, from any phase.
- **FR-059**: Spoken mode MUST NOT capture audio, transcribe speech, synthesise
  speech, or manage a voice session; it MUST present the phase and content supplied.

**Consistency and access**

- **FR-060**: Every block MUST take its colours, spacing, corner radii, typography,
  and shadows from the platform design system's tokens.
- **FR-061**: Where the platform design system ships a component that matches the
  approved design, that component MUST be used rather than reimplemented. Where the
  approved design does not match one, the block MUST be built from tokens. The design
  decides, not the availability of a component.
- **FR-062**: A block with an approved design MUST match it. A block without one MUST
  follow the customer-facing implementation's behaviour and be confirmed in design
  review before release.
- **FR-063**: Every interactive element MUST be reachable and operable by keyboard,
  and MUST expose an accessible name from wording the consuming product supplied.
- **FR-064**: State conveyed by colour alone MUST also be conveyed by text, shape, or
  icon.
- **FR-065**: Newly arrived messages and phase changes MUST be announced to assistive
  technology without interrupting reading of earlier content.

**Adoption**

- **FR-066**: Each block MUST be inspectable in every presentation variant and state
  in a browsable catalogue, which MUST also document how to use the block, so a
  reviewer can verify design fidelity and an engineer can integrate it without running
  a consuming product or reading library source.
- **FR-067**: Every capability inside the chat that the customer-facing implementation
  provides MUST be provided here. Any that is not yet MUST be recorded as a known gap
  and kept current.

### Key Entities

- **Conversation**: an ordered collection of messages belonging to one connection,
  together with whether the other side is currently composing or working, and whether
  more history exists earlier.
- **Message**: one entry in a conversation. Carries a stable identity, a direction
  (inbound or outbound), a form (text, image, video, audio, document, location, order,
  or an unrecognised form), its content, a moment in time, a delivery state for
  outbound messages, and optionally preset replies, a call to action, offered actions,
  or a product set.
- **Message presentation**: whether a message renders as an aligned bubble or as an
  assistant block with icon, heading, and bordered panel.
- **Preset reply**: an offered response carrying wording to show and an identity to
  report when chosen.
- **Suggestion**: an offered response to an attendant, which can either be sent
  immediately or moved into the composer for editing.
- **Call to action**: an offering attached to a message that carries wording to show
  and a destination outside the conversation, and can be unavailable.
- **Message action**: an operation on a message itself, being copy, send onward, or a
  helpful or unhelpful rating, with the current rating if one was given.
- **Product**: an item that can appear in a product set or a cart. Carries a stable
  identity, a name, an optional image, an optional description, a unit price, and
  optionally a promotional price.
- **Product set**: an ordered collection of products presented horizontally, either
  actionable or as a record.
- **Cart**: a collection of products with quantities and line totals, plus the
  subtotal, discount, and total supplied for them, and a count for its indicator.
- **Agent configuration option**: a selectable choice in the composer identifying
  which agent configuration a message addresses.
- **Spoken mode state**: the current phase of a spoken conversation, the partial
  understanding of speech so far, the captured sound level, and any failure reason.
- **Presentation variant**: a named preset selecting how a block looks and which
  controls it offers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both consuming products present a webchat conversation using only these
  shared blocks, with no conversation presentation code duplicated between them.
- **SC-002**: Three conversations can be shown and driven simultaneously on one screen
  with zero observed leakage of messages, indicators, or persisted values between them.
- **SC-003**: A screen showing two conversations driven by one shared composer
  delivers a single typed message to both, with each tracking its own delivery state.
- **SC-004**: Agent Builder attaches its own execution-trace content to individual
  agent messages without any change to the shared blocks.
- **SC-005**: A frontend engineer integrates the thread and composer into a screen for
  the first time in under one working day, using the catalogue and documentation alone.
- **SC-006**: Every block renders correctly with no wording of its own, verified by
  rendering the full set in a second language with no untranslated text appearing.
- **SC-007**: A conversation of 500 messages remains scrollable and responsive to
  reading and typing without perceptible stalling.
- **SC-008**: Every interactive element in every block is reachable and operable by
  keyboard alone, and every block passes automated accessibility checks with no
  violations.
- **SC-009**: Every block matches its approved design for each consuming product, as
  confirmed by design review against the catalogue.
- **SC-010**: Removing a conversation from the screen leaves no ongoing recording,
  playback, timer, or voice session, verified with no residual activity after unmount.
- **SC-011**: Every in-chat capability of the customer-facing implementation is either
  provided here or recorded as a known gap, with none unrecorded.
- **SC-012**: The product set is used unchanged both inside a message and standalone,
  proving the reuse that FR-041 requires.
- **SC-013**: Message text containing markup capable of executing renders as inert
  content, verified by a test for each formatting form supported.

## Assumptions

- The two consuming products are Agent Builder and Live Desk. No external customer
  consumes this block set; customers continue to use the customer-facing
  implementation, which keeps its own design.
- Approved designs exist for the composer in both products, for the Copilot's assistant
  message with its actions, for the product set, and for the cart, and are the reference
  for those blocks. Blocks without an approved design follow the customer-facing
  implementation and are confirmed in design review before release.
- The platform design system supplies tokens for everything visual, and supplies
  components for a subset. The approved designs use its button, chip, and icon
  directly, and specify bespoke construction for the message, the composer, the product
  set, and the cart. FR-061 encodes that the design decides which applies.
- Connection handling, session handling, message transport, history retrieval, and
  media encoding already exist in the shared logic layer and are not rebuilt here.
- The shared logic layer's own message shape is transport-oriented and carries
  historical compatibility baggage: identity is expressed by two competing fields,
  direction by four values across two competing fields, and nearly everything is
  optional. Its published declarations are also already out of step with what it
  actually produces, declaring a timestamp as a number where order messages emit text,
  omitting the order form from its list of message forms, and omitting the call to
  action field entirely. This is why FR-004 keeps the presentation contract separate:
  adopting that shape would push defensive branching into every block and freeze the
  shared layer's compatibility concerns into this feature's public contract.
- Cart behaviour and voice session behaviour do **not** yet exist in the shared logic
  layer. Stories 7 and 8 specify the presentation only and are sequenced last so the
  missing behaviour can be added to the shared logic layer first, rather than being
  implemented inside these blocks.
- Recording an audio message, recording from the camera, and entering spoken mode are
  three separate capabilities with separate controls.
- A call to action both navigates and reports. The customer-facing implementation only
  navigates, but a CX Platform product needs to record or intercept the activation, and
  navigating without reporting would make that impossible. Navigating is kept because
  an offering that leads somewhere should behave like a link, including opening in a new
  context and supporting the browser's own ways of following it.
- The product set imposes no item limit. The approved design annotates a ten-item cap
  because that is what WhatsApp accepts in one message, but neither existing
  implementation caps anything: the customer-facing implementation has no product
  limit in its source, and Live Desk's own carousel renders everything it is given
  behind horizontal scrolling. The cap constrains what may be delivered, which belongs
  to whoever composes the outbound message.
- Blocks with no approved design of their own follow the customer-facing
  implementation's behaviour, and where Live Desk has already built the block, that
  existing implementation is the reference for both behaviour and construction.
- Each consuming product owns its own translations and supplies all wording, because
  each already maintains its own translation catalogue and pipeline.
- Live Desk shows one conversation at a time and switches it as the attendant changes
  room, while holding several connections open. Agent Builder shows two at once. The
  block set does not assume either arrangement.
- The block set does not persist anything on its own behalf. Where persistence is
  needed, the identity comes from the consuming product.
- Rendering very long conversations relies on ordinary scrolling. Windowed or
  virtualised rendering is out of scope unless the 500-message target is missed.
- Light and dark presentation follows the platform design system automatically. No
  separate theming interface is offered.

## Dependencies

- **Shared logic layer, cart behaviour**: story 7 cannot be completed until cart
  contents, quantities, line totals, subtotals, discounts, and totals are owned by the
  shared logic layer.
- **Shared logic layer, voice session behaviour**: story 8 cannot be completed until
  voice session phases, speech capture, and speech synthesis are owned by the shared
  logic layer. This behaviour currently lives inside the customer-facing implementation
  and has already been copied once by Live Desk.
- **Platform design system**: any token this block set needs must exist there. A
  missing token is resolved by adding it there, not by working around it.
- **Approved designs**: blocks without an approved design for a consuming product need
  one before that product can adopt them.
- **Shared logic layer, declaration accuracy**: the mismatches noted in Assumptions
  should be corrected at the source. This feature is not blocked by them, because
  FR-004 absorbs them in one translation step, but leaving them uncorrected means that
  translation carries permanent compensating logic.

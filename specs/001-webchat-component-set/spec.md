# Feature Specification: CX Platform Webchat Component Set

**Feature Branch**: `001-webchat-component-set`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "Full component set for the CX Platform webchat: conversation thread, composer, suggested replies, cart, and voice mode, at parity for both consumers (Agent Builder and Live Desk)."

## Overview

Weni's CX Platform has two products that need to present a webchat conversation:
Agent Builder, where a builder tests an agent and compares two agent versions side
by side, and Live Desk, where a human attendant is assisted by a Copilot while
serving a customer. Today each product builds this presentation itself, which means
the same conversation experience is being written twice and drifts apart.

This feature delivers one shared set of conversation building blocks that both
products assemble into their own screens. The blocks cover everything a webchat
conversation can contain, so that neither product has to reinvent a message bubble,
a composer, a cart, or a voice indicator again.

## Glossary

- **Consuming product**: an internal Weni CX Platform application that assembles
  these blocks into a screen. Currently Agent Builder and Live Desk.
- **Conversation**: one ordered exchange of messages tied to a single connection.
- **Conversation surface**: one visible conversation on screen. A screen may show
  several at once.
- **Host-owned UI**: content a consuming product supplies to appear inside a block,
  such as Agent Builder's execution logs above an agent message.
- **Presentation variant**: a named preset that changes how a block looks or which
  controls it offers, without changing what the block does.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a conversation (Priority: P1)

A person looking at a CX Platform screen can read a full webchat conversation:
every message in order, who sent it, when, whether it is still being delivered, and
whether the other side is currently composing a reply. Messages arrive in many
forms, including text that streams in progressively, images, video, audio, and file
attachments, and each form is legible and actionable.

**Why this priority**: Every other story renders inside or below the thread. It is
also the only story that delivers standalone value with no other block present: a
read-only transcript is immediately useful for reviewing an agent run.

**Independent Test**: Supply a fixed set of messages covering every supported form
and verify each renders legibly in the correct order with the correct sender
attribution, timestamp, and delivery state, with no composer or other block mounted.

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
5. **Given** an image, a video, an audio recording, and a document attachment,
   **When** each is displayed, **Then** the recipient can preview or play it
   in place, or reach it through an explicit action for documents.
6. **Given** the other side begins composing, **When** the thread is displayed,
   **Then** an activity indicator appears and is removed once composing stops.
7. **Given** a conversation longer than the visible area, **When** a new message
   arrives while the reader is at the latest message, **Then** the thread advances
   to show it; **When** the reader has scrolled up to read history, **Then** the
   thread does not yank them away from what they are reading.
8. **Given** earlier history exists beyond what is loaded, **When** the reader
   reaches the top of the thread, **Then** the thread reports that more history is
   wanted and shows that loading is in progress.

---

### User Story 2 - Send a message (Priority: P2)

A person can write and send a message from a composer that matches the product they
are in. They can attach a file, record an audio message, and see clearly when
sending is unavailable. Agent Builder's composer additionally offers a selector for
choosing which agent configuration to address, and its send affordance is emphasised;
Live Desk's composer is deliberately plainer.

**Why this priority**: It turns the read-only thread into a conversation. It is the
second-most requested block and both products already have an approved design for it.

**Independent Test**: Mount the composer alone in each presentation variant, type a
message, and verify the send intent is reported once with the typed content, that
attachment and audio-recording intents are reported, and that each variant shows
exactly the controls its design specifies.

**Acceptance Scenarios**:

1. **Given** an empty composer, **When** the person types text and confirms sending,
   **Then** the send intent is reported exactly once carrying the typed text.
2. **Given** an empty composer, **When** the person attempts to send, **Then** no
   send intent is reported.
3. **Given** a composer, **When** the person inserts a line break, **Then** the
   composer grows to fit the content up to a bounded height and does not send.
4. **Given** the Agent Builder presentation variant, **When** it is displayed,
   **Then** it offers audio recording, attachment, an agent-configuration selector,
   and an emphasised voice affordance.
5. **Given** the Live Desk presentation variant, **When** it is displayed, **Then**
   it offers attachment and a non-emphasised voice affordance, and does not show an
   agent-configuration selector.
6. **Given** an agent-configuration selector with several options, **When** the
   person picks one, **Then** the selection is reported and reflected in the control.
7. **Given** sending is unavailable, **When** the composer is displayed, **Then**
   every control that would produce a message is visibly and functionally
   unavailable.
8. **Given** an audio recording is in progress, **When** the composer is displayed,
   **Then** elapsed recording time is visible and the person can both finish and
   discard the recording.
9. **Given** any composer, **When** it is displayed, **Then** all of its wording
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
message without modifying the shared blocks. Agent Builder uses this to show the
agent's execution trace above each agent reply, expandable to full detail.

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

### User Story 5 - Choose from offered replies (Priority: P5)

When the conversation offers preset replies, the person can pick one instead of
typing. These arrive in two shapes: replies attached to a message, and standalone
suggestions offered to an attendant. Live Desk's attendant can either send a
suggestion straight away or drop it into their own composer to edit first. Richer
offerings are also supported: a selectable list of options, and a horizontally
browsable set of products.

**Why this priority**: It is the first block that is genuinely product-specific
rather than shared, so it can follow the common ones. Live Desk's Copilot needs it
to be useful, but the Copilot is still usable with typed replies only.

**Independent Test**: Supply each offering shape, activate one option in each, and
verify the correct choice is reported once, distinguishing a request to send
immediately from a request to edit first.

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
6. **Given** a browsable set of products, **When** the person moves through it,
   **Then** each product's identifying details stay legible and selecting one is
   reported.

---

### User Story 6 - Review and submit a cart (Priority: P6)

In a commerce conversation, the person can review the items collected so far, adjust
how many of each they want, remove items, see what they will pay including any
discount, and submit the order into the conversation.

**Why this priority**: It serves a narrower set of conversations than the blocks
above, and it depends on cart behaviour that does not exist in the shared logic layer
yet, so it cannot be completed before that dependency is resolved.

**Independent Test**: Supply a set of items with prices and discounts, exercise
quantity changes and removal, and verify the displayed quantities, totals, and
discount reflect the supplied values and that every change and the submission are
reported as intents.

**Acceptance Scenarios**:

1. **Given** a cart with several items, **When** it is displayed, **Then** each item
   shows its identifying details, unit price, and quantity, alongside a total and any
   discount.
2. **Given** an item in the cart, **When** the person increases or decreases its
   quantity, **Then** the change is reported carrying the item and the new quantity.
3. **Given** an item at quantity one, **When** the person decreases it, **Then** a
   removal intent is reported rather than a zero quantity.
4. **Given** a cart with at least one item, **When** the person submits it, **Then**
   a submission intent is reported carrying the current items.
5. **Given** an empty cart, **When** it is displayed, **Then** submission is
   unavailable.
6. **Given** displayed money amounts, **When** they are shown, **Then** they are
   formatted according to the locale and currency the consuming product supplied.

---

### User Story 7 - Converse by voice (Priority: P7)

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
- **FR-004**: The block set MUST expose the conversation data shape it renders as a
  documented contract, so a consuming product that keeps its own message shape can map
  into it once. [NEEDS CLARIFICATION: should this contract be a shape owned and defined
  by this block set, or the shape already produced by the shared logic layer?]
- **FR-005**: Where the two consuming products need the same block to look or behave
  differently, that difference MUST be offered as a named presentation variant of one
  block. Separate blocks per product MUST NOT be provided.
- **FR-006**: A consuming product MUST be able to place its own content above and
  below any individual message, and that content MUST receive the message it is
  attached to.
- **FR-007**: Every intent a block reports MUST be reported exactly once per person
  action, and MUST carry enough information to identify what the action applied to.

**Conversation presentation**

- **FR-008**: The thread MUST present messages in chronological order and MUST make
  sender direction visually unambiguous.
- **FR-009**: The thread MUST present text, image, video, audio, and document
  messages, and MUST keep any message whose form it does not recognise accounted for
  rather than dropping it.
- **FR-010**: The thread MUST present text that arrives progressively without
  reordering or remounting the message as content grows.
- **FR-011**: The thread MUST distinguish pending, delivered, and failed delivery for
  outbound messages.
- **FR-012**: The thread MUST present activity indicators for the other side
  composing and for the other side working on a reply, and these MUST be distinct.
- **FR-013**: The thread MUST advance to a newly arrived message when the reader is
  already at the latest message, and MUST NOT move the reader when they have scrolled
  back to read history.
- **FR-014**: The thread MUST report when the reader has reached the start of loaded
  history so more can be requested, and MUST be able to present that loading is in
  progress.
- **FR-015**: Timestamps and money amounts MUST be formatted using the locale and
  currency supplied by the consuming product.

**Independence between conversations**

- **FR-016**: Every block MUST support an unbounded number of simultaneous instances
  on one screen, each holding entirely separate state.
- **FR-017**: No block MUST share mutable state between its instances, and no block
  MUST rely on a browser-wide or document-wide identifier that two instances could
  collide on.
- **FR-018**: Any block that persists anything between visits MUST derive its storage
  identity from a value the consuming product supplies, and MUST NOT choose that
  identity itself.
- **FR-019**: When a block is removed from the screen it MUST stop all of its own
  ongoing activity, including recordings, playback, timers, and voice sessions.
- **FR-020**: A consuming product MUST be able to drive several conversations from one
  shared composer, and each conversation MUST track its own delivery state
  independently for the resulting message.

**Composing**

- **FR-021**: The composer MUST support multi-line text entry that grows to fit
  content up to a bounded height, and MUST distinguish confirming a send from
  inserting a line break.
- **FR-022**: The composer MUST NOT report a send intent for content that is empty or
  only whitespace.
- **FR-023**: The composer MUST offer attaching a file, recording an audio message,
  and entering spoken mode, and MUST allow each to be individually unavailable.
- **FR-024**: While an audio recording is in progress the composer MUST present
  elapsed time and MUST offer both finishing and discarding the recording.
- **FR-025**: The composer MUST offer a selector for choosing which agent
  configuration a message addresses, and MUST be usable with that selector absent.
- **FR-026**: When sending is unavailable, every composer control that would produce a
  message MUST be presented and behave as unavailable.
- **FR-027**: The composer MUST support having its text content controlled by the
  consuming product, so that one composer can serve several conversations.

**Offered replies and rich content**

- **FR-028**: Preset replies attached to a message MUST be selectable, and the
  selection MUST be reported identifying the chosen reply.
- **FR-029**: Standalone suggestions MUST distinguish a request to send immediately
  from a request to place the suggestion into the composer for editing.
- **FR-030**: Offered replies MUST remain reachable and legible when there are more of
  them than fit the available width.
- **FR-031**: A selectable list of options MUST be presentable, and choosing an option
  MUST be reported.
- **FR-032**: A horizontally browsable set of products MUST be presentable, and
  selecting a product MUST be reported.

**Cart**

- **FR-033**: The cart MUST present each item with its identifying details, unit
  price, and quantity, and MUST present the total and any discount from the values
  supplied.
- **FR-034**: The cart MUST report quantity changes and item removals as intents, and
  MUST report a removal rather than a zero quantity when the last unit is removed.
- **FR-035**: The cart MUST report a submission intent carrying the current items, and
  MUST make submission unavailable while empty.
- **FR-036**: The cart MUST NOT compute prices, totals, or discounts itself; it MUST
  present the values supplied to it.

**Spoken mode**

- **FR-037**: Spoken mode MUST present start-up, listening, working, and replying as
  visually distinct phases.
- **FR-038**: Spoken mode MUST present partial understanding of speech as it is
  supplied and replace it as it is revised.
- **FR-039**: Spoken mode MUST present an indication of captured sound level while
  listening.
- **FR-040**: Spoken mode MUST present failures using the reason supplied and MUST
  always offer a way to leave the mode.
- **FR-041**: Spoken mode MUST report an exit intent exactly once, from any phase.
- **FR-042**: Spoken mode MUST NOT capture audio, transcribe speech, synthesise
  speech, or manage a voice session; it MUST present the phase and content supplied.

**Consistency and access**

- **FR-043**: Every block MUST take its colours, spacing, corner radii, typography,
  and icons from the platform design system, and MUST match the approved designs for
  each consuming product.
- **FR-044**: Every interactive element MUST be reachable and operable by keyboard,
  and MUST expose an accessible name from wording the consuming product supplied.
- **FR-045**: State conveyed by colour alone MUST also be conveyed by text, shape, or
  icon.
- **FR-046**: Newly arrived messages and phase changes MUST be announced to assistive
  technology without interrupting reading of earlier content.

**Adoption**

- **FR-047**: Each block MUST be inspectable in every presentation variant and state
  in a browsable catalogue, so a reviewer can verify design fidelity without running a
  consuming product.
- **FR-048**: The set of webchat capabilities present in the customer-facing webchat
  implementation but absent from this block set MUST be recorded and kept current.

### Key Entities

- **Conversation**: an ordered collection of messages belonging to one connection,
  together with whether the other side is currently composing or working, and whether
  more history exists earlier.
- **Message**: one entry in a conversation. Carries a stable identity, a direction
  (inbound or outbound), a form (text, image, video, audio, document, or an
  unrecognised form), its content, a moment in time, a delivery state for outbound
  messages, and optionally preset replies or rich content.
- **Preset reply**: an offered response carrying wording to show and an identity to
  report when chosen.
- **Suggestion**: an offered response to an attendant, which can either be sent
  immediately or moved into the composer for editing.
- **Product**: an item that can appear in a browsable set or a cart. Carries a stable
  identity, identifying details, a unit price, and optionally a promotional price.
- **Cart**: a collection of products with quantities, plus the total and discount
  supplied for them.
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
- **SC-011**: Capability gaps against the customer-facing webchat implementation are
  recorded, and each is either scheduled or explicitly accepted, with none unrecorded.

## Assumptions

- The two consuming products are Agent Builder and Live Desk. No external customer
  consumes this block set; customers continue to use the customer-facing webchat
  implementation, which keeps its own design.
- Approved designs exist for the composer in both products and for standalone
  suggestions in Live Desk, and are the reference for those blocks. Blocks without an
  approved design follow the platform design system and are confirmed in design review
  before release.
- Connection handling, session handling, message transport, history retrieval, and
  media encoding already exist in the shared logic layer and are not rebuilt here.
- Cart behaviour and voice session behaviour do **not** yet exist in the shared logic
  layer. Stories 6 and 7 specify the presentation only and are sequenced last so the
  missing behaviour can be added to the shared logic layer first, rather than being
  implemented inside these blocks.
- Recording an audio message and entering spoken mode are two separate capabilities
  with separate controls, as shown in the approved Agent Builder design.
- Each consuming product owns its own translations and supplies all wording, because
  each already maintains its own translation catalogue and pipeline.
- Live Desk shows one conversation at a time and switches it as the attendant changes
  room, while holding several connections open. Agent Builder shows two at once. The
  block set does not assume either arrangement.
- The block set does not persist anything on its own behalf. Where persistence is
  needed, the identity comes from the consuming product.
- Rendering very long conversations relies on ordinary scrolling. Windowed or
  virtualised rendering is out of scope unless the 500-message target is missed.
- Video recording from the camera is out of scope, as neither approved design offers
  it, even though the shared logic layer supports it.
- Light and dark presentation follows the platform design system automatically. No
  separate theming interface is offered.

## Dependencies

- **Shared logic layer, cart behaviour**: story 6 cannot be completed until cart
  contents, quantities, totals, and discounts are owned by the shared logic layer.
- **Shared logic layer, voice session behaviour**: story 7 cannot be completed until
  voice session phases, speech capture, and speech synthesis are owned by the shared
  logic layer. This behaviour currently lives inside the customer-facing webchat
  implementation and has already been copied once by Live Desk.
- **Platform design system**: any colour, spacing, or icon this block set needs must
  exist there. A missing value is resolved by adding it there, not by working around it.
- **Approved designs**: blocks without an approved design for a consuming product need
  one before that product can adopt them.

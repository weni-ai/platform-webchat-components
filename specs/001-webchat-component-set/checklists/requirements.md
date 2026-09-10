# Specification Quality Checklist: CX Platform Webchat Component Set

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-09
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Validation Notes

**Iteration 1 findings and resolutions**:

1. *Implementation detail leakage* — the first draft named Vue concepts (props,
   emits, slots, `v-model`) and concrete component names throughout. Rewritten in
   capability language: "receives the data it displays", "reports an intent",
   "host-owned content above and below a message". A Glossary was added so
   non-technical readers can follow terms like conversation surface and presentation
   variant.

2. *Technology-specific success criteria* — earlier criteria referenced coverage
   percentages and bundle size. Replaced with user- and business-observable outcomes
   (SC-001 no duplicated presentation code, SC-005 first integration under one working
   day, SC-007 500-message responsiveness, SC-008 keyboard operability).

3. *Untestable wording* — "works well with many instances" replaced with the concrete
   three-simultaneous-conversations criterion in SC-002 and the acceptance scenarios of
   story 3.

4. *Unbounded scope* — the request was the full component set, which risked an
   open-ended spec. Bounded by naming exclusions explicitly in Assumptions (video
   recording, virtualised rendering, separate theming interface, external customers)
   and by recording the two shared-logic-layer gaps in Dependencies.

**Iteration 2 — clarification resolved**:

`FR-004` asked whether the conversation data contract should be owned by this block
set or adopted from the shared logic layer. Resolved in favour of **owning it**, after
inspecting what the shared layer actually publishes and produces:

- Identity is declared twice (`id` and `ID`, the latter noted as history
  compatibility), and both are optional.
- Direction is declared twice, once as a four-valued field covering two concepts
  (`incoming`/`outgoing`/`in`/`out`) and again as a separate sender field, both optional.
- The declared message forms omit the order form, which its builders do emit.
- Timestamp is declared as a number, but order messages are built with text.
- Almost every field is optional, and one field uses a different naming convention
  from the rest.

Adopting that shape would have required every block to branch defensively over those
inconsistencies, and would have frozen the shared layer's backward-compatibility
concerns into this feature's public contract, which the constitution's versioning
principle then makes expensive to change. Owning a normalised contract confines the
reconciliation to one translation step.

The main argument against owning a contract — an extra place to update whenever the
shared layer gains a message form — turns out to be weak: presenting a new message
form requires a new block regardless, so extending the contract alongside it is
marginal work rather than duplicated work.

Recorded in the spec as the resolved `FR-004`, with the supporting evidence in
Assumptions and a follow-up for the shared layer in Dependencies.

**Iteration 3 — scope amended during planning**:

Planning research compared the spec against the 45 components in the customer-facing
implementation and found four capabilities uncovered. Two of them, calls to action and
conversation starters, were confirmed in scope and added: FR-049 through FR-052, four
acceptance scenarios on story 5, two entities, three edge cases, and supporting
assumptions. Story 5 was retitled from "Choose from offered replies" to "Act on what
the conversation offers", since it no longer covers replies alone.

The new requirements are numbered after FR-048 rather than beside the other offerings.
The surrounding numbers were already referenced from `plan.md`, `data-model.md`, and
`contracts/public-api.md`, so renumbering would have silently invalidated those
references. A pointer in the offerings subsection makes them discoverable in place.

Re-validated after the amendment: all items still pass. The two remaining gaps, product
browsing beyond a carousel and order message presentation, are recorded rather than
specified, which is what FR-048 requires and does not affect this checklist.

**Iteration 4 — scope rule established and approved designs read**:

The user supplied a scope rule and seven Figma nodes. Both changed the spec materially
enough that the Requirements section was rewritten with sequential numbering rather
than patched; it now holds 67 requirements against the previous 52. References in
`plan.md`, `data-model.md`, and `contracts/public-api.md` were rewritten to match.

*The scope rule*: everything inside the chat is in scope, the widget shell is not.
This closed every open parity question at once. Product browsing and order message
presentation, previously recorded as open gaps, are now in scope. Camera recording,
previously excluded for want of a design, is in scope for the same reason. Conversation
starters, added in iteration 3 as "opening prompts", are removed again because neither
consuming product needs them.

*The designs* added four capabilities no earlier version covered: per-message actions
(copy, send, rate), a second message presentation for the Copilot, the product set
living inside a message in two modes, and the cart as a panel with a count indicator
and a subtotal/discount/total summary. They also inverted the Unnnic decision: the
designs use Unnnic variables throughout but Code-Connect to only three Unnnic
components, so the library is a token consumer first and a component consumer second.

Re-validated after the rewrite: all items still pass. Two measurements are flagged for
design confirmation in the plan's Open items rather than guessed at, which is why they
do not appear here as `[NEEDS CLARIFICATION]`: neither blocks planning, and both are
questions for a designer rather than decisions for the spec.

## Notes

- All checklist items pass.
- `/speckit-clarify` was not needed. The one decision it would have surfaced was
  resolved in iteration 2; the scope questions in iterations 3 and 4 were resolved
  directly with the user during planning.

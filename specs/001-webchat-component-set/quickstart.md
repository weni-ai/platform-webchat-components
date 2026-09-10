# Quickstart & Validation Guide

**Feature**: [spec.md](./spec.md) | **Contract**: [contracts/public-api.md](./contracts/public-api.md)

How to run this library and prove the feature works. Each section below maps to
success criteria in the spec, so a reviewer can check them off rather than guess what
"done" means.

## Prerequisites

- Node 22.12.0 or newer, matching `agent-builder-webapp`. Verified present locally.
- npm 10.9 or newer.
- Access to the public npm registry. No `.npmrc` or private registry is involved.

## Setup

```bash
npm install
```

Peer dependencies are installed as dev dependencies for local work:
`vue@^3.4.8`, `@weni/unnnic-system@>=3.30.0 <4`, `@weni/webchat-service@^1.10.3`.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Storybook catalogue and usage documentation on a local port |
| `npm test` | Vitest once, including axe assertions |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Coverage via istanbul, matching both consumers' provider |
| `npm run typecheck` | `vue-tsc --noEmit` in strict mode |
| `npm run lint` | ESLint with `@weni/eslint-config` and Prettier |
| `npm run build` | Vite library build plus generated declarations |

CI must run lint, typecheck, test, and build, per the constitution's quality gates.

## Validating each success criterion

### SC-001 — both products render from shared blocks only

Not verifiable inside this repository. It is confirmed when a consuming product
deletes its own thread and composer code in favour of these blocks. Until then the
catalogue standing in for both variants is the closest available evidence.

### SC-002 and SC-010 — independence and clean teardown

```bash
npm test -- multi-instance
```

Expected: three conversation surfaces mounted together, each driven separately, with
no message, indicator, or persisted value from one appearing in another. Unmounting
one leaves the others working and leaves no timer, listener, or stream behind.

The teardown half is the part that silently regresses, so the assertion counts
listeners on a stubbed service before mount and after unmount and requires the counts
to match.

### SC-003 — one composer driving two conversations

```bash
npm test -- shared-composer
```

Expected: a single `PwcComposer` bound to two `useWebchatService` calls sends one
typed message to both, and each tracks its own delivery state for it. This is the
scenario the whole library was approved for, so it gets a dedicated test rather than
living inside a broader one.

### SC-004 — host content on individual messages

```bash
npm test -- message-slots
```

Expected: content supplied through `message-before` appears on exactly the messages
matching the supplied condition, receives the message in slot scope, and reserves no
space when absent. In the catalogue, the story that stands in for Agent Builder's
execution trace uses `unnnicCollapse` and stays anchored when expanded.

### SC-005 — first integration under one working day

Measured with a person, not a command. The catalogue and the published contract are
the only permitted inputs. If the engineer has to read library source to wire the
thread and composer, this criterion has failed regardless of elapsed time.

### SC-006 — no wording of its own

```bash
npm test -- no-hardcoded-copy
```

Expected: every component rendered with `labels` values replaced by recognisable
sentinel strings shows no text outside those sentinels. The required `labels` object
already makes a missing label a type error, so this test covers the remaining
case, which is text baked into a template.

### SC-007 — 500 messages stay responsive

```bash
npm run test -- thread-performance
```

Expected: a 500-message thread mounts, scrolls, and accepts typing without exceeding
the interaction budget asserted in the test. If this fails, the decision to skip
windowed rendering is what gets revisited, per the spec's assumption and D7 in the
research notes.

### SC-008 — keyboard and automated accessibility

```bash
npm test -- a11y
```

Expected: axe reports no violations for any component in any variant, and every
interactive element is reachable and operable by keyboard. Storybook's a11y addon
gives the same feedback while authoring but does not gate CI.

### SC-009 — design fidelity

```bash
npm run dev
```

Reviewed by design against the Figma nodes recorded in the contract, covering the
thread and execution trace, both composer variants, the Copilot reply with its
actions, the product set in both modes, and the cart panel. Blocks without an approved
design follow the customer-facing implementation and are confirmed in the same review
before release.

### SC-011 — every in-chat capability present or recorded

Read `PARITY.md` at the repository root. All 45 `webchat-react` components are
classified against the scope rule as in scope, widget shell, conversation starters, or
a generic primitive absorbed elsewhere. With the rule applied there should be no open
gaps; this criterion fails if an in-scope capability is neither built nor recorded.

### SC-012 — the product set is genuinely reusable

```bash
npm test -- product-set-reuse
```

Expected: the same component renders inside a message and standalone, with only its
mode differing, and no wrapper or copy exists for either position.

### SC-013 — formatted text cannot execute

```bash
npm test -- message-text-sanitisation
```

Expected: for every supported formatting form, text carrying markup capable of
executing renders as inert content. This is the one test whose failure is a security
issue rather than a defect, so it runs on every change to text rendering.

## Consumer smoke test

Once the package builds, verify it integrates before publishing:

```bash
npm run build
npm pack
# in the consuming product:
npm install <path-to-tarball>
```

Expected: the consumer type-checks against the generated declarations, Unnnic styles
resolve, and no copy of Vue, Unnnic, or the service is bundled into the library output.
The last part is the one worth checking by hand, because a peer dependency that leaks
into the bundle produces two Vue instances in the consumer and fails in confusing ways.

## Known validation limits

- The composable layer has no consumer able to validate it end to end, because neither
  consuming product declares `@weni/webchat-service` in `main` today. Tests use a
  stubbed service built against the 1.10.3 published surface, so a mismatch between
  that surface and real behaviour would not be caught here.
- Cart and spoken mode can be validated only as presentation until the corresponding
  behaviour exists in the service. Their tests supply state directly, which is exactly
  what FR-036 and FR-042 require of the components but leaves the eventual wiring
  unverified.

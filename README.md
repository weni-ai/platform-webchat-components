# platform-webchat-components

Vue component library for webchat experiences inside the VTEX CX Platform.

Consumers are internal VTEX products only:

- `agent-builder-webapp` — Preview and agent version comparison
- `chats-webapp` — Live Desk Copilot

This package is **not** a template for external customers. Customers clone and
customise [`webchat-react`](https://github.com/weni-ai/webchat-react), which keeps
its own customer-facing design and release cadence. This library exists because the
CX Platform is Vue, uses the Unnnic design system, and needs host-owned injection
points that a React bundle cannot provide.

## Architecture in one line

Domain logic lives in [`@weni/webchat-service`](https://github.com/weni-ai/webchat-service);
this package is the Vue UI and reactivity layer on top of it.

```
@weni/webchat-service  (logic: connection, session, messages, history, media)
        |
        +--> webchat-react                    (customer-facing UI, React)
        |
        +--> platform-webchat-components      (CX Platform UI, Vue)  <-- this repo
                    |
                    +--> agent-builder-webapp
                    +--> chats-webapp
```

`webchat-react` and this package are siblings. Neither depends on the other.

## Ground rules

Read [`.specify/memory/constitution.md`](.specify/memory/constitution.md) before
contributing. The non-negotiables in short:

1. UI only — domain logic goes to `@weni/webchat-service`, never here
2. Components are presentational; the service is adapted in composables
3. Every component supports N simultaneous independent instances
4. Consumer differences are variants and slots, never forked components
5. Unnnic tokens and components are the only design source
6. The public API in `src/index.ts` is semver-contracted
7. Capability gaps versus `webchat-react` are tracked, not assumed away
8. Components ship with tests

## Development

Requires Node 26 or newer.

This repository uses [Spec Kit](https://github.com/github/spec-kit) for
spec-driven development. Workflow:

| Step | Skill |
| --- | --- |
| Establish or amend principles | `/speckit-constitution` |
| Write a feature spec | `/speckit-specify` |
| Build the technical plan | `/speckit-plan` |
| Generate tasks | `/speckit-tasks` |
| Implement | `/speckit-implement` |

Releases use [Changesets](https://github.com/changesets/changesets) after
`1.0.0`. Phases 1 and 2 stay on `1.0.0` with no Changeset and no changelog.
From then on, add a changeset with `npm run changeset` for any user-facing or
public-contract change. `CHANGELOG.md` is generated when a later release
consumes that queue.

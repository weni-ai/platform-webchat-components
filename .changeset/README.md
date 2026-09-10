# Changesets

User-facing and public-contract changes land here as markdown files, not as
hand-edited Unreleased sections in `CHANGELOG.md`.

```bash
npm run changeset
```

That records the package, the bump (`patch` / `minor` / `major`), and the
summary. `CHANGELOG.md` and `package.json` version update only when a
release consumes the queue:

```bash
npm run changeset:version
npm run changeset:publish
```

A breaking contract change MUST use `major` and state the migration in the
changeset body, per Principle VI.

# Releasing

This repo uses [Changesets](https://github.com/changesets/changesets) and GitHub Actions to automate versioning, changelogs, and npm publishing.

## Published packages

Only packages **without** `"private": true` in their `package.json` are published to npm:

| Package | npm |
|---------|-----|
| `@l4n3/fakeish` | [npmjs.com](https://www.npmjs.com/package/@l4n3/fakeish) |
| `@l4n3/fakeish-gen-core` | [npmjs.com](https://www.npmjs.com/package/@l4n3/fakeish-gen-core) |

All other packages (configs, utils, examples, docs) are marked `"private": true` and are never published.

## Semver

All published packages follow [semantic versioning](https://semver.org/):

- **patch** (`0.1.0` -> `0.1.1`) — bug fixes, internal changes
- **minor** (`0.1.0` -> `0.2.0`) — new features, backwards-compatible
- **major** (`0.x` -> `1.0.0`) — breaking changes

While packages are pre-1.0 (`0.x`), minor bumps may include breaking changes per semver convention.

## How it works

### 1. Create a changeset

When a PR includes changes that should result in a version bump, add a changeset:

```bash
pnpm changeset
```

This interactive prompt asks:
1. Which packages changed
2. The semver bump type (patch, minor, major) for each
3. A summary of the change (used in the changelog)

It creates a markdown file in `.changeset/` (e.g. `.changeset/fuzzy-panda.md`) that looks like:

```markdown
---
'@l4n3/fakeish': minor
---

Add support for custom generator functions
```

Commit the changeset file with your PR. Multiple changesets can exist at once — they accumulate until a release is cut.

### 2. Version PR (automatic)

When changesets are merged to `main`, the [publish workflow](`.github/workflows/publish.yml`) runs the `changesets/action`. If pending changesets exist, it opens (or updates) a PR titled **"chore: version packages"** that:

- Bumps `version` in each affected `package.json`
- Generates/updates `CHANGELOG.md` in each affected package (via `@changesets/changelog-github`, which links to PRs and contributors)
- Removes the consumed `.changeset/*.md` files

This PR stays open and accumulates changes until you're ready to release.

### 3. Publish to npm (automatic)

When the version PR is merged to `main`, the same workflow detects there are no pending changesets and runs:

```bash
pnpm publish-packages  # turbo run build && changeset publish
```

This builds all packages via Turbo, then publishes the updated packages to npm with public access.

## Internal dependency updates

When a published package is bumped, any internal packages that depend on it are automatically patched (`updateInternalDependencies: "patch"` in `.changeset/config.json`). This keeps workspace dependency versions in sync without manual intervention.

## Configuration

| File | Purpose |
|------|---------|
| `.changeset/config.json` | Changesets config (access, changelog format, base branch) |
| `.github/workflows/publish.yml` | GitHub Actions workflow for versioning + publishing |
| Root `package.json` scripts | `changeset`, `version-packages`, `publish-packages` |

## Manual commands

These are used by CI but can also be run locally:

```bash
pnpm changeset            # create a new changeset
pnpm version-packages     # apply pending changesets (bump versions, update changelogs)
pnpm publish-packages     # build all packages and publish to npm
```

## Secrets

The publish workflow requires:

- `GITHUB_TOKEN` — provided automatically by GitHub Actions (for creating the version PR)
- `L4N3_NPMJS_TOKEN` — npm auth token stored as a repository secret (for `npm publish`)

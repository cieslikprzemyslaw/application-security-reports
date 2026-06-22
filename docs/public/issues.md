# Issue workflow

## Source of scope

GitHub Issues and Milestones are the source of truth for delivery scope and status.

Before implementation:

1. read the entire issue;
2. confirm dependencies;
3. read the listed repository documents;
4. inspect the current `master` implementation;
5. keep explicit out-of-scope items out of the branch.

## Branches

Use one branch per issue.

Example:

```text
feature/39-document-setup-architecture-data-flow
```

Do not mix unrelated cleanup into the same pull request.

## Documentation hierarchy

Tracked documentation:

```text
README.md
docs/public/*.md
CONTRIBUTING.md
```

The GitHub Wiki provides navigation and summaries. When Wiki text conflicts with tracked technical documentation, update the Wiki and use the tracked repository files as the technical source of truth.

A local, ignored `AGENTS.md` may be provided by automation tooling. When present, follow it for agent execution rules, but do not treat it as public project documentation.

Public frontend architecture belongs in [frontend.md](frontend.md). Local agent-specific implementation rules remain in the ignored `docs/frontend.md` file.

## Pull requests

A pull request should include:

- linked issue;
- summary;
- relevant implementation notes;
- validation performed;
- explicit note for checks not run.

Keep pull requests focused and reviewable.

## Automation

PowerShell or agent tooling should orchestrate work, not duplicate architecture, issue acceptance criteria, or documentation content.

Stable project decisions belong in tracked documentation or GitHub Issues.

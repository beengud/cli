---
name: commit
description: Create commit messages for git
metadata:
  internal: true
---

Commit the working changes to git.
Analyze the changes, and create one or more commits with appropriate messages.
Break down the commits to smaller commits if the changes are not related.

# Commit Messages

This project uses conventional commit messages.

## Format

```
<type>(<commands>): <description>

<body>
```

- `<commands>` — comma-separated list of CLI commands touched by the change (e.g. `skill list`, `configure`, `cli uninstall`). Omit the scope entirely only if no command files were changed.
- `<description>` — short imperative summary (≤72 chars).
- `<body>` — required when more than one thing changed or the description alone is ambiguous. List what was changed and why, one bullet per logical change. Omit only for truly trivial single-line fixes.

## Types

- `feat:` - New features or functionality
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks, dependency updates, config changes
- `refactor:` - Code changes that neither fix bugs nor add features
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `style:` - Code style changes (formatting, whitespace)

## Examples

```
feat(skill list): add --json output flag

- Added --json flag to `skill list` command to print raw JSON
- Updated REST client to return parsed response instead of printing

fix(configure): handle missing API key gracefully

- Throw a user-facing error when CURSOR_API_KEY is not set instead of crashing

chore: update dependencies

refactor(cli uninstall): extract confirmation prompt into utility
```

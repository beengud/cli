---
name: branch
description: >-
  Create git branches with a username prefix. Use when creating new branches,
  checking out new branches, or when the user asks to start work on a feature,
  fix, or task.
metadata:
  internal: true
---

# Branch Naming

All new branches must be prefixed with the current user's name.

## Format

```
<username>/<branch-name>
```

## Determining the Username

Run `whoami` or extract the user from the system environment to get the current
username. Use that as the prefix.

## Branch Name Rules

- Prefix with `<username>/` followed by a short, descriptive kebab-case name
- Use lowercase letters, numbers, and hyphens only for the branch name portion
- Keep it concise but descriptive

## Examples

```
cole/add-user-auth
cole/fix-query-timeout
cole/update-dependencies
```

## Workflow

1. Determine the username (e.g. via `whoami`)
2. Construct the branch name as `<username>/<descriptive-name>`
3. Create the branch with `git checkout -b <username>/<descriptive-name>`

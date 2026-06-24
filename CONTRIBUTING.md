# Contributing to AI Nav

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/your-username/ai-nav.git
cd ai-nav

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

## Project Structure

This is a pnpm monorepo with Turborepo:

- `apps/web` — React + Vite + Tailwind frontend
- `apps/api` — Express backend + Claude API
- `packages/shared` — Shared types & constants
- `packages/db` — SQLite schema & queries

## Making Changes

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Commit with clear messages (e.g. `feat: add bookmark export`)
5. Push and open a Pull Request

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `refactor:` — Code refactor
- `chore:` — Maintenance

## Reporting Issues

Open an issue with:

- What you expected
- What actually happened
- Steps to reproduce
- Your environment (OS, Node version, etc.)

## Security

See [SECURITY.md](./SECURITY.md) for reporting security vulnerabilities.

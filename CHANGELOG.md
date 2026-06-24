# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-06-24

### Added

- AI-powered URL categorization via Claude API
- Bulk URL import with automatic extraction
- Drag-and-drop reordering for bookmarks and categories
- Edit/readonly mode toggle
- Inline search filtering on main page
- Category management with custom colors
- Bookmark CRUD operations
- Health check hook and dashboard
- Glassmorphism UI theme (frosted glass, dark gradients)
- Heuristic fallback categorization (no API key required)
- Settings page for API key, base URL, and model configuration
- Keyboard shortcuts (⌘K search, ⌘N add, ESC close)

### Changed

- AI Group re-groups ALL bookmarks by title/description
- AI Group categorizes by bookmark title/name
- Unified NavCard height regardless of description length
- Replaced search modal with inline filtering

### Fixed

- Swap mode toggle button display

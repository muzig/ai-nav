# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. Email the maintainer directly (or use GitHub's private vulnerability reporting)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact

We'll respond within 72 hours and work with you to address the issue.

## Scope

This project handles API keys (Anthropic Claude) stored locally in SQLite. Key security considerations:

- API keys are stored in a local SQLite database (not in code or git)
- No telemetry or data is sent to third parties
- All data stays on the user's machine

## Best Practices for Users

- Don't share your `data/` directory or `*.db` files
- Keep your API keys confidential
- Run the app behind a firewall if exposing to a network

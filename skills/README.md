# Nexora Engine - AI Skills Repository

This repository contains machine-readable documentation for AI agents to understand and operate the Nexora Engine SDK - a Supabase-based backend toolkit.

## Agent Skills Structure

The skills are now available in multiple formats for different AI agents:

### OpenCode Skills
Location: `.opencode/skills/*/SKILL.md`
- Automatically discovered by OpenCode
- Use `skill(name: "skill-name")` to load

### Claude Skills
Location: `.claude/skills/*/SKILL.md`
- Compatible with Claude AI agents
- Follows Claude skill conventions

### Generic Agent Skills
Location: `.agents/skills/*/SKILL.md`
- Compatible with other AI agent systems
- Standardized SKILL.md format

## Available Skills

| Skill Name | Description | Complexity |
|-----------|-------------|-------------|
| `query-engine` | Smart query system with caching, deduplication, and TTL | Medium |
| `crud-operations` | Generic database CRUD abstraction layer | Low |
| `caching-system` | TTL-based smart caching with invalidation | Low |
| `validation-system` | Zod-based schema validation layer | Low |
| `auth-system` | Authentication utilities with MFA support | Medium |
| `error-handling` | Unified error format with specialized types | Low |
| `sdk-architecture` | Layered SDK design overview | High |
| `performance-optimization` | Performance patterns and optimization | Medium |
| `utility-functions` | Validators, formatters, rate limiting | Low |
| `infinite-scroll` | Infinite scroll, cursor pagination, optimistic updates | Medium |
| `realtime` | Database subscriptions, broadcast, presence tracking | High |

## Skill File Structure

Each skill follows the standardized SKILL.md format:

```markdown
---
name: skill-name
description: Brief description of the skill
license: MIT
compatibility: opencode
metadata:
  audience: developers
  sdk_layer: layer-name
  complexity: low|medium|high
  stability: stable
---

# Skill Title

## Overview
Brief overview of the skill

## What It Does
Detailed description

## Why Use It
Benefits and rationale

... (additional sections)
```

## Using Skills with OpenCode

### Loading a Skill
```typescript
skill({ name: "query-engine" })
```

### Permission Configuration
In `opencode.json`:
```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

## Using Skills with Claude

Claude agents can access skills from `.claude/skills/` directory. The skills are automatically loaded when needed.

## Using Skills with Other Agents

Generic agents can access skills from `.agents/skills/` directory. The format is compatible with most AI agent systems.

## Original Skill Files

The original skill files (`.md`, `.yaml`, `.json`) are preserved in the `skills/` directory for reference and backward compatibility:

- `01-query-engine.*` - Query Engine, QueryBuilder, and filter operators
- `02-crud-operations.*` - Create, read, update, delete operations
- `03-caching-system.*` - Cache management and invalidation
- `04-validation-system.*` - Data validation with Zod
- `05-auth-system.*` - Authentication and authorization
- `06-error-handling.*` - Error types and handling strategies
- `07-sdk-architecture.*` - Library structure and design
- `08-performance-optimization.*` - Optimization techniques
- `09-utility-functions.*` - Helper functions and formatters
- `10-infinite-scroll.*` - Infinite scroll, cursor pagination, and optimistic updates
- `11-realtime.*` - Database subscriptions, broadcast channels, presence tracking, and connection management

## For AI Agents

When working with this SDK, load the relevant skill using:
- OpenCode: `skill({ name: "skill-name" })`
- Claude: Skills are auto-discovered from `.claude/skills/`
- Other agents: Read from `.agents/skills/` or `.opencode/skills/`

Each skill contains:
1. Available functions and their signatures
2. How to compose operations
3. Error handling patterns
4. Caching behavior
5. Configuration requirements
6. Code examples and best practices
7. Internal logic and execution reasoning
8. Constraints and anti-patterns
9. Dependencies and code mappings

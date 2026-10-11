# AgentTTX

**The only agent tabletop that starts from your agent's real permissions and ends with a report your insurer will accept.**

AgentTTX is a facilitated crisis simulation platform for AI-agent incidents. Unlike talk-only tabletop vendors, AgentTTX:

1. **Starts from the client's own agent** - Import your agent's tool inventory and compute a Blast Radius Map of worst-case exposure
2. **Ends with an insurer-ready evidence pack** - Generates PDF/Markdown reports mapped to cyber insurance requirements, including sign-off blocks and regulation citations
3. **Scores objectively** - Decision checkpoints carry measurable criteria, not just facilitator opinion

## Quick Start

```bash
git clone https://github.com/prajjwal5655-coder/agenttx.git
cd agenttx

# Install dependencies (requires pnpm)
pnpm install

# Generate Prisma client
pnpm prisma generate

# Create database
pnpm prisma db push

# Seed scenarios, regulations, and samples
pnpm tsx prisma/seed.ts

# Start dev server
pnpm dev
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm typeckheck` | TypeScript type checking |
| `pnpm test` | Run Vitest tests |
| `pnpm tsx prisma/seed.ts` | Load/validate all content |

## Project Structure

```
agenttx/
  content/
    scenarios/          # YAML scenario files (editable without code changes)
    regulations/        # YAML regulation citation files
    legal/              # Legal disclaimer
    samples/            # Sample MCP manifest + agent-tools JSON
  prisma/
    schema.prisma       # Database schema
    seed.ts             # Seed script (validates all content)
  src/
    app/                # Next.js 14 App Router pages + API routes
    components/         # React components
    lib/                # Business logic (scenarios, scoring, blast radius)
    lib/blastradius/    # Blast Radius Map logic
    lib/pdf/            # PDF report generator
    lib/zod/            # Zod schemas
    types/              # Shared TypeScript types
  tests/                # Vitest test files
  e2e/                  # Playwright e2e tests
```

## Modules

### M1: Blast Radius Map
Import your agent's tool inventory (MCP manifest, agent tool config, or manual entry),
confirm inferred capabilities, and visualize worst-case exposure on an interactive graph.

### M2: Live Console
Run facilitated tabletop exercises with timed injects, roleplay cards, objective
decision checkpoints, and a score sheet.

### M3: Insurer Evidence Pack
Generate PDF and Markdown reports with all six required sections:
1. Board one-pager
2. Test evidence block
3. Decision-vs-inject timeline
4. Weighted scorecard
5. Regulation citation table
6. Appendix

### M4: History & Polish
Session history, print stylesheets, full README.

## ⚠️ Human Review Required

**Scenarios, sources, and regulation files are DRAFT content that has NOT been independently verified.**

Before any content is used with a client:

1. **Scenarios** must be reviewed and approved by a qualified professional. The scenario
   `based_on` citations have `verified: false` - the founder must confirm all sources.

2. **Regulation citations** (EU AI Act, SEC Form 8-K, DORA) cite article numbers only.
   These are NOT legal advice and do NOT constitute a determination that any regulation
   applies to any specific agent or organization. A qualified legal professional must
   review these.

3. **No real customer data** is included. All company names, logs, and dashboards are
   fictional. Any resemblance to real entities is coincidental.

See `content/legal/disclaimer.md` for the full legal disclaimer.

## Platform Rules

- SQLite + Prisma: All lists/objects stored as JSON strings in String columns (no scalar lists, enums, or Json type)
- Zod validation on every read/write via `src/lib/db.ts`
- PDF generated in Node runtime only
- Scenario/regulation YAML validated server-side at load; invalid files fail loudly

## Scoring Formula

```
OBJECTIVE_SHARE = 0.7
FACILITATOR_SHARE = 0.3

For each dimension d:
  r = (sum of weights of confirmed criteria) / (sum of all criteria weights)
  s = facilitator score (1-5)
  final(d) = round1(OBJECTIVE_SHARE * (1 + 4*r) + FACILITATOR_SHARE * s)  # if criteria exist
  final(d) = s  # if no criteria

Headline score = sum(weight(d) * final(d))
```

## License

MIT

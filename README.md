# AgentTTX

**The only agent tabletop that starts from your agent's real permissions and ends with a report your insurer will accept.**

## Status: M0 Scaffold (Scaffold + Schema + Seed)

### M0 Completion Checklist
- [x] Directory structure created
- [x] TypeScript strict config
- [x] Next.js 14 App Router configured
- [x] Tailwind CSS configured
- [x] Prisma + SQLite schema (M0) — all columns are String type per platform rules
- [x] Zod schemas for scenarios and regulations
- [x] 3 scenarios: `helpful-plugin`, `scope-creep`, `silent-exfiltration`
- [x] 3 regulation sets: EU AI Act, SEC Form 8-K, DORA
- [x] Legal disclaimer (`content/legal/disclaimer.md`)
- [x] Sample files: MCP manifest + agent-tools JSON
- [x] Scenario artifacts (fictional logs)
- [x] Seed script — loads + validates all content
- [x] M0 smoke tests (16 tests, all passing)
- [x] `pnpm typecheck` passes

### Commands
```bash
pnpm install       # Install deps (use `npx pnpm` if pnpm not on PATH)
pnpm prisma generate  # Generate Prisma client
pnpm prisma db push   # Create SQLite database
pnpm tsx prisma/seed.ts  # Seed scenarios + regulations
pnpm typecheck     # TypeScript check
pnpm test          # Run vitest tests
pnpm dev           # Start dev server
```

### Human Review Required
Scenarios, source citations, and regulation files are DRAFT content that has not
been independently verified. A qualified professional must review all content
before client use. See `content/legal/disclaimer.md`.

# Pipeline Follow-up

Two related but separate tools for Russell Wealth Group, in one app.

**Pipeline** is opportunities we've uncovered — existing clients with assets to
move, and brand-new first meetings like the Dave Ramsey / SmartVestor referrals.
Each one records who they are, how we got them, who referred them, and for every
pot of money: what it is, how much, where it's at now, and where it needs to go.

**Follow-up** is what has to get done — today, this week, this month. Not a flat
task list: these are commitment windows, and items can be tied back to the
pipeline opportunity they serve.

## Stack

Vite + React 19 + TypeScript.

The look and feel comes from the **Trade Blotter** (`~/advisortool/advisortool`
at commit `f35c984`, "Redesign Trade Blotter with shadcn/ui white style"): a zinc
palette on white, Inter, a 220px sticky sidebar carrying brand / views / summary
cards / primary action, and a dense spreadsheet where every cell is editable in
place. Column groups get a colored header band, the column labels sit in a second
sticky row beneath, and money totals live in a `tfoot`.

Both screens are that same blotter: rows you type directly into, not forms.

## Run it

```bash
npm install
npm run dev
```

Also: `npm run build` (typecheck + production build), `npm run preview`, `npm run lint`.

## Layout

| Path | What it holds |
| --- | --- |
| `src/types.ts` | Both domains: `Prospect`/`Asset` and `FollowUp`, plus every enum and its display labels |
| `src/lib/repository.ts` | The storage seam — an async `Repository` interface with a localStorage implementation |
| `src/lib/dates.ts` | Local-time date math, week/month boundaries, money formatting |
| `src/ui/theme.ts` | Blotter tokens, column-group metadata, injected global styles |
| `src/ui/primitives.tsx` | In-cell editors (`TextCell`, `SelectCell`, `MoneyCell`) plus `Chip`, `StatCard` |
| `src/features/pipeline/PipelineTable.tsx` | The pipeline blotter: column defs, group spans, filters, totals |
| `src/features/followup/FollowUpTable.tsx` | The follow-up blotter, split by commitment window |
| `src/App.tsx` | Sidebar shell, summary figures, load/save wiring |

## Data model

A **Prospect** carries `kind` (new prospect vs existing client), `source` (Dave
Ramsey, client referral, COI, seminar, walk-in…), `referredBy`, contact details,
a `stage`, and a list of **Assets**. Each asset is
`{ kind, amount, heldAt, movingTo, status }` — `heldAt` is where the money is
now, `movingTo` is the destination, and `status` tracks
`identified → paperwork → in transit → landed`.

Stages run `identified → contacted → appointment set → first meeting held →
plan presented → paperwork out → transfer in progress → funded`, with `stalled`
and `lost` as off-track states that drop out of the open counts.

A **FollowUp** carries a `horizon` (`today` / `week` / `month`), an optional
`prospectId` linking it to an opportunity, an owner, a due date, and done state.

The pipeline blotter shows **one row per account**, so a household with three
pots of money is three rows. Household-level fields — name, type, source, stage,
next step — render only on the first of those rows; the rest show `↳` and their
own account columns, because one household has one stage, not one per account.

No SSNs or account numbers are stored, deliberately — see below.

## Where this is going

1. **A backend.** Team access from any device is the stated requirement, and
   localStorage cannot do it: the data lives in one browser profile on one
   machine. Every read and write already goes through the async `Repository`
   interface in `src/lib/repository.ts`, so this is one new implementation plus
   auth — not a rewrite.
2. **The 12 Week Year.** Follow-up horizons are built as commitment windows, not
   calendar buckets, so "this month" is the natural place for the cycle/week-of-12
   view. Not built yet — we haven't spec'd it.
3. **Compliance review before real client data goes in.** This currently holds
   prospect names, contact details, and account balances in unencrypted browser
   storage with no audit trail, no retention policy, and no access control. That
   is fine for evaluating the tool with fake data; it should be reviewed against
   books-and-records requirements and any broker-dealer rules on approved systems
   before it holds a real household.

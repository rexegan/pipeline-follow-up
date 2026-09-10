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

Vite + React 19 + TypeScript. The look and feel is carried over from Advisor
Toolbox — the CatScan workbook palette (steel blue and rust banners, light-blue
field labels, cream row highlight), serif headings, large type.

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
| `src/ui/theme.ts` | Design tokens (`C`), serif stack, injected global styles |
| `src/ui/Icon.tsx` | Lucide-style stroke icons |
| `src/ui/primitives.tsx` | `Field`, `Badge`, `ActionBtn`, `Card`, `SubHead`, `StatTile`, `Empty` |
| `src/features/pipeline/` | Stat tiles, stage strip, opportunity cards, the add/edit form with its asset editor |
| `src/features/followup/` | The three horizon columns, quick-add, and the composer |
| `src/App.tsx` | Shell: firm header, section tabs, banner, load/save wiring |

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

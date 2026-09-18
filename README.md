# Pipeline Follow-up

Two related but separate tools for Russell Wealth Group, in one app.

**Pipeline** is opportunities we've uncovered — existing clients with assets to
move, and brand-new first meetings like the Dave Ramsey / SmartVestor referrals.
Each one records who they are, how we got them, who referred them, a running
activity log of what's actually happened with them, and for every pot of money:
what it is, how much, where it's at now, and where it needs to go.

**Follow-up** is what has to get done — today, this week, this month. Not a flat
task list: these are commitment windows, and items can be tied back to the
pipeline opportunity they serve. Overdue items are pulled out and surfaced
first, ahead of whichever window they were originally due in.

## Design references

The visual language — zinc palette on white, Inter, a 220px sticky sidebar,
boxed field editors — comes from the **Trade Blotter**
(`~/advisortool/advisortool` at commit `f35c984`).

The *structure* of Pipeline (a stage board, not a table) comes from looking at
how actual financial-advisor CRMs handle this — Wealthbox, Redtail, Salesforce
Financial Services Cloud:

- **A stage board, not a list.** Wealthbox and Pipedrive lead with a
  drag-and-drop kanban. A flat list of fully-expanded records has no
  glanceable, collapsed state — you're always looking at a form, never a
  shape. `PipelineBoard.tsx` is that board; click a card to open the full
  record in `ProspectDetail.tsx`.
- **Activity history, not a single notes field.** Redtail tracks
  "communication history" as a dated timeline per relationship. A `Prospect`
  carries `activity: ActivityEntry[]` (call / email / meeting / note, each
  dated) instead of one flat `notes` string.
- **Stage-triggered workflows.** Redtail and Wealthbox auto-generate a task
  when a deal changes stage. Moving a card's stage here offers a suggested
  follow-up (`stageWorkflow.ts`) — e.g. hitting Paperwork Out offers "Confirm
  the paperwork was signed and returned," due in 5 days — rather than relying
  on remembering to add it.
- **Needs-attention surfacing.** Salesforce Financial Services Cloud leads
  with next-best-action / staleness scoring. Overdue follow-ups get their own
  section at the top of the list, and board cards show days-in-stage, instead
  of a red date you have to notice yourself.

## Run it

```bash
npm install
npm run dev
```

Also: `npm run build` (typecheck + production build), `npm run preview`, `npm run lint`.

Pushing to `main` auto-deploys to GitHub Pages via `.github/workflows/deploy-pages.yml`.

## Layout

| Path | What it holds |
| --- | --- |
| `src/types.ts` | `Prospect`/`Asset`/`ActivityEntry` and `FollowUp`, plus every enum and its display labels |
| `src/lib/repository.ts` | The storage seam — an async `Repository` interface with a localStorage implementation, plus the one-time demo seed gate |
| `src/lib/seedData.ts` | The demo household shown on a browser that's never had data in it |
| `src/lib/dates.ts` | Local-time date math, week/month boundaries, money formatting, "3d ago" style relative stamps |
| `src/ui/theme.ts` | Blotter tokens, injected global styles |
| `src/ui/primitives.tsx` | Boxed field editors (`BoxText`, `BoxSelect`, `BoxMoney`, `Combobox`), `RecordCard` + `FieldRow`, `Modal`, `ActionBtn`, `Chip`, `StatCard` |
| `src/features/pipeline/PipelineBoard.tsx` | The stage-column kanban board — drag-and-drop between stages, a collapsed strip for stalled/lost |
| `src/features/pipeline/ProspectDetail.tsx` | The full record: editable fields plus the activity timeline, opened from a board card |
| `src/features/pipeline/stageWorkflow.ts` | What follow-up a stage change typically implies |
| `src/features/followup/FollowUpTable.tsx` | One card per follow-up: an Overdue section first, then Today / This Week / This Month |
| `src/App.tsx` | Sidebar shell, summary figures, the stage-change suggestion banner, load/save wiring |

## Data model

A **Prospect** carries `kind` (new prospect vs existing client), `source` (Dave
Ramsey, client referral, COI, seminar, walk-in…), `referredBy`, contact details,
a `stage` plus `stageChangedAt` (how "days in stage" is measured), a list of
**Assets**, and an `activity` timeline. Each asset is
`{ kind, amount, heldAt, movingTo, status }` — `heldAt` is where the money is
now, `movingTo` is the destination, and `status` tracks
`identified → paperwork → in transit → landed`.

Stages run `identified → contacted → appointment set → first meeting held →
plan presented → paperwork out → transfer in progress → funded`, with `stalled`
and `lost` as off-track states — they drop off the board's columns entirely
(collapsed into a "stalled or lost" strip below it) rather than cluttering the
active view, but stay reachable and reversible from there.

A **FollowUp** carries a `horizon` (`today` / `week` / `month`), a `title` (the
task), a `reason` (why it needs doing — distinct from the task itself), an
`owner` (who's doing it), an optional `prospectId` (who it's about — a
prospect or an existing client, searched by name via the `Combobox` primitive
rather than scrolled in a plain dropdown), a due date, and done state.

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
   before it holds a real household. It's also worth noting the deployed GitHub
   Pages site has no login at all — anyone with the link can view and edit it.

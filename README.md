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

- **Collapsed cards, not fully-expanded records.** A flat list of expanded
  records has no glanceable, collapsed state — you're always looking at a
  form, never a shape. `PipelineBoard.tsx` renders every opportunity as a
  compact card in one grid (not stage columns — see below); click a card to
  open the full record in `ProspectDetail.tsx`.
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
| `src/lib/repository.ts` | The storage seam — an async `Repository` interface with a localStorage implementation, the one-time demo seed gate, and Settings load/save |
| `src/lib/seedData.ts` | The demo household shown on a browser that's never had data in it, plus `sampleProspects()` — twenty opportunities scattered across every stage, loadable anytime from the sidebar |
| `src/lib/dates.ts` | Local-time date math, week/month boundaries, money formatting, "3d ago" style relative stamps |
| `src/lib/slugify.ts` | Turns a typed stage label into a stable storage key |
| `src/lib/useElapsed.ts` | The Time Open stopwatch — ticks every second, freezes once passed `frozen: true` |
| `src/ui/theme.ts` | Blotter tokens, injected global styles |
| `src/ui/primitives.tsx` | Boxed field editors (`BoxText`, `BoxSelect`, `BoxMoney`, `Combobox`, `TypeaheadSelect`), `RecordCard` + `FieldRow`, `Modal`, `ActionBtn`, `Chip`, `StatCard`, `CheckboxDropdown` (Quick View's checklist dropdowns) |
| `src/features/pipeline/PipelineBoard.tsx` | Every opportunity in one grid, not stage columns — a strict 7-per-row layout, wrapping to a new row rather than scrolling, for every Sort option including "All Opportunities"; a collapsed strip for off-track stages |
| `src/features/pipeline/ProspectDetail.tsx` | The full record: editable fields plus the activity timeline, opened from a board card |
| `src/features/pipeline/stageWorkflow.ts` | What follow-up a stage change typically implies |
| `src/features/settings/SettingsPanel.tsx` | Add/remove stages, custodians, account types, sources, and per-stage Next Step suggestions |
| `src/features/followup/FollowUpTable.tsx` | One card per follow-up: an Overdue section first, then Today / This Week / This Month |
| `src/App.tsx` | Sidebar shell, summary figures, the stage-change suggestion banner, load/save wiring, the Settings button |

## Data model

A **Prospect** carries `kind` (new prospect vs existing client), `source`
(Dave Ramsey, client referral, COI, seminar, walk-in…), `referredBy`, contact
details (phone auto-formats to `(817) 555-0142` as you type — on every load,
not just while typing, so a number entered before this shipped doesn't sit
there unformatted forever), a `stage` plus `stageChangedAt` (how "days in
stage" is measured), a list of **Assets**, and an `activity` timeline. Each
asset is `{ kind, amount, heldAt, newAccountType, movingTo, status }` —
`heldAt` ("Where It's At Now") and `movingTo` ("Where It's Moving") are two
*separate* Settings lists, not one shared one: an incoming prospect's money
can plausibly be sitting almost anywhere, but only a handful of firms are
ever the actual destination, so "moving to" starts out much shorter.
`newAccountType` ("New Account Type," between them, same Account Type list
and width as the account's own `kind`) is what the account is *becoming* — a
rollover often changes type, not just custodian, e.g. a 401(k) landing as a
Traditional IRA — and defaults to matching `kind` until changed. All of
these are typeaheads (`TypeaheadSelect` in `primitives.tsx`) that accept any
typed value regardless of the list. `status` mirrors the pipeline stage
names: `identified → doc-prep → docs-signed → processed → follow-up →
funded` — this one's fixed, not a Settings category.

The record form's `kind`/`newAccountType` (Account Type), `heldAt`/`movingTo`
(Where It's At Now / Moving), `source` (From), and Next Step are all the same
typeahead pattern: a list of suggestions that don't have to be the only
allowed answer. Typing something that isn't already an option quietly saves
it into that Settings list (`addToSettingsList` in `App.tsx`, or
`addNextStepSuggestion` for Next Step specifically, since its suggestions are
per-stage rather than one flat list) — an opportunity still at "Opportunity
Uncovered" suggests "Schedule the first meeting," while one at Doc Prep
suggests "Complete transfer paperwork signatures." A `nextStepStatus` (In
Process / Completed) sits between Next Step and Next Step Due.

"Time Open" is a running stopwatch (`useElapsedMs` in `lib/useElapsed.ts`) —
days/hours/minutes/seconds since `createdAt`, ticking every second like the
Trade Blotter's clock on an open position. It only stops once every asset's
`status` is Funded (not the Stage, which can say "Funded" before the last
account has actually settled) — freezing at whatever it read at that moment
rather than resetting or continuing. Next to Referred By and Time Open, a
read-only "Total" field mirrors the header's dollar total.

The record modal's footer offers a **Next** button, when more than one
opportunity shares the currently open one's stage — it cycles through them
in order and wraps back around, so you can work through every open Doc Prep
(say) one after another without closing and re-picking a card each time.
Between Next and Close sits **Duplicate** — for the same household turning
up with a second, unrelated opportunity: it opens a new record carrying over
the contact info (name, Type, From, Referred By, phone, email) but starting
the deal itself fresh (stage back to the first active one, a blank asset,
no Next Step, no activity log).

The Pipeline board is one grid of every opportunity, not a column per stage —
stage is shown per card (the colored left border) rather than by grouping;
change it from the record's own Stage field, not by dragging a card
somewhere. Under **Quick View** (its own row under the date) sit two
checklist dropdowns (`CheckboxDropdown` in `primitives.tsx`) rather than
plain single-choice selects — each option gets its own checkbox, so any
combination can be checked at once instead of picking just one:

- The first is Sort: "All Opportunities" (nothing checked) is every active
  opportunity in no particular order; Highest dollar amount / Newest
  Opportunity / Oldest Opportunity are *orders* — checking more than one
  applies by priority (amount, then newest, then oldest) rather than
  compounding, since sorting by more than one key at once isn't a single
  well-defined order; the rest are stage filters (including the off-track
  ones — Stalled, Lost) that *union* together — checking Doc Prep and Signed
  shows both, and this is also how the off-track ones become visible outside
  the board's collapsed strip.
- The second filters by account type (same list as Settings' Account Type
  and the record form's Account Type field), unioning the same way —
  checking 401(k) and Roth IRA shows a household with either.

The two dropdowns compose with each other by intersection: Sort "Doc Prep"
plus account type "401(k)" shows only opportunities that are both. Quick
View only narrows the board grid, not the sidebar's totals or breakdown. All
four sidebar stat cards (Total Opportunities, In Process, Completed, Open
Opportunities) are clickable and reset both dropdowns to the matching view.

The sidebar's Total Opportunities stat is also followed by a small
per-stage count breakdown — clicking a stage with opportunities on it jumps
straight into the first one's record (not the filtered view; see `App.tsx`'s
stage-breakdown chips vs. Quick View for the difference).

A **FollowUp** carries a `horizon` (`today` / `week` / `month`), a `title` (the
task), a `reason` (why it needs doing — distinct from the task itself), an
`owner` (who's doing it), an optional `prospectId` (who it's about — a
prospect or an existing client, searched by name via the `Combobox` primitive
rather than scrolled in a plain dropdown), a due date, and done state.

No SSNs or account numbers are stored, deliberately — see below.

## Settings

Stage names, custodians, account types, sources, and Next Step suggestions
used to be hardcoded enums; they're now data, edited from the ⚙ Settings
button on the Pipeline page. A `StageDef` (`types.ts`) is `{ key, label,
shortLabel, formLabel, color, offTrack }` — adding a stage from Settings
slugifies its label into a `key`, assigns the next color off a fixed palette,
and appends it to the board; checking "Stalled / lost" collapses it into the
strip below the board instead of giving it a column. Deleting a stage (or any
other Settings entry) that a record is still using doesn't corrupt anything —
`findStage` falls back to a neutral gray stand-in for a stage key Settings no
longer defines, rather than crashing. Where It's At Now / Where It's Moving,
account types, sources, and Next Step suggestions are plainer: each just an
editable list of strings that populates the matching field's suggestions.

Settings persistence is deliberately *not* a write-through-on-load like
prospects/follow-ups: `App.tsx` only calls `saveSettings` from inside the
Settings panel's own `onChange`, never from an effect tied to the loaded
state. `loadSettings` fills in the current code default for any category a
browser hasn't saved — if it eagerly wrote that merged result back on every
load, a category the user never customized would freeze at whatever the
default happened to be the first time the app loaded, silently shadowing any
later change to that default (this bit once — see the code comment above
`updateSettings`). Once a category is actually edited via the panel, that
edit is what persists.

That "freeze on first load" bug predates the fix above, so a browser that
had already loaded the app before it landed still has a `stages` array
frozen at whatever shipped then — non-empty, so the missing-category
fallback doesn't touch it. Adding a stage after that point (the IGO/NIGO
split, `First Meeting`, `Issued`) needs its own explicit one-off migration
in `repository.ts` (`splitLegacyIgoNigoStage`, `ensureFirstMeetingStage`,
`ensureIssuedStage`) rather than relying on the general fallback — the same
pattern as the `LEGACY_*` label tables below, just for stage keys instead of
free-text field values.

The defaults (`DEFAULT_STAGES` in `types.ts`) ship as `First Meeting →
Opportunity Uncovered → Doc Prep → Docs Signed → IGO → NIGO → Follow Up →
Funded → Issued`, plus `Stalled` and `Lost` marked off track. `First
Meeting` is the very first touchpoint — before the opportunity itself is
confirmed — and is the default stage a brand-new opportunity starts on.
IGO/NIGO is standard back-office shorthand for paperwork coming back either
In Good Order or Not In Good Order — two different outcomes, so two
separate stages rather than one combined one. `Issued` is the step after
`Funded` — the account or policy
has actually been issued by the receiving firm, not just funded.

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

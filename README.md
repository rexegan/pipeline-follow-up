# Pipeline Follow-up

A small tracker for things that need a follow-up: people, leads, or threads moving
through pipeline stages, each with an owner and a next-contact date. Items that are
due or overdue surface first, so the list answers one question — *who do I need to
get back to today?*

## Stack

Vite + React 19 + TypeScript. No backend: state lives in the browser's
`localStorage` under `pipeline-follow-up:items:v1`.

## Run it

```bash
npm install
npm run dev
```

Other scripts: `npm run build` (typecheck + production build), `npm run preview`,
`npm run lint`.

## Layout

| Path | What it holds |
| --- | --- |
| `src/types.ts` | `Item`, the `Stage` union, and stage display labels |
| `src/lib/storage.ts` | Load/save to `localStorage`, with validation of stored data |
| `src/lib/dates.ts` | Local-time date math for due/overdue labels |
| `src/components/ItemForm.tsx` | Add-an-item form |
| `src/components/ItemCard.tsx` | One item: stage, date, touch log, actions |
| `src/App.tsx` | State, filtering, sorting |

## Model

An item is `{ title, owner, notes, stage, followUpOn, touches }`. Stages are
`new → contacted → in-progress → waiting → closed`; closed items drop out of the
due counts. "Logged a touch" appends a timestamp so you can see how many times
someone has been contacted and when.

## Possible next steps

- Persist to a real backend so the list survives a browser change.
- Import contacts from CSV.
- Browser notifications for items due today.

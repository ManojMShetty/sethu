# Sethu — Gram Panchayat asset ledger

A mobile-first civic reporting app for rural Karnataka. A resident reports a
broken streetlight, tap, toilet or borewell; a deadline starts; the report
escalates itself when that deadline passes; and an office that misses one has
to say why in public.

This is the front end only. Every figure on screen derives from the seed data
in `src/data.ts` plus a simulated clock, so it runs with no backend.

## Run it

```
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
```

## Where things are

| File | What it holds |
|---|---|
| `src/data.ts` | Issue types with their SLA hours, the 13 seed reports, and all deadline maths |
| `src/App.tsx` | Tabs, shared state, the demo clock offset |
| `src/components/Header.tsx` | Wordmark, pills, the live stat strip, the demo clock |
| `src/components/Entry.tsx` | One register entry: rail, deadline bar, reason or silence strip |
| `src/components/ReportForm.tsx` | The four-step report form |
| `src/components/VoiceBubble.tsx` | The draggable microphone |
| `src/index.css` | Design tokens for light and dark, and the type treatment |

## The rules worth knowing

**Deadlines are per category, and they are not arbitrary.** A live wire gets
12 hours because it can kill someone tonight. A road hole gets 168 because
filling one needs material and a contractor, and a deadline nobody can meet is
a deadline everybody learns to ignore.

**Escalation is derived, not granted.** `hoursLeft = sla − (age + offset)`.
Nothing in the data model records an approval, because nothing approves it.

**Silence is a state.** A report past its deadline with no `reason` posted
reads as silent and is counted separately in the header. That is the number
the product exists to make visible.

**Only the resident closes a report.** Staff can claim a repair; the person
who filed it decides whether it is fixed.

## The demo clock

`+1 hour` and `+24 hours` advance `clockOffsetHours`. Every age, deadline bar
and header figure recalculates from it. After `+24h`, VYS-0004 (hand pump,
5 hours left at base) tips into overdue, and the "past deadline" count moves.

## Known limits

- Dictation uses the browser's own recogniser, so it needs a signal and https.
  Everything else on the form works offline. Where no recogniser exists the
  bubble does not render at all.
- Kannada is a display toggle over the issue names and tab labels here, not a
  full translation layer.
- Seed data is fixed. Filing a report shows the success screen and a generated
  ID; it does not append to the ledger.

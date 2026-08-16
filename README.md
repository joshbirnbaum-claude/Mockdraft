# Instant Mocks

Fantasy football mock drafts with no lobby wait. Create a room, share the code, and the draft opens the instant everyone's ready — every empty seat is filled by an ADP-driven bot. When the last pick is in, every roster gets graded.

## Stack

- **server/** — Node + Express + Socket.io. Holds all room/draft state in memory, runs the pick clock, the bot AI, and post-draft grading.
- **client/** — React + Vite + TypeScript + Tailwind. The draft room UI.
- **shared/** — Types, the ADP dataset, and draft-order/value-curve math used by both sides.

## Running locally

```bash
npm install
npm run dev
```

This starts the server on `:4000` and the client on `:5173` (via `concurrently`). Open `http://localhost:5173`.

To point the client at a different server (e.g. a deployed backend), set `VITE_SERVER_URL` (see `client/.env.example`). The server's allowed CORS origin is controlled by `CLIENT_ORIGIN` (defaults to `*`).

## How a draft works

1. **Create a room** — pick league size, roster construction, draft type (snake/linear, with optional 3rd-round reversal), pick clock, scoring format, and how wild the bots play.
2. Every seat starts as a bot. **Share the room code/link** — friends claim seats and hit "ready."
3. The draft **auto-starts the instant every human seat is ready** (or the host can force-start anytime). Draft order is randomized at start.
4. Each team's clock runs independently; if it hits zero the pick is made automatically (using that team's queue if they set one, otherwise the same bot logic).
5. **Bots** draft off ESPN PPR ADP (`shared/data/adp.csv`) but don't follow it exactly — each bot gets a randomized "wildness" personality, and pick noise grows in later rounds, so no two mocks play out the same. Bots also respect roster construction (won't hoard one position, won't touch K/D until the last few rounds unless desperate).
6. When the last pick is made, **every roster is graded** (`server/src/draft/grading.ts`): starters are optimally assigned, each pick is tagged steal/reach/fair against its ADP, and teams are graded on a curve within the room (A+ to F).

## Refreshing the ADP dataset

`shared/data/adp.csv` is the single source of truth for player pool + ADP rank, loaded at server startup. Columns: `rank,name,team,position,bye`. To refresh, replace or edit the file with an updated ADP export in the same format — no code changes needed. `rank` doesn't need to be contiguous or file-ordered (decimals like `25.5` are fine for inserting a player between two existing ranks); `posRank` (rank within position) is derived automatically from `adpRank` order, not row order, so edits can go anywhere in the file.

**Data provenance:** as of 2026-08-16, `adp.csv` is transcribed directly from ESPN's live "Draft Trends" ADP table (300 players: rank, avg pick, team, position, %rostered), pasted in by a human since this environment can't reach espn.com itself (outbound fetches to ESPN, FantasyPros, DraftSharks, and other fantasy sites are all egress-blocked here — see below). A few earlier attempts to patch the dataset by hand from model training data or web-search snippets got real things wrong (stale trades, a missing rookie class); this ESPN pull superseded and corrected all of that. Two adjustments were made in transcription: ESPN's `AVG PICK` column has heavy ties (many players share `169.9`), so the CSV's `rank` column uses ESPN's own integer rank instead, which is already unique and tie-broken; and defense/special-teams rows (e.g. "Texans D/ST") were expanded to full franchise names ("Houston Texans") to match this app's display convention. `bye` is not part of ESPN's ADP table, so bye weeks are a synthetic team→week mapping — cosmetic only, not used anywhere in the draft or grading logic. This is a point-in-time snapshot, not a live-updating feed — ADP shifts throughout the preseason, so re-paste periodically if freshness matters.

## Notes / current limitations

- Room state is in-memory per server process — restarting the server drops in-progress rooms. Fine for a single-instance deployment; would need shared state (e.g. Redis) to scale horizontally.
- No accounts — a seat is secured by a token stored in the browser's `localStorage`, which is what lets you refresh mid-draft without losing your spot.
- Spectating a room that's already drafting (without having claimed a seat before it started) shows a "already started" notice rather than a full read-only view.
- This environment's network egress is blocked for essentially all external sites (confirmed against ESPN, FantasyPros, DraftSharks, Wikipedia), so the ADP dataset can't be auto-refreshed from here — see "Data provenance" above for how it's kept current instead.

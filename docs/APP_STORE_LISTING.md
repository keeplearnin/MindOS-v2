# App Store listing copy

Paste-ready metadata for App Store Connect. Character limits are Apple's;
counts in brackets are the current draft.

---

## App Name — 30 char limit

`Keel` on its own is very likely taken. Options, best first:

| Name | Chars |
|---|---|
| **Keel: Labs & Daily Habits** | 25 |
| Keel — Health Protocol | 22 |
| Keel Health Tracker | 19 |

Search the App Store for the exact string before committing — the name must be
unique across the store, and App Store Connect rejects duplicates at creation
time, not at submission.

## Subtitle — 30 char limit

```
Turn lab results into habits
```
[28]

## Promotional text — 170 char limit, editable without a new build

```
Your bloodwork says what to fix. Keel turns it into eight daily habits, tracks what you actually did, and shows each marker moving toward its target.
```
[149]

## Description — 4000 char limit

```
Keel connects your lab results to what you do every day.

Most health apps count steps. Keel starts from your bloodwork — LDL particles, A1c, hs-CRP, homocysteine, ferritin — and turns those numbers into a short daily protocol you can actually finish.

EIGHT A DAY, NOT SIXTEEN
The protocol lists sixteen habits. The daily target is eight. Hit eight and the day is complete; anything beyond that is a bonus, never a requirement. A day takes about thirty seconds to log.

EVERY HABIT IS TIED TO A MARKER
Each habit shows which biomarkers it moves, so you always know why you are doing it. Fiber sits under LDL and glucose. Omega-3 sits under hs-CRP. Nothing is arbitrary.

METRICS THAT COMPLETE THEMSELVES
Log 110 g of protein and the protein habit ticks itself. Log fiber, steps, or sleep and the same thing happens. Tick tonight's protocol dinner and its calories and macros are counted for you — no re-typing what the plan already knows.

YOUR MARKERS, AGAINST THEIR TARGETS
Import your results and every marker appears against its reference range, with the change since your last draw and a trend line. Progress is judged by distance from the target zone, so a marker falling below its floor reads as worse — not better.

A WEEK OF MEALS, WITH THE REASONING
Seven protocol dinners with full recipes, macros, and a plain explanation of which lab values each meal is meant to support.

THE REST OF YOUR DAY
Keel also carries the productivity side: tasks with an Eisenhower matrix, GTD inbox processing, calendar, a journal, and a weekly review — because health habits do not live in a separate app from everything else you are trying to do.

PRIVATE BY DEFAULT
Your data is yours. Every record is protected by row-level security and readable only by you. No advertising, no data brokers, no tracking across apps. Delete your account and it is gone permanently.

Keel is a personal tracking tool, not a medical device. It does not diagnose or treat any condition. Reference ranges are shown for context only — discuss your results with a qualified healthcare provider.
```
[2068]

## Keywords — 100 char limit, comma-separated, no spaces after commas

```
biomarker,bloodwork,labs,cholesterol,a1c,habit,protocol,tracker,wellness,gtd,tasks,journal,routine
```
[97]

Do not repeat words already in the app name or subtitle — Apple indexes those
separately, so repeating them wastes characters.

## Category

- **Primary:** Health & Fitness
- **Secondary:** Productivity

## URLs

| Field | Value |
|---|---|
| Support URL | `https://<your-domain>/support` |
| Privacy Policy URL | `https://<your-domain>/privacy` |
| Marketing URL | optional — leave blank |

Both pages ship in the app. Use your real domain once it points at Vercel;
`mindos-v2.vercel.app` works for review but looks unfinished, and Google OAuth
verification will require the custom domain anyway.

## Age rating

Expect **4+**, with one caveat: the questionnaire asks about *Medical or
Treatment Information*. Keel displays reference ranges next to biomarkers, so
answer **Infrequent/Mild** rather than None. That is still 4+ and answering it
honestly avoids a metadata rejection.

## What's New (first release)

```
First release.

• Daily protocol — eight habits a day, each tied to the biomarkers it moves
• Markers — import your lab results and watch each one against its target
• Fuel — calories and macros, with the protocol dinner counted automatically
• Trends — adherence heatmap, streaks, and blood pressure over time
• Tasks, calendar, journal, and a weekly review
```

## Screenshots

Five 6.7"/6.9" iPhone screenshots (1290 × 2796) are generated in
`docs/appstore-screenshots/`. Apple accepts a 6.7" set as the only required
size and scales it for smaller devices, so no other sizes are needed unless you
also ship iPad.

Suggested order and captions, if you add text overlays:

1. **01-today** — "Eight habits a day. Thirty seconds to log."
2. **03-markers** — "Every marker against its target."
3. **02-fuel** — "Macros, with dinner counted for you."
4. **04-trends** — "See adherence and streaks build."
5. **05-plan** — "A week of meals, with the reasoning."

## Review notes — paste into App Review Information

```
Keel is a personal health and productivity tracker.

Sign-in: the demo account below is pre-populated with habit history,
biomarker results, and tasks so all features are visible.

Health data is entered or imported by the user. The app does not read
from Apple Health and does not connect to any medical device. Reference
ranges shown next to biomarkers are informational only; the app makes no
diagnosis and gives no treatment advice.

Notifications are local only (a user-configurable daily reminder). No
push server, no APNs.
```

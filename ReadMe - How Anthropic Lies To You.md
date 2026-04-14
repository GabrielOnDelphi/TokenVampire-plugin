# Why Anthropic's Usage Page Lies To You

Anthropic's [usage page](https://claude.ai/settings/usage) shows a progress bar: **"Current session — Resets in X hours."** No token counts, no breakdown, no history. Just a bar.

The real problem: **that bar is fundamentally broken** for a rolling window.

## Rolling windows can't be a progress bar

Your quota isn't a bucket that fills and empties. It's a **sliding 5-hour window**. Tokens drip out continuously as they age past 5 hours — there is no single "reset" moment.

**"Resets in X hours"** implies your quota dumps to zero at that time. It doesn't. That timer shows when your *oldest* tokens expire — one small chunk. Everything else keeps counting against you.

## Same bar, completely different realities

**Scenario A:** You idle for 4h55m, then burn 88M tokens in a 5-minute burst. Rate-limited at 100%.

Five minutes later, what expired? Five minutes of *silence* from 5 hours ago — zero tokens. Your burst is 10 minutes old, won't expire for 4h50m. Progress bar: still ~100%. You're stuck for hours.

**Scenario B:** You burn the same 88M tokens *spread evenly* over 5 hours. Also 100%, also rate-limited.

But tokens are constantly dripping off the back. In 15 minutes, real headroom opens up.

**Same progress bar. Same 100%. Same "Resets in X hours."** One scenario traps you for 5 hours, the other frees you in 15 minutes. The progress bar shows the same thing for both.

A rolling window is **two-dimensional** — usage over time. A progress bar crushes that into one number, destroying the information you actually need:
- **When** were tokens consumed? (Determines when they expire)
- **How much expires soon?** (Heavy session 4.5h ago = relief is minutes away)
- **How much is recent?** (Last-hour burst = stuck for a long time)
- **What kind of tokens?** (Cache reads are cheap, cache creation is expensive)

Showing a rolling window as a progress bar is like showing a heart rate monitor as a single BPM number — it tells you almost nothing compared to seeing the waveform.

## What ClaudeTokenVampire shows instead

A **per-15-minute bar chart** spanning the full 5-hour window (plus 5 hours of grayed-out history):

- Burst scenario: one massive red spike at the right edge, empty elsewhere — nothing expires soon.
- Spread scenario: bars across the whole window, leftmost ones about to fall off — relief is imminent.

The difference is **immediately visible**. No guessing.

### Comparison

| | claude.ai/settings/usage | ClaudeTokenVampire |
|---|---|---|
| **Token counts** | Hidden behind a vague progress bar | Exact numbers by type |
| **Rolling window** | Flattened into one bar | 5h bar chart showing distribution over time |
| **"Reset" timer** | Implies all-at-once reset (false) | Shows exactly what's expiring and when |
| **Per-project split** | None | Every project tracked separately |
| **Cache status** | Not shown | Hit rate + warm/cold warning |
| **Cost estimate** | Not shown | Configurable per-token rates |
| **History** | None | 10h chart (5h active + 5h grayed) |
| **Works offline** | Needs browser + login | Local files only. Zero tokens. Zero API calls. |

Anthropic tells you _that_ you're using tokens. ClaudeTokenVampire tells you _how many_, _where_, _how fast_, _what kind_, and _what's coming next_.

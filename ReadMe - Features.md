# Implemented Features

### Data Engine
- Parses all billable token types: input, output, cache creation, cache read
- Sorts entries by timestamp; skips non-`assistant` entries
- **5-hour rolling window** for stats (what Anthropic counts against your limit)
- **10-hour display window** (5h active + 5h history) for chart context
- Per-project breakdown, sorted descending by token usage
- Configurable bucket width (2–60 minutes per chart bar)

### Computed Stats (per window, global and per-project)
- Total tokens: input + output + cache creation + cache read
- Per-type token breakdown
- Message count (assistant turns)
- Cache hit rate: `cache_read / (cache_read + input)`
- Cost estimate in USD (four independently configurable $/1M rates)
- Minutes until the oldest entry expires from the 5h window
- Idle minutes since the last message
- Cache gap warning (5m and 1h tier cold/warm detection)
- Cache tier breakdown: 1h ephemeral vs 5m ephemeral tokens
- Web search and web fetch counts

### All Projects Tab
- Combined stats across all projects
- Four gradient progress bars: token usage · cache hit rate · next expiry · cache warmth
- Bar chart with configurable bucket width
- Color-coded bars: green ? yellow ? orange ? red by % of per-slot budget
- Auto-scale blue mode when no limit is configured
- Historical bars (muted colors) showing 5h before the active window
- Vertical separator line marking the rolling 5h boundary
- Token value labels above each active bar
- Y-axis with token count labels
- X-axis with hour labels and "now" marker
- 10% horizontal grid lines; vertical hour-mark grid lines
- Legend (color key or auto-scale note)
- Cache status line: shows both 5m and 1h tier state + idle time, color-coded
- **Hot hours warning** (13:00–18:59 local time — Anthropic peak load window)
- Detailed tooltips on every stat label

### Per Project Tab
- Project list: active projects (with token counts) and inactive known projects (gray, separated)
- Per-project stats: tokens · messages · cache hit rate · cost · expiry · cache status
- Per-project bar chart (same renderer, filtered data)
- Selection preserved across automatic refreshes

### General UI
- Status bar: last scan time · session files scanned · messages in 5h · active project count
- Manual refresh button
- Settings dialog
- FMX skin / theme picker (multiple built-in skins)
- Auto-refresh timer (configurable interval, default 60 s)
- Form position auto-saved and restored (LightSaber TLightForm)
- User configurable time per bar (now one bar = 15 minutes)

### Plugin & Distribution
- Claude Code plugin installed via Node.js (no admin required)
- Skill: `/claudetokenvampire:monitor`
- Hook-based **instant launch** (bypasses the model entirely): type _launch vampire_, _start vampire_, or _token monitor_
- Windows directory junctions for skill cache discovery (no admin, zero-copy, stays in sync)
- `Install.cmd` / `Uninstall.cmd` wrappers for double-click install


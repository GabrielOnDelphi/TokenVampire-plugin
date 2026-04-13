# Claude ClaudeTokenVampire

A system-tray app that monitors your Claude Code token usage in real time.
Anthropic doesn't tell you how much of your 5-hour rolling quota you've consumed — ClaudeTokenVampire does.

![ClaudeTokenVampire - Screenshot](ScreenShot.png)

## What it does

- Tracks **all token types**: input, output, cache creation, cache reads
- Shows a **5-hour [rolling window](https://gabrielmoraru.com/the-5-hour-mirage-anthropics-diabolical-moving-goalposts-subscription/)** with per-hour bar chart
- Color-coded bars: green → yellow → red as you approach your limit
- Estimates **cost** (configurable $/1M token rates)
- Shows **cache hit rate** and warns when the 5-minute cache gap expires
- Counts down until the oldest tokens **evaporate** from the window
- Runs quietly in the **system tray** — click the icon to show/hide
- USES 0 TOKENS! 

## Views

- **All Projects** — combined rolling 5h view across everything
- **Per Project** — same chart broken down by project

## Settings

- Token limit (default 88M — roughly Anthropic's Max 5x tier)
- Cost rates per 1M tokens (input / output / cache read / cache create)
- Refresh interval (default 60s)
- Start minimized
- Start with Windows

## Requirements

- Windows 10/11
- Claude Code (no API keys needed)
- Zero external libraries.


## Platform support

| Platform | Status |
|----------|--------|
| Windows  | Available now |
| macOS    | Coming soon |

The codebase uses FMX (FireMonkey), which is cross-platform. The macOS port mainly requires swapping `%USERPROFILE%\.claude\` for `~/.claude/`.


# User manual 

## All Projects Tab

### Stats Panel (top)

| Label | Meaning |
|-------|---------|
| **Total tokens (5h)** | Sum of all tokens (input + output + cache creation + cache read) in the last 5 hours. Shown as `used / limit`. |
| **Messages** | Number of assistant responses in the 5h window. |
| **Cache hit rate** | `cache_read / (cache_read + input)`. Higher = cheaper. 99%+ is normal for long sessions. |
| **Estimated cost** | USD estimate based on token counts and per-million rates (configurable in Settings). |
| **Next expiry in** | Minutes until the oldest message in the window "falls off" (older than 5h). Usage drops when messages expire. |
| **Cache status** | **Warm** = last message < 5 min ago (5-minute cache still valid). **CACHE COLD** (orange) = gap > 5 min, next message will rebuild the cache (expensive). |
| **Web searches / fetches** | Count of web_search and web_fetch tool calls in the window. |
| **Cache 1h / 5m** | Breakdown of cache creation tokens by tier: 1-hour ephemeral vs 5-minute ephemeral. Display only — already included in total. |

### Chart (bottom)

Each bar height = total tokens used in the user-defined interval (default 15 minutes).

**Y-axis** scales to your per-hour budget (limit / 5). So if your limit is 88M, the Y-axis tops out around 17.6M per hour.

**Bar colors** (when limit is set):
- Green: < 50% of Y-axis max
- Yellow: 50-75%
- Orange: 75-90%
- Red: >= 90%

**Bar colors** (no limit set): blue (auto-scale mode).

A value label appears above each bar showing the token count for that hour.

**Legend** at the bottom shows the color key.

## Per Project Tab

Left panel: list of projects sorted by total tokens (heaviest first).
Right panel: same stats and chart, but filtered to the selected project.

Click a project to view its individual stats and hourly chart.

## Settings

| Setting | Default | Notes |
|---------|---------|-------|
| Max tokens (5h window) | 88,000,000 | Your estimated 5h rolling limit. Set to 0 if unknown (chart switches to auto-scale blue). |
| Cost: input tokens ($/1M) | 3.00 | Anthropic's price per 1M input tokens |
| Cost: output tokens ($/1M) | 15.00 | Per 1M output tokens |
| Cost: cache read ($/1M) | 0.30 | Per 1M cache-read tokens |
| Cost: cache creation ($/1M) | 3.75 | Per 1M cache-creation tokens |
| Refresh interval (seconds) | 60 | How often to re-scan session files. Minimum 10. |
| Start minimized to tray | off | Hide window on app startup |
| Start with Windows | off | Launch at Windows login |

## Tips

- **"CACHE COLD" warning**: If you step away for > 5 minutes, the next Claude message will rebuild the prompt cache (costs more tokens). Resume work within 5 min to keep cache warm.
- **Next expiry**: When this hits 0, your oldest messages roll off and total usage drops. Useful to know if you're near the limit — just wait.
- **Per-hour chart**: Helps spot usage spikes. A single heavy hour (large bar) suggests a big refactor or long conversation.
- **Cost estimate**: Approximate. Real billing may differ. Useful for relative comparison.

## Safety

It opens files in read-only shared mode so it never interferes with Claude Code. 
No data is sent anywhere.
No tokens are wasted.


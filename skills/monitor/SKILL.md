---
name: monitor
description: Launch ClaudeTokenVampire tray app to monitor Claude Code token usage in real time
disable-model-invocation: true
---

# ClaudeTokenVampire — Token Usage Monitor

Launch ClaudeTokenVampire to monitor your Claude Code 5-hour session token window.
Windows only. Runs as a system-tray app.

```powershell
Start-Process "${CLAUDE_PLUGIN_ROOT}/bin/ClaudeTokenVampire.exe"
```

ClaudeTokenVampire shows:
- Total tokens in the current 5-hour session (input + output + cache)
- Per-bucket bar chart spanning `session_start -> session_end`, color-coded by usage level
- Cache hit rate and cache tier status (warm/cold)
- Estimated cost based on configurable per-million rates
- Time until the session hard-resets (single reset, not per-message expiry)
- Per-project breakdown

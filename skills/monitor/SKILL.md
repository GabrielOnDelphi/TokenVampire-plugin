---
name: monitor
description: Launch ClaudeTokenVampire﻿﻿ tray app to monitor Claude Code token usage in real time
disable-model-invocation: true
---

# ClaudeTokenVampire﻿﻿ — Token Usage Monitor

Launch ClaudeTokenVampire﻿﻿ to monitor your Claude Code 5-hour rolling token window.
Windows only. Runs as a system-tray app.

```bash
start "" "${CLAUDE_PLUGIN_ROOT}/bin/ClaudeTokenVampire﻿﻿.exe"
```

ClaudeTokenVampire﻿﻿ shows:
- Total tokens in last 5 hours (input + output + cache)
- Per-hour bar chart with color-coded usage levels
- Extended 10-hour history (muted bars for expired tokens)
- Cache hit rate and cache tier status (warm/cold)
- Estimated cost based on configurable per-million rates
- Time until oldest messages expire from the window
- Per-project breakdown

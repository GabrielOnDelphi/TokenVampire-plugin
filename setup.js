// ClaudeTokenVampire — install/uninstall helper
// Usage: node setup.js install | uninstall

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MARKETPLACE      = 'claudetokenvampire';
const PLUGIN_ID        = 'claudetokenvampire';
const PLUGIN_KEY       = PLUGIN_ID + '@' + MARKETPLACE;
// HOOK_TRIGGER: regex matched inside the ps1 helper — NOT used as settings.json matcher
// (UserPromptSubmit hooks ignore matcher; filtering must be done in the command itself)
const HOOK_TRIGGER     = 'launch vampire|start vampire|token monitor|launch tokenvampire|start tokenvampire';
// HOOK_MATCHER_LEGACY: old setup.js used this as settings.json matcher — kept for uninstall cleanup
const HOOK_MATCHER_LEGACY = HOOK_TRIGGER;
const VERSION          = 'local';
const CLAUDE_DIR       = path.join(process.env.USERPROFILE, '.claude');
const PLUGINS_DIR      = path.join(CLAUDE_DIR, 'plugins');
const CACHE_DIR        = path.join(PLUGINS_DIR, 'cache', MARKETPLACE, PLUGIN_ID, VERSION);
const MKT_DIR          = path.join(PLUGINS_DIR, 'marketplaces', MARKETPLACE);
const SETTINGS_FILE    = path.join(CLAUDE_DIR, 'settings.json');
const KNOWN_MKT        = path.join(PLUGINS_DIR, 'known_marketplaces.json');
const INSTALLED        = path.join(PLUGINS_DIR, 'installed_plugins.json');
const HOOK_SCRIPT_PATH = path.join(CLAUDE_DIR, 'vampire-hook.ps1');
const STATUSLINE_PATH  = path.join(CLAUDE_DIR, 'vampire-statusline.ps1');
const PLUGIN_DIR       = __dirname;

// Generate the ps1 helper script content with the actual EXE path embedded.
// Claude Code's UserPromptSubmit hooks fire for ALL prompts — the matcher field is ignored.
// Filtering must be done inside the command. The script reads stdin JSON (field: "prompt")
// and only launches the EXE when the prompt matches HOOK_TRIGGER.
function hookPs1Content(exePath) {
    // Escape single quotes in path for PowerShell single-quoted string
    const safePath = exePath.replace(/'/g, "''");
    return `$stdin = [Console]::In.ReadToEnd()
if ($stdin -eq '') { exit 0 }
try {
    $j = $stdin | ConvertFrom-Json
    $prompt = $j.prompt
} catch {
    exit 0
}
if ($prompt -imatch '${HOOK_TRIGGER}') {
    Start-Process '${safePath}'
}
`;
}

// Statusline ps1: reads rate_limits from Claude Code's stdin JSON and writes them to a
// JSON file the desktop app polls. Anthropic only exposes rate_limits on Claude.ai Pro/Max
// after the first API response, so the snapshot may take a moment to appear.
// Schema: https://code.claude.com/docs/en/statusline (rate_limits.five_hour.{used_percentage,resets_at})
function statuslinePs1Content() {
    return `$stdin = [Console]::In.ReadToEnd()
if ($stdin -eq '') {
    Write-Output ''
    exit 0
}
try {
    $j = $stdin | ConvertFrom-Json
    $rl = $j.rate_limits
    if ($rl -ne $null) {
        $out = @{ written_at = [int][double]::Parse((Get-Date -UFormat %s)) }
        if ($rl.five_hour -ne $null) {
            $out.five_hour = @{
                used_percentage = $rl.five_hour.used_percentage
                resets_at       = $rl.five_hour.resets_at
            }
        }
        if ($rl.seven_day -ne $null) {
            $out.seven_day = @{
                used_percentage = $rl.seven_day.used_percentage
                resets_at       = $rl.seven_day.resets_at
            }
        }
        $dir = Join-Path $env:APPDATA 'Light TokenVampire'
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        $jsonPath = Join-Path $dir 'rate_limits.json'
        $out | ConvertTo-Json -Depth 4 | Set-Content -Path $jsonPath -Encoding utf8 -Force
    }
} catch {
}
Write-Output ''
exit 0
`;
}

// ANSI color helpers. Windows 10/11 cmd.exe and Terminal honor these out of the box;
// older shells fall through harmlessly (chunks of '\x1b[...m' visible but readable).
// Routed to a single output channel: stdout for normal lines, stderr for errors.
const ANSI = {
    gray:  '\x1b[90m',
    green: '\x1b[32m',
    red:   '\x1b[31m',
    reset: '\x1b[0m'
};
function log(msg)     { process.stdout.write(ANSI.gray  + msg + ANSI.reset + '\n'); }
function logOk(msg)   { process.stdout.write(ANSI.green + msg + ANSI.reset + '\n'); }
function logErr(msg)  { process.stderr.write(ANSI.red   + msg + ANSI.reset + '\n'); }

function readJSON(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
    catch (e) { return null; }
}

function writeJSON(filePath, data) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function junctionExists(linkPath) {
    // lstatSync does NOT follow junctions — detects junction even when target is missing.
    // fs.existsSync follows junctions and returns false for broken ones, so we can't use it here.
    try { fs.lstatSync(linkPath); return true; }
    catch (e) { return false; }
}

function createJunction(target, linkPath) {
    if (junctionExists(linkPath)) {
        // rmdir removes the junction itself without following it or deleting target contents.
        // Never use fs.rmSync({recursive:true}) here — it may follow the junction and delete files.
        try { execSync(`rmdir "${linkPath}"`, { shell: 'cmd.exe', stdio: 'ignore' }); } catch (e) {}
    }
    // Ensure parent exists
    const parent = path.dirname(linkPath);
    if (!fs.existsSync(parent))
        fs.mkdirSync(parent, { recursive: true });
    // Create Windows junction (no admin needed)
    execSync(`mklink /J "${linkPath}" "${target}"`, { shell: 'cmd.exe' });
}

function removeJunction(linkPath) {
    if (junctionExists(linkPath)) {
        // rmdir removes junction without deleting target contents
        try { execSync(`rmdir "${linkPath}"`, { shell: 'cmd.exe', stdio: 'ignore' }); } catch (e) {}
    }
}

function install() {
    const now = new Date().toISOString();
    const exePath = path.join(PLUGIN_DIR, 'bin', 'ClaudeTokenVampire.exe');

    // Verify EXE exists before doing anything
    if (!fs.existsSync(exePath)) {
        logErr('ERROR: EXE not found: ' + exePath);
        logErr('Ensure ClaudeTokenVampire.exe is in the bin\\ subfolder.');
        process.exit(1);
    }

    // 1. Create junctions (cache + marketplace) → plugin directory
    //    Claude Code reads skills from the cache path, marketplace for discovery.
    createJunction(PLUGIN_DIR, CACHE_DIR);
    createJunction(PLUGIN_DIR, MKT_DIR);
    log('  Cache junction: ' + CACHE_DIR + ' -> ' + PLUGIN_DIR);
    log('  Mkt junction:   ' + MKT_DIR + ' -> ' + PLUGIN_DIR);

    // Verify junctions were created
    if (!junctionExists(CACHE_DIR) || !junctionExists(MKT_DIR)) {
        logErr('ERROR: Junction creation failed. Try running as administrator.');
        process.exit(1);
    }

    // 2. settings.json — declare marketplace + enable plugin
    const s = readJSON(SETTINGS_FILE) || {};
    if (!s.extraKnownMarketplaces) s.extraKnownMarketplaces = {};
    s.extraKnownMarketplaces[MARKETPLACE] = {
        source: { source: 'directory', path: PLUGIN_DIR }
    };
    if (!s.enabledPlugins) s.enabledPlugins = {};
    s.enabledPlugins[PLUGIN_KEY] = true;

    // 3. Write the ps1 helper script that does prompt-based filtering.
    //    UserPromptSubmit hooks fire for ALL prompts (matcher field is ignored for this event).
    //    The script reads stdin JSON { prompt: "..." } and launches the EXE only on keyword match.
    fs.writeFileSync(HOOK_SCRIPT_PATH, hookPs1Content(exePath), 'utf8');
    log('  Hook script:    ' + HOOK_SCRIPT_PATH);

    // 4. Inject UserPromptSubmit hook into settings.json.
    //    matcher is empty (required field but ignored by Claude Code for UserPromptSubmit).
    //    Hook identified for removal by checking command contains 'vampire-hook.ps1'.
    if (!s.hooks) s.hooks = {};
    if (!s.hooks.UserPromptSubmit) s.hooks.UserPromptSubmit = [];
    // Remove previous TokenVampire entries (both old-style by matcher and new-style by command)
    s.hooks.UserPromptSubmit = s.hooks.UserPromptSubmit.filter(h =>
        h.matcher !== HOOK_MATCHER_LEGACY &&
        !(h.hooks && h.hooks.some(hk => hk.command && hk.command.includes('vampire-hook.ps1')))
    );
    s.hooks.UserPromptSubmit.push({
        matcher: '',
        hooks: [{
            type: 'command',
            command: `powershell -NoProfile -ExecutionPolicy Bypass -File "${HOOK_SCRIPT_PATH}"`,
            timeout: 5,
            statusMessage: 'Launching ClaudeTokenVampire...'
        }]
    });

    // 4b. Statusline helper — writes rate_limits.json the desktop app polls for Anthropic's
    //     authoritative 5h reset time. We do NOT trample an existing statusLine; if the user
    //     already has one, we still write the ps1 (harmless) but tell them how to wire it up.
    fs.writeFileSync(STATUSLINE_PATH, statuslinePs1Content(), 'utf8');
    log('  Statusline ps1: ' + STATUSLINE_PATH);

    const existingStatusLine = s.statusLine;
    const ourStatusCommand   = `powershell -NoProfile -ExecutionPolicy Bypass -File "${STATUSLINE_PATH}"`;
    const ourIsAlreadyInstalled =
        existingStatusLine &&
        existingStatusLine.command &&
        existingStatusLine.command.includes('vampire-statusline.ps1');

    if (!existingStatusLine) {
        s.statusLine = { type: 'command', command: ourStatusCommand };
        log('  Statusline registered in settings.json.');
    } else if (ourIsAlreadyInstalled) {
        // Refresh the path in case the user moved the plugin folder.
        s.statusLine = { type: 'command', command: ourStatusCommand };
        log('  Statusline already registered — refreshed path.');
    } else {
        log('  NOTE: You already have a custom statusLine. We did NOT overwrite it.');
        log('        To use the authoritative Anthropic reset time, manually invoke');
        log('        ' + STATUSLINE_PATH + ' from your existing statusLine command');
        log('        (it reads stdin and prints nothing — chain it before your own logic).');
    }

    writeJSON(SETTINGS_FILE, s);

    // 5. known_marketplaces.json — register marketplace with install location
    const km = readJSON(KNOWN_MKT) || {};
    km[MARKETPLACE] = {
        source: { source: 'directory', path: PLUGIN_DIR },
        installLocation: MKT_DIR,
        lastUpdated: now
    };
    writeJSON(KNOWN_MKT, km);

    // 6. installed_plugins.json — register plugin (cache path)
    const ip = readJSON(INSTALLED) || { version: 2, plugins: {} };
    if (!ip.plugins) ip.plugins = {};
    ip.plugins[PLUGIN_KEY] = [{
        scope: 'user',
        installPath: CACHE_DIR,
        version: VERSION,
        installedAt: now,
        lastUpdated: now
    }];
    writeJSON(INSTALLED, ip);

    logOk('Plugin installed.');
    log('  Plugin dir:     ' + PLUGIN_DIR);
    log('  EXE:            ' + exePath);
    log('  Settings:       ' + SETTINGS_FILE);
}

function uninstall() {
    // 1. Remove junctions
    removeJunction(CACHE_DIR);
    removeJunction(MKT_DIR);
    // Clean up empty parent dirs
    for (const d of [path.dirname(CACHE_DIR), path.dirname(path.dirname(CACHE_DIR)),
                      path.dirname(MKT_DIR)]) {
        try {
            if (fs.existsSync(d) && fs.readdirSync(d).length === 0)
                fs.rmdirSync(d);
        } catch (e) {}
    }

    // 2. settings.json — remove plugin, marketplace, and injected hook
    const s = readJSON(SETTINGS_FILE) || {};
    if (s.enabledPlugins) {
        delete s.enabledPlugins[PLUGIN_KEY];
        if (Object.keys(s.enabledPlugins).length === 0)
            delete s.enabledPlugins;
    }
    if (s.extraKnownMarketplaces) {
        const othersUseIt = s.enabledPlugins &&
            Object.keys(s.enabledPlugins).some(k => k.endsWith('@' + MARKETPLACE));
        if (!othersUseIt) {
            delete s.extraKnownMarketplaces[MARKETPLACE];
            if (Object.keys(s.extraKnownMarketplaces).length === 0)
                delete s.extraKnownMarketplaces;
        }
    }
    // Remove injected UserPromptSubmit hook (both old-style by matcher and new-style by command)
    if (s.hooks && s.hooks.UserPromptSubmit) {
        s.hooks.UserPromptSubmit = s.hooks.UserPromptSubmit.filter(h =>
            h.matcher !== HOOK_MATCHER_LEGACY &&
            !(h.hooks && h.hooks.some(hk => hk.command && hk.command.includes('vampire-hook.ps1')))
        );
        if (s.hooks.UserPromptSubmit.length === 0)
            delete s.hooks.UserPromptSubmit;
        if (Object.keys(s.hooks).length === 0)
            delete s.hooks;
    }
    // Remove statusLine entry only when WE installed it (preserve any user-customized one).
    let statuslineWasOurs = false;
    if (s.statusLine && s.statusLine.command && s.statusLine.command.includes('vampire-statusline.ps1')) {
        delete s.statusLine;
        statuslineWasOurs = true;
    }
    writeJSON(SETTINGS_FILE, s);

    // 3. Remove ps1 helper scripts
    if (fs.existsSync(HOOK_SCRIPT_PATH)) {
        fs.unlinkSync(HOOK_SCRIPT_PATH);
        log('  Hook script removed: ' + HOOK_SCRIPT_PATH);
    }
    if (fs.existsSync(STATUSLINE_PATH)) {
        fs.unlinkSync(STATUSLINE_PATH);
        log('  Statusline ps1 removed: ' + STATUSLINE_PATH);
    }
    if (statuslineWasOurs)
        log('  Statusline entry removed from settings.json.');

    // 4. known_marketplaces.json — remove marketplace
    const km = readJSON(KNOWN_MKT);
    if (km) {
        delete km[MARKETPLACE];
        writeJSON(KNOWN_MKT, km);
    }

    // 5. installed_plugins.json — remove plugin
    const ip = readJSON(INSTALLED);
    if (ip && ip.plugins) {
        delete ip.plugins[PLUGIN_KEY];
        writeJSON(INSTALLED, ip);
    }

    logOk('Plugin uninstalled.');
    log('  Settings:       ' + SETTINGS_FILE);
}

// --- Main ---
const action = process.argv[2];
if (action === 'install')        install();
else if (action === 'uninstall') uninstall();
else {
    logErr('Usage: node setup.js install | uninstall');
    process.exit(1);
}

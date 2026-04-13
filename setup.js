// ClaudeTokenVampire — install/uninstall helper
// Usage: node setup.js install | uninstall

const fs = require('fs');
const path = require('path');

const MARKETPLACE  = 'claudetokenvampire';
const PLUGIN_NAME  = 'claudetokenvampire@' + MARKETPLACE;
const SETTINGS_DIR = path.join(process.env.USERPROFILE, '.claude');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json');
const PLUGIN_DIR   = __dirname;

function readSettings() {
    if (!fs.existsSync(SETTINGS_FILE))
        return {};
    try {
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function writeSettings(settings) {
    if (!fs.existsSync(SETTINGS_DIR))
        fs.mkdirSync(SETTINGS_DIR, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

function install() {
    const s = readSettings();

    // Register local directory as marketplace
    if (!s.extraKnownMarketplaces) s.extraKnownMarketplaces = {};
    s.extraKnownMarketplaces[MARKETPLACE] = {
        source: { source: 'directory', path: PLUGIN_DIR }
    };

    // Enable the plugin
    if (!s.enabledPlugins) s.enabledPlugins = {};
    s.enabledPlugins[PLUGIN_NAME] = true;

    writeSettings(s);

    console.log('Plugin installed.');
    console.log('  Plugin dir:  ' + PLUGIN_DIR);
    console.log('  Settings:    ' + SETTINGS_FILE);
}

function uninstall() {
    const s = readSettings();

    // Remove plugin from enabled list
    if (s.enabledPlugins) {
        delete s.enabledPlugins[PLUGIN_NAME];
        if (Object.keys(s.enabledPlugins).length === 0)
            delete s.enabledPlugins;
    }

    // Remove marketplace (only if no other plugins use it)
    if (s.extraKnownMarketplaces) {
        const othersUseIt = s.enabledPlugins &&
            Object.keys(s.enabledPlugins).some(k => k.endsWith('@' + MARKETPLACE));
        if (!othersUseIt) {
            delete s.extraKnownMarketplaces[MARKETPLACE];
            if (Object.keys(s.extraKnownMarketplaces).length === 0)
                delete s.extraKnownMarketplaces;
        }
    }

    writeSettings(s);

    console.log('Plugin uninstalled.');
    console.log('  Settings:    ' + SETTINGS_FILE);
}

// --- Main ---
const action = process.argv[2];
if (action === 'install')        install();
else if (action === 'uninstall') uninstall();
else {
    console.error('Usage: node setup.js install | uninstall');
    process.exit(1);
}

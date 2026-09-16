/**
 * Reads your settings from .env and writes the two files that need them:
 *
 *   src/Env.gs    -> settings the Apps Script code reads (Drive folder, sheet name)
 *   .clasp.json   -> tells clasp which Apps Script project to upload to
 *
 * Run with:  npm run configure   (npm run deploy runs it for you)
 * Both files are git-ignored, so your IDs never end up on GitHub.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');

// ----- 1. Read .env ------------------------------------------------------------
if (!fs.existsSync(ENV_FILE)) {
  fail('No .env file found. Create one first:\n' +
    '  Ubuntu / macOS:  cp .env.example .env\n' +
    '  Windows:         Copy-Item .env.example .env');
}

const env = {};
for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); // KEY=value
  if (!match) continue; // Skip blank lines and # comments
  env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2'); // Strip optional quotes
}

// ----- 2. Check the values -----------------------------------------------------
const settings = {
  SCRIPT_ID: env.SCRIPT_ID || '',
  PARENT_FOLDER_ID: env.PARENT_FOLDER_ID || '',
  SHEET_NAME: env.SHEET_NAME || 'Sheet1',
};

const isBlank = (value) => !value || value.startsWith('PASTE_');

if (isBlank(settings.PARENT_FOLDER_ID)) {
  fail('Please fill in PARENT_FOLDER_ID in your .env file.');
}

// "npm run deploy" passes --deploy, which also needs the Script ID.
if (process.argv.includes('--deploy') && isBlank(settings.SCRIPT_ID)) {
  fail('Please fill in SCRIPT_ID in your .env file (needed for "npm run deploy").');
}

// ----- 3. Write src/Env.gs -----------------------------------------------------
const envGs = `// AUTO-GENERATED from .env by "npm run configure". Do not edit by hand.
function getEnv() {
  return ${JSON.stringify({
    PARENT_FOLDER_ID: settings.PARENT_FOLDER_ID,
    SHEET_NAME: settings.SHEET_NAME,
  }, null, 2).replace(/\n/g, '\n  ')};
}
`;
fs.writeFileSync(path.join(ROOT, 'src', 'Env.gs'), envGs);

console.log('Configured from .env:');
console.log(`  Sheet name:       ${settings.SHEET_NAME}`);
console.log(`  Drive folder ID:  ${settings.PARENT_FOLDER_ID}`);
console.log('  Wrote src/Env.gs');

// ----- 4. Write .clasp.json (only needed for "npm run deploy") -----------------
if (isBlank(settings.SCRIPT_ID)) {
  console.log('  SCRIPT_ID is empty, so .clasp.json was not written.');
  console.log('  That is fine if you copy and paste the code into the browser.');
} else {
  const claspJson = { scriptId: settings.SCRIPT_ID, rootDir: 'src' };
  fs.writeFileSync(path.join(ROOT, '.clasp.json'), JSON.stringify(claspJson, null, 2) + '\n');
  console.log(`  Script ID:        ${settings.SCRIPT_ID}`);
  console.log('  Wrote .clasp.json');
}

function fail(message) {
  console.error(`\nERROR: ${message}\n`);
  process.exit(1);
}

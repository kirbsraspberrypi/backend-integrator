/**
 * Local test for src/Code.gs - no Google account needed.
 * Run with:  node tests/test.js
 *
 * It loads Code.gs with fake SpreadsheetApp / DriveApp objects that mirror
 * the SANDBOX TEST - Intake Roster layout, then checks each rule.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// ----- Fake sheet (same layout as the sandbox file) -------------------------
function makeSheet() {
  const cells = {
    1: { 1: 'SINCERE CARE LLC - INTERNAL TESTING ENVIRONMENT' },
    2: { 1: 'Ensure all dates are formatted as MM/DD/YYYY' },
    6: { 1: 'Total Enrolled Students:', 2: 0 },
    10: { 1: 'Timestamp', 2: 'Student Name', 3: 'Mobile Phone', 4: 'Approval Status' },
    11: { 1: '09/16/2026', 2: 'John Doe', 3: 2165551234, 4: 'Pending' },
    12: { 1: '09/16/2026', 2: 'Jane Smith', 3: 2165559876, 4: 'Pending' },
  };
  const sheet = {
    getName: () => 'Sheet1',
    getLastRow: () => Math.max(...Object.keys(cells).map(Number)),
    getRange: (row, col, numRows = 1, numCols = 1) => ({
      getSheet: () => sheet,
      getRow: () => row,
      getColumn: () => col,
      getNumRows: () => numRows,
      getNumColumns: () => numCols,
      getValue: () => (cells[row] && cells[row][col]) ?? '',
    }),
    set: (row, col, value) => { (cells[row] = cells[row] || {})[col] = value; },
  };
  return sheet;
}

// ----- Fake Drive folder -----------------------------------------------------
function makeDrive() {
  const created = [];
  const folder = {
    getFoldersByName: (name) => ({ hasNext: () => created.includes(name) }),
    createFolder: (name) => created.push(name),
  };
  return { created, DriveApp: { getFolderById: () => folder } };
}

// ----- Load Code.gs into a sandbox ------------------------------------------
function load() {
  const sheet = makeSheet();
  const drive = makeDrive();
  const context = {
    console: { log() {}, warn() {} },
    DriveApp: drive.DriveApp,
    SpreadsheetApp: { getActive: () => ({ getSheetByName: () => sheet }) },
  };
  vm.createContext(context);
  const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'Code.gs'), 'utf8');
  vm.runInContext(code, context);

  // Simulates a user typing a value into a cell (what the trigger receives).
  const edit = (row, col, value) => {
    const oldValue = sheet.getRange(row, col).getValue();
    sheet.set(row, col, value);
    context.handleEdit({ range: sheet.getRange(row, col), oldValue, value });
  };
  return { context, sheet, created: drive.created, edit };
}

// ----- Tests -----------------------------------------------------------------
const tests = {
  'Row 11 changed to Approved creates the folder'() {
    const t = load();
    t.edit(11, 4, 'Approved');
    assert.deepStrictEqual(t.created, ['John Doe - Documentation Portfolio']);
  },

  'Rows 1-10 are ignored even if set to Approved'() {
    const t = load();
    for (let row = 1; row <= 10; row++) t.edit(row, 4, 'Approved');
    assert.deepStrictEqual(t.created, []);
  },

  'Other statuses do not trigger'() {
    const t = load();
    t.edit(11, 4, 'Denied');
    t.edit(11, 4, 'approved pending');
    assert.deepStrictEqual(t.created, []);
  },

  'Edits outside Column D do not trigger'() {
    const t = load();
    t.edit(11, 2, 'Approved');
    assert.deepStrictEqual(t.created, []);
  },

  'Re-approving does not create a duplicate folder'() {
    const t = load();
    t.edit(11, 4, 'Approved');
    t.edit(11, 4, 'Pending');
    t.edit(11, 4, 'Approved');
    assert.deepStrictEqual(t.created, ['John Doe - Documentation Portfolio']);
  },

  'Pasting a block over rows 9-12 only processes rows 11-12'() {
    const t = load();
    for (let row = 9; row <= 12; row++) t.sheet.set(row, 4, 'Approved');
    t.context.handleEdit({ range: t.sheet.getRange(9, 4, 4, 1) });
    assert.deepStrictEqual(t.created, [
      'John Doe - Documentation Portfolio',
      'Jane Smith - Documentation Portfolio',
    ]);
  },

  'Phone regex accepts only a clean 10-digit string'() {
    const { context } = load();
    const regex = new RegExp(vm.runInContext('PHONE_REGEX', context));
    for (const ok of ['2165551234', '0000000000']) assert.ok(regex.test(ok), ok);
    for (const bad of ['216555123', '21655512345', '216-555-1234', '(216) 5551234',
      '+12165551234', '216 555 1234', '216555123a', '', ' 2165551234']) {
      assert.ok(!regex.test(bad), `should reject "${bad}"`);
    }
  },
};

let failed = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log(`PASS  ${name}`); }
  catch (err) { failed++; console.log(`FAIL  ${name}\n      ${err.message}`); }
}
console.log(`\n${Object.keys(tests).length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

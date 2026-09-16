/**
 * SANDBOX TEST - Intake Roster automation
 *
 * When a student's "Approval Status" (Column D) changes to "Approved",
 * create a Drive folder named "<Student Name> - Documentation Portfolio".
 *
 * Rows 1-10 hold KPIs, instructions and headers, so they are always ignored.
 * Student records start on row 11.
 *
 * Your own values (Drive folder ID, sheet name) live in the .env file.
 * "npm run configure" copies them into Env.gs, which this file reads via getEnv().
 */

// ---------------------------------------------------------------------------
// SETTINGS - fixed layout of the Intake Roster
// (Drive folder ID and sheet name come from .env -> Env.gs)
// ---------------------------------------------------------------------------
const CONFIG = {
  FIRST_DATA_ROW: 11,            // Rows above this are never processed
  NAME_COLUMN: 2,                // Column B - Student Name
  PHONE_COLUMN: 3,               // Column C - Mobile Phone
  STATUS_COLUMN: 4,              // Column D - Approval Status
  APPROVED_VALUE: 'Approved',
  FOLDER_SUFFIX: ' - Documentation Portfolio',
};

// Exactly 10 digits, nothing else (no spaces, dashes, brackets or +1).
const PHONE_REGEX = '^[0-9]{10}$';

// ---------------------------------------------------------------------------
// ONE-TIME SETUP - run this once from the Apps Script editor
// ---------------------------------------------------------------------------
/**
 * Installs the edit trigger. An "installable" trigger is required because
 * the simple onEdit() trigger is not allowed to create Drive folders.
 */
function setup() {
  const spreadsheet = SpreadsheetApp.getActive();

  // Remove old copies of the trigger so it never fires twice.
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'handleEdit')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('handleEdit').forSpreadsheet(spreadsheet).onEdit().create();
  console.log('Edit trigger installed.');
}

// ---------------------------------------------------------------------------
// TRIGGER - runs automatically every time someone edits the sheet
// ---------------------------------------------------------------------------
function handleEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();

  // Only watch the roster tab.
  if (sheet.getName() !== getEnv().SHEET_NAME) return;

  // Only watch Column D.
  const firstCol = range.getColumn();
  const lastCol = firstCol + range.getNumColumns() - 1;
  if (CONFIG.STATUS_COLUMN < firstCol || CONFIG.STATUS_COLUMN > lastCol) return;

  // Row isolation: skip rows 1-10 entirely.
  const firstRow = Math.max(range.getRow(), CONFIG.FIRST_DATA_ROW);
  const lastRow = range.getRow() + range.getNumRows() - 1;
  if (lastRow < CONFIG.FIRST_DATA_ROW) return;

  // If one cell was edited and it was already "Approved", nothing changed.
  const isSingleCell = range.getNumRows() === 1 && range.getNumColumns() === 1;
  if (isSingleCell && isApproved(e.oldValue)) return;

  for (let row = firstRow; row <= lastRow; row++) {
    processRow(sheet, row);
  }
}

// ---------------------------------------------------------------------------
// OPTIONAL - run manually to create folders for rows already "Approved"
// (e.g. John Doe on row 11, which was approved before the trigger existed)
// ---------------------------------------------------------------------------
function processExistingApprovedRows() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(getEnv().SHEET_NAME);
  for (let row = CONFIG.FIRST_DATA_ROW; row <= sheet.getLastRow(); row++) {
    processRow(sheet, row);
  }
}

// ---------------------------------------------------------------------------
// OPTIONAL - run manually to block bad phone numbers in Column C
// ---------------------------------------------------------------------------
function applyPhoneValidation() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(getEnv().SHEET_NAME);
  const numRows = sheet.getMaxRows() - CONFIG.FIRST_DATA_ROW + 1;
  const phoneRange = sheet.getRange(CONFIG.FIRST_DATA_ROW, CONFIG.PHONE_COLUMN, numRows, 1);
  const firstCell = phoneRange.getCell(1, 1).getA1Notation(); // e.g. "C11"

  const rule = SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied(`=REGEXMATCH(TO_TEXT(${firstCell}), "${PHONE_REGEX}")`)
    .setAllowInvalid(false) // Reject the input instead of only showing a warning
    .setHelpText('Enter a 10-digit phone number using digits only, e.g. 2165551234')
    .build();

  phoneRange.setDataValidation(rule);
  console.log(`Phone validation applied from ${firstCell} down.`);
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
/** Creates the student's folder if the row is approved. */
function processRow(sheet, row) {
  if (row < CONFIG.FIRST_DATA_ROW) return; // Safety net for rows 1-10

  const status = sheet.getRange(row, CONFIG.STATUS_COLUMN).getValue();
  if (!isApproved(status)) return;

  const studentName = String(sheet.getRange(row, CONFIG.NAME_COLUMN).getValue()).trim();
  if (!studentName) {
    console.warn(`Row ${row} is Approved but has no student name. Skipped.`);
    return;
  }

  const folderName = studentName + CONFIG.FOLDER_SUFFIX;
  const parent = DriveApp.getFolderById(getEnv().PARENT_FOLDER_ID);

  // Don't create a duplicate if the status is toggled more than once.
  if (parent.getFoldersByName(folderName).hasNext()) {
    console.log(`Row ${row}: "${folderName}" already exists. Skipped.`);
    return;
  }

  parent.createFolder(folderName);
  console.log(`Row ${row}: created "${folderName}".`);
}

function isApproved(value) {
  return String(value ?? '').trim() === CONFIG.APPROVED_VALUE;
}

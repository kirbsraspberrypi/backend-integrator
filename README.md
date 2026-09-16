# Intake Roster: Row Isolation & Drive Automation

A Google Apps Script for the **SANDBOX TEST - Intake Roster** sheet.

When a student's **Approval Status** (Column D) changes to `Approved`, the script
creates a Google Drive folder named after that student:

```
John Doe - Documentation Portfolio
```

Rows 1–10 hold KPIs, instructions and headers, so the script **never** processes them.
Student records start on **row 11**.

---

## Files

| File | What it is |
|------|------------|
| `src/Code.gs` | The automation. Paste this into the Apps Script editor. |
| `src/appsscript.json` | Project settings and the permissions the script needs. |
| `tests/test.js` | Local test that uses a fake sheet. No Google account needed. |

---

## Setup (about 5 minutes)

1. **Open the sheet** in Google Sheets, then go to **Extensions → Apps Script**.
2. **Paste the code.** Replace everything in `Code.gs` with the contents of `src/Code.gs`.
3. **Set the Drive folder.** Open the test Drive folder in your browser and copy the ID
   from the URL:
   ```
   https://drive.google.com/drive/folders/1AbC...XyZ
                                          └── this part
   ```
   Paste it into `PARENT_FOLDER_ID` at the top of `Code.gs`.
4. **Check the tab name.** If the roster tab isn't named `Sheet1`, update `SHEET_NAME`.
5. **Install the trigger.** Pick `setup` from the function dropdown and click **Run**.
   Approve the permission prompt. You only have to do this once.

That's it. Change any row's Column D (row 11 or below) to `Approved` and the folder
appears in Drive.

### Optional functions (run from the editor)

| Function | When to use it |
|----------|----------------|
| `processExistingApprovedRows` | Creates folders for rows that were already `Approved` before setup, like John Doe in the sandbox. |
| `applyPhoneValidation` | Adds the phone number rule below to Column C, from row 11 down. |

---

## How each rule is handled

| # | Rule | How the script meets it |
|---|------|-------------------------|
| 1 | Trigger only when Column D changes to `Approved` | The trigger exits unless the edit touched Column D and the new value is exactly `Approved`. If the cell already said `Approved`, nothing happens. |
| 2 | Ignore rows 1–10 | Edits that only touch rows 1–10 exit right away. If a pasted block overlaps rows 1–10, processing starts at row 11. `processRow` also checks the row number as a second safeguard. |
| 3 | Create `<Student Name> - Documentation Portfolio` | The folder is created inside `PARENT_FOLDER_ID`. If a folder with that name already exists, no duplicate is made. |
| 4 | Phone number regex | See below. |

**Why an installable trigger?** Google's built-in `onEdit()` trigger doesn't have
permission to create Drive folders. The `setup` function installs a trigger that does.

---

## Phone number regex (Rule 4)

```
^[0-9]{10}$
```

- `^` and `$`: the whole value must match, with nothing before or after.
- `[0-9]{10}`: exactly ten digits.

This blocks spaces, dashes, brackets, `+1` prefixes, letters, and any value with
fewer or more than 10 digits.

To use it as a Google Sheets data validation rule
(**Data → Data validation → Custom formula is**), with Column C starting at row 11:

```
=REGEXMATCH(TO_TEXT(C11), "^[0-9]{10}$")
```

`TO_TEXT` is needed because Sheets stores a typed phone number like `2165551234` as a number.

---

## Running the local test

Requires [Node.js](https://nodejs.org/).

```bash
node tests/test.js
```

Expected output:

```
PASS  Row 11 changed to Approved creates the folder
PASS  Rows 1-10 are ignored even if set to Approved
PASS  Other statuses do not trigger
PASS  Edits outside Column D do not trigger
PASS  Re-approving does not create a duplicate folder
PASS  Pasting a block over rows 9-12 only processes rows 11-12
PASS  Phone regex accepts only a clean 10-digit string

7 passed, 0 failed
```

---

## Notes

- `Approved` is matched exactly (case-sensitive), ignoring extra spaces at either end.
- If an approved row has no student name, it is skipped and a warning is logged.
- To see what the script did, open **Apps Script → Executions**.

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

## Contents

1. [What the task asks for](#what-the-task-asks-for)
2. [Project files](#project-files)
3. [Setting up your computer](#setting-up-your-computer)
   - [Linux (Ubuntu)](#linux-ubuntu)
   - [macOS (MacBook)](#macos-macbook)
   - [Windows 10 and up](#windows-10-and-up)
4. [Running the tests](#running-the-tests)
5. [Putting the script on the Google Sheet](#putting-the-script-on-the-google-sheet)
6. [How each rule is handled](#how-each-rule-is-handled)
7. [Phone number regex](#phone-number-regex)
8. [Troubleshooting](#troubleshooting)

---

## What the task asks for

The main problem is **row isolation**. The roster mixes admin content (rows 1–10) with
student records (row 11 and below). The automation must react to approvals **without ever
treating a header or KPI row as a student**. The Drive folder and the phone regex build on that.

---

## Project files

| File | What it is |
|------|------------|
| `src/Code.gs` | **The automation.** The settings you may need to change are at the top. |
| `src/appsscript.json` | Project settings and the permissions the script needs. |
| `tests/test.js` | Local test that uses a fake copy of the sheet. No Google account needed. |
| `package.json` | Short commands: `npm test`, `npm run login`, `npm run deploy`. |
| `.clasp.json.example` | Template that links this folder to your Apps Script project (Option B below). |

---

## Setting up your computer

You only need a computer setup if you want to **run the tests** or **upload the script from
the command line**. If you plan to copy and paste the code into the browser
([Option A](#option-a-copy-and-paste-no-installs)), you can skip this section.

You will install:

- **Git**: to download the project.
- **Node.js 20 or newer (LTS)**: to run the tests and Google's upload tool (`clasp`).

> The repository is private. Make sure your GitHub account has been given access.
>
> Until the pull request is merged, the code is on a branch. After `cd backend-integrator`, run
> `git checkout feature/intake-roster-drive-automation`.

### Linux (Ubuntu)

Open **Terminal** (`Ctrl` + `Alt` + `T`) and run:

```bash
# 1. Install Git and curl
sudo apt update
sudo apt install -y git curl

# 2. Install Node.js LTS (Ubuntu's built-in version is too old)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Check the versions (Node must be 20 or higher)
git --version
node --version

# 4. Download the project
git clone https://github.com/kirbsraspberrypi/backend-integrator.git
cd backend-integrator

# 5. Run the tests
npm test
```

### macOS (MacBook)

Open **Terminal** (`Cmd` + `Space`, type "Terminal", press Enter) and run:

```bash
# 1. Install Homebrew (skip this if `brew --version` already works)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
#    When it finishes, run the 2 "Next steps" commands it prints to add brew to your PATH.

# 2. Install Git and Node.js
brew install git node

# 3. Check the versions (Node must be 20 or higher)
git --version
node --version

# 4. Download the project
git clone https://github.com/kirbsraspberrypi/backend-integrator.git
cd backend-integrator

# 5. Run the tests
npm test
```

> If you'd rather not use Homebrew, install Node.js LTS from <https://nodejs.org>, and Git with
> `xcode-select --install`.

### Windows 10 and up

Open **PowerShell** (Start menu → type "PowerShell" → press Enter) and run:

```powershell
# 1. Install Git and Node.js LTS (winget is built into Windows 10 1809+ and Windows 11)
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
```

**Close PowerShell and open it again** so it picks up the new programs, then run:

```powershell
# 2. Allow npm commands to run in PowerShell (one time only)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# 3. Check the versions (Node must be 20 or higher)
git --version
node --version

# 4. Download the project
git clone https://github.com/kirbsraspberrypi/backend-integrator.git
cd backend-integrator

# 5. Run the tests
npm test
```

> If `winget` isn't available, download the installers from <https://git-scm.com/download/win>
> and <https://nodejs.org> (choose **LTS**), keeping the default options.

---

## Running the tests

The commands are the same on every system:

```bash
npm test
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

The tests use a fake sheet with the same layout as the sandbox file, so they never touch
your real Google Sheet or Drive.

---

## Putting the script on the Google Sheet

### Before you start: get the Drive folder ID

Open the test Drive folder in your browser and copy the ID from the address bar:

```
https://drive.google.com/drive/folders/1AbC...XyZ
                                       └── this part
```

Open `src/Code.gs` and paste it into `PARENT_FOLDER_ID` at the top.
If the roster tab isn't named `Sheet1`, update `SHEET_NAME` as well.

### Option A: copy and paste (no installs)

1. Open the sheet in Google Sheets, then go to **Extensions → Apps Script**.
2. Replace everything in `Code.gs` with the contents of `src/Code.gs`.
3. Click the **gear icon (Project Settings)**, turn on
   **Show "appsscript.json" manifest file in editor**, and replace that file's contents with
   `src/appsscript.json`.
4. Click **Save**.
5. Continue with [Final step: install the trigger](#final-step-install-the-trigger).

### Option B: upload from the command line (clasp)

Run these commands in the project folder. They're the same on Ubuntu, macOS and Windows.

1. **Turn on the Apps Script API** (one time only): go to
   <https://script.google.com/home/usersettings> and switch it **On**.
2. **Find the Script ID**: in the sheet, go to **Extensions → Apps Script → Project Settings**
   and copy the **Script ID**.
3. **Create your config file** from the template:

   Ubuntu / macOS:
   ```bash
   cp .clasp.json.example .clasp.json
   ```
   Windows (PowerShell):
   ```powershell
   Copy-Item .clasp.json.example .clasp.json
   ```
   Open `.clasp.json` and replace `PASTE_YOUR_SCRIPT_ID_HERE` with the Script ID.
4. **Sign in to Google** (this opens a browser window):
   ```bash
   npm run login
   ```
5. **Upload the script**:
   ```bash
   npm run deploy
   ```
   If it asks whether to overwrite the manifest, answer **Yes**.
6. Continue with [Final step: install the trigger](#final-step-install-the-trigger).

`.clasp.json` is listed in `.gitignore`, so your Script ID is never committed.

### Final step: install the trigger

1. In the Apps Script editor, choose **`setup`** from the function dropdown and click **Run**.
2. Approve the permission prompt. If you see "Google hasn't verified this app", click
   **Advanced → Go to (project name)**.
3. This only needs to be done once.

**Try it:** change any Column D cell on row 11 or below to `Approved`. The folder appears
in the Drive folder.

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

## Phone number regex

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

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `node: command not found` / `'node' is not recognized` | Close and reopen the terminal. If it still fails, install Node.js again (see your OS section). |
| `npm test` fails on Windows with "running scripts is disabled" | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. |
| `node --version` shows lower than 20 | Upgrade Node.js with the steps for your OS. |
| `git clone` asks for a password or says "not found" | The repo is private. Ask for access, then sign in to GitHub when prompted. |
| `npm run deploy` says "User has not enabled the Apps Script API" | Turn it on at <https://script.google.com/home/usersettings> and wait a minute. |
| No folder appears after approving | Check that `PARENT_FOLDER_ID` is set, `setup` was run, the row is 11 or below, and Column D says exactly `Approved`. See **Apps Script → Executions** for logs. |
| Folder already existed, nothing new was created | Expected. The script doesn't create duplicates. |

---

## Notes

- `Approved` is matched exactly (case-sensitive), ignoring extra spaces at either end.
- If an approved row has no student name, it is skipped and a warning is logged.
- The automation runs on edits made by people in the sheet. Changes from other scripts or API
  writes don't fire Google edit triggers.

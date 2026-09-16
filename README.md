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
4. [The .env file](#the-env-file)
5. [Running the tests](#running-the-tests)
6. [Putting the script on the Google Sheet](#putting-the-script-on-the-google-sheet)
7. [How each rule is handled](#how-each-rule-is-handled)
8. [Phone number regex](#phone-number-regex)
9. [Troubleshooting](#troubleshooting)

---

## What the task asks for

The main problem is **row isolation**. The roster mixes admin content (rows 1–10) with
student records (row 11 and below). The automation must react to approvals **without ever
treating a header or KPI row as a student**. The Drive folder and the phone regex build on that.

---

## Project files

| File | What it is |
|------|------------|
| `src/Code.gs` | **The automation.** Trigger, row isolation, Drive folder creation. |
| `src/appsscript.json` | Project settings and the permissions the script needs. |
| `.env.example` | Template for your settings. Copy it to `.env` and fill it in. |
| `scripts/configure.js` | Reads `.env` and creates `src/Env.gs` and `.clasp.json`. |
| `tests/test.js` | Local test that uses a fake copy of the sheet. No Google account needed. |
| `package.json` | Short commands: `npm test`, `npm run configure`, `npm run login`, `npm run deploy`. |

Created on your computer (git-ignored, never committed):

| File | Created by | What it is |
|------|------------|------------|
| `.env` | You (copied from `.env.example`) | Your Drive folder ID, Script ID and sheet name. |
| `src/Env.gs` | `npm run configure` | The `.env` values in a form Apps Script can read. |
| `.clasp.json` | `npm run configure` | Tells clasp which Apps Script project to upload to. |

---

## Setting up your computer

You will install:

- **Git**: to download the project.
- **Node.js 20 or newer (LTS)**: to run the tests, create the settings file and upload the script.

> The repository is private. Make sure your GitHub account has been given access.

### Linux (Ubuntu)

Open **Terminal** (`Ctrl` + `Alt` + `T`) and run:

```bash
# 1. Install Git and curl
sudo apt update
sudo apt install -y git curl

# 2. Install Node.js LTS (Ubuntu's built-in version can be too old)
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

# 6. Create your .env file, then open it to fill in your values
cp .env.example .env
nano .env        # Save with Ctrl+O, Enter; exit with Ctrl+X

# 7. Create src/Env.gs (and .clasp.json) from .env
npm run configure
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

# 6. Create your .env file, then open it to fill in your values
cp .env.example .env
open -e .env     # Opens in TextEdit; save and close when done

# 7. Create src/Env.gs (and .clasp.json) from .env
npm run configure
```

> If you'd rather not use Homebrew, install Node.js LTS from <https://nodejs.org>, and Git with
> `xcode-select --install`.
>
> `.env` starts with a dot, so Finder hides it. Press `Cmd` + `Shift` + `.` to show hidden files.

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

# 6. Create your .env file, then open it to fill in your values
Copy-Item .env.example .env
notepad .env     # Save and close Notepad when done

# 7. Create src/Env.gs (and .clasp.json) from .env
npm run configure
```

> If `winget` isn't available, download the installers from <https://git-scm.com/download/win>
> and <https://nodejs.org> (choose **LTS**), keeping the default options.

---

## The .env file

All your own values go in **one file: `.env`**. Nothing else needs editing.

```ini
# Apps Script project ID (only needed for "npm run deploy")
SCRIPT_ID=PASTE_SCRIPT_ID_HERE

# REQUIRED: test Drive folder where student folders are created
PARENT_FOLDER_ID=PASTE_DRIVE_FOLDER_ID_HERE

# Name of the roster tab at the bottom of the Google Sheet
SHEET_NAME=Sheet1
```

| Setting | Required? | Where to find it |
|---------|-----------|------------------|
| `PARENT_FOLDER_ID` | **Yes** | Open the test Drive folder. It's the last part of the URL: `https://drive.google.com/drive/folders/`**`1AbC...XyZ`** |
| `SCRIPT_ID` | Only for `npm run deploy` | In the sheet: **Extensions → Apps Script → Project Settings (gear icon) → Script ID** |
| `SHEET_NAME` | No (default `Sheet1`) | The tab name at the bottom of the Google Sheet |

After editing `.env`, run:

```bash
npm run configure
```

Example output:

```
Configured from .env:
  Sheet name:       Sheet1
  Drive folder ID:  1AbC...XyZ
  Wrote src/Env.gs
  Script ID:        1XyZ...AbC
  Wrote .clasp.json
```

**Why is a script needed?** Apps Script runs on Google's servers, so it can't read a `.env`
file on your computer. `npm run configure` copies the values into `src/Env.gs`, which is uploaded
with the code. `.env`, `src/Env.gs` and `.clasp.json` are all git-ignored, so your IDs never
reach GitHub.

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
your real Google Sheet or Drive, and they don't need a `.env` file.

---

## Putting the script on the Google Sheet

First, finish [The .env file](#the-env-file) and run `npm run configure`.

### Option A: upload from the command line (recommended)

The commands are the same on Ubuntu, macOS and Windows.

1. **Turn on the Apps Script API** (one time only): go to
   <https://script.google.com/home/usersettings> and switch it **On**.
2. **Make sure `SCRIPT_ID` is filled in** in `.env`.
3. **Sign in to Google** (opens a browser window, one time only):
   ```bash
   npm run login
   ```
4. **Upload the script.** This re-reads `.env` first, so it always uploads your latest settings:
   ```bash
   npm run deploy
   ```
   If it asks whether to overwrite the manifest, answer **Yes**.
5. Continue with [Final step: install the trigger](#final-step-install-the-trigger).

### Option B: copy and paste in the browser

1. Open the sheet in Google Sheets, then go to **Extensions → Apps Script**.
2. Replace everything in `Code.gs` with the contents of `src/Code.gs`.
3. Click **+ → Script**, name it `Env`, and replace its contents with `src/Env.gs`
   (the file `npm run configure` created).
4. Click the **gear icon (Project Settings)**, turn on
   **Show "appsscript.json" manifest file in editor**, and replace that file's contents with
   `src/appsscript.json`.
5. Click **Save**.
6. Continue with [Final step: install the trigger](#final-step-install-the-trigger).

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
| 3 | Create `<Student Name> - Documentation Portfolio` | The folder is created inside the `PARENT_FOLDER_ID` folder from `.env`. If a folder with that name already exists, no duplicate is made. |
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
| Windows: "running scripts is disabled on this system" | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. |
| `node --version` shows lower than 20 | Upgrade Node.js with the steps for your OS. |
| `git clone` asks for a password or says "not found" | The repo is private. Ask for access, then sign in to GitHub when prompted. |
| `ERROR: No .env file found` | Create it: `cp .env.example .env` (Ubuntu/macOS) or `Copy-Item .env.example .env` (Windows). |
| `ERROR: Please fill in PARENT_FOLDER_ID` / `SCRIPT_ID` | Open `.env` and replace the `PASTE_..._HERE` placeholder with the real ID. |
| Apps Script error `getEnv is not defined` | `Env.gs` is missing. Run `npm run deploy` again, or add it as in Option B step 3. |
| `npm run deploy` says "User has not enabled the Apps Script API" | Turn it on at <https://script.google.com/home/usersettings> and wait a minute. |
| No folder appears after approving | Check `PARENT_FOLDER_ID` and `SHEET_NAME` in `.env`, redeploy, confirm `setup` was run, the row is 11 or below, and Column D says exactly `Approved`. See **Apps Script → Executions** for logs. |
| Folder already existed, nothing new was created | Expected. The script doesn't create duplicates. |

---

## Notes

- `Approved` is matched exactly (case-sensitive), ignoring extra spaces at either end.
- If an approved row has no student name, it is skipped and a warning is logged.
- The automation runs on edits made by people in the sheet. Changes from other scripts or API
  writes don't fire Google edit triggers.
- After changing `.env`, run `npm run deploy` again (or repeat Option B step 3) so Google gets
  the new values.

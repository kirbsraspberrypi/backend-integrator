# Installation Process

**1. Install** (requires Git and Node.js 20+; the README has steps for Ubuntu, macOS and Windows)

```
git clone https://github.com/kirbsraspberrypi/backend-integrator.git
cd backend-integrator
npm ci
```

**2. Configure**

Copy `.env.example` to `.env` and fill in:

- `SCRIPT_ID`: in the Google Sheet, go to Extensions → Apps Script → Project Settings
- `PARENT_FOLDER_ID`: the last part of your test Drive folder's URL

**3. Deploy**

Turn on the Apps Script API at https://script.google.com/home/usersettings, then run:

```
npm run login
npm run deploy
```

In the Apps Script editor, run `setup` once and approve the permissions.

**4. Try it**

- Change **D11** to `Approved`. A folder named **John Doe - Documentation Portfolio** appears in your test Drive folder.
- Type `Approved` into any cell from **D1 to D10**. Nothing happens, because rows 1–10 are ignored.

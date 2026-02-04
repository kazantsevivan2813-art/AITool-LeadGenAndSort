# How to Run This Project on macOS (Step by Step)

This guide walks you through running the Norway Company Scraper on **macOS** from scratch.

---

## 1. Prerequisites

### 1.1 Node.js (required: version 18 or higher)

**Option A – Install via Homebrew (recommended)**

1. Install Homebrew if you don’t have it (open **Terminal** and run):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Install Node.js:
   ```bash
   brew install node
   ```
3. Check the version:
   ```bash
   node --version
   ```
   You should see `v18.x.x` or higher (e.g. `v20.x.x`).

**Option B – Install from nodejs.org**

1. Go to [https://nodejs.org](https://nodejs.org).
2. Download the **LTS** version for macOS (e.g. “macOS Installer (.pkg)”).
3. Run the installer and follow the steps.
4. Open a **new** Terminal window and run:
   ```bash
   node --version
   ```
   You should see `v18.x.x` or higher.

### 1.2 curl (for downloading the .gz file)

On macOS, `curl` is usually already installed. Check with:

```bash
curl --version
```

If it’s missing, install with:

```bash
brew install curl
```

### 1.3 API keys

You need:

- **Serper API key** – from [https://serper.dev](https://serper.dev) (Google search API).
- **OpenAI API key** – from [https://platform.openai.com](https://platform.openai.com).
- **URL of the .gz data file** – e.g. the Brønnøysund enheter export URL you use.

---

## 2. Get the Project on Your Mac

### 2.1 Copy the project folder to your Mac

- If the project is in **Windows**: copy the whole project folder (e.g. `AI Tool Agent - Lead Generation and Data Sorting Specialist Needed`) to your Mac (USB, cloud, or network share).
- Or clone from Git if you use a repo:
  ```bash
  cd ~/Projects   # or wherever you keep projects
  git clone <your-repo-url>
  cd <repo-folder-name>
  ```

### 2.2 Open Terminal and go to the project folder

```bash
cd "/path/to/AI Tool Agent - Lead Generation and Data Sorting Specialist Needed"
```

Use the real path to the folder on your Mac. Example:

```bash
cd ~/Documents/"AI Tool Agent - Lead Generation and Data Sorting Specialist Needed"
```

If the path has spaces, keep the folder name in quotes as above.

---

## 3. Install Dependencies

In the same Terminal window (inside the project folder), run:

```bash
npm install
```

You should see something like “added XX packages” and no errors. This installs `dotenv`, `openai`, `stream-json`, etc.

---

## 4. Configure Environment Variables

### 4.1 Create a `.env` file

In the project root (same folder as `package.json`), create a file named `.env`:

```bash
touch .env
```

Then open it in a text editor, for example:

```bash
open -e .env
```

Or use VS Code / Cursor:

```bash
code .env
```

### 4.2 Add your settings to `.env`

Put the following in `.env` (replace the placeholder values with your real ones):

```env
DATA_GZ_URL=https://your-actual-url-to-the-gz-file.json.gz
SERPER_API_KEY=your_serper_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
REQUEST_DELAY_MS=500
```

- **DATA_GZ_URL** – Full URL to the Norwegian company data `.gz` file (e.g. Brønnøysund).
- **SERPER_API_KEY** – Your Serper API key (no quotes).
- **OPENAI_API_KEY** – Your OpenAI API key (no quotes).
- **REQUEST_DELAY_MS** – Optional; delay in milliseconds between API calls (default 500). Increase if you hit rate limits.

Save and close the file.

---

## 5. Run the Project (Methods in Detail)

All commands are run from the project folder in Terminal:

```bash
cd "/path/to/AI Tool Agent - Lead Generation and Data Sorting Specialist Needed"
```

### Method 1: Run the pipeline once (recommended for first run)

```bash
npm start
```

What happens:

1. If the **.gz file is not** in the `data/` folder:  
   - The script asks nothing, downloads the `.gz` from `DATA_GZ_URL` (using `curl`) into `data/source.json.gz`, then starts processing.

2. If the **.gz file is already** in `data/`:  
   - You are asked: **“Will you update database? (yes/no):”**  
   - **yes** – Downloads the `.gz` again (overwrites), clears progress, and processes from index 0.  
   - **no** – Skips download, uses the existing `.gz`, and resumes from the last saved progress.

3. Then you are asked for **postnummer range**:  
   - **Postnummer FROM (blank = any):**  
     - Press Enter to process all companies, or type a number (e.g. `1000`).  
   - **Postnummer TO (blank = any):**  
     - Press Enter for “any”, or type a number (e.g. `2000`) to limit to that range.

4. The script:  
   - Streams the JSON array from the (downloaded or existing) `.gz`.  
   - For each company in range: extracts data, searches with Serper, uses OpenAI to pick company website or Facebook, optionally runs the “companyName proff” fallback, and appends a row to `data/companies.csv`.  
   - Saves progress to `data/progress.json` so you can stop and resume.

To **stop** the run: press **Ctrl+C** in the Terminal. The next run will continue from the last saved index.

---

### Method 2: Same as “run once” (alternative command)

```bash
npm run run-once
```

Behavior is the same as `npm start`: same prompts (update database, postnummer range), same processing, same resume.

---

### Method 3: Run via the scheduler (no 24h cron, just one run)

```bash
npm run schedule
```

This starts the same pipeline once (same as `npm start`). The project does **not** run every 24 hours by default; it’s a single run. You can run `npm run schedule` whenever you want.

---

## 6. Where Results Are Stored

- **CSV output:** `data/companies.csv`  
  Columns include: `organisasjonsnummer`, `navn`, `adresse`, `postnummer`, `epostadresse`, `telefon`, `mobil`, `company_website`.

- **Progress (for resume):** `data/progress.json`  
  Contains the last processed index. Do not edit manually if you want resume to work correctly.

- **Downloaded .gz:** `data/source.json.gz`  
  The file downloaded from `DATA_GZ_URL`.

---

## 7. Start From Scratch (Full Re-run)

To ignore previous progress and re-process everything:

1. Delete progress and optionally the CSV:
   ```bash
   rm -f data/progress.json
   rm -f data/companies.csv
   ```
2. Run again:
   ```bash
   npm start
   ```
3. When asked “Will you update database?”, answer **yes** so it re-downloads the `.gz` and starts from 0.  
   Or answer **no** if you only want to re-use the existing `data/source.json.gz` and process from index 0 (progress is already deleted).

---

## 8. Typical First-Time Flow on macOS

1. Install Node.js 18+ and ensure `curl` works (see section 1).
2. Copy the project to your Mac and open Terminal.
3. `cd` into the project folder (use quotes if the path has spaces).
4. Run `npm install`.
5. Create `.env` and add `DATA_GZ_URL`, `SERPER_API_KEY`, `OPENAI_API_KEY` (and optionally `REQUEST_DELAY_MS`).
6. Run `npm start`.
7. If prompted “Will you update database?”, choose **yes** (first time) or **no** (resume).
8. For postnummer, press Enter for both to process all, or enter numbers to limit range.
9. Wait for the run to finish or stop with **Ctrl+C** and resume later with `npm start` again.

---

## 9. Troubleshooting on macOS

- **“command not found: node”**  
  Install Node.js (section 1) and open a new Terminal window.

- **“command not found: npm”**  
  Same as above; npm is installed with Node.

- **“curl failed to start” or download never starts**  
  Check that `curl` is installed (`curl --version`) and that `DATA_GZ_URL` in `.env` is correct and reachable (e.g. open it in a browser).

- **“SERPER_API_KEY not set” / “OpenAI … error”**  
  Make sure `.env` is in the project root (same folder as `package.json`) and that the keys are spelled exactly as above, with no extra spaces or quotes.

- **Permission denied**  
  Do not run with `sudo`. Fix folder permissions if needed, e.g.:
  ```bash
  chmod -R u+rwX .
  ```

- **Process very slow**  
  Increase `REQUEST_DELAY_MS` in `.env` if you hit rate limits; otherwise you can try lowering it slightly (e.g. 300) for faster runs.

This is the complete method to process the project on macOS in detail.

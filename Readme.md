# Norway Company Scraper

Node.js app that runs every 24 hours to:

1. Download a `.gz` file from a configurable URL
2. Stream-uncompress to JSON (handles ~2GB JSON array without loading into memory)
3. For each JSON object: extract `navn`, `organisasjonsnummer`, address/postnummer from `forretningsadresse`, `epostadresse`, `telefon` → CSV
4. For each company: search by company name (Serper API), take first 5 results, send to OpenAI to identify the company website, then add the website URL to the CSV

**Resumable:** If you stop the process (e.g. Ctrl+C), progress is saved. On the next run it continues from the next index (skips already-processed items and appends only new rows to the CSV).

**Detailed step-by-step guide for macOS:** see [docs/RUN-ON-MACOS.md](docs/RUN-ON-MACOS.md).

---

## Requirements

- Node.js **18+** (for native `fetch` and `Readable.fromWeb`)
- [Serper](https://serper.dev) API key
- [OpenAI](https://platform.openai.com) API key

---

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and set:

   - `DATA_GZ_URL` – URL of the `.gz` file (e.g. Brønnøysund enheter export)
   - `SERPER_API_KEY` – your Serper API key
   - `OPENAI_API_KEY` – your OpenAI API key
   - Optional: `REQUEST_DELAY_MS` – delay between Serper/OpenAI calls (default `500`)

   ```bash
   cp .env.example .env
   # Edit .env with your URL and API keys
   ```

---

## Usage

### Run once (manual)

Process the current `.gz` file once. Safe to stop with Ctrl+C; next run will resume.

```bash
npm start
# or
npm run run-once
```

### Run every 24 hours

Keeps the process running and runs the pipeline every day at midnight:

```bash
npm run schedule
```

### Output and progress

- **CSV:** `data/companies.csv`  
  Columns: `organisasjonsnummer`, `navn`, `adresse`, `postnummer`, `epostadresse`, `telefon`, `company_website`
- **Progress:** `data/progress.json`  
  Stores `processedIndex` (last 0-based index written to CSV) and optional `totalCount`. Used for resume.

### Start from scratch

To reprocess everything from the beginning:

1. Delete `data/progress.json`
2. Optionally delete `data/companies.csv` (or keep it and the script will overwrite with a new header and only new rows if you keep progress)
3. Delete `data/progress.json` and `data/companies.csv` for a clean full run

---

## Project layout

```
├── .env                 # Your URL and API keys (create from .env.example)
├── .env.example
├── package.json
├── Readme.md
├── data/
│   ├── companies.csv    # Output CSV
│   └── progress.json   # Resume state (processedIndex, totalCount)
└── src/
    ├── config.js       # Loads .env and paths
    ├── progress.js     # Load/save progress for resume
    ├── csv.js          # CSV header + append row
    ├── extract.js      # Extract fields from one enhet JSON object
    ├── serper.js       # Serper API search (first 5 results)
    ├── openai-website.js # OpenAI: pick company website from 5 results
    ├── processor.js    # Stream download → gunzip → JSON array → process each → CSV
    ├── run-once.js     # Run pipeline once
    ├── scheduler.js    # Cron every 24h
    └── index.js        # Entry (runs once)
```

---

## Notes

- The JSON source is assumed to be a **single top-level array** of enhet objects (e.g. Brønnøysund format). Parsing is streamed so a ~2GB file is handled without loading it all into memory.
- Serper returns up to 5 organic results per company name; those 5 (title, link, snippet) are sent to OpenAI to choose the most likely company website.
- Rate limiting: use `REQUEST_DELAY_MS` in `.env` if you hit Serper or OpenAI limits.

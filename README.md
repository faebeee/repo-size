# repo-size

A terminal UI that scans folders you give it, counts files and total lines of code (respecting the `.gitignore` in your current directory), and tracks those numbers over time so you can see trends — all from a small interactive dashboard in your terminal.

## Install / build

```sh
npm install
npm run build
npm link   # optional: makes the `repo-size` command available globally
```

## Usage

```sh
# Track folders (persisted in ./.repo-size/config.json)
repo-size add src lib

# Scan all tracked folders and record a snapshot (./.repo-size/history.json)
repo-size scan

# Scan ad-hoc paths without tracking them permanently
repo-size scan ../other-project

# Scan ad-hoc paths AND start tracking them going forward
repo-size scan ../other-project --save

# List tracked folders
repo-size list

# Stop tracking a folder
repo-size remove lib

# Launch the interactive dashboard
repo-size
# or explicitly
repo-size tui
```

### Dashboard keybindings

- `↑`/`↓` or `j`/`k` — select a folder
- `r` — rescan all tracked folders and refresh
- `Tab` — toggle the trend chart between `lines` and `files`
- `q` / `Esc` — quit

## How scanning works

- Ignore rules come from the `.gitignore` file in your current working directory (plus `.git/` and `.repo-size/`, which are always excluded).
- Every remaining file counts toward the file count.
- Files that look like text (no null bytes in the first 8KB) have their lines counted toward the lines-of-code total; binary files are counted as a file but contribute 0 lines.
- Each `scan` appends a timestamped snapshot per folder to `.repo-size/history.json` (capped at the most recent 200 snapshots per folder).

## Data files

Everything is stored locally next to where you run the command:

```
.repo-size/
  config.json   # tracked folder list
  history.json  # snapshot history per folder
```

`repo-size` automatically appends `.repo-size/` to your `.gitignore` if one already exists in the current directory (it won't create a `.gitignore` for you).

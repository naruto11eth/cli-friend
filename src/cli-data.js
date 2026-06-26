// Curated, offline modern-CLI cheatsheet: fzf, zoxide, ripgrep, fd, bat, yazi
// (+ handy combos). Same entry shape as vim-data.js, minus `mode` (not a CLI
// notion). `keys` holds a command or keybinding; `cat` is the tool.
//
//   keys, desc, cat, tags, kw, use, [also]
//
//   kw  - a short ACTION keyword shown as a chip, so you can tell at a glance
//         what the command is for ("search", "find", "jump", "preview"…).
//   use - one-line "when to reach for this".
//
// The `domain: "CLI"` tag is added when this list is merged in search.js.

export const CLI_COMMANDS = [
  // ── fzf — fuzzy finder ────────────────────────────────
  { keys: "Ctrl+R", desc: "Fuzzy-search shell command history", cat: "fzf", kw: "history", tags: "history search reverse fuzzy find previous command recall rerun", use: "Re-run an old command without retyping it" },
  { keys: "Ctrl+T", desc: "Fuzzy file picker — inserts the path into the command line", cat: "fzf", kw: "pick file", tags: "file picker path insert find choose select fuzzy", use: "Drop a file path into the command you're typing", also: "Alt+C" },
  { keys: "Alt+C", desc: "Fuzzy-pick a directory and cd into it", cat: "fzf", kw: "pick dir", tags: "cd directory folder change jump pick fuzzy", use: "Hop to a nearby directory without typing the path", also: "cd, cdi" },
  { keys: "**<Tab>", desc: "Trigger fzf completion (e.g. vim **<Tab>)", cat: "fzf", kw: "complete", tags: "completion complete tab trigger fuzzy", use: "Fuzzy-complete an argument mid-command" },
  { keys: "Ctrl+/", desc: "Toggle the preview window inside fzf", cat: "fzf", kw: "preview", tags: "preview toggle window show hide", use: "Peek at a file/result while picking" },
  { keys: "Tab (in fzf)", desc: "Mark an item in multi-select mode", cat: "fzf", kw: "multi-select", tags: "multi select mark multiple choose", use: "Pick several items at once" },
  { keys: "fd --type f | fzf --preview 'bat --color=always {}'", desc: "Browse files with a syntax-highlighted preview", cat: "fzf", kw: "browse", tags: "preview browse files bat highlight pick", use: "Eyeball file contents before opening", also: "Ctrl+T" },
  { keys: "kill -9 $(ps aux | fzf | awk '{print $2}')", desc: "Pick a process from a list and kill it", cat: "fzf", kw: "kill", tags: "kill process pick ps select terminate stop", use: "Stop a runaway process without hunting its PID" },
  { keys: "git branch | fzf | xargs git checkout", desc: "Pick a git branch and switch to it", cat: "fzf", kw: "switch branch", tags: "git branch switch checkout pick choose change", use: "Change branches without typing the name", also: "gco" },
  { keys: "nvim $(fzf -m)", desc: "Open multiple picked files in your editor", cat: "fzf", kw: "open files", tags: "open multiple files editor multi select nvim", use: "Open a batch of files at once" },

  // ── zoxide — smarter cd ───────────────────────────────
  { keys: "cd <name>", desc: "Jump to the most-frecent directory matching a name", cat: "zoxide", kw: "jump", tags: "cd jump directory folder change smart frecent zoxide navigate go", use: "Get to a project dir from anywhere with one word" },
  { keys: "cd a b", desc: "Jump to a dir matching multiple fragments (a AND b)", cat: "zoxide", kw: "jump", tags: "cd jump multi token fragment directory match", use: "Disambiguate when one word isn't enough" },
  { keys: "cdi", desc: "Interactive zoxide picker over your directory history", cat: "zoxide", kw: "pick dir", tags: "interactive picker directory history fuzzy choose cd", use: "Browse visited dirs when unsure of the name", also: "Alt+C" },
  { keys: "zoxide query <name>", desc: "Show what 'cd <name>' would jump to", cat: "zoxide", kw: "check", tags: "query check preview where resolve directory", use: "Sanity-check where a jump lands before running it" },
  { keys: "zoxide query -ls", desc: "List all tracked dirs with scores (most-frecent first)", cat: "zoxide", kw: "list", tags: "list tracked directories scores history", use: "See what zoxide has learned" },
  { keys: "zoxide remove <path>", desc: "Forget a directory from the database", cat: "zoxide", kw: "forget", tags: "remove forget delete directory database clean", use: "Drop a stale or deleted dir from jumps" },

  // ── ripgrep (rg) — content search ─────────────────────
  { keys: "rg \"pattern\"", desc: "Recursively search file contents (respects .gitignore)", cat: "ripgrep", kw: "search", tags: "search grep content text recursive find pattern code", use: "Find where a string lives in the codebase", also: "rg -i, rg -w" },
  { keys: "rg -i \"pattern\"", desc: "Case-insensitive content search", cat: "ripgrep", kw: "search", tags: "search grep ignore case insensitive", use: "Match regardless of upper/lower case" },
  { keys: "rg -w \"word\"", desc: "Match whole words only", cat: "ripgrep", kw: "search", tags: "whole word boundary exact search grep", use: "Avoid matching inside longer words" },
  { keys: "rg -F \"literal\"", desc: "Search a literal string (disable regex)", cat: "ripgrep", kw: "search", tags: "literal fixed string no regex search grep", use: "Search text that contains regex characters" },
  { keys: "rg \"pat\" -g \"*.ts\"", desc: "Search only files matching a glob", cat: "ripgrep", kw: "search", tags: "glob filter file type extension search grep only", use: "Narrow a search to certain file types" },
  { keys: "rg -t js \"pat\"", desc: "Search only a predefined file type", cat: "ripgrep", kw: "search", tags: "type filter language search grep js python", use: "Search one language without writing a glob" },
  { keys: "rg \"pat\" -C 3", desc: "Show 3 lines of context around each match", cat: "ripgrep", kw: "context", tags: "context around before after lines search grep", use: "See surrounding code for each hit", also: "rg -A, rg -B" },
  { keys: "rg -l \"pattern\"", desc: "List only file names that contain matches", cat: "ripgrep", kw: "list files", tags: "list files names only matches search grep which", use: "See which files mention something" },
  { keys: "rg -c \"pattern\"", desc: "Count matches per file", cat: "ripgrep", kw: "count", tags: "count number matches per file search grep", use: "Gauge how widespread something is" },
  { keys: "rg --files", desc: "List every file ripgrep would search", cat: "ripgrep", kw: "list files", tags: "list all files enumerate search", use: "Pipe a clean file list into another tool" },
  { keys: "rg --hidden \"pat\"", desc: "Include hidden files and dotfiles", cat: "ripgrep", kw: "search", tags: "hidden dotfiles include search grep", use: "Search config/dotfiles too" },
  { keys: "rg --no-ignore \"pat\"", desc: "Search everything, ignoring .gitignore", cat: "ripgrep", kw: "search", tags: "no ignore gitignore everything all search grep", use: "Find matches in ignored/build dirs" },

  // ── fd — file finding ─────────────────────────────────
  { keys: "fd <name>", desc: "Find files by name (respects .gitignore)", cat: "fd", kw: "find", tags: "find file name search locate fd recursive", use: "Locate a file when you know part of its name", also: "fd -e" },
  { keys: "fd -e ts", desc: "Find all files with a given extension", cat: "fd", kw: "find", tags: "extension file type find search ts json", use: "List every file of one type" },
  { keys: "fd -t f", desc: "Find files only", cat: "fd", kw: "find", tags: "files only type find filter", use: "Exclude directories from results" },
  { keys: "fd -t d", desc: "Find directories only", cat: "fd", kw: "find dir", tags: "directories folders only type find filter", use: "List folders, not files" },
  { keys: "fd --size +10M", desc: "Find files larger than a size", cat: "fd", kw: "find", tags: "size large big find filter disk space", use: "Hunt down what's eating disk space" },
  { keys: "fd --changed-within 1d", desc: "Find files modified in the last day", cat: "fd", kw: "find recent", tags: "changed modified recent time find within", use: "Find what you just touched" },
  { keys: "fd -e log -X rm", desc: "Find files and run one batched command on them", cat: "fd", kw: "find + run", tags: "execute batch delete run command files", use: "Act on all matches at once", also: "fd -x" },
  { keys: "fd -e jpg -x convert {} {.}.webp", desc: "Run a command per found file", cat: "fd", kw: "find + run", tags: "execute per file convert each command run", use: "Transform each matching file" },

  // ── bat — cat with highlighting ───────────────────────
  { keys: "bat <file>", desc: "View a file with syntax highlighting + line numbers", cat: "bat", kw: "view", tags: "cat view file syntax highlight read show print", use: "Read a file comfortably in the terminal" },
  { keys: "bat -p <file>", desc: "Plain mode (no decorations) — pipe-safe", cat: "bat", kw: "view", tags: "plain no decorations pipe cat raw", use: "Pipe highlighted output without line numbers" },
  { keys: "bat --line-range 50:100 <file>", desc: "Show only a range of lines", cat: "bat", kw: "view", tags: "line range subset show lines partial", use: "Look at just a slice of a big file" },
  { keys: "bat -A <file>", desc: "Show non-printable characters (debug whitespace)", cat: "bat", kw: "inspect", tags: "non printable whitespace debug show invisible characters tabs", use: "Track down tabs vs spaces / weird bytes" },
  { keys: "bat -d <file>", desc: "Show git diff markers in the gutter", cat: "bat", kw: "view diff", tags: "git diff markers changes gutter show", use: "See uncommitted changes while reading" },

  // ── yazi — TUI file manager ───────────────────────────
  { keys: "yy", desc: "Launch yazi; cd your shell to wherever you end up", cat: "yazi", kw: "browse", tags: "yazi launch file manager browser tui open visual explore", use: "Navigate folders visually, then land your shell there" },
  { keys: "h / j / k / l (yazi)", desc: "Navigate left/down/up/right (vim-style)", cat: "yazi", kw: "navigate", tags: "navigate move arrows vim yazi", use: "Move around without arrow keys" },
  { keys: "Space (yazi)", desc: "Select (toggle) a file", cat: "yazi", kw: "select", tags: "select toggle mark file yazi", use: "Mark files to act on" },
  { keys: "y / d / p (yazi)", desc: "Copy / cut / paste files", cat: "yazi", kw: "copy/move", tags: "copy cut paste move file yazi yank", use: "Move or duplicate files visually" },
  { keys: "a / r (yazi)", desc: "Create (add) a file or folder / rename", cat: "yazi", kw: "create", tags: "create add new file folder rename yazi", use: "Make or rename files in place" },
  { keys: "D (yazi)", desc: "Move selected to trash", cat: "yazi", kw: "delete", tags: "trash delete remove file yazi", use: "Safely remove files (recoverable)" },
  { keys: "s / S (yazi)", desc: "Search by name (fd) / search content (rg)", cat: "yazi", kw: "search", tags: "search find name content file yazi fd rg", use: "Find files/text from inside the browser" },

  // ── power combos / aliases ────────────────────────────
  { keys: "rg \"TODO\" -n | fzf | awk -F: '{print \"+\"$2, $1}' | xargs nvim", desc: "Find a TODO, fuzzy-pick it, open at that line", cat: "combos", kw: "find + open", tags: "todo jump open line edit find fzf nvim grep", use: "Jump straight to a TODO in your editor" },
  { keys: "alias fkill='ps -ef | fzf -m | awk \"{print \\$2}\" | xargs kill -9'", desc: "Alias: fuzzy-pick processes and kill them", cat: "combos", kw: "kill", tags: "kill process alias fuzzy fkill terminate", use: "One word to interactively kill processes" },
  { keys: "alias gco='git branch | fzf | sed \"s/[* ]//g\" | xargs git checkout'", desc: "Alias: fuzzy-pick a git branch to check out", cat: "combos", kw: "switch branch", tags: "git branch checkout switch alias gco fuzzy", use: "One word to switch branches interactively" },
  { keys: "alias cat='bat -p'", desc: "Alias cat to bat (plain mode, pipe-safe)", cat: "combos", kw: "alias", tags: "alias cat bat replace highlight", use: "Retrain cat to highlight by default" },
  { keys: "export MANPAGER=\"sh -c 'col -bx | bat -l man -p'\"", desc: "Use bat to render man pages and --help", cat: "combos", kw: "config", tags: "man pager bat help manual highlight", use: "Make man pages syntax-highlighted" },
];

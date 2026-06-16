// Curated, offline modern-CLI cheatsheet: fzf, zoxide, ripgrep, fd, bat, yazi
// (+ handy combos). Same entry shape as vim-data.js, minus `mode` (not a CLI
// notion). `keys` holds a command or keybinding; `cat` is the tool.
//
//   keys, desc, cat, tags, [also], [use]
//
// The `domain: "CLI"` tag is added when this list is merged in search.js.

export const CLI_COMMANDS = [
  // ── fzf — fuzzy finder ────────────────────────────────
  { keys: "Ctrl+R", desc: "Fuzzy-search shell command history", cat: "fzf", tags: "history search reverse fuzzy find previous command recall", use: "Replaces the default reverse-i-search" },
  { keys: "Ctrl+T", desc: "Fuzzy file picker — inserts the path into the command line", cat: "fzf", tags: "file picker path insert find choose select", also: "Alt+C", use: "e.g. type 'nvim ' then Ctrl+T" },
  { keys: "Alt+C", desc: "Fuzzy-pick a directory and cd into it", cat: "fzf", tags: "cd directory folder change jump pick fuzzy", also: "cd, cdi" },
  { keys: "**<Tab>", desc: "Trigger fzf completion (e.g. vim **<Tab>)", cat: "fzf", tags: "completion complete tab trigger fuzzy" },
  { keys: "Ctrl+/", desc: "Toggle the preview window inside fzf", cat: "fzf", tags: "preview toggle window show hide" },
  { keys: "Tab (in fzf)", desc: "Mark an item in multi-select mode", cat: "fzf", tags: "multi select mark multiple choose" },
  { keys: "fd --type f | fzf --preview 'bat --color=always {}'", desc: "Browse files with a syntax-highlighted preview", cat: "fzf", tags: "preview browse files bat highlight pick", also: "Ctrl+T" },
  { keys: "kill -9 $(ps aux | fzf | awk '{print $2}')", desc: "Pick a process from a list and kill it", cat: "fzf", tags: "kill process pick ps select terminate", use: "Interactive process killer" },
  { keys: "git branch | fzf | xargs git checkout", desc: "Pick a git branch and switch to it", cat: "fzf", tags: "git branch switch checkout pick choose change", also: "gco" },
  { keys: "nvim $(fzf -m)", desc: "Open multiple picked files in your editor", cat: "fzf", tags: "open multiple files editor multi select nvim" },

  // ── zoxide — smarter cd ───────────────────────────────
  { keys: "cd <name>", desc: "Jump to the most-frecent directory matching a name", cat: "zoxide", tags: "cd jump directory folder change smart frecent zoxide navigate go", use: "Goes there from anywhere — learns from your habits" },
  { keys: "cd a b", desc: "Jump to a dir matching multiple fragments (a AND b)", cat: "zoxide", tags: "cd jump multi token fragment directory match" },
  { keys: "cdi", desc: "Interactive zoxide picker over your directory history", cat: "zoxide", tags: "interactive picker directory history fuzzy choose cd", also: "Alt+C" },
  { keys: "zoxide query <name>", desc: "Show what 'cd <name>' would jump to", cat: "zoxide", tags: "query check preview where resolve directory" },
  { keys: "zoxide query -ls", desc: "List all tracked dirs with scores (most-frecent first)", cat: "zoxide", tags: "list tracked directories scores history" },
  { keys: "zoxide remove <path>", desc: "Forget a directory from the database", cat: "zoxide", tags: "remove forget delete directory database clean" },

  // ── ripgrep (rg) — content search ─────────────────────
  { keys: "rg \"pattern\"", desc: "Recursively search file contents (respects .gitignore)", cat: "ripgrep", tags: "search grep content text recursive find pattern code", also: "rg -i, rg -w", use: "The everyday code search" },
  { keys: "rg -i \"pattern\"", desc: "Case-insensitive content search", cat: "ripgrep", tags: "search grep ignore case insensitive" },
  { keys: "rg -w \"word\"", desc: "Match whole words only", cat: "ripgrep", tags: "whole word boundary exact search grep" },
  { keys: "rg -F \"literal\"", desc: "Search a literal string (disable regex)", cat: "ripgrep", tags: "literal fixed string no regex search grep" },
  { keys: "rg \"pat\" -g \"*.ts\"", desc: "Search only files matching a glob", cat: "ripgrep", tags: "glob filter file type extension search grep only" },
  { keys: "rg -t js \"pat\"", desc: "Search only a predefined file type", cat: "ripgrep", tags: "type filter language search grep js python" },
  { keys: "rg \"pat\" -C 3", desc: "Show 3 lines of context around each match", cat: "ripgrep", tags: "context around before after lines search grep", also: "rg -A, rg -B" },
  { keys: "rg -l \"pattern\"", desc: "List only file names that contain matches", cat: "ripgrep", tags: "list files names only matches search grep which" },
  { keys: "rg -c \"pattern\"", desc: "Count matches per file", cat: "ripgrep", tags: "count number matches per file search grep" },
  { keys: "rg --files", desc: "List every file ripgrep would search", cat: "ripgrep", tags: "list all files enumerate search" },
  { keys: "rg --hidden \"pat\"", desc: "Include hidden files and dotfiles", cat: "ripgrep", tags: "hidden dotfiles include search grep" },
  { keys: "rg --no-ignore \"pat\"", desc: "Search everything, ignoring .gitignore", cat: "ripgrep", tags: "no ignore gitignore everything all search grep" },

  // ── fd — file finding ─────────────────────────────────
  { keys: "fd <name>", desc: "Find files by name (respects .gitignore)", cat: "fd", tags: "find file name search locate fd recursive", also: "fd -e", use: "The modern replacement for find" },
  { keys: "fd -e ts", desc: "Find all files with a given extension", cat: "fd", tags: "extension file type find search ts json" },
  { keys: "fd -t f", desc: "Find files only", cat: "fd", tags: "files only type find filter" },
  { keys: "fd -t d", desc: "Find directories only", cat: "fd", tags: "directories folders only type find filter" },
  { keys: "fd --size +10M", desc: "Find files larger than a size", cat: "fd", tags: "size large big find filter disk" },
  { keys: "fd --changed-within 1d", desc: "Find files modified in the last day", cat: "fd", tags: "changed modified recent time find recent within" },
  { keys: "fd -e log -X rm", desc: "Find files and run one batched command on them", cat: "fd", tags: "execute batch delete run command files", also: "fd -x" },
  { keys: "fd -e jpg -x convert {} {.}.webp", desc: "Run a command per found file", cat: "fd", tags: "execute per file convert each command run" },

  // ── bat — cat with highlighting ───────────────────────
  { keys: "bat <file>", desc: "View a file with syntax highlighting + line numbers", cat: "bat", tags: "cat view file syntax highlight read show print", use: "A nicer cat" },
  { keys: "bat -p <file>", desc: "Plain mode (no decorations) — pipe-safe", cat: "bat", tags: "plain no decorations pipe cat raw" },
  { keys: "bat --line-range 50:100 <file>", desc: "Show only a range of lines", cat: "bat", tags: "line range subset show lines partial" },
  { keys: "bat -A <file>", desc: "Show non-printable characters (debug whitespace)", cat: "bat", tags: "non printable whitespace debug show invisible characters tabs" },
  { keys: "bat -d <file>", desc: "Show git diff markers in the gutter", cat: "bat", tags: "git diff markers changes gutter show" },

  // ── yazi — TUI file manager ───────────────────────────
  { keys: "yy", desc: "Launch yazi; cd your shell to wherever you end up", cat: "yazi", tags: "yazi launch file manager browser tui open visual", use: "Visual file browser that cd's on exit" },
  { keys: "h / j / k / l (yazi)", desc: "Navigate left/down/up/right (vim-style)", cat: "yazi", tags: "navigate move arrows vim yazi" },
  { keys: "Space (yazi)", desc: "Select (toggle) a file", cat: "yazi", tags: "select toggle mark file yazi" },
  { keys: "y / d / p (yazi)", desc: "Copy / cut / paste files", cat: "yazi", tags: "copy cut paste move file yazi yank" },
  { keys: "a / r (yazi)", desc: "Create (add) a file or folder / rename", cat: "yazi", tags: "create add new file folder rename yazi" },
  { keys: "D (yazi)", desc: "Move selected to trash", cat: "yazi", tags: "trash delete remove file yazi" },
  { keys: "s / S (yazi)", desc: "Search by name (fd) / search content (rg)", cat: "yazi", tags: "search find name content file yazi fd rg" },

  // ── power combos / aliases ────────────────────────────
  { keys: "rg \"TODO\" -n | fzf | awk -F: '{print \"+\"$2, $1}' | xargs nvim", desc: "Find a TODO, fuzzy-pick it, open at that line", cat: "combos", tags: "todo jump open line edit find fzf nvim grep" },
  { keys: "alias fkill='ps -ef | fzf -m | awk \"{print \\$2}\" | xargs kill -9'", desc: "Alias: fuzzy-pick processes and kill them", cat: "combos", tags: "kill process alias fuzzy fkill terminate" },
  { keys: "alias gco='git branch | fzf | sed \"s/[* ]//g\" | xargs git checkout'", desc: "Alias: fuzzy-pick a git branch to check out", cat: "combos", tags: "git branch checkout switch alias gco fuzzy" },
  { keys: "alias cat='bat -p'", desc: "Alias cat to bat (plain mode, pipe-safe)", cat: "combos", tags: "alias cat bat replace highlight" },
  { keys: "export MANPAGER=\"sh -c 'col -bx | bat -l man -p'\"", desc: "Use bat to render man pages and --help", cat: "combos", tags: "man pager bat help manual highlight" },
];

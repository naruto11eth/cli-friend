// Curated, offline Vim command database.
// Each entry: { keys, desc, mode, cat, tags }
//   keys  - the keystrokes (what you press)
//   desc  - plain-English description (also used for search)
//   mode  - Normal | Insert | Visual | Command | Any
//   cat   - category, for grouping/filtering
//   tags  - extra synonyms so natural-language queries match
//
// Add your own lines freely — the search picks them up automatically.

export const VIM_COMMANDS = [
  // ── Modes ─────────────────────────────────────────────
  { keys: "i", desc: "Insert before the cursor", mode: "Normal", cat: "Modes", tags: "insert type write edit enter input mode" },
  { keys: "I", desc: "Insert at the first non-blank of the line", mode: "Normal", cat: "Modes", tags: "insert start beginning line" },
  { keys: "a", desc: "Append after the cursor", mode: "Normal", cat: "Modes", tags: "append insert after type" },
  { keys: "A", desc: "Append at the end of the line", mode: "Normal", cat: "Modes", tags: "append end of line insert" },
  { keys: "o", desc: "Open a new line below and insert", mode: "Normal", cat: "Modes", tags: "new line below open insert add line" },
  { keys: "O", desc: "Open a new line above and insert", mode: "Normal", cat: "Modes", tags: "new line above open insert add line" },
  { keys: "Esc", desc: "Leave Insert/Visual mode, back to Normal mode", mode: "Any", cat: "Modes", tags: "escape exit normal mode quit insert stop editing" },
  { keys: "Ctrl-[", desc: "Same as Esc — return to Normal mode", mode: "Any", cat: "Modes", tags: "escape exit normal mode" },
  { keys: "v", desc: "Start charwise Visual mode (select text)", mode: "Normal", cat: "Modes", tags: "visual select selection highlight mark" },
  { keys: "V", desc: "Start linewise Visual mode (select whole lines)", mode: "Normal", cat: "Modes", tags: "visual line select selection highlight" },
  { keys: "Ctrl-v", desc: "Start blockwise Visual mode (column/block select)", mode: "Normal", cat: "Modes", tags: "visual block column rectangle select multiple lines" },
  { keys: "R", desc: "Enter Replace mode (overtype)", mode: "Normal", cat: "Modes", tags: "replace overtype overwrite mode" },
  { keys: ":", desc: "Enter Command-line mode (run an ex command)", mode: "Normal", cat: "Modes", tags: "command colon ex run prompt" },

  // ── Basic motions ─────────────────────────────────────
  { keys: "h", desc: "Move left one character", mode: "Normal", cat: "Motion", tags: "left move cursor arrow" },
  { keys: "j", desc: "Move down one line", mode: "Normal", cat: "Motion", tags: "down move cursor arrow next line" },
  { keys: "k", desc: "Move up one line", mode: "Normal", cat: "Motion", tags: "up move cursor arrow previous line" },
  { keys: "l", desc: "Move right one character", mode: "Normal", cat: "Motion", tags: "right move cursor arrow" },
  { keys: "w", desc: "Jump forward to the start of the next word", mode: "Normal", cat: "Motion", tags: "word forward next move jump" },
  { keys: "W", desc: "Jump forward by WORD (whitespace-separated)", mode: "Normal", cat: "Motion", tags: "word forward big WORD" },
  { keys: "b", desc: "Jump backward to the start of the word", mode: "Normal", cat: "Motion", tags: "word back backward previous move" },
  { keys: "e", desc: "Jump to the end of the word", mode: "Normal", cat: "Motion", tags: "word end forward" },
  { keys: "0", desc: "Move to the very start of the line (column 0)", mode: "Normal", cat: "Motion", tags: "beginning start line first column home" },
  { keys: "^", desc: "Move to the first non-blank character of the line", mode: "Normal", cat: "Motion", tags: "first non blank start line indent home" },
  { keys: "$", desc: "Move to the end of the line", mode: "Normal", cat: "Motion", tags: "end of line last column" },
  { keys: "gg", desc: "Go to the first line of the file", mode: "Normal", cat: "Motion", tags: "top first line start of file beginning" },
  { keys: "G", desc: "Go to the last line of the file", mode: "Normal", cat: "Motion", tags: "bottom last line end of file" },
  { keys: ":{n}  or  {n}G", desc: "Jump to line number n", mode: "Normal", cat: "Motion", tags: "go to line number jump goto" },
  { keys: "f{char}", desc: "Jump to next occurrence of {char} on the line", mode: "Normal", cat: "Motion", tags: "find char to character forward jump on line" },
  { keys: "F{char}", desc: "Jump backward to {char} on the line", mode: "Normal", cat: "Motion", tags: "find char backward character on line" },
  { keys: "t{char}", desc: "Jump till just before {char} on the line", mode: "Normal", cat: "Motion", tags: "till before char to character forward" },
  { keys: ";", desc: "Repeat the last f/F/t/T motion", mode: "Normal", cat: "Motion", tags: "repeat find next occurrence" },
  { keys: ",", desc: "Repeat the last f/F/t/T motion, reversed", mode: "Normal", cat: "Motion", tags: "repeat find previous reverse" },
  { keys: "}", desc: "Jump to the next paragraph / blank line", mode: "Normal", cat: "Motion", tags: "paragraph next block down" },
  { keys: "{", desc: "Jump to the previous paragraph / blank line", mode: "Normal", cat: "Motion", tags: "paragraph previous block up" },
  { keys: "%", desc: "Jump to the matching bracket ()[]{}", mode: "Normal", cat: "Motion", tags: "matching bracket parenthesis brace jump pair" },
  { keys: "H / M / L", desc: "Jump to top / middle / bottom of the screen", mode: "Normal", cat: "Motion", tags: "screen top middle bottom high low visible" },

  // ── Scrolling ─────────────────────────────────────────
  { keys: "Ctrl-d", desc: "Scroll down half a screen", mode: "Normal", cat: "Scroll", tags: "scroll down half page page down" },
  { keys: "Ctrl-u", desc: "Scroll up half a screen", mode: "Normal", cat: "Scroll", tags: "scroll up half page page up" },
  { keys: "Ctrl-f", desc: "Scroll forward one full screen (page down)", mode: "Normal", cat: "Scroll", tags: "scroll page down forward full" },
  { keys: "Ctrl-b", desc: "Scroll back one full screen (page up)", mode: "Normal", cat: "Scroll", tags: "scroll page up back full" },
  { keys: "zz", desc: "Center the current line on the screen", mode: "Normal", cat: "Scroll", tags: "center recenter screen line middle" },
  { keys: "zt", desc: "Scroll so the current line is at the top", mode: "Normal", cat: "Scroll", tags: "scroll top current line" },
  { keys: "zb", desc: "Scroll so the current line is at the bottom", mode: "Normal", cat: "Scroll", tags: "scroll bottom current line" },

  // ── Editing / deleting ────────────────────────────────
  { keys: "x", desc: "Delete the character under the cursor", mode: "Normal", cat: "Edit", tags: "delete char remove cut letter forward delete" },
  { keys: "X", desc: "Delete the character before the cursor (backspace)", mode: "Normal", cat: "Edit", tags: "delete backspace char before remove" },
  { keys: "dd", desc: "Delete (cut) the current line", mode: "Normal", cat: "Edit", tags: "delete line cut remove whole line" },
  { keys: "{n}dd", desc: "Delete (cut) n lines", mode: "Normal", cat: "Edit", tags: "delete multiple lines cut n lines" },
  { keys: "dw", desc: "Delete from cursor to the start of the next word", mode: "Normal", cat: "Edit", tags: "delete word cut remove forward" },
  { keys: "diw", desc: "Delete the word under the cursor (inner word)", mode: "Normal", cat: "Edit", tags: "delete inner word remove whole word" },
  { keys: "D  (or d$)", desc: "Delete from the cursor to the end of the line", mode: "Normal", cat: "Edit", tags: "delete to end of line cut rest of line" },
  { keys: "d0", desc: "Delete from the cursor to the start of the line", mode: "Normal", cat: "Edit", tags: "delete to beginning start of line cut" },
  { keys: "dG", desc: "Delete from the current line to the end of the file", mode: "Normal", cat: "Edit", tags: "delete to end of file rest of document cut" },
  { keys: "dgg", desc: "Delete from the current line to the top of the file", mode: "Normal", cat: "Edit", tags: "delete to top start of file cut" },
  { keys: "di(  di{  di[  di\"", desc: "Delete inside brackets/quotes (inner)", mode: "Normal", cat: "Edit", tags: "delete inside brackets parentheses quotes braces inner contents" },
  { keys: "da(  da{  da[", desc: "Delete around brackets (incl. the brackets)", mode: "Normal", cat: "Edit", tags: "delete around brackets parentheses including" },
  { keys: "J", desc: "Join the current line with the next one", mode: "Normal", cat: "Edit", tags: "join lines merge combine two lines" },
  { keys: "r{char}", desc: "Replace the single character under the cursor", mode: "Normal", cat: "Edit", tags: "replace one character single overwrite" },
  { keys: "cc  (or S)", desc: "Change (delete + insert) the whole line", mode: "Normal", cat: "Edit", tags: "change line clear retype replace whole line" },
  { keys: "cw", desc: "Change to the end of the word", mode: "Normal", cat: "Edit", tags: "change word retype replace" },
  { keys: "ciw", desc: "Change the inner word under the cursor", mode: "Normal", cat: "Edit", tags: "change inner word replace retype whole word" },
  { keys: "ci(  ci{  ci\"", desc: "Change inside brackets/quotes", mode: "Normal", cat: "Edit", tags: "change inside brackets quotes parentheses contents replace" },
  { keys: "C  (or c$)", desc: "Change from the cursor to the end of the line", mode: "Normal", cat: "Edit", tags: "change to end of line retype rest" },
  { keys: "s", desc: "Delete the character and start inserting", mode: "Normal", cat: "Edit", tags: "substitute char delete insert replace" },
  { keys: "~", desc: "Toggle case of the character under the cursor", mode: "Normal", cat: "Edit", tags: "toggle case uppercase lowercase swap letter" },
  { keys: "guu / gUU", desc: "Lowercase / Uppercase the whole line", mode: "Normal", cat: "Edit", tags: "lowercase uppercase line case convert" },
  { keys: "Ctrl-a / Ctrl-x", desc: "Increment / decrement the number under the cursor", mode: "Normal", cat: "Edit", tags: "increment decrement number increase decrease add subtract" },
  { keys: ".", desc: "Repeat the last change", mode: "Normal", cat: "Edit", tags: "repeat last command change dot redo action again" },

  // ── Copy / paste (yank / put) ─────────────────────────
  { keys: "yy  (or Y)", desc: "Yank (copy) the current line", mode: "Normal", cat: "Copy/Paste", tags: "copy yank line clipboard duplicate" },
  { keys: "{n}yy", desc: "Yank (copy) n lines", mode: "Normal", cat: "Copy/Paste", tags: "copy yank multiple lines n" },
  { keys: "yw", desc: "Yank (copy) to the start of the next word", mode: "Normal", cat: "Copy/Paste", tags: "copy yank word" },
  { keys: "yiw", desc: "Yank (copy) the inner word", mode: "Normal", cat: "Copy/Paste", tags: "copy yank inner word whole word" },
  { keys: "y$", desc: "Yank (copy) to the end of the line", mode: "Normal", cat: "Copy/Paste", tags: "copy yank to end of line rest" },
  { keys: "p", desc: "Paste after the cursor / below the line", mode: "Normal", cat: "Copy/Paste", tags: "paste put after below insert clipboard" },
  { keys: "P", desc: "Paste before the cursor / above the line", mode: "Normal", cat: "Copy/Paste", tags: "paste put before above insert clipboard" },
  { keys: "\"+y / \"+p", desc: "Yank to / paste from the system clipboard", mode: "Any", cat: "Copy/Paste", tags: "system clipboard copy paste os external register plus" },
  { keys: "\"{a-z}y", desc: "Yank into a named register (e.g. \"ayy)", mode: "Normal", cat: "Copy/Paste", tags: "register named yank copy store buffer" },

  // ── Undo / redo ───────────────────────────────────────
  { keys: "u", desc: "Undo the last change", mode: "Normal", cat: "Undo", tags: "undo revert back mistake go back" },
  { keys: "Ctrl-r", desc: "Redo (undo the undo)", mode: "Normal", cat: "Undo", tags: "redo forward again restore" },
  { keys: "U", desc: "Undo all latest changes on one line", mode: "Normal", cat: "Undo", tags: "undo line revert whole line" },

  // ── Search ────────────────────────────────────────────
  { keys: "/{pattern}", desc: "Search forward for a pattern", mode: "Normal", cat: "Search", tags: "search find forward pattern text look for" },
  { keys: "?{pattern}", desc: "Search backward for a pattern", mode: "Normal", cat: "Search", tags: "search find backward pattern text" },
  { keys: "n", desc: "Repeat the search in the same direction", mode: "Normal", cat: "Search", tags: "next search match repeat find again" },
  { keys: "N", desc: "Repeat the search in the opposite direction", mode: "Normal", cat: "Search", tags: "previous search match repeat find reverse" },
  { keys: "*", desc: "Search forward for the word under the cursor", mode: "Normal", cat: "Search", tags: "search word under cursor next occurrence find" },
  { keys: "#", desc: "Search backward for the word under the cursor", mode: "Normal", cat: "Search", tags: "search word under cursor previous occurrence find" },
  { keys: ":noh", desc: "Clear / turn off search highlighting", mode: "Command", cat: "Search", tags: "clear remove search highlight nohlsearch turn off" },

  // ── Find & replace (substitute) ───────────────────────
  { keys: ":s/old/new/", desc: "Replace first match on the current line", mode: "Command", cat: "Replace", tags: "substitute replace find swap current line first" },
  { keys: ":s/old/new/g", desc: "Replace all matches on the current line", mode: "Command", cat: "Replace", tags: "substitute replace all current line global" },
  { keys: ":%s/old/new/g", desc: "Replace all matches in the whole file", mode: "Command", cat: "Replace", tags: "substitute replace all everywhere whole file global document find replace" },
  { keys: ":%s/old/new/gc", desc: "Replace all in file, confirming each one", mode: "Command", cat: "Replace", tags: "substitute replace all confirm prompt ask each global file" },
  { keys: ":%s/old/new/gi", desc: "Replace all in file, case-insensitive", mode: "Command", cat: "Replace", tags: "substitute replace all case insensitive ignore case global" },

  // ── Indenting & formatting ────────────────────────────
  { keys: ">>", desc: "Indent the current line one shiftwidth", mode: "Normal", cat: "Format", tags: "indent right shift tab line" },
  { keys: "<<", desc: "Dedent (unindent) the current line", mode: "Normal", cat: "Format", tags: "dedent unindent left shift outdent line" },
  { keys: "> (in Visual)", desc: "Indent the selected lines", mode: "Visual", cat: "Format", tags: "indent selection block right shift" },
  { keys: "=", desc: "Auto-indent the selection / motion", mode: "Visual", cat: "Format", tags: "auto indent format reindent fix indentation" },
  { keys: "gg=G", desc: "Auto-indent the entire file", mode: "Normal", cat: "Format", tags: "auto indent whole file format reindent everything" },

  // ── Visual-mode actions ───────────────────────────────
  { keys: "y (in Visual)", desc: "Yank (copy) the selection", mode: "Visual", cat: "Visual", tags: "copy yank selection visual highlighted" },
  { keys: "d (in Visual)", desc: "Delete (cut) the selection", mode: "Visual", cat: "Visual", tags: "delete cut selection visual highlighted remove" },
  { keys: "c (in Visual)", desc: "Change (delete + insert) the selection", mode: "Visual", cat: "Visual", tags: "change replace selection visual" },
  { keys: "gv", desc: "Reselect the last visual selection", mode: "Normal", cat: "Visual", tags: "reselect last selection visual restore" },
  { keys: "o (in Visual)", desc: "Jump to the other end of the selection", mode: "Visual", cat: "Visual", tags: "other end selection swap cursor visual" },
  { keys: "I (Visual-block)", desc: "Insert text on every selected line (multi-cursor edit)", mode: "Visual", cat: "Visual", tags: "block insert multiple lines column multi cursor edit many lines at once" },

  // ── Files / buffers / saving ──────────────────────────
  { keys: ":w", desc: "Save (write) the file", mode: "Command", cat: "File", tags: "save write file store" },
  { keys: ":w {name}", desc: "Save as a new filename", mode: "Command", cat: "File", tags: "save as write filename new file" },
  { keys: ":q", desc: "Quit (fails if there are unsaved changes)", mode: "Command", cat: "File", tags: "quit close exit" },
  { keys: ":q!", desc: "Quit without saving (discard changes)", mode: "Command", cat: "File", tags: "quit force close discard without saving exit no save" },
  { keys: ":wq  (or :x, or ZZ)", desc: "Save and quit", mode: "Command", cat: "File", tags: "save and quit write close exit done finish" },
  { keys: "ZQ", desc: "Quit without saving (shortcut for :q!)", mode: "Normal", cat: "File", tags: "quit without saving discard force exit" },
  { keys: ":e {file}", desc: "Open / edit another file", mode: "Command", cat: "File", tags: "open edit file load" },
  { keys: ":bn / :bp", desc: "Go to next / previous buffer", mode: "Command", cat: "File", tags: "buffer next previous switch file" },
  { keys: ":ls", desc: "List open buffers", mode: "Command", cat: "File", tags: "list buffers open files show" },
  { keys: ":wa / :qa", desc: "Save all / quit all buffers", mode: "Command", cat: "File", tags: "save all quit all buffers everything" },

  // ── Windows / splits / tabs ───────────────────────────
  { keys: ":sp  (Ctrl-w s)", desc: "Split the window horizontally", mode: "Command", cat: "Windows", tags: "split horizontal window pane divide" },
  { keys: ":vs  (Ctrl-w v)", desc: "Split the window vertically", mode: "Command", cat: "Windows", tags: "split vertical window pane side by side" },
  { keys: "Ctrl-w  h/j/k/l", desc: "Move focus to the left/down/up/right window", mode: "Normal", cat: "Windows", tags: "move window pane focus switch navigate splits" },
  { keys: "Ctrl-w w", desc: "Cycle to the next window", mode: "Normal", cat: "Windows", tags: "cycle next window pane switch" },
  { keys: "Ctrl-w q", desc: "Close the current window", mode: "Normal", cat: "Windows", tags: "close window pane quit split" },
  { keys: "Ctrl-w =", desc: "Make all windows equal size", mode: "Normal", cat: "Windows", tags: "equalize window size balance resize panes" },
  { keys: ":tabnew", desc: "Open a new tab", mode: "Command", cat: "Windows", tags: "tab new open create" },
  { keys: "gt / gT", desc: "Go to the next / previous tab", mode: "Normal", cat: "Windows", tags: "tab next previous switch move" },

  // ── Marks & jumps ─────────────────────────────────────
  { keys: "m{a-z}", desc: "Set a mark at the cursor (e.g. ma)", mode: "Normal", cat: "Marks", tags: "mark set bookmark save position" },
  { keys: "`{a-z}", desc: "Jump to a mark's exact position", mode: "Normal", cat: "Marks", tags: "jump mark bookmark go to position backtick" },
  { keys: "''", desc: "Jump back to the line before the last jump", mode: "Normal", cat: "Marks", tags: "jump back previous position return" },
  { keys: "Ctrl-o / Ctrl-i", desc: "Go back / forward in the jump list", mode: "Normal", cat: "Marks", tags: "jump list back forward navigate history previous location" },
  { keys: "gd", desc: "Go to the local definition of the symbol", mode: "Normal", cat: "Marks", tags: "go to definition symbol local declaration" },

  // ── Macros ────────────────────────────────────────────
  { keys: "q{a-z} … q", desc: "Record a macro into a register, q to stop", mode: "Normal", cat: "Macros", tags: "record macro automate repeat actions" },
  { keys: "@{a-z}", desc: "Play back a recorded macro (e.g. @a)", mode: "Normal", cat: "Macros", tags: "play run macro replay execute" },
  { keys: "@@", desc: "Replay the last-run macro", mode: "Normal", cat: "Macros", tags: "repeat last macro again replay" },
  { keys: "{n}@a", desc: "Run macro 'a' n times", mode: "Normal", cat: "Macros", tags: "repeat macro multiple times count" },

  // ── Misc / help ───────────────────────────────────────
  { keys: ":help {topic}", desc: "Open Vim's built-in help for a topic", mode: "Command", cat: "Help", tags: "help docs documentation manual topic" },
  { keys: "Ctrl-g", desc: "Show the current file name and position", mode: "Normal", cat: "Help", tags: "file info status position line count where am i" },
  { keys: "ga", desc: "Show the character code under the cursor", mode: "Normal", cat: "Help", tags: "character code ascii unicode info" },
  { keys: ":set number  (:set nu)", desc: "Show line numbers", mode: "Command", cat: "Help", tags: "line numbers show display gutter" },
  { keys: ":set relativenumber", desc: "Show relative line numbers", mode: "Command", cat: "Help", tags: "relative line numbers show jumps count" },
  { keys: "Ctrl-n / Ctrl-p", desc: "Autocomplete next / previous word (Insert mode)", mode: "Insert", cat: "Help", tags: "autocomplete completion suggest word insert" }
];

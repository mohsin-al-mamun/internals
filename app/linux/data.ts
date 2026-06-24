export const LINUX_DOCKER_COMPOSE_YML = `services:
  linux-sandbox:
    image: ubuntu:24.04
    container_name: linux-sandbox
    restart: unless-stopped
    stdin_open: true
    tty: true
    command: /bin/bash`;

export const LINUX_SETUP_COMMANDS = `# Pull and start the sandbox container
docker compose up -d

# Drop into a bash shell inside the container
docker exec -it linux-sandbox bash

# When done
docker compose down`;

export interface Tier {
  id: string;
  order: number;
  name: string;
  label: string;
  locked: boolean;
}

export interface LinuxTopic {
  id: string;
  tier: string;
  title: string;
  html: string;
}

export const LINUX_TIERS: Tier[] = [
  { id: 't1', order: 1, name: 'TIER 1', label: 'Surface',   locked: false },
  { id: 't2', order: 2, name: 'TIER 2', label: 'Midground', locked: false },
  { id: 't3', order: 3, name: 'TIER 3', label: 'Bedrock',   locked: false },
];

export const LINUX_TOPICS: LinuxTopic[] = [
  // ── SURFACE ──────────────────────────────────────────────────
  {
    id: 'linux-s0', tier: 't1',
    title: 'Terminal, shell, kernel, OS — what is what',
    html: `<p>Four words get used interchangeably by beginners, but each means something specific:</p>
<ul>
  <li><strong>Terminal (emulator)</strong> — the window on your screen. It draws text, handles your keyboard, and talks to the shell. Examples: iTerm2, GNOME Terminal, Windows Terminal. It's just a UI wrapper.</li>
  <li><strong>Shell</strong> — the interpreter running <em>inside</em> the terminal. It reads your commands, interprets them, and tells the kernel what to do. Examples: bash, zsh, sh. The shell is a program; the terminal is just its display.</li>
  <li><strong>Kernel</strong> — the core of the operating system. It manages hardware (CPU, RAM, disks, network), enforces process isolation, and exposes system calls to programs. You never talk to it directly.</li>
  <li><strong>OS (Operating System)</strong> — the kernel plus all the utilities and libraries shipped with it. "Linux" is technically just the kernel; "Ubuntu" is an OS that includes the Linux kernel plus thousands of userspace programs.</li>
</ul>
<pre class="codeblock">You type → Terminal renders it → Shell reads it → Shell calls kernel → Kernel does the work</pre>
<p>When a command "isn't found," it's a shell problem — it couldn't locate the program. When a program crashes with "permission denied," it's a kernel problem — the kernel rejected the syscall.</p>
<div class="callout">
  <div class="callout-label">Why this matters</div>
  Error messages tell you which layer failed. "command not found" = shell. "Operation not permitted" = kernel. "Connection refused" = network stack (also kernel). Knowing the layers lets you look in the right place.
</div>`,
  },
  {
    id: 'linux-1', tier: 't1',
    title: 'What the shell actually is',
    html: `<p>When you open a terminal, you're not talking to the operating system directly. You're talking to a <strong>shell</strong> — a program that reads text you type, interprets it as commands, and asks the kernel to execute them.</p>
<p>The most common shells:</p>
<ul>
  <li><strong>bash</strong> — Bourne Again SHell. Default on most Linux systems.</li>
  <li><strong>zsh</strong> — Default on macOS since 2019. Feature-superset of bash.</li>
  <li><strong>sh</strong> — The original POSIX shell. Still used in scripts that must be portable.</li>
</ul>
<p>When you type an external command, the shell does four things: it <strong>parses</strong> your input, <strong>resolves</strong> the program name to a file on disk (via $PATH), <strong>forks</strong> a child process, and <strong>execs</strong> that program in the child. The kernel actually runs the program. The shell just orchestrates it.</p>
<pre class="codeblock">$ ls -la
(shell forks → execs /usr/bin/ls → kernel runs it → output appears)</pre>
<p>But <code>echo</code> is a <strong>shell builtin</strong> — it's built into the shell itself and runs without forking a child process at all:</p>
<pre class="codeblock">$ echo hello
hello

$ type echo
echo is a shell builtin</pre>
<p>There is also <code>/usr/bin/echo</code> on disk, but bash's builtin version takes priority. Most common "simple" commands — <code>cd</code>, <code>pwd</code>, <code>export</code>, <code>echo</code> — are builtins.</p>
<div class="callout">
  <div class="callout-label">Why this matters</div>
  Everything you type — commands, pipes, redirections — runs through the shell's own little interpreter before anything reaches the OS. Understanding this explains why quotes, spaces, and special characters behave the way they do.
</div>`,
  },
  {
    id: 'linux-s1b', tier: 't1',
    title: 'Builtins vs external programs',
    html: `<p>Commands fall into two categories. Knowing which is which explains a lot of surprising behavior.</p>
<p><strong>Shell builtins</strong> are part of the shell itself. They run in the <em>current</em> shell process — no fork, no child. That's the only way some of them can work at all:</p>
<pre class="codeblock">cd /tmp      # changes the shell's own working directory
             # if it forked a child, the child would change dir and exit
             # — the parent shell would never move</pre>
<p>Common builtins: <code>cd</code>, <code>echo</code>, <code>pwd</code>, <code>export</code>, <code>source</code> (or <code>.</code>), <code>alias</code>, <code>type</code>, <code>exit</code>, <code>read</code>.</p>
<p><strong>External programs</strong> live on disk and are found via $PATH. The shell forks, then execs:</p>
<pre class="codeblock">/usr/bin/ls     # external
/usr/bin/grep   # external
/usr/bin/git    # external</pre>
<p>Use <code>type</code> to check either way:</p>
<pre class="codeblock">type cd       # cd is a shell builtin
type ls       # ls is /usr/bin/ls
type echo     # echo is a shell builtin
type git      # git is /usr/bin/git</pre>
<p>Use <code>which</code> to find external programs on disk — it deliberately ignores builtins:</p>
<pre class="codeblock">which echo    # /usr/bin/echo (the external version that exists on disk)
which cd      # (nothing — cd has no external program)</pre>
<div class="callout">
  <div class="callout-label">source vs bash script.sh</div>
  <code>bash script.sh</code> forks a new shell, runs the script there, and exits — env vars set inside don't affect your session. <code>source script.sh</code> (or <code>. script.sh</code>) runs it in your current shell — changes stick. This is why you <code>source ~/.bashrc</code> to apply config changes.
</div>`,
  },
  {
    id: 'linux-2', tier: 't1',
    title: 'Navigating the filesystem',
    html: `<p>Linux has one filesystem tree. Everything — files, devices, network sockets — hangs off a single root <code>/</code>. No drive letters.</p>
<p>Three commands cover 90% of navigation:</p>
<pre class="codeblock">pwd          # print working directory — where am I?
ls           # list files in current directory
ls -la       # long format + hidden files (dotfiles)
cd /etc      # change to an absolute path
cd logs      # change to a relative path
cd ..        # go up one level
cd ~         # go to your home directory
cd -         # go back to the previous directory</pre>
<p>Paths are either <strong>absolute</strong> (start with <code>/</code>, always correct no matter where you are) or <strong>relative</strong> (relative to where you currently are). Mixing them up is the most common beginner mistake.</p>
<pre class="codeblock">ls -la /etc/nginx    # absolute — works from anywhere
ls -la nginx         # relative — only works if you're in /etc</pre>
<div class="callout">
  <div class="callout-label">Key filesystem paths</div>
  <code>/etc</code> — config files &nbsp;·&nbsp; <code>/var/log</code> — logs &nbsp;·&nbsp; <code>/tmp</code> — temp files (wiped on reboot) &nbsp;·&nbsp; <code>/usr/bin</code> — programs &nbsp;·&nbsp; <code>/home</code> — user home dirs
</div>`,
  },
  {
    id: 'linux-s2b', tier: 't1',
    title: 'Hidden files and dotfiles',
    html: `<p>Any file or directory whose name starts with a <code>.</code> is <strong>hidden</strong> — <code>ls</code> won't show it by default. This is purely a naming convention; the kernel treats them no differently.</p>
<pre class="codeblock">ls            # normal files only
ls -a         # all files, including hidden
ls -la        # all files, long format (most useful)

# Common hidden files in your home directory
~/.bashrc        # bash config (runs on each new interactive shell)
~/.bash_history  # your command history
~/.ssh/          # SSH keys and config
~/.gitconfig     # git identity and aliases
~/.config/       # config dir for many apps (XDG standard)</pre>
<p>Hidden directories work the same — they just start with <code>.</code>:</p>
<pre class="codeblock">ls -la ~
# drwxr-xr-x  .ssh/
# drwxr-xr-x  .config/
# -rw-r--r--  .bashrc</pre>
<p>The convention exists to declutter home directories. Configuration files are there all the time but you rarely need to look at them, so they're hidden by default.</p>
<div class="callout">
  <div class="callout-label">. and ..</div>
  Every directory also contains two special hidden entries: <code>.</code> (current directory) and <code>..</code> (parent directory). That's why <code>cd ..</code> goes up and <code>./script.sh</code> runs a script in the current directory.
</div>`,
  },
  {
    id: 'linux-s2c', tier: 't1',
    title: 'Wildcards and globbing',
    html: `<p><strong>Globbing</strong> is the shell expanding patterns into matching filenames before the command runs. The command never sees the pattern — it only sees the expanded list.</p>
<pre class="codeblock">*        # matches anything (zero or more characters)
?        # matches exactly one character
[abc]    # matches any single character in the set
[a-z]    # matches any lowercase letter
[!abc]   # matches any character NOT in the set</pre>
<pre class="codeblock"># Examples
ls *.log             # all .log files
rm *.tmp             # delete all .tmp files
ls report_?.txt      # report_1.txt, report_2.txt, etc.
ls [0-9]*.jpg        # images starting with a digit
cp *.{jpg,png} ~/photos/   # brace expansion — multiple patterns</pre>
<p>The shell expands globs, then passes the results to the command. If no files match, most shells pass the literal pattern string (which usually causes an error):</p>
<pre class="codeblock">rm *.log     # shell expands to: rm app.log error.log access.log
             # if no .log files exist: rm *.log — error: no such file</pre>
<p>Enable <code>**</code> for recursive matching with <code>globstar</code> in bash:</p>
<pre class="codeblock">shopt -s globstar
ls **/*.ts       # all .ts files in any subdirectory</pre>
<div class="callout">
  <div class="callout-label">Globs vs regex</div>
  Globs and regular expressions look similar but are different. <code>*</code> in a glob means "anything"; in regex, <code>*</code> means "zero or more of the previous char." Don't confuse them — <code>grep "*.log"</code> is not looking for files ending in .log; it's a regex matching any line with zero or more dots followed by "log".
</div>`,
  },
  {
    id: 'linux-3', tier: 't1',
    title: 'Reading files',
    html: `<p>Several commands read file contents — pick the right one for the job:</p>
<pre class="codeblock">cat file.txt          # stream entire file to terminal
less file.txt         # page through (q to quit, /word to search)
head -n 20 file.txt   # first 20 lines
tail -n 20 file.txt   # last 20 lines
tail -f app.log       # follow a file live (great for logs)</pre>
<p><code>less</code> is almost always the right choice for anything longer than a screen. It reads the file in chunks — it works fine on 10 GB log files because it never needs the whole file at once. <code>cat</code> on a large file is fine too, but it floods your terminal — the problem isn't RAM, it's that thousands of lines scroll past before you can read any of them.</p>
<p><code>tail -f</code> is the one you'll use constantly in production. It streams new lines as they're written — exactly how you watch a running server's log.</p>
<pre class="codeblock"># Watch nginx access log in real time
tail -f /var/log/nginx/access.log

# Show last 100 lines then follow
tail -n 100 -f /var/log/nginx/error.log</pre>
<div class="callout">
  <div class="callout-label">Tip</div>
  <code>less +F</code> starts in follow mode (like <code>tail -f</code>) but lets you press <code>Ctrl+C</code> to scroll back through history, then <code>F</code> to resume following. More useful than raw <code>tail -f</code> when debugging.
</div>`,
  },
  {
    id: 'linux-4', tier: 't1',
    title: 'Creating and writing files',
    html: `<p>Four ways to get content into a file:</p>
<pre class="codeblock">touch notes.txt           # create empty file (or update timestamp)
echo "hello" > file.txt   # write a single line (overwrites)
echo "more" >> file.txt   # append a line
nano file.txt             # open in nano editor (beginner-friendly)
vim file.txt              # open in vim (powerful, steep curve)</pre>
<p>The <code>></code> and <code>>></code> are <strong>redirections</strong> — they tell the shell where to send a command's output instead of the terminal:</p>
<pre class="codeblock">echo "line 1" > out.txt     # creates or overwrites out.txt
echo "line 2" >> out.txt    # appends — out.txt now has 2 lines
ls -la >> out.txt           # any command's output can be redirected</pre>
<p><strong>Vim survival kit</strong> — the minimum to not get stuck:</p>
<pre class="codeblock">vim file.txt   # open
i              # enter insert mode (now you can type)
Esc            # leave insert mode
:wq            # save and quit
:q!            # quit without saving</pre>
<div class="callout">
  <div class="callout-label">Why > vs >></div>
  <code>></code> truncates first — the existing content is gone before new content is written. <code>>></code> seeks to the end and appends. Never use <code>></code> on a log file you care about.
</div>`,
  },
  {
    id: 'linux-5', tier: 't1',
    title: 'Moving, copying, deleting',
    html: `<p>The four verbs for file operations:</p>
<pre class="codeblock">mkdir logs                  # create a directory
mkdir -p a/b/c              # create nested dirs in one shot

cp file.txt backup.txt      # copy a file
cp -r src/ dst/             # copy a directory recursively

mv file.txt archive/        # move file into directory
mv old.txt new.txt          # rename (mv is how you rename)

rm file.txt                 # delete file
rm -r folder/               # delete directory and everything inside
rm -rf folder/              # same but no confirmation prompts</pre>
<p><strong>There is no recycle bin.</strong> <code>rm</code> is permanent. <code>rm -rf</code> on the wrong directory has ended careers. Two habits that save you:</p>
<ul>
  <li>Run <code>ls</code> first to confirm what's in a directory before deleting it.</li>
  <li>Use <code>rm -i</code> (interactive — prompts before each delete) when unsure.</li>
</ul>
<pre class="codeblock"># Safe pattern: inspect before deleting
ls -la ./old_logs
rm -r ./old_logs</pre>
<div class="callout">
  <div class="callout-label">mv rename trick</div>
  Linux has no <code>rename</code> built-in for single files. <code>mv old.txt new.txt</code> is how you rename — it moves the file to a new name in the same directory.
</div>`,
  },
  {
    id: 'linux-s5b', tier: 't1',
    title: 'Tab completion and command history',
    html: `<p>These two features will save you more time than any other shell skill:</p>
<p><strong>Tab completion</strong> — press Tab to complete commands, file paths, and arguments. Press twice if nothing happens to see all options:</p>
<pre class="codeblock">cd /usr/lo[Tab]     → cd /usr/local/
git comm[Tab]       → git commit
ls /etc/ng[Tab]Tab  → nginx/  (shows options if multiple match)</pre>
<p><strong>Command history</strong> — the shell remembers every command you run:</p>
<pre class="codeblock">↑ / ↓            # scroll through previous commands
history          # list all history with line numbers
history | grep ssh   # search history
!42              # re-run command #42 from history
!!               # re-run last command
!$               # last argument of previous command

# Repeat last command with sudo:
sudo !!</pre>
<p><strong>Ctrl+R</strong> (reverse history search) — the most powerful shortcut. Start typing any part of a past command and it jumps to the most recent match:</p>
<pre class="codeblock">Ctrl+R → type "docker" → shell shows last docker command
Ctrl+R again → jump to the one before that
Enter → run it    Ctrl+C → cancel</pre>
<div class="callout">
  <div class="callout-label">Other useful shortcuts</div>
  <code>Ctrl+A</code> — jump to start of line &nbsp;·&nbsp; <code>Ctrl+E</code> — jump to end &nbsp;·&nbsp; <code>Ctrl+W</code> — delete word back &nbsp;·&nbsp; <code>Ctrl+L</code> — clear screen &nbsp;·&nbsp; <code>Ctrl+U</code> — delete to start of line
</div>`,
  },
  {
    id: 'linux-s5c', tier: 't1',
    title: 'Quoting — single, double, and escaping',
    html: `<p>The shell interprets special characters (<code>$</code>, <code>*</code>, <code>!</code>, spaces) before passing arguments to commands. Quoting controls what the shell touches and what it passes through literally.</p>
<p><strong>Double quotes</strong> — protect spaces, but still expand <code>$variables</code> and <code>$(commands)</code>:</p>
<pre class="codeblock">name="Alice"
echo "Hello $name"       # Hello Alice
echo "Today: $(date)"    # Today: Mon Jun 24 ...
echo "Files: *.txt"      # Files: *.txt  (glob NOT expanded inside "")</pre>
<p><strong>Single quotes</strong> — completely literal. Nothing is interpreted:</p>
<pre class="codeblock">echo 'Hello $name'       # Hello $name   (literal dollar-sign)
echo 'Today: $(date)'    # Today: $(date) (literal)
echo '$HOME'             # $HOME          (literal)</pre>
<p><strong>Backslash</strong> — escapes a single character:</p>
<pre class="codeblock">echo "Price: \$5"        # Price: $5   ($ not expanded)
echo "Tab:\there"        # Tab:	here  (\t = tab)
mkdir "my dir"           # or: mkdir my\ dir</pre>
<p>Common mistake — forgetting to quote a variable with spaces:</p>
<pre class="codeblock">file="my report.pdf"
rm $file       # WRONG: rm sees two args: "my" and "report.pdf"
rm "$file"     # RIGHT: rm sees one arg: "my report.pdf"</pre>
<div class="callout">
  <div class="callout-label">Rule of thumb</div>
  Always double-quote variables: <code>"$var"</code> not <code>$var</code>. Use single quotes when you want no interpretation at all. Escape only when you need to mix literal special chars into a double-quoted string.
</div>`,
  },
  {
    id: 'linux-6', tier: 't1',
    title: 'Pipes and redirection',
    html: `<p>A <strong>pipe</strong> connects the output of one command directly to the input of the next. It's the most powerful idea in Unix.</p>
<pre class="codeblock">ls -la | grep ".log"         # list files, keep only .log lines
cat access.log | wc -l       # count lines in a file
ps aux | grep nginx          # find nginx processes
cat error.log | tail -n 50 | grep "ERROR"</pre>
<p>Each <code>|</code> creates a chain. Data flows left to right through the pipe. Each program in the chain reads from its standard input and writes to its standard output.</p>
<p><strong>Redirection</strong> controls where input comes from and where output goes:</p>
<pre class="codeblock">command > file.txt       # stdout to file (overwrite)
command >> file.txt      # stdout to file (append)
command 2> errors.txt    # stderr to file
command 2>&1             # redirect stderr into stdout (combine both)
command > out.txt 2>&1   # everything to one file
command < input.txt      # read stdin from a file</pre>
<p>The numbers are <strong>file descriptors</strong>: <code>0</code> = stdin, <code>1</code> = stdout, <code>2</code> = stderr. <code>2>&1</code> means "send file descriptor 2 to wherever file descriptor 1 is going."</p>
<div class="callout">
  <div class="callout-label">In practice</div>
  <code>./deploy.sh > deploy.log 2>&1</code> — run a script and capture all output (including errors) to a log file. Standard pattern for any long-running operation you want a record of.
</div>`,
  },
  {
    id: 'linux-s6b', tier: 't1',
    title: 'Command substitution',
    html: `<p><strong>Command substitution</strong> runs a command and drops its output inline — as a string, an argument, or a variable value. Syntax: <code>$(command)</code>.</p>
<pre class="codeblock"># Capture output into a variable
today=$(date +%Y-%m-%d)
echo "Backup-$today.tar.gz"    # Backup-2026-06-24.tar.gz

version=$(cat VERSION)
echo "Deploying v$version"

# Use inline as an argument
mkdir "release-$(date +%Y%m%d)"
kill $(cat /var/run/app.pid)

# Nested
echo "Scripts in $(ls $(pwd) | grep .sh | wc -l) files"</pre>
<p>The old backtick syntax does the same thing but is harder to read and can't nest:</p>
<pre class="codeblock">today=\`date +%Y-%m-%d\`    # old style — avoid
today=$(date +%Y-%m-%d)    # modern — prefer this</pre>
<p>Common patterns:</p>
<pre class="codeblock">files=$(find . -name "*.log" | wc -l)
echo "$files log files found"

# In loops
for pid in $(pgrep nginx); do
  echo "nginx PID: $pid"
done</pre>
<div class="callout">
  <div class="callout-label">Output is a string</div>
  Command substitution strips trailing newlines. <code>$(echo "hello")</code> gives <code>hello</code> not <code>hello\n</code>. Multi-line output becomes a single string unless you quote it — <code>"$(cat file.txt)"</code> preserves newlines; <code>$(cat file.txt)</code> collapses them into spaces.
</div>`,
  },

  // ── MIDGROUND ─────────────────────────────────────────────────
  {
    id: 'linux-ms0', tier: 't2',
    title: 'Shell startup files — .bashrc, .profile, .zshrc',
    html: `<p>When a shell starts, it reads config files to set up your environment. Which files it reads depends on whether the shell is a <strong>login shell</strong> or an <strong>interactive shell</strong>.</p>
<p>The distinction:</p>
<ul>
  <li><strong>Login shell</strong> — started when you log in (SSH session, console login, <code>su -</code>). Reads <code>~/.bash_profile</code> or <code>~/.profile</code>.</li>
  <li><strong>Interactive non-login shell</strong> — a new terminal tab, or running <code>bash</code> without logging in. Reads <code>~/.bashrc</code>.</li>
  <li><strong>Non-interactive shell</strong> — a script running in the background. Reads neither (usually).</li>
</ul>
<pre class="codeblock"># bash
~/.bash_profile   # login shell — typically sources ~/.bashrc
~/.bashrc         # interactive non-login — where most config lives
~/.bash_logout    # runs on logout

# zsh
~/.zshrc          # interactive shells (zsh merges the distinction)
~/.zprofile       # login shells

# POSIX / sh compatible
~/.profile        # login shells for sh, dash, also bash fallback</pre>
<p>Typical <code>~/.bashrc</code> structure:</p>
<pre class="codeblock">export PATH="$HOME/.local/bin:$PATH"   # extend PATH
export EDITOR=vim                       # default editor

alias ll='ls -la'
alias gs='git status'

# Source additional files
[ -f ~/.bash_aliases ] && source ~/.bash_aliases</pre>
<p>After editing, apply changes without restarting the terminal:</p>
<pre class="codeblock">source ~/.bashrc    # or: . ~/.bashrc</pre>
<div class="callout">
  <div class="callout-label">Common mistake</div>
  Adding something to <code>~/.bashrc</code> and wondering why it doesn't work in SSH sessions — those are login shells that read <code>~/.bash_profile</code>, not <code>~/.bashrc</code>. The fix: put <code>source ~/.bashrc</code> inside <code>~/.bash_profile</code>, which most distros do by default.
</div>`,
  },
  {
    id: 'linux-m1', tier: 't2',
    title: 'Permissions — what rwx actually means',
    html: `<p>Every file and directory has an owner, a group, and a permission bitmask. <code>ls -la</code> shows it:</p>
<pre class="codeblock">-rwxr-xr-- 1 mohsin staff 4096 Jun 1 12:00 deploy.sh
│└──┘└──┘└──┘
│ │   │   └── other: r-- = read only
│ │   └─────── group: r-x = read + execute
│ └─────────── owner: rwx = read + write + execute
└───────────── - = file, d = directory, l = symlink</pre>
<p>Three permission bits per entity: <strong>r</strong>ead (4), <strong>w</strong>rite (2), e<strong>x</strong>ecute (1).</p>
<pre class="codeblock">chmod 755 script.sh     # rwxr-xr-x  (owner full, others read+exec)
chmod 644 config.txt    # rw-r--r--  (owner read+write, others read)
chmod +x script.sh      # add execute bit for everyone
chmod -w file.txt       # remove write bit for everyone
chown mohsin file.txt   # change owner
chown mohsin:staff dir/ # change owner and group</pre>
<p>The octal numbers: each digit is the sum of r(4)+w(2)+x(1) for owner, group, other in order. <code>755</code> = 7(rwx) 5(r-x) 5(r-x).</p>
<div class="callout">
  <div class="callout-label">Execute on directories</div>
  The <code>x</code> bit on a <em>directory</em> means "enter" — you need it to <code>cd</code> into that directory. <code>r</code> alone lets you list the contents but not navigate into them.
</div>`,
  },
  {
    id: 'linux-m2', tier: 't2',
    title: 'Finding things — grep and find',
    html: `<p><code>grep</code> searches inside file contents. <code>find</code> searches the filesystem for files by name, size, type, or time.</p>
<pre class="codeblock"># grep — search file content
grep "ERROR" app.log              # lines containing ERROR
grep -i "error" app.log           # case-insensitive
grep -r "TODO" ./src              # recursive search across files
grep -n "def main" script.py      # show line numbers
grep -v "DEBUG" app.log           # invert — lines NOT matching
grep -E "ERROR|WARN" app.log      # extended regex (multiple patterns)</pre>
<pre class="codeblock"># find — search for files
find . -name "*.log"              # by name pattern
find /etc -name "nginx.conf"      # search in specific path
find . -type d                    # only directories
find . -type f -size +10M         # files larger than 10MB
find . -mtime -1                  # modified in the last 24h
find . -name "*.tmp" -delete      # find and delete in one shot</pre>
<p>Combine them with pipes:</p>
<pre class="codeblock"># grep output of find
find ./logs -name "*.log" | xargs grep "FATAL"

# which: find where a command lives
which python3    # /usr/bin/python3</pre>
<div class="callout">
  <div class="callout-label">xargs</div>
  <code>xargs</code> takes lines from stdin and passes them as arguments to a command. <code>find . -name "*.log" | xargs wc -l</code> counts lines in every log file found.
</div>`,
  },
  {
    id: 'linux-ms2b', tier: 't2',
    title: 'Symbolic links',
    html: `<p>A <strong>symbolic link</strong> (symlink) is a file that points to another path. Reading or writing through it transparently accesses the target.</p>
<pre class="codeblock">ln -s /usr/local/bin/python3 ~/bin/python   # create symlink
ls -la ~/bin/python
# lrwxrwxrwx 1 mohsin staff 22 Jun 24 python -> /usr/local/bin/python3

readlink ~/bin/python       # show what the symlink points to
# /usr/local/bin/python3</pre>
<p>Symlinks are shown with <code>l</code> in <code>ls -la</code> and display their target with <code>-></code>.</p>
<pre class="codeblock"># Common use: versioned installs
ln -s /opt/node-20.0.0/bin/node /usr/local/bin/node
# Now upgrade by changing where the symlink points:
ln -sf /opt/node-22.0.0/bin/node /usr/local/bin/node   # -f overwrites</pre>
<p>Key behaviors:</p>
<ul>
  <li>If the target is deleted or moved, the symlink <strong>breaks</strong> (becomes a dangling link).</li>
  <li>Symlinks can point across filesystems — hard links cannot.</li>
  <li>Symlinks can point to directories.</li>
  <li>Permissions on the symlink itself don't matter — the target's permissions apply.</li>
</ul>
<pre class="codeblock"># Find broken symlinks
find . -xtype l    # -xtype l = symlink pointing to nothing</pre>
<div class="callout">
  <div class="callout-label">vs hard links</div>
  A hard link is a second directory entry pointing to the same inode (actual data). Deleting the original doesn't affect a hard link. A symlink is just a path pointer — if the path disappears, the symlink breaks. Use symlinks for most things; hard links only when you specifically need delete-proof aliasing.
</div>`,
  },
  {
    id: 'linux-m3', tier: 't2',
    title: 'Processes — ps, kill, signals',
    html: `<p>Every running program is a <strong>process</strong> with a unique PID (process ID). The kernel tracks all of them.</p>
<pre class="codeblock">ps aux                  # all running processes, detailed
ps aux | grep nginx     # find a specific process
top                     # live view (q to quit)
htop                    # nicer live view (if installed)</pre>
<p>The <code>ps aux</code> columns that matter: <code>PID</code>, <code>%CPU</code>, <code>%MEM</code>, <code>COMMAND</code>.</p>
<p>Stopping processes:</p>
<pre class="codeblock">kill 1234               # send SIGTERM to PID 1234 (polite, ask to stop)
kill -9 1234            # send SIGKILL (immediate, cannot be caught)
kill -HUP 1234          # SIGHUP — reload config without restart
pkill nginx             # kill by process name instead of PID
killall node            # same — kills all processes named "node"</pre>
<p>Always try <code>kill PID</code> (SIGTERM) first. The process can catch it, clean up, and exit gracefully. <code>kill -9</code> is the nuclear option — the kernel kills it immediately, no cleanup runs.</p>
<div class="callout">
  <div class="callout-label">Ctrl+C vs Ctrl+Z</div>
  <code>Ctrl+C</code> sends SIGINT to the foreground process — it stops. <code>Ctrl+Z</code> sends SIGTSTP — it <em>suspends</em> (pauses, still exists). Resume with <code>fg</code> or background with <code>bg</code>.
</div>`,
  },
  {
    id: 'linux-ms3b', tier: 't2',
    title: 'Package management — apt, dnf, pacman',
    html: `<p>Linux distributions ship a <strong>package manager</strong> to install, update, and remove software from curated repositories. Which one depends on the distro:</p>
<pre class="codeblock">apt       # Debian, Ubuntu, Kali — most common on servers
dnf       # Fedora, RHEL 8+, CentOS Stream
yum       # RHEL 7 / older CentOS (being replaced by dnf)
pacman    # Arch Linux and derivatives</pre>
<p><strong>apt</strong> (what Ubuntu uses):</p>
<pre class="codeblock">sudo apt update              # refresh package list from repos
sudo apt upgrade             # upgrade all installed packages
sudo apt install git curl    # install packages
sudo apt remove nginx        # remove package (keep config)
sudo apt purge nginx         # remove package + config files
apt search "text editor"     # find packages by keyword
apt show vim                 # details about a package
apt list --installed         # list everything installed</pre>
<p><strong>dnf</strong> (Fedora/RHEL):</p>
<pre class="codeblock">sudo dnf install git
sudo dnf update
sudo dnf remove nginx
dnf search vim</pre>
<p><strong>pacman</strong> (Arch):</p>
<pre class="codeblock">sudo pacman -Syu             # sync repos + upgrade everything
sudo pacman -S git           # install
sudo pacman -R nginx         # remove
pacman -Ss "text editor"     # search</pre>
<div class="callout">
  <div class="callout-label">apt update vs apt upgrade</div>
  <code>apt update</code> downloads the package index — it tells apt what versions are available. It doesn't change anything installed. <code>apt upgrade</code> then upgrades installed packages using that updated index. Always run <code>update</code> first.
</div>`,
  },
  {
    id: 'linux-ms3c', tier: 't2',
    title: 'systemd — managing services',
    html: `<p><strong>systemd</strong> is the init system on most modern Linux distributions. It's PID 1 — the first process the kernel starts, which then starts everything else. It manages services, mounts, sockets, and timers.</p>
<p><strong>systemctl</strong> controls services:</p>
<pre class="codeblock">systemctl status nginx          # is it running?
sudo systemctl start nginx      # start now
sudo systemctl stop nginx       # stop now
sudo systemctl restart nginx    # stop + start
sudo systemctl reload nginx     # reload config without full restart

sudo systemctl enable nginx     # start on boot
sudo systemctl disable nginx    # don't start on boot
systemctl is-enabled nginx      # check if enabled</pre>
<p><strong>journalctl</strong> reads logs from systemd's journal:</p>
<pre class="codeblock">journalctl -u nginx                 # all logs for nginx
journalctl -u nginx -f              # follow live (like tail -f)
journalctl -u nginx --since "1h ago"
journalctl -u nginx -n 100          # last 100 lines
journalctl -p err                   # only error-level messages
journalctl --disk-usage             # how much space logs use</pre>
<p>Service unit files live in <code>/etc/systemd/system/</code> (your custom ones) and <code>/lib/systemd/system/</code> (installed packages). Each is a simple INI-like file:</p>
<pre class="codeblock">cat /lib/systemd/system/nginx.service
# [Service]
# Type=forking
# ExecStart=/usr/sbin/nginx
# ExecReload=/bin/kill -s HUP $MAINPID</pre>
<div class="callout">
  <div class="callout-label">After editing a unit file</div>
  Run <code>sudo systemctl daemon-reload</code> before restarting the service — systemd needs to re-read the file. Forgetting this is a common source of confusion when config changes don't take effect.
</div>`,
  },
  {
    id: 'linux-m4', tier: 't2',
    title: 'Environment variables and $PATH',
    html: `<p>Environment variables are key-value pairs that processes inherit from their parent. They configure behavior without hardcoding values into programs.</p>
<pre class="codeblock">printenv              # show all env vars
echo $HOME            # your home directory
echo $USER            # current username
echo $SHELL           # which shell you're running

# Set a variable for current session
export DATABASE_URL="postgres://localhost/mydb"

# Set for a single command only
NODE_ENV=production node server.js</pre>
<p><strong>$PATH</strong> is the most important env var — it's a colon-separated list of directories the shell searches when you type a command name:</p>
<pre class="codeblock">echo $PATH
# /usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

# Add a directory to PATH
export PATH="$HOME/.local/bin:$PATH"</pre>
<p>When you type <code>python3</code>, the shell walks through each directory in $PATH left to right and returns the first match. If a command is "not found," it's not in any $PATH directory.</p>
<pre class="codeblock">which python3     # show which PATH entry wins
type python3      # similar, but shows aliases and builtins too</pre>
<div class="callout">
  <div class="callout-label">Persistence</div>
  <code>export</code> only lasts for the current shell session. To make it permanent, add the line to <code>~/.bashrc</code> (bash) or <code>~/.zshrc</code> (zsh). Those files run every time a new shell starts.
</div>`,
  },
  {
    id: 'linux-m5', tier: 't2',
    title: 'Users, groups, and sudo',
    html: `<p>Linux is a multi-user system. Every process runs as a specific user, which limits what it can touch.</p>
<pre class="codeblock">whoami            # current username
id                # uid, gid, and all group memberships
groups            # just your groups

# Switch users
su - mohsin       # switch to mohsin (needs their password)
sudo su -         # become root (needs your password + sudo rights)</pre>
<p><strong>sudo</strong> lets authorized users run a command as root — without switching to root permanently:</p>
<pre class="codeblock">sudo apt update           # run as root
sudo systemctl restart nginx
sudo -u postgres psql     # run as a specific user (not root)</pre>
<p>User management:</p>
<pre class="codeblock">sudo useradd -m newuser   # create user with home directory
sudo passwd newuser       # set their password
sudo usermod -aG sudo newuser   # add to sudo group
sudo userdel -r newuser   # delete user + home dir</pre>
<div class="callout">
  <div class="callout-label">Why not just run as root?</div>
  Root can delete anything, change any permission, kill any process. Running as root day-to-day means one typo or compromised script can destroy the entire system. Sudo gives you root when needed and logs every invocation to <code>/var/log/auth.log</code>.
</div>`,
  },
  {
    id: 'linux-m6', tier: 't2',
    title: 'SSH — remote access',
    html: `<p><strong>SSH</strong> (Secure Shell) lets you run a shell on a remote machine over an encrypted connection. It's how every developer accesses servers.</p>
<pre class="codeblock">ssh user@hostname          # connect
ssh user@192.168.1.10      # by IP
ssh -p 2222 user@host      # non-default port

# Exit
exit    # or Ctrl+D</pre>
<p><strong>Key-based authentication</strong> is more secure than passwords and required by most cloud providers:</p>
<pre class="codeblock"># Generate a key pair (once, on your machine)
ssh-keygen -t ed25519 -C "your@email.com"
# Creates ~/.ssh/id_ed25519 (private) and ~/.ssh/id_ed25519.pub (public)

# Copy public key to server
ssh-copy-id user@hostname
# Now: ssh user@hostname works without a password</pre>
<p>Useful flags:</p>
<pre class="codeblock">ssh -i ~/.ssh/mykey.pem user@host   # use a specific key file
ssh -L 5432:localhost:5432 user@host  # tunnel remote port to local

# Copy files
scp file.txt user@host:~/           # local → remote
scp user@host:~/file.txt ./         # remote → local
rsync -avz ./dist/ user@host:~/app/ # sync directory</pre>
<div class="callout">
  <div class="callout-label">~/.ssh/config</div>
  Store connection aliases so <code>ssh myserver</code> works instead of typing the full <code>ssh -i key.pem -p 2222 ubuntu@12.34.56.78</code> every time. Add an entry: <code>Host myserver</code> / <code>HostName 12.34.56.78</code> / <code>User ubuntu</code> / <code>IdentityFile ~/.ssh/mykey.pem</code>.
</div>`,
  },
  {
    id: 'linux-ms7b', tier: 't2',
    title: 'Networking basics — ping, curl, dig',
    html: `<p>A handful of tools cover most networking troubleshooting from the command line:</p>
<p><strong>ping</strong> — tests basic connectivity:</p>
<pre class="codeblock">ping google.com          # send ICMP packets, measure round-trip time
ping -c 4 google.com     # stop after 4 packets
ping 192.168.1.1         # ping by IP</pre>
<p><strong>curl</strong> — make HTTP requests, download files, test APIs:</p>
<pre class="codeblock">curl https://example.com                    # GET request, print body
curl -I https://example.com                 # headers only
curl -o file.html https://example.com       # save to file
curl -X POST -d '{"key":"val"}' -H "Content-Type: application/json" https://api.example.com/endpoint
curl -u user:pass https://example.com       # basic auth</pre>
<p><strong>wget</strong> — download files (simpler than curl for downloads):</p>
<pre class="codeblock">wget https://example.com/file.zip
wget -O myfile.zip https://example.com/file.zip   # rename on download
wget -r https://example.com/docs/                  # recursive download</pre>
<p><strong>dig</strong> — DNS queries:</p>
<pre class="codeblock">dig google.com            # A record (IPv4)
dig google.com MX         # mail records
dig google.com ANY        # all records
dig @8.8.8.8 google.com   # query specific DNS server
nslookup google.com       # simpler alternative</pre>
<p><strong>ss</strong> — open sockets and listening ports (replaces netstat):</p>
<pre class="codeblock">ss -tuln                  # listening TCP and UDP ports
ss -tuln | grep :80       # who is listening on port 80</pre>
<div class="callout">
  <div class="callout-label">Quick debug sequence</div>
  Can't reach a server? Check in order: <code>ping</code> (network reachable?), <code>curl -I</code> (HTTP responding?), <code>ss -tuln | grep :PORT</code> (service listening?), <code>dig</code> (DNS resolving?). Each one narrows the problem.
</div>`,
  },
  {
    id: 'linux-m7', tier: 't2',
    title: 'Disk, memory, and system info',
    html: `<p>Commands for understanding what the system is doing and how much headroom is left:</p>
<pre class="codeblock"># Disk
df -h              # disk usage per filesystem, human-readable
du -sh ./logs      # size of a specific directory
du -sh * | sort -rh | head -20   # biggest items in current dir
lsblk              # list block devices (disks, partitions)</pre>
<pre class="codeblock"># Memory
free -h            # RAM usage (total, used, free, cached)
vmstat 1           # virtual memory stats, refresh every 1s</pre>
<pre class="codeblock"># CPU and load
uptime             # load averages for 1, 5, 15 minutes
nproc              # number of CPU cores
top                # live CPU, memory, per-process
# inside top: P = sort by CPU, M = sort by memory, q = quit</pre>
<pre class="codeblock"># Network
ip addr            # show network interfaces and IPs
ss -tuln           # open sockets (replaces netstat)
ss -tuln | grep LISTEN   # just listening ports
curl ifconfig.me   # your public IP</pre>
<div class="callout">
  <div class="callout-label">Load average</div>
  The three numbers in <code>uptime</code> are load averages over 1, 5, and 15 minutes. A load of 1.0 on a single-core machine means fully saturated. On a 4-core machine, 4.0 is 100% utilization. Above that, processes are waiting for CPU time.
</div>`,
  },
  {
    id: 'linux-ms3d', tier: 't2',
    title: 'Archiving and compression — tar, gzip, zip',
    html: `<p>Two separate concepts that are often combined: <strong>archiving</strong> (bundling files) and <strong>compression</strong> (making smaller). <code>tar</code> archives; <code>gzip</code>/<code>bzip2</code>/<code>xz</code> compress. Usually used together.</p>
<p><strong>tar</strong> — the standard Unix archiver:</p>
<pre class="codeblock"># Create archive (c=create, z=gzip, f=filename, v=verbose)
tar -czf archive.tar.gz folder/
tar -cjf archive.tar.bz2 folder/    # bzip2 (slower, smaller)
tar -cJf archive.tar.xz folder/     # xz (even slower, even smaller)

# Extract (x=extract)
tar -xzf archive.tar.gz
tar -xzf archive.tar.gz -C /target/ # extract to specific dir

# List contents without extracting
tar -tzf archive.tar.gz</pre>
<p>Memory aid: <strong>c</strong>reate / e<strong>x</strong>tract, <strong>z</strong>=gzip, <strong>f</strong>=file, <strong>v</strong>=verbose. Always put <code>f</code> last — it takes the filename as the next argument.</p>
<p><strong>gzip</strong> — compress individual files:</p>
<pre class="codeblock">gzip file.txt           # compress — replaces with file.txt.gz
gunzip file.txt.gz      # decompress — replaces back
gzip -k file.txt        # keep original
zcat file.txt.gz        # read without decompressing</pre>
<p><strong>zip</strong> — cross-platform archives (Windows compatible):</p>
<pre class="codeblock">zip -r archive.zip folder/
unzip archive.zip
unzip archive.zip -d /target/
unzip -l archive.zip          # list contents</pre>
<div class="callout">
  <div class="callout-label">tar vs zip</div>
  <code>tar.gz</code> is the Linux standard — it preserves Unix permissions, symlinks, and ownership. <code>zip</code> is for when the recipient uses Windows or a tool that only understands zip. Use <code>tar.gz</code> by default on Linux servers.
</div>`,
  },
  {
    id: 'linux-m8', tier: 't2',
    title: 'Text processing — sort, uniq, awk, sed',
    html: `<p>Unix text tools chain together to process logs, CSVs, and output without writing code:</p>
<pre class="codeblock"># sort
sort names.txt            # alphabetical
sort -n numbers.txt       # numeric
sort -r file.txt          # reverse
sort -k2 file.txt         # sort by second column</pre>
<pre class="codeblock"># uniq — collapse adjacent duplicate lines
sort file.txt | uniq           # deduplicate
sort file.txt | uniq -c        # count occurrences
sort file.txt | uniq -c | sort -rn | head  # top frequency</pre>
<pre class="codeblock"># wc — word/line/byte count
wc -l file.txt       # count lines
wc -w file.txt       # count words</pre>
<pre class="codeblock"># cut — extract columns from delimited text
cut -d',' -f1,3 data.csv    # columns 1 and 3 from CSV
cut -d':' -f1 /etc/passwd   # usernames only</pre>
<pre class="codeblock"># sed — stream editor (find/replace)
sed 's/foo/bar/' file.txt          # replace first foo per line
sed 's/foo/bar/g' file.txt         # replace all occurrences
sed -i 's/old/new/g' file.txt      # edit file in place</pre>
<pre class="codeblock"># awk — pattern scanning and processing
awk '{print $1}' file.txt          # print first field
awk -F',' '{print $2}' data.csv    # second CSV column
awk '$3 > 1000 {print}' file.txt   # filter rows where col 3 > 1000
awk '{sum += $1} END {print sum}'  # sum a column</pre>
<div class="callout">
  <div class="callout-label">Real example — top IPs from nginx log</div>
  <code>awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10</code> — prints the 10 IP addresses making the most requests.
</div>`,
  },
  {
    id: 'linux-m9', tier: 't2',
    title: 'Background jobs and multiplexing',
    html: `<p>Running long processes without tying up your terminal:</p>
<pre class="codeblock"># Run in background
./build.sh &          # & forks to background, prints PID
jobs                  # list background jobs in this shell
fg %1                 # bring job 1 to foreground
bg %1                 # resume stopped job in background
Ctrl+Z then bg        # suspend foreground process, then background it</pre>
<p>Background jobs with <code>&</code> die when the shell exits. To survive logout:</p>
<pre class="codeblock">nohup ./server.sh &           # immune to hangup signal
nohup ./server.sh > out.log 2>&1 &   # capture output too
disown %1             # detach a job already running</pre>
<p><strong>tmux</strong> is the modern solution — a terminal multiplexer that keeps sessions alive:</p>
<pre class="codeblock">tmux                      # start new session
tmux new -s mysession     # named session
Ctrl+B, D                 # detach (session keeps running)
tmux attach -t mysession  # reattach later (even after SSH reconnect)
Ctrl+B, C                 # create new window
Ctrl+B, %                 # split pane vertically
Ctrl+B, "                 # split pane horizontally</pre>
<div class="callout">
  <div class="callout-label">tmux vs screen</div>
  <code>screen</code> is older and still common on servers. <code>tmux</code> has better defaults, scriptability, and copy-mode. Either lets you disconnect from SSH and return to a running session — critical for long-running tasks on remote servers.
</div>`,
  },
  {
    id: 'linux-m10', tier: 't2',
    title: 'Cron — scheduled tasks',
    html: `<p><strong>cron</strong> is the Unix job scheduler. It runs commands on a schedule, as a specific user, in the background.</p>
<pre class="codeblock">crontab -l          # list your current cron jobs
crontab -e          # edit your cron table
crontab -r          # remove all your cron jobs</pre>
<p>Cron schedule format — five fields before the command:</p>
<pre class="codeblock">┌─────── minute (0-59)
│ ┌───── hour (0-23)
│ │ ┌─── day of month (1-31)
│ │ │ ┌─ month (1-12)
│ │ │ │ ┌ day of week (0=Sun, 6=Sat)
│ │ │ │ │
* * * * * command</pre>
<pre class="codeblock"># Examples
0 * * * *   /scripts/hourly.sh         # every hour on the hour
30 2 * * *  /scripts/backup.sh         # 2:30 AM every day
0 0 * * 0   /scripts/weekly.sh         # midnight every Sunday
*/5 * * * * /scripts/healthcheck.sh    # every 5 minutes
0 9-17 * * 1-5 /scripts/business.sh   # every hour, 9-5, weekdays</pre>
<p>Always use absolute paths in cron — it runs with a minimal $PATH and won't find your local binaries.</p>
<pre class="codeblock"># Capture output (cron suppresses stdout by default)
0 * * * * /scripts/job.sh >> /var/log/job.log 2>&1</pre>
<div class="callout">
  <div class="callout-label">cron gotcha</div>
  Cron runs in a minimal environment. Your <code>~/.bashrc</code> doesn't run. If your script needs env vars, source them explicitly at the top: <code>source /etc/environment</code> or set them inline in the crontab entry.
</div>`,
  },

  // ── BEDROCK ───────────────────────────────────────────────────
  {
    id: 'linux-b0', tier: 't3',
    title: 'Inodes — what a file actually is',
    html: `<p>When you think of a "file," you think of a name, some content, and maybe permissions. But the kernel stores these separately.</p>
<p>Every file has an <strong>inode</strong> — a fixed-size metadata record stored in the filesystem. The inode holds:</p>
<ul>
  <li>File type (regular, directory, symlink, device, etc.)</li>
  <li>Permissions, owner UID, group GID</li>
  <li>Timestamps: access, modify, change</li>
  <li>File size and block count</li>
  <li>Pointers to the data blocks on disk</li>
</ul>
<p>The inode does <strong>not</strong> hold the filename. Filenames live in directory entries, which map a name to an inode number.</p>
<pre class="codeblock">stat notes.txt
# File: notes.txt
# Size: 42        Blocks: 8        IO Block: 4096  regular file
# Inode: 2621441  Links: 1
# Access: (0644/-rw-r--r--)  Uid: (1000/ mohsin)
# Modify: 2026-06-24 10:00:00.000

ls -i notes.txt       # show inode number
# 2621441 notes.txt

df -i                  # inode usage per filesystem
# (can run out of inodes before disk space — each file uses one)</pre>
<p>A directory is just a file containing a list of name→inode mappings. When you run <code>ls</code>, the kernel reads the directory file, then fetches metadata from each inode.</p>
<div class="callout">
  <div class="callout-label">Running out of inodes</div>
  Filesystems have a fixed number of inodes, set at creation. If you create millions of tiny files (email queues, npm installs, tmp files), you can exhaust inodes while disk space still shows free. <code>df -i</code> reveals this. The fix is usually to clean up files, not add disk space.
</div>`,
  },
  {
    id: 'linux-b0b', tier: 't3',
    title: 'Hard links vs symbolic links',
    html: `<p>Both hard links and symlinks let multiple names refer to the same data. They work very differently at the inode level.</p>
<p><strong>Hard link</strong> — a second directory entry pointing to the same inode:</p>
<pre class="codeblock">ln original.txt hardlink.txt
ls -i original.txt hardlink.txt
# 2621441 original.txt
# 2621441 hardlink.txt   ← same inode number!</pre>
<p>Both names point to exactly the same inode and the same data blocks. The inode tracks a <strong>link count</strong> — the file is deleted from disk only when the count reaches zero:</p>
<pre class="codeblock">rm original.txt    # link count: 2 → 1. Data still exists.
# hardlink.txt still works perfectly</pre>
<p><strong>Symbolic link</strong> — a separate inode that stores a target path:</p>
<pre class="codeblock">ln -s original.txt symlink.txt
ls -i original.txt symlink.txt
# 2621441 original.txt
# 2621449 symlink.txt   ← different inode

rm original.txt    # symlink now broken — points to a nonexistent path</pre>
<p>Key differences:</p>
<pre class="codeblock">Feature                   Hard link     Symlink
─────────────────────────────────────────────────
Different inode?          No            Yes
Survives original delete? Yes           No (broken)
Cross-filesystem?         No            Yes
Can link to directory?    No*           Yes
Shows in ls -la as l?     No            Yes</pre>
<div class="callout">
  <div class="callout-label">When to use which</div>
  Use symlinks almost always — they're transparent, flexible, and can point to directories. Hard links are a niche tool: backup programs use them to make "snapshots" that share unchanged files without duplicating data.
</div>`,
  },
  {
    id: 'linux-b0c', tier: 't3',
    title: 'Mount points and filesystems',
    html: `<p>Linux presents one unified directory tree starting at <code>/</code>, but that tree is assembled from multiple <strong>filesystems</strong> mounted at different points.</p>
<p>A <strong>filesystem</strong> is a structured way to store files on a block device (disk, partition, RAM, network share). Common types:</p>
<pre class="codeblock">ext4    # most common Linux default (journaling, reliable)
xfs     # high-performance, good for large files (used by RHEL)
btrfs   # copy-on-write, snapshots, checksums
tmpfs   # lives entirely in RAM — gone on reboot (/tmp, /run)
procfs  # virtual — /proc — kernel-generated
sysfs   # virtual — /sys — device and driver info</pre>
<p>A <strong>mount point</strong> is a directory where a filesystem is attached to the tree:</p>
<pre class="codeblock">df -T              # show all mounted filesystems with type
mount              # list all current mounts
lsblk              # show block devices and where they're mounted</pre>
<pre class="codeblock"># Manually mount a device (usually not needed on modern systems)
sudo mount /dev/sdb1 /mnt/data       # attach partition to /mnt/data
sudo umount /mnt/data                # detach

# Mount an ISO
sudo mount -o loop disk.iso /mnt/iso</pre>
<p><code>/etc/fstab</code> lists filesystems to mount at boot:</p>
<pre class="codeblock">cat /etc/fstab
# /dev/sda1   /        ext4    defaults    0 1
# /dev/sda2   /home    ext4    defaults    0 2
# tmpfs       /tmp     tmpfs   defaults    0 0</pre>
<div class="callout">
  <div class="callout-label">Hard links can't cross filesystems</div>
  An inode number is only unique within one filesystem. A hard link in <code>/home</code> can't point to an inode in <code>/var</code> — they're different filesystems with independent inode tables. Symlinks have no such restriction because they store a path, not an inode number.
</div>`,
  },
  {
    id: 'linux-b1', tier: 't3',
    title: 'Everything is a file — file descriptors',
    html: `<p>"Everything is a file" isn't a metaphor — it's how the Linux kernel actually works. Network sockets, device drivers, pipes, and terminals are all represented as file descriptors your process can read from and write to.</p>
<p>Every process starts with three file descriptors already open:</p>
<pre class="codeblock">0  stdin   — standard input  (keyboard by default)
1  stdout  — standard output (terminal by default)
2  stderr  — standard error  (terminal by default)</pre>
<p>When you open a file, you get the next available number:</p>
<pre class="codeblock">fd 3  →  /var/log/app.log  (opened by your program)
fd 4  →  socket to 192.168.1.5:443
fd 5  →  /dev/null</pre>
<p>You can inspect any process's open file descriptors:</p>
<pre class="codeblock">ls -la /proc/$$/fd     # $$ = current shell's PID
lsof -p 1234           # list all open files for PID 1234
lsof -i :8080          # which process has port 8080 open</pre>
<p>This is why redirection works — <code>2>&1</code> literally duplicates file descriptor 2 to point at the same thing as file descriptor 1. The program never knows; it just writes to fd 2 as normal.</p>
<div class="callout">
  <div class="callout-label">Practical consequence</div>
  If a program opens a log file, you delete the file, and the program keeps running — the disk space is NOT freed. The file descriptor is still open, and the inode (actual data) persists until all file descriptors pointing to it are closed. <code>lsof | grep deleted</code> reveals these zombie files.
</div>`,
  },
  {
    id: 'linux-b2', tier: 't3',
    title: 'Signals in depth',
    html: `<p>Signals are asynchronous notifications the kernel sends to processes. They're how you tell a process to stop, reload, or dump state.</p>
<pre class="codeblock">kill -l      # list all signals</pre>
<p>The ones you'll use:</p>
<pre class="codeblock">Signal    Number   Default action      Meaning
SIGHUP       1     Terminate          Terminal closed / reload config
SIGINT       2     Terminate          Ctrl+C
SIGQUIT      3     Core dump          Ctrl+\\ — quit + dump
SIGKILL      9     Terminate          Cannot be caught or ignored
SIGTERM     15     Terminate          Polite stop (can be caught)
SIGSTOP     19     Stop               Cannot be caught (Ctrl+Z sends SIGTSTP)
SIGUSR1     10     User-defined       Application-specific
SIGUSR2     12     User-defined       Application-specific</pre>
<p>The critical difference: <strong>SIGKILL cannot be caught, blocked, or ignored</strong>. The kernel handles it directly. SIGTERM can be caught — processes use it to close connections, flush buffers, and write state before exiting. Always try SIGTERM first.</p>
<p>In bash scripts, trap signals:</p>
<pre class="codeblock">trap "echo 'Caught SIGTERM, cleaning up...'; cleanup; exit 0" SIGTERM
trap "rm -f /tmp/lockfile" EXIT    # always runs when script exits</pre>
<div class="callout">
  <div class="callout-label">nginx uses SIGUSR1</div>
  <code>kill -USR1 $(cat /var/run/nginx.pid)</code> tells nginx to reopen its log files — used after log rotation. nginx catches SIGUSR1 and handles it without downtime. Many daemons repurpose SIGUSR1/USR2 this way.
</div>`,
  },
  {
    id: 'linux-b2b', tier: 't3',
    title: 'Processes vs threads',
    html: `<p>Both processes and threads are units of concurrent execution, but they differ in isolation and overhead.</p>
<p><strong>Process</strong> — fully isolated execution context:</p>
<ul>
  <li>Own virtual address space (memory)</li>
  <li>Own file descriptor table</li>
  <li>Own PID</li>
  <li>Crash in one process does not affect another</li>
  <li>Communication via pipes, sockets, shared memory (explicit)</li>
</ul>
<p><strong>Thread</strong> — execution unit sharing a process's address space:</p>
<ul>
  <li>Shares memory, file descriptors, signal handlers with other threads in the process</li>
  <li>Faster to create and context-switch than a process</li>
  <li>Bug in one thread (wild pointer write) can corrupt data for all threads</li>
  <li>Communication via shared variables (requires locking)</li>
</ul>
<pre class="codeblock"># See threads in ps
ps -eLf         # L = threads. LWP = Light Weight Process (thread ID)
ps aux | grep nginx
# nginx: master has 1 thread; worker processes are separate processes

# /proc shows threads
ls /proc/1234/task/    # one subdirectory per thread</pre>
<p>In Linux, both processes and threads are implemented as <strong>tasks</strong> at the kernel level. The difference is how much they share, controlled by flags passed to the <code>clone()</code> syscall:</p>
<pre class="codeblock">fork()   → clone with nothing shared (new process)
pthread  → clone with address space, FDs, signals shared (thread)</pre>
<div class="callout">
  <div class="callout-label">Python's GIL</div>
  Python threads are OS threads, but the Global Interpreter Lock (GIL) prevents more than one from running Python bytecode at once. This means Python threads are good for I/O-bound work (waiting on network/disk) but don't speed up CPU-bound work. For CPU parallelism in Python, use the <code>multiprocessing</code> module — separate processes, no GIL.
</div>`,
  },
  {
    id: 'linux-b3', tier: 't3',
    title: 'The /proc filesystem',
    html: `<p><code>/proc</code> is a virtual filesystem — it has no files on disk. The kernel generates its contents on the fly. Every file in <code>/proc</code> is a live window into kernel state.</p>
<pre class="codeblock">cat /proc/cpuinfo       # CPU details and capabilities
cat /proc/meminfo       # memory stats (what free -h reads)
cat /proc/version       # kernel version
cat /proc/uptime        # seconds since boot
cat /proc/loadavg       # load averages (what uptime reads)</pre>
<p>Every process has a directory at <code>/proc/PID/</code>:</p>
<pre class="codeblock">ls /proc/1/             # PID 1 (init/systemd)
cat /proc/1/status      # process status
cat /proc/1/cmdline     # exact command that started it
ls -la /proc/1/fd       # all open file descriptors
cat /proc/1/maps        # memory map (which libraries are loaded)
cat /proc/1/net/tcp     # open TCP connections</pre>
<p>You can tune kernel behavior by writing to <code>/proc/sys/</code>:</p>
<pre class="codeblock">cat /proc/sys/net/ipv4/ip_forward   # 0 or 1
echo 1 > /proc/sys/net/ipv4/ip_forward   # enable IP forwarding
sysctl net.ipv4.ip_forward=1             # same thing, via sysctl</pre>
<div class="callout">
  <div class="callout-label">Why /proc matters</div>
  Every monitoring tool — <code>top</code>, <code>ps</code>, <code>free</code>, <code>netstat</code> — just reads from <code>/proc</code>. It's not magic: they parse the same virtual files you can read directly. When a tool isn't available, <code>/proc</code> is always there.
</div>`,
  },
  {
    id: 'linux-b4', tier: 't3',
    title: 'Bash scripting fundamentals',
    html: `<p>A bash script is a file of shell commands the shell executes in order. The first line tells the OS which interpreter to use:</p>
<pre class="codeblock">#!/usr/bin/env bash
# Always start with this shebang line

set -euo pipefail   # exit on error, undefined vars, pipe failures</pre>
<p><code>set -euo pipefail</code> is essential — by default bash keeps running after errors. This line makes scripts fail loudly instead of silently.</p>
<pre class="codeblock"># Variables (no spaces around =)
name="world"
echo "hello $name"
echo "hello \${name}!"   # braces for adjacent text

# Command substitution
today=$(date +%Y-%m-%d)
files=$(ls *.log | wc -l)</pre>
<pre class="codeblock"># Conditionals
if [ -f "config.yml" ]; then
  echo "config found"
elif [ -d "config/" ]; then
  echo "config dir found"
else
  echo "no config"
fi

# Common test flags
[ -f file ]   # file exists
[ -d dir ]    # directory exists
[ -z "$var" ] # variable is empty
[ "$a" = "$b" ] # string equality</pre>
<pre class="codeblock"># Loops
for file in *.log; do
  echo "Processing $file"
  gzip "$file"
done

while read line; do
  echo "$line"
done < input.txt</pre>
<pre class="codeblock"># Functions
backup() {
  local src=$1
  local dst=$2
  cp -r "$src" "$dst/$(date +%Y%m%d)"
}
backup ./data /backups</pre>
<div class="callout">
  <div class="callout-label">Quote everything</div>
  Always double-quote variables: <code>"$var"</code> not <code>$var</code>. Without quotes, if <code>$var</code> contains spaces or is empty, the command breaks in surprising ways. This is the single most common source of bugs in shell scripts.
</div>`,
  },
  {
    id: 'linux-b4b', tier: 't3',
    title: 'Aliases and shell functions',
    html: `<p>Aliases and functions let you create shortcuts for commands you type repeatedly. Both live in your shell config and load on every new shell.</p>
<p><strong>Aliases</strong> — simple text substitution before the shell parses the command:</p>
<pre class="codeblock">alias ll='ls -la'
alias gs='git status'
alias gp='git push'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'

# Unalias
unalias ll

# List all aliases
alias</pre>
<p>Add them to <code>~/.bashrc</code> (or <code>~/.zshrc</code>) for persistence. After editing, run <code>source ~/.bashrc</code>.</p>
<p>Aliases can't take arguments or run conditional logic. For that, use a <strong>function</strong>:</p>
<pre class="codeblock"># Functions go in ~/.bashrc too
mkcd() {
  mkdir -p "$1" && cd "$1"
}

# Function with default argument
serve() {
  local port=\${1:-8080}
  python3 -m http.server "$port"
}

# Usage
mkcd my-project        # creates dir and cds into it
serve                  # serves on 8080
serve 3000             # serves on 3000</pre>
<p>Difference: aliases are text substitution (no logic, no args). Functions are mini-scripts that run in your current shell.</p>
<div class="callout">
  <div class="callout-label">Alias vs function — which to use</div>
  Use an alias for simple renamed commands (<code>ll</code>, <code>gs</code>). Use a function when you need arguments (<code>$1</code>), conditionals, or multiple steps. If you find yourself doing <code>alias foo='bar "$@"'</code> — stop, write a function instead.
</div>`,
  },
  {
    id: 'linux-b5', tier: 't3',
    title: 'System calls — what happens when you run a command',
    html: `<p>Every interaction between a program and the OS goes through a <strong>system call</strong> — a controlled entry point into the kernel. Programs don't touch hardware directly; they ask the kernel to do it via syscalls.</p>
<p>When you type <code>ls</code> and press Enter:</p>
<ol>
  <li>The shell calls <code>fork()</code> — creates a copy of itself (a child process).</li>
  <li>The child calls <code>execve("/usr/bin/ls", ["ls", "-la"], environ)</code> — replaces itself with the <code>ls</code> program.</li>
  <li><code>ls</code> calls <code>openat()</code> to open the directory, then <code>getdents64()</code> to read its entries.</li>
  <li><code>ls</code> calls <code>write()</code> to send formatted output to stdout (fd 1).</li>
  <li><code>ls</code> calls <code>exit_group(0)</code> — done.</li>
  <li>The shell calls <code>wait4()</code> and gets back the exit code.</li>
</ol>
<p><code>strace</code> lets you see every syscall a program makes:</p>
<pre class="codeblock">strace ls -la 2>&1 | head -30   # trace ls
strace -p 1234                   # attach to running process
strace -e trace=network curl example.com  # only network calls
strace -c ls                     # summary: count and timing per syscall</pre>
<pre class="codeblock"># Typical output line
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3</pre>
<p>This says: opened <code>/etc/ld.so.cache</code> for reading, got back file descriptor 3.</p>
<div class="callout">
  <div class="callout-label">Exit codes</div>
  Every process exits with a number (0-255). <code>0</code> = success. Anything else = failure. The shell stores the last exit code in <code>$?</code>. This is how <code>if</code>, <code>&&</code>, and <code>||</code> in shell scripts make decisions — they check exit codes, not return values.
</div>`,
  },
  {
    id: 'linux-b5b', tier: 't3',
    title: 'ACLs — fine-grained permissions',
    html: `<p>Traditional Unix permissions (owner/group/other) have a hard limitation: one owner, one group. If you need user Alice to read a file owned by Bob without making her part of Bob's group — and without making it world-readable — you need <strong>Access Control Lists (ACLs)</strong>.</p>
<p>ACLs let you grant per-user and per-group permissions on top of the standard bits.</p>
<pre class="codeblock"># View ACLs on a file
getfacl report.pdf
# # file: report.pdf
# # owner: bob
# # group: team
# user::rw-
# user:alice:r--    ← alice has read, even though she's not owner/group
# group::r--
# mask::r--
# other::---</pre>
<pre class="codeblock"># Set ACL: give alice read access
setfacl -m u:alice:r report.pdf

# Give the "contractors" group read+write
setfacl -m g:contractors:rw shared/

# Remove alice's ACL entry
setfacl -x u:alice report.pdf

# Remove all ACL entries (revert to standard permissions)
setfacl -b report.pdf

# Recursive — apply to directory and everything inside
setfacl -R -m u:alice:rX shared/</pre>
<p>When a file has an ACL, <code>ls -la</code> shows a <code>+</code> after the permission string:</p>
<pre class="codeblock">-rw-r--r--+ 1 bob team 4096 Jun 24 report.pdf
            ↑ ACL present</pre>
<p>The <strong>mask</strong> entry in ACLs limits the maximum effective permissions for named users and groups (not the owner). It's automatically updated when you set ACLs, but can catch you off guard.</p>
<div class="callout">
  <div class="callout-label">When to use ACLs</div>
  Most setups don't need ACLs — careful use of groups covers most cases. ACLs shine in shared directories where different teams need different access to overlapping files, like a web root where deployers need write and monitoring needs read without mixing them into the same group.
</div>`,
  },
];

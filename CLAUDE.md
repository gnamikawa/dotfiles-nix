## Collaboration

Never tamper with the user's home files. The only home files an agent may
edit unattended are files this repository declares and manages itself
(e.g. via `home.file`, `xdg.configFile`, or equivalent) — never files that
merely happen to live under `$HOME` but are outside the repo's control, and
never via activation scripts, migrations, or "cleanup" logic that reaches
outside declared files to move, rename, or delete undeclared state. If
undeclared state (a leftover profile, a stray cache directory, etc.) is
interfering with a managed config, the fix is to change what gets declared
or how it is discovered — not to reach out and modify the undeclared file
itself.

The exception is acting under the user's strict, real-time supervision:
each touch to an undeclared home file is a step the user is actively
watching and can halt before it happens, not a batch of changes approved
in advance or reviewed after the fact. Unattended code — activation
scripts, migrations, cron jobs, anything that runs without the user
watching it happen — always falls under the general rule, no matter how
safe or reversible it looks.

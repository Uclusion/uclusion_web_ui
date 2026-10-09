<!-- uclusion-skill-reference:v1 -->
# Claude Code session-owned Poke delivery

Load this unit only when the selected resident stub declares Claude Code
session-owned delivery. Use that stub's authoritative CLI command and
environment for each `uclusion` command below. Shared discovery, ownership,
event routing and lifecycle rules remain in [the core](../SKILL.md).

At session start, before acting on the first user request, establish Poke AI
delivery, even for unrelated or read-only work. Arm exactly one delivery task
unless this session already armed one that is running. If Monitor offers
`persistent`, run `uclusion listen` with `persistent: true`. Otherwise use Bash
to run `uclusion wait --timeout 86400` with `run_in_background: true` and the
largest accepted `timeout` (normally `7200000` milliseconds for unattended
sessions). Name the Uclusion Poke stream in the description. Do not use an
expiring Monitor. Local background commands have no time limit; unattended
commands normally stop after at most two hours and report that stop. Where the
person or client expects approval for a background process, ask; if declined,
continue without delivery. Arm delivery before reading a file or running a
command requested by the user.

Delivery reaches only the session that armed it. Never adopt a task you did not
arm, stop another session's task, or enumerate processes looking for one.
Handle each printed Poke line in order. When a delivery task ends, read its
output and handle any Pokes, then arm the next task in that same turn, including
after a quiet timeout or a background time-limit stop. For a delivered Poke,
complete the target read required by the common workflow before arming the
next task. Then continue work with delivery running. Leave a quiet task
running. When exiting, choose the plain exit; never move delivery outside the
client or its harness. Arm or relaunch delivery before the final chat message
because some clients hide text written before a tool call.

A session's first delivery task starts its cursor at arm time. Both wait and
listen key the cursor on `CLAUDE_CODE_SESSION_ID`, so rearming or switching
commands in the same session continues that cursor and delivers Pokes that
arrived between tasks. An explicit `--consumer` or `UCLUSION_CONSUMER` overrides
the session identity; never set `UCLUSION_CONSUMER` yourself. Outside Claude
Code, a bare wait still uses the shared default cursor; this does not authorize
a different delivery mode. Apply [the core](../SKILL.md)'s shared retained-history
and human-requested replay rules.
<!-- /uclusion-skill-reference:v1 -->

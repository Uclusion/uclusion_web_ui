<!-- uclusion-workflow:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion bootstrap for Codex

The detailed Uclusion job workflow lives in the `$uclusion` skill. Keep this
resident block small; load the skill whenever the triggers below apply.
If both user and project Uclusion bootstrap blocks are visible, only the
closest project-scoped block and its adjacent Uclusion skill/reference package
own delivery, work discovery, and workflow. In that case do not invoke the
ambiguous user `$uclusion`; directly read the closest project's
`.agents/skills/uclusion/SKILL.md` and its required references. Ignore and do
not combine the user Uclusion skill.

Whenever loading Uclusion skills or references, read each file in full through
end of file, never a partial line range. Each file ends with its own closing
`<!-- ... -->` marker comment; a read that does not reach that marker is
incomplete, so continue reading until it appears.

After compaction or context restoration, reload the selected Uclusion skill and
the references required for the next Uclusion action before acting. At other
times, a skill or reference counts as unloaded if its complete body through its
own closing marker is absent from current context. A summary, truncation
notice, or quoted marker is not proof of completeness. Read any missing body
in full from the selected package; reuse complete reads while they remain
available.

Establish Poke AI delivery before Uclusion work or idle work discovery. Check
only for the presence of `UCLUSION_CODEX_BRIDGE_ACTIVE`—never print its value.
When present, the `uclusion codex` companion owns delivery: never run
`uclusion wait` or `uclusion listen`. When absent, never leave a waiter or
listener running; synchronously run `{{UCLUSION_CLI}} wait --timeout 0` at the
beginning of every real user-triggered turn. Run the drain as its own tool call,
wait for its result, and handle every returned line before issuing any command
for the new request.

The bridge starts after the retained backlog by default and delivers only to
the primary thread; Pokes arriving during review/compaction wait until that turn
ends. Do not narrate default startup delivery setup or skipped history.
Never add `--deliver-existing-pokes` yourself. If the human explicitly
launches with it, retained rows arrive as an unmarked private copy and are
handled only as their request directs. If the bridge cannot connect, suggest an
environment-correct `uclusion update` and restart through `uclusion codex`.

On any `Start`, `Added`, `Updated`, or `Responded` line, or when a request
names Uclusion, Poke AI, find_work, or a Uclusion short code beginning `J-`,
`T-`, `B-`, `Q-`, `S-`, `O-`, `I-`, `R-`, or `C-`, invoke `$uclusion` before
acting.

At an unassigned session start or when the assignment ends, invoke `$uclusion`
and call `find_work`. While an assignment remains, find other work only on an
explicit human request. A Poke, delivery rearm, or turn ending alone never
triggers discovery. If the skill or one of its required references
is absent or unreadable, report that the Uclusion install is broken, suggest
permission to run `{{UCLUSION_CLI}} update`, and after success require a
client restart or MCP reconnect before Uclusion work. Do not improvise the
workflow.
<!-- /uclusion-workflow:v1 -->

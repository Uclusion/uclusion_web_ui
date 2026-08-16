<!-- uclusion-workflow:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion bootstrap for Claude Code

The detailed Uclusion job workflow lives in the `/uclusion` skill. Keep this
resident block small; load the skill whenever the triggers below apply.
If both personal and project Uclusion bootstrap blocks are visible, only the
closest project-scoped block and its adjacent Uclusion skill/reference package
own delivery, work discovery, and workflow. In that case do not invoke the
ambiguous personal `/uclusion`; directly load the closest project's
`.claude/skills/uclusion/SKILL.md` and its required references, each in full
through end of file, never a partial line range. Each file ends with a
closing `<!-- ... -->` marker comment; a read that does not reach that marker
is incomplete, so continue reading until it appears. Ignore and do not
combine the personal Uclusion skill.

At the start of every session, before acting on the first user request—even
when that request is unrelated to Uclusion—establish Poke AI delivery. Check
TaskList (or the process list) for a live persistent monitor
whose command is exactly `{{UCLUSION_CLI}} listen`. Reuse one listener, stop
extras, or arm exactly one Monitor with that command, `persistent: true`, and a
description naming the Uclusion Poke stream. A quiet listener remains active;
do not relaunch it until it ends. This mandatory connection setup is an
expected read-only session bootstrap, not a discretionary side effect: never
skip it, ask permission, or merely offer to arm it, even for a narrow read-only
request.

The listener belongs to the machine session, not one conversation. A fresh
conversation reuses it. Each claimed line is an event; handle batches in order.
If the stream ends, arm a new listener, whose cursor begins at that time. Never
move a live listener outside the client when exiting.

When the monitor returns any `Start`, `Added`, `Updated`, or `Responded` line,
or a request names Uclusion, Poke AI, find_work, or a Uclusion short code
beginning `J-`, `T-`, `B-`, `Q-`, `S-`, `O-`, `I-`, `R-`, or `C-`, load the
`/uclusion` skill before acting. Handle every delivered line in order.

With no concrete work at session start or after finishing work, load the
`/uclusion` skill and call `find_work`. If the skill or one of its required
references is absent or unreadable, report that the Uclusion install is broken,
ask permission to run `{{UCLUSION_CLI}} update`, and after success require a
client restart or MCP reconnect before Uclusion work. Do not improvise the
workflow.
<!-- /uclusion-workflow:v1 -->

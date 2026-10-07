<!-- uclusion-workflow:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion bootstrap for Claude Code

The detailed Uclusion job workflow lives in the `/uclusion` skill. Keep this
resident block small; load the skill whenever the triggers below apply.
If both personal and project Uclusion bootstrap blocks are visible, only the
closest project-scoped block and its adjacent Uclusion skill/reference package
own delivery, work discovery, and workflow. In that case do not invoke the
ambiguous personal `/uclusion`; directly load the closest project's
`.claude/skills/uclusion/SKILL.md` and its required references. Ignore and do
not combine the personal Uclusion skill.

Whenever loading Uclusion skills or references, read each file in full through
end of file, never a partial line range. Each file ends with its own closing
`<!-- ... -->` marker comment; a read that does not reach that marker is
incomplete, so continue reading until it appears.

`{{UCLUSION_CLI}} workflow-status <selected-package> [--loaded <content_id>]`
gives `reload_required`. Pass `--loaded` only with required complete bodies and
their ID still in context; omit it after compaction, restoration, or body loss.
Reload when true; otherwise reuse identical bodies across paths. Check your
role's package; summaries and saved IDs are not bodies.

At session start, before acting on the first user request, establish Poke AI delivery,
even for unrelated or read-only work. Arm exactly one delivery task unless this
session already armed one that is running. If Monitor offers `persistent`, run
`{{UCLUSION_CLI}} listen` with `persistent: true`. Otherwise use Bash to run
`{{UCLUSION_CLI}} wait --timeout 86400` with `run_in_background: true` and the
largest accepted `timeout` (normally `7200000` milliseconds for unattended
sessions). Name the Uclusion Poke stream in the description. Do not use an
expiring Monitor. Local background commands have no time limit; unattended
commands normally stop after at most two hours and report that stop. Where the
person or client expects approval for a background process, ask; if declined,
continue without delivery.

Arm delivery before reading a file or running a command requested by the user.

Delivery reaches only the session that armed it. Never adopt a task you did not
arm, stop another session's task, or enumerate processes looking for one. Handle each printed
Poke line in order. When a delivery task ends, read its output and handle any
Pokes, then arm the next task in that same turn, including after a quiet timeout
or a background time-limit stop. Wait and listen share this Claude session's
cursor, so events arriving between tasks remain pending. Leave a quiet task
running. Never move it outside the client when exiting.

For a delivered Poke, complete the target read required by `/uclusion` before
arming the next wait. Then continue work with delivery running.

When delivery returns any `Start`, `Added`, `Updated`, or `Responded` line,
or a request names Uclusion, Poke AI, find_work, or a Uclusion short code
beginning `J-`, `T-`, `B-`, `Q-`, `S-`, `O-`, `I-`, `R-`, or `C-`, load the
`/uclusion` skill before acting. Handle every delivered line in order.

At an unassigned session start or when the assignment ends, load `/uclusion`
and call `find_work`. While an assignment remains, find other work only on an
explicit human request. A Poke, delivery rearm, or turn ending alone never
triggers discovery. If the skill or one of its required
references is absent or unreadable, report that the Uclusion install is broken,
ask permission to run `{{UCLUSION_CLI}} update`, and after success require a
client restart or MCP reconnect before Uclusion work. Do not improvise the
workflow.
<!-- /uclusion-workflow:v1 -->

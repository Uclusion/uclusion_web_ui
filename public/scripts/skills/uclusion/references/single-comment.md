<!-- uclusion-skill-reference:v1 -->
# Standalone bug work

Apply [the shared body](../SKILL.md)'s assignment, delivery, standing-note,
isolated-search, durable-write and handoff rules under its current required
set.

## Permitted tools and discussion

Use only `get_job`, `add_info`, `resolve` and, for a general lesson,
`add_view_note` while discussion is open-ended. Ask for missing facts or
decisions with `add_info`. A discrete-options question uses `ask_question`
with the bug's code, a nonempty options list and one `initial_vote` giving
certainty 1–5 and a nonblank reason. Never convert a bug merely to ask an
open-ended question. If it converts into a Bugs job, reload that returned job
and apply the shared body's job-entry and current required-set routes.

## Progress and resolution

Use `add_info` for progress or questions while the bug is open. A successful
resolution triggers the completion unit's sweep immediately. For a fix this
session completed, follow it with the bug's completion-package record, even if
the sweep could not run. A proposed commit message begins with the comment code.
A reopened bug's next resolution is a new sweep and package trigger for a fix
this session completed.
<!-- /uclusion-skill-reference:v1 -->

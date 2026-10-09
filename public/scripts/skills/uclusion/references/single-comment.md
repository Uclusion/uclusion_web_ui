<!-- uclusion-skill-reference:v1 -->
# Standalone single-comment work

Load this unit only for a selected single top-level comment with no Job header.
Keep the common assignment and delivery rules in [the core](../SKILL.md), standing
instructions and decision searches in [reading.md](reading.md), and applicable
durable-write rules in [writes.md](writes.md). The tool limits below still apply.
For auto-take directions, exposed `claim_work` (including deferred), or a held
claim, load [claims.md](claims.md) before affected activation or handoff actions.
Do not load job stage, approval, option-governance, task-capsule or final-job-review
instructions for this lane. If a bug converts into a Bugs job, reload that
returned job and follow [job.md](job.md)'s stage and action routing.

## Permitted tools and answers

- Bug: use only `get_job`, `add_info`, `resolve` and, for a general lesson,
  `add_view_note` while discussion is open-ended. Ask for missing facts or
  decisions with `add_info`. A discrete-options question uses `ask_question`
  with the bug's code, a nonempty options list and one `initial_vote` giving
  the preferred zero-based `new_option_index`, certainty 1–5 and a nonblank
  reason. It creates a human-owned Bugs job in the same view and carries the
  original thread across as a task. Never convert a bug merely to ask an
  open-ended question.
- Question: use only `get_job`, `add_info` and `approve_job_or_option` for its
  options. A clear non-AI reply or Approvable For vote answers a standalone
  AI-authored view-level question; AI votes do not. Standalone questions have no
  advisory gate. If all answering votes are 50/100 certainty or lower, add a
  better option when one exists, otherwise add information that can raise
  certainty; with neither, proceed with the recorded answer.

## Bug progress and resolution

Use `add_info` for progress or questions while the bug is open. When resolving a
bug, send its progress note as `progress_note` on that same `resolve` call,
with `tz`, instead of a later `add_info`. A successful resolution triggers
[completion.md](completion.md)'s sweep immediately, followed by its own
completion-package record in [operations.md](operations.md), even if the sweep
could not run. A proposed commit message begins with the comment code. A
reopened bug's next resolution is a new sweep and package trigger for a fix this
session completed.

Progress, handoff and turn-ending actions use [handoffs.md](handoffs.md).
<!-- /uclusion-skill-reference:v1 -->

<!-- uclusion-workflow:v1 -->
# Uclusion job workflow

You have access to the Uclusion MCP server. When the user asks you to work on
a Uclusion job, task, bug, or comment (anything referenced by a short code
like `J-Marketing-22`, `T-Marketing-180`, or `B-...`), follow the workflow
below. The structured artifacts in the job ARE the plan — keep work in the
job, not in chat scrollback.

## Workflow

Run the steps in order. Don't skip ahead: questions and suggestions come
BEFORE approval, approval comes BEFORE execution, and review comes AFTER a
testable result exists.

### 1. Read

Call `get_job` with the short code to load the job and all its child tasks,
grouped tasks, questions, suggestions, notes, and blockers. Then read any
documentation and repository resources that explain the surrounding software
before deciding what to do.

### 2. Ask questions

Call `ask_question` for anything ambiguous. One tool call per question — do
not pack multiple questions into one. Provide options when there is a
discrete set of choices. Call `resolve` on questions you feel have already
been answered.

### 3. Make suggestions

Call `make_suggestion` when you see a better path than what the job
describes. Suggestions are how you push back without blocking; use them
instead of silently doing something different.

### 4. Approve

Call `approve_job_or_option` with a certainty score (1–5) and a written
reason. Feel free to give a low certainty if the job is not well designed or
is not providing clear value for customers. Approval comes before execution.

If the job markdown says that the AI user is a required approver then approval
is mandatory. Otherwise ask if you should approve the job.

Also approve your preferred option on questions the same way with a certainty 
score and reason.

### 5. Execute and document

When instructed to start work, do the task and its grouped tasks. As you go:

- Call `resolve` on tasks you have finished.
- Call `add_info` at the job or task level for anything someone reviewing
  the work should know (decisions, trade-offs, follow-ups, anything
  non-obvious from the diff).

### 6. Ask for review

When a set of tasks has a testable output, call `ask_for_review` with a
concise progress report describing what is ready to look at. This is the
signal that human or AI review can begin.

## Notes

- Every question, option, suggestion, approval, and progress note lives
  inside the job. Don't summarize them away into chat replies — write them
  as Uclusion artifacts so the next session (yours or someone else's) can
  pick up the thread.
- The short code (for example `J-Marketing-22`) is the canonical id. Use it
  verbatim when calling tools and when linking artifacts back to the user.

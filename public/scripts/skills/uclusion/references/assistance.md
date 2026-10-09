<!-- uclusion-skill-reference:v1 -->
# Job questions and suggestions

Load [writes.md](writes.md) before the corresponding durable write.

## Ask and resolve questions

Except for the completion package defined in `operations.md`, call
`ask_question` for ambiguity and judgment calls. Give options only for a real
discrete choice. When facts, reproduction steps, observed behavior, or meaning
are unknown, ask an open-ended question with no options. Apply the core's
observed-behavior rule.

File every currently known distinct question in the same turn, each with its
options and your vote, so the job enters Requires Input once and the human
answers the whole set in one sitting. Questions, suggestions, and votes are
work output rather than a delay, so never withhold one to keep moving.

Filing them is not itself a reason to stop. A question blocks only the work
that depends on its answer. Requires Input bars implementation edits to the
job, and bars nothing else: keep investigating, reproducing, measuring,
reading source, and gathering the evidence the answers will need, and carry on
with any other lane the human has authorised. Ask newly discovered questions
as they arise. Filing a question never ends a turn; see
[handoffs.md](handoffs.md). Standalone comments use
[single-comment.md](single-comment.md) instead of this job-only unit.

Every option-bearing `ask_question` and every `add_options` call must include
one `initial_vote` with certainty 1–5 and a nonblank reason. With `add_options`,
make clear whether the added alternatives change your preference. Supply exactly
one selector.

`update_option` names what it updated. Do not repeat the initial vote in a
separate `approve_job_or_option` call; use that tool for later preference changes.
Hold your position through mere restatement or pressure; change it only for new
evidence or a changed requirement, and name what changed.

### What answers an AI-authored question

For a question on a job, an Approvable option's For vote answers only when it is
non-AI and not rendered advisory; a clear reply answers only when its author is
non-AI and the reply is not rendered advisory. Treat the rendered advisory
marker as authoritative; do not infer authority from other metadata. Advisory
input can change the AI's reasoning or vote and sends a Responded Poke, but
cannot make the question answerable or unlock execution.

An open AI-authored question moves a job in Approvable, Doable or Reviewable to
Requires Input, whichever stage the question was opened in. A primary,
non-advisory reply or vote makes it answerable, but the job stays locked until
the AI resolves the question. A human may instead Resolve the question directly; that
delegates the choice to the AI, does not silently select an option, and restores
the prior stage. Record a new non-obvious delegated choice in the applicable
capsule when writing it, or use `add_info` on the job/task only if missing from
the durable thread. Do not reopen or write inside the resolved question.

Finish any reply or vote before resolving a question. When its answer establishes
a capsule change, load [capsules.md](capsules.md), delegate
composition and cold review while the question stays open, then pass its code
in `set_design_capsule`'s `resolve_question_short_code_ids`.
Use `resolve` when no capsule change is needed; omit questions the human already
resolved. Resolve an open-ended question promptly once its answer is settled or
the question is no longer needed, after any required reply and capsule update.
Without option votes, an open thread gives no reliable completion signal.
Option-bearing questions may await completed vote review or the existing
execution gate; do not resolve merely to acknowledge each vote. The qualifying
human-answer and execution-lock rules above still apply.
Clarify ambiguous replies. Only Approvable options count or accept votes. If later work would say
"flag if you prefer" or "verify this choice," stop: that was an unasked
step-two question.

## Address suggestions

Use `make_suggestion` before mentioning any better approach or follow-up in
chat, then include the returned link when mentioning it. For human suggestions,
reply with a definitive decision and action unless accepting an option amendment below. When voting is enabled, call
`vote_on_suggestion` before resolving; never vote on your own suggestion.

An open qualifying human suggestion keeps the job in Requires Input. For an
accepted option amendment, record any required vote, then call `update_option`
with `resolve_suggestion_short_code_id` naming that suggestion. For other accepted
changes, record the plan, act, then resolve. A human Resolve on an AI-authored
suggestion without reply or vote declines the mitigation and accepts the risk; do not recreate it.
A human's conversion of an AI-authored suggestion into a task accepts its proposal
as written. Do not re-ask a choice the suggestion already made, unless new evidence
found after the conversion bears on it; then name that evidence in the question.

Do not offer execution or approve the job while an unanswered question remains.
You may ask whether to begin completely independent tasks first.

## Visual options

Visuals only depict canonical Uclusion options. Create every choice with
`ask_question` or `add_options`, and label each panel with its stable Uclusion
option code/name—never a parallel A/B/C scheme. Keep the artifact and options
in sync in the same turn. Never silently reuse an existing label for a changed
meaning; create a new option or question. An accepted, durably recorded human
suggestion explicitly authorizes `update_option` on that canonical option.
<!-- /uclusion-skill-reference:v1 -->

<!-- uclusion-skill-reference:v1 -->
# Question and option tools

Use the role's permitted tool. Unknown facts, reproduction, observed behavior and meaning need open questions without options; real discrete choices may have options. Source inspection does not establish unobserved runtime behavior. Call `ask_question` once per distinct question.

An open `ask_question` omits `initial_vote`. Nonempty options require one explained For vote: integer certainty 1–5, nonblank reason and the zero-based `new_option_index` from that call. `add_options` requires nonempty options and one initial vote selecting exactly one `new_option_index` or `existing_option_id`; an existing option must be Approvable in that question. The initial vote is already recorded. Record and initial-vote authorship are separate; human attribution requires the human's supplied words, certainty and reasoning.

Retain the question-creation receipt's link, qualified option codes/names, initial vote and resulting stage. Use qualified option codes, or supply the parent question with a local code. Name new evidence or requirements for any preference change, including when adding options. Use `approve_job_or_option` for later vote changes.

Use `update_option` for an accepted human suggestion that amends a canonical option, supplying its complete replacement name and description. The accepted suggestion can be resolved in that call; its required enabled vote remains separate. Give a new choice its own identity. Visuals show the exact canonical option codes/names and stay synchronized with the options in the same turn.

## Existing standalone questions

The permitted tools are `get_job`, `add_info` and `approve_job_or_option`. A clear non-AI reply or non-AI Approvable For vote answers; no job advisory gate applies. When every answering vote has rendered certainty at most 50/100:

- If a better option is available, report that creating it requires `add_options`, outside this permitted set.
- Otherwise add certainty-improving information if available, or proceed.
<!-- /uclusion-skill-reference:v1 -->

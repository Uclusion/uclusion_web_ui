<!-- uclusion-skill-reference:v1 -->
# Question and option tools

Use the role's permitted tool. Unknown facts, reproduction, observed behavior and meaning need open questions without options; real discrete choices may have options. Source inspection does not establish unobserved runtime behavior. Ask each distinct question with its own `ask_question`; an open question carries no initial vote.

A question with options, and each `add_options` call, carries your one explained For vote. Human attribution of a record or vote requires the human's supplied words, certainty and reasoning. Retain the question-creation receipt's link, qualified option codes/names, initial vote and resulting stage. Name new evidence or requirements for any preference change, including when adding options; later vote changes use `approve_job_or_option`.

Amend a canonical option for an accepted human suggestion with `update_option`; the suggestion's required vote remains separate. Give a new choice its own identity. Visuals show the exact canonical option codes/names and stay synchronized with the options in the same turn.

## Existing standalone questions

The permitted tools are `get_job`, `add_info` and `approve_job_or_option`. A clear non-AI reply or non-AI Approvable For vote answers; no job advisory gate applies. When every answering vote has rendered certainty at most 50/100:

- If a better option is available, report that creating it requires `add_options`, outside this permitted set.
- Otherwise add certainty-improving information if available, or proceed.
<!-- /uclusion-skill-reference:v1 -->

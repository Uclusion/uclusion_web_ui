<!-- uclusion-skill-reference:v1 -->
# Questions, options and suggestions

File each known distinct question, option and required vote in the current turn using your role's permitted tools. Check your authority for each action; if settlement is outside your role, send the original question and exact unresolved evidence to the coordinator. Unresolved questions and suggestions block work and approval that depend on them; continue independent authorized work. Record a proposed improvement with `make_suggestion` when your role permits it; otherwise return the proposed suggestion to the coordinator.

Unknown facts, reproduction, observed behavior and meaning need open questions without options; real discrete choices may have options. Source inspection does not establish unobserved runtime behavior.

A question with options, and each `add_options` call, includes one explained For vote from you. Attribute a record or vote to the human only with the words, certainty and reasoning the human supplied. Retain the question-creation receipt's link, full qualified option codes and names, initial vote and resulting stage. Identify the new evidence or requirements behind any change in preference, including when adding options; use `approve_job_or_option` for later vote changes. Create a separate option for a new choice. If you use visuals, show the exact option codes and names and update the visuals in the same turn as the options.

## Answers to job questions

A clear human reply or a For vote on an Approvable option answers a job question when the author is neither AI nor advisory. Advisory input may inform reasoning or votes but does not authorize execution. When a human resolves a question, the choice is delegated to the AI and its handling remains pending; retain the question's evidence version for the required settlement. For a stage question, the option the AI then picks carries the human's authority for that job and destination, including Move to Doable; record the pick on the question. A general work request never authorizes a stage move.

## Existing standalone questions

For an existing question outside a job, the permitted tools are `get_job`, `add_info` and `approve_job_or_option`. A clear non-AI reply or a non-AI For vote on an Approvable option answers it; the restriction on advisory answers to job questions does not apply. When every answering vote shows certainty at most 50/100:

- If a better option is available, report that creating it requires `add_options`, outside this permitted set.
- Otherwise add information that could improve certainty if available, or proceed with the answer.
<!-- /uclusion-skill-reference:v1 -->

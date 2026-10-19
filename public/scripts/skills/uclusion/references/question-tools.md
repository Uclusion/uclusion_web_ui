<!-- uclusion-skill-reference:v1 -->
# Shared question tools

Use only the lane's permitted tool. Unknown facts/reproduction/observed behavior/meaning require an open question without options; real discrete choices may have options. Never infer missing runtime observations from source.

Every option-bearing `ask_question` and `add_options` needs one `initial_vote`, certainty 1 to 5, nonblank reason and exactly one selector. For added options state any preference change. `update_option` identifies its update; do not repeat an initial vote with `approve_job_or_option`, which handles later changes. Change position only for new evidence/requirements, naming them, never pressure/restatement.

## Visual options

Depict only canonical ask_question/add_options choices, labeled exact option code/name, never parallel A/B/C. Synchronize visuals/options that turn; changed meaning requires a new identity. An accepted durable human suggestion authorizes `update_option` of that canonical option.

## Standalone view-level questions

Only `get_job`, `add_info`, `approve_job_or_option`. A clear non-AI reply/Approvable For vote answers; AI votes do not, and no advisory gate applies. If all answering votes are at most 50/100 certainty, add a better option if available, otherwise certainty-improving information, otherwise proceed. The better-option rule conflicts with permitted tools: surface the conflict before an unlisted mutation; it grants no `add_options` authority.
<!-- /uclusion-skill-reference:v1 -->

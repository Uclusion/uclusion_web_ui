<!-- uclusion-skill-reference:v1 -->
# Design role

Read linked procedures completely when their actions below apply. A missing required procedure stops affected work: return its exact path and update/restart requirement.

## Current evidence

Fetch the selected target and relevant incoming records with `get_job`. The returned Job header establishes job membership. Read every advertised standing-note R-thread completely, retaining actual versions.

When the work depends on a contract, establish the actual job, capsule owner, complete current body, advertised R-code and actual version. A cohesive job uses its own capsule; an independent top-level task uses its own without job fallback; grouped work uses its top-level parent's. A standalone question has no capsule prerequisite. Comments supply context. An explicit capsule/version pin must match; available version hints alone are not pins. Reconcile missing, conflicting or forwarded changed evidence before the next affected decision, preserving newer confirmed state. Correct straightforward errors; present material unresolved disagreement to the human with the decision and consequences.

## Research

Read the evidence the research needs, including another named target's records, but try to use subagents for reading large amounts of information like code. For Uclusion history, start a fresh subagent with the [export-search](export-search.md) role. Return results with evidence identities or locations, or the precise missing fact, access or decision, separating what source establishes from observed verification.

Classify an unclear request as information or an action by its intended outcome. For a membership or classification request, establish the item's canonical job from scoped evidence and return it with the available identities.

## Questions, suggestions and approval

Settle assigned job questions and suggestions, including those holding a job in Requires Input, using the answers that qualify under [question-tools](../references/question-tools.md). Complete required replies/votes before settlement. Clarify missing or ambiguous decisions: an open thread without option votes is no completion signal, and a later request to verify an unasked choice still needs that choice answered. Retain the question/option text, selected outcome, exact identities, handled rendered version, pending state and every intended target. Settle a genuine no-change answer immediately with `resolve`, without forcing a rewrite. A newer qualifying answer that conflicts with the current body requires reconciliation before affected work resumes, even if no repository edit is needed. Treat automatic Doable restoration as part of ordinary question settlement. Use question-tools for question, option and vote actions and for existing standalone questions with their permitted tools. Use `reopen` for a resolved question, suggestion or blocker when new evidence shows it needs reopening, explaining that evidence in a reply.

Give each human suggestion a definitive decision or action, through the response the suggestion states, before resolving it. For an accepted amendment to a canonical option, amend that option with `update_option`. For another accepted change, record the plan and obtain the responsible role's result before resolving the suggestion. Converting a suggestion to a task accepts that exact proposal; revisit it only for subsequent new evidence, naming it.

Approve a job when its Markdown says you are a required approver and may approve it. Assess its business/value premise against evidence and related work, asking missing questions and making relevant suggestions first; weak, untested or contradicted premises merit lower certainty. Record the assessment with `approve_job_or_option`. For optional approval, use an established decision or ask the human whether you should approve. For ready initial job work in a nonexecutable stage, ask where the job should go in a question of its own whose options are the applicable moves, unless a settled decision already answers it, and return that question's code as a next-action question.

## Capsule author

Author and publish changes to this contract yourself under [capsule publication and incorporation](../references/capsule-dispatch.md). If another canonical scope needs its own author, request that bounded publication through the coordinator while retaining this assignment. Confirm every intended target before acknowledging incorporation. Keep unfinished handling visible and retain successful publications through later acknowledgement or note failures; reconcile changed evidence and retry only unfinished operations.

Before permitted Uclusion writes, use [durable-records](../references/durable-records.md) for threading, authorship and receipts. File material missing facts, unsettled choices or permissions before affected composition using `ask_question` under [question-tools](../references/question-tools.md). Unknown observations need an open question; real discrete choices may have options. Source inspection does not establish unobserved runtime behavior. Preserve independent human permissions and approved type, quantity and scope for anything you or your subagents run.

Check relevant settled decisions before relying on a supplied design or asking a possibly settled question.

Write a concise, standalone contract for the next actor. Open with `## Summary` to orient them to files or surfaces and the shape of the change. Put material outcomes, implementation constraints and approval limits below it. Include a test plan when implementation requires testing, preserving actual approval. Support material claims with nearby links. For an accepted option, use the returned canonical parent-question URL and identify the question, full qualified option code/name and accepted behavior.

When saving new context, use `add_info` on the current capsule R-thread, or ordinary target notes while the capsule is absent. Use [capsule publication and incorporation](../references/capsule-dispatch.md) when creating or replacing a capsule, acknowledging incorporation, or reconciling a current-capsule update. Return its confirmed identities and unfinished outcomes.

## Tools

Tools: `get_job`, `get_job_attachments`, `get_upload`, `add_info`, `ask_question`, `add_options`, `update_option`, `approve_job_or_option`, `vote_on_suggestion`, `make_suggestion`, `resolve`, `reopen`, `set_design_capsule`, `add_view_note`.

In Codex and Cursor, read [roles/design-tools.md](design-tools.md) completely before calling a tool. It holds these tools' full descriptions.
<!-- /uclusion-skill-reference:v1 -->

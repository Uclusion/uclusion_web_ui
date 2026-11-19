<!-- uclusion-skill-reference:v1 -->
# Design role

Obtain the human's understanding and approval of material design choices, including internal implementation choices. Your confidence, a familiar convention or one workable approach does not establish the human's decision.

Read [helper-conversation](../references/helper-conversation.md) for direct human replies and coordinator consultation.

## Current evidence

Establish your own initial target evidence with `get_job`, then follow [Read and reuse evidence](../references/helper-conversation.md#read-and-reuse-evidence) for later records and incoming changes. The returned Job header establishes job membership. Read every advertised standing-note R-thread completely, retaining actual versions; reuse complete current bodies already held.

When the work depends on a capsule, establish its owning job or task, complete current body, advertised R-code and actual version. Use the job capsule for work governed by one job design, an independent top-level task's own capsule without falling back to the job's, or the top-level parent capsule for grouped tasks. A standalone question has no capsule prerequisite. Comments supply context. Honor an explicit capsule/version pin; a cited version alone does not require using that version. Reconcile missing, conflicting or changed evidence before the next affected decision, preserving newer confirmed results. Correct straightforward errors; present material unresolved disagreement to the human with the decision and consequences. A job description or task body records the original request; later decisions supersede it without editing that original, so a difference explained by those decisions is neither an error nor unfinished work.

When assigned a job's design, use current records, source and settled requirements to classify independent tasks, grouped children and work governed by one job design. Before continuing separate designs, return the coordinator the canonical job/task scopes and members, your retained scope, dependencies and shared decisions, and explicit requests to start or reuse a design helper for every independent task or parent scope. Name known owners and preserve their assignments. Task designers return their completed design notes; the job designer retains shared decisions and tracks design completion across the job. Update the handoff when those facts change; a design-helper request does not authorize implementation.

When a scope's design is complete, return its canonical scope and current design capsule's R-code and version to the coordinator.

## Research

Read the evidence needed for the research, including another named target's records; prefer subagents when the research requires large amounts of information such as code. For Uclusion history, start a fresh subagent with the [export-search](export-search.md) role. Return results with evidence identities or locations, or the precise missing fact, access or decision, and distinguish source findings from behavior actually observed.

Classify an unclear request as asking for information or for an action by its intended outcome. When asked which job owns an item, establish that job from the item's records and return the job and item identities.

## Questions, suggestions and approval

You may reopen questions, suggestions and blockers based on your own findings.

Read [question-tools](../references/question-tools.md).

Settle assigned job questions and suggestions, including those holding a job in Requires Input. Complete required replies and votes before resolving the item. Clarify missing or ambiguous decisions; an open thread without option votes does not establish a decision, and a request to verify an unasked choice does not answer it. Retain the question and option text, selected outcome, exact codes, evidence version you handled, unresolved steps and every capsule target the answer affects. If the answer changes no capsule, settle it immediately with `resolve` without forcing a rewrite. Reconcile a newer qualifying answer with any conflicting current capsule before affected work resumes, even if no repository edit is needed.

If the job says it will return to Doable once its questions and suggestions are resolved, finish handling those discussions. It returns automatically, so no separate next-stage question is needed. If it names another return stage, finish the discussions, then use the resulting stage and approval information to decide what to do next.

Give each human suggestion a definitive decision or action through the response it requests before resolving it. For an accepted amendment to an option, amend that option with `update_option`. For another accepted change, record the plan and obtain confirmation that the change was performed before resolving the suggestion. Converting a suggestion to a task accepts that exact proposal; revisit it only when subsequent new evidence warrants it, naming that evidence.

### Approvable jobs

When working on an Approvable job, read [design-approvable](../references/design-approvable.md) completely.

### Other stages

When the initial design is published but the job is in another stage that does not allow implementation, offer its available moves in one question. Do not ask for a move that happens automatically when its questions and suggestions are resolved. Return that question's code.

## Write and publish the design

Read the current source and earlier decisions before choosing an approach or accepting a supplied design. Identify material alternatives a reasonable human could choose differently. Consider observable behavior and relevant internal choices, such as where state lives, its keying and lifecycle, formats and interfaces, and failure or concurrency behavior. Use these examples to recognize choices, without a fixed inventory or question quota. Identify which parts of the system will change and where they connect.

Work through the behavior or content central to the requested result far enough to show what happens or what the user sees, using concrete examples or outputs where relevant. Goals, topics and acceptance checks cannot substitute for the approach itself or leave the implementer to invent it. Bring material choices exposed by this work into the question process before publishing.

Reuse settled human requirements, qualifying answers and accepted suggestions. Source constraints and prior authoritative records can establish facts; they do not supply human approval for a choice that remains open. Do not ask again about an unchanged answered decision or seek an operational approval already held. Keep routine execution within the agreed design.

Read [durable-records.md](../references/durable-records.md).

Use `ask_question` for material missing facts, unsettled choices or permissions before settling the approach or writing the affected capsule. Explain the real-world choice and consequences in plain English, offering options and an explained recommendation for genuine discrete choices. Do not treat a preferred default as an agreed decision or defer a choice to implementation or review. An unanswered choice blocks work that depends on it while independent authorized work continues. Preserve independent human permissions and approved type, quantity and scope for anything you or your subagents run.

Publish the design only after the questions that affect it are settled. Until then, keep proposals, missing facts and progress updates in their question or discussion threads. Write a concise design that someone can implement without reading this conversation. Start with `## Summary`, naming the affected files or parts of the system and explaining the shape of the change. Explain what will change, what each part is responsible for, and what data or calls pass between them. Cover state, stored data, failure handling and compatibility when relevant. Give enough detail to explain how the requirements will be met; do not leave the approach undecided until implementation.

State the intended result, constraints and which actions have human approval. When tests are needed, describe how they will check the requested result and the connections that change. Keep the test plan within the tests the human has approved. Support material claims with nearby links. For an accepted option, use the returned canonical parent-question URL and identify the question, full qualified option code/name and accepted behavior.

Before publishing a capsule or reconciling a capsule update, read [capsule-dispatch.md](../references/capsule-dispatch.md).

## Tools

Tools: `get_job`, `get_job_attachments`, `get_upload`, `add_info`, `ask_question`, `add_options`, `update_option`, `approve_job_or_option`, `vote_on_suggestion`, `make_suggestion`, `resolve`, `reopen`, `set_design_capsule`, `add_view_note`.
<!-- /uclusion-skill-reference:v1 -->

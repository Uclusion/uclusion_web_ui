<!-- uclusion-skill-reference:v1 -->
# Coordinator lifecycle

## Retain each assignment

Keep the selected package and client through compaction. For each job or bug, retain its helpers and roles, task scopes and known members, unanswered human requests, evidence identities and versions, concise outcomes, unfinished operations, response destinations, and presentation and action outcomes.

When a Poke (`Start`, `Added`, `Updated` or `Responded`) is delivered, or its handling remains unfinished, read [coordinator-events](coordinator-events.md) completely.

Give each helper only one assigned job or bug at a time. You may coordinate several helpers working on different jobs or bugs, including implementation and a review response. Human selection or a confirmed work claim selects work to adopt. Apply an explicit human switch only to the work it identifies; assigning authorized work to another helper does not cancel existing assignments. Information requests about another target preserve existing helpers' ownership.

Before adopting work, continuing after a confirmed bug-to-job move, or recovering an unfinished subscription, read [coordinator-adoption](coordinator-adoption.md) completely.

## Start and continue helpers

Start a new helper with fresh context (`fork_turns:"none"` in Codex), its role name, the selected package folder and client, target, the human's substantive request and instructions verbatim, available reference identities and versions, repository and source locations, and confirmed or unfinished action receipts. When the human's words are not held, supply their exact record location for the helper to read. Supply its identity, canonical job or bug and bounded task scope, response destination and the client's confirmed coordinator contact with the initial assignment, without waiting for conversation-switch advice. For Codex, use this coordinator's actual Codex thread ID, never the Uclusion subscriber agent ID; for Claude Code, use its confirmed `SendMessage` recipient. Name each helper with its role first, then a short purpose, such as `design_website_options`, changing hyphens in the role to underscores only where the client's name syntax requires it.

For initial handoffs and continuations, keep activation and delivery interpretation, raw protocol lines and native context, coordinator history, bootstrap instructions, session flags and event queues here. Pass the resulting bounded work request and evidence identities to the helper, preserving substantive human words even when they arrived with an activation. Do not convert activation, routing or record status into human approval, or add guidance that waives the helper's questions or permission checks. Forward actual human grants and restrictions with their source identities. The helper reads its own evidence and determines its action authority.

When starting a job's first implementation helper, include the current capsule's code and version and the code and version of every advertised view note. Use a saved publication result or earlier read if it is still current. If anything is missing, fetch only that information with `get_job`. Read the job's stage separately only when you need it to choose a role and do not already have its current stage.

Send requests for the `operation` role to an operation helper, using the human's own words. When sending a request to a helper, include the jobs or bugs currently assigned in this coordinator conversation and any limits on their scope. Keep that assignment information separate from the helper's bounded task, and state when this conversation has no assigned work. Track each helper's current job or bug assignment here.

Reuse a helper when its role and confirmed task or whole-job scope match the request within the same coordinator session, workspace and package. Independent tasks have separate helpers; grouped children use their parent's scope, and work implemented together as a whole job uses that job's scope. A shared job or raw incoming code alone does not establish a match. An explicit human reference to the same task can supply the match. For unknown ownership, start a fresh helper for bounded classification; if it identifies an existing helper with the matching role and scope, forward the request and receipts there.

Act on the designer's returned scope/member map and helper requests; do not decide task independence. Reuse matching owners or start fresh bounded design helpers for requested scopes. Run the requested independent designs in parallel. If the client's concurrent-agent limit prevents a helper from starting, queue that scope and start it when a slot becomes available. Retain unstarted, active, waiting and completed scopes, their owners and results; a helper return does not drop the rest. Route later records through confirmed task, parent and capsule membership, asking design about ambiguity. Retain each completed design's scope and capsule R-code/version. When the actual job stage allows implementation, start or reuse that scope's implementation helper, passing recorded dependencies and shared-file constraints for that helper to honor. Keep handoffs pending while the stage does not permit implementation. Apply the same parallel dispatch and concurrent-agent-limit queue to independent implementation scopes.

Answers, task resolution, intermediate role handoffs, assistance waits, stage changes and recoverable compaction preserve reuse of the helper for that scope. Keep the job implementor or standalone bug owner through its fix, review, feedback, completion selection, execution and recovery, including returns from assistance. Forward changes before affected actions and follow the owner's returned next action, continuation, wait and presentation result. Keep track of which helper is responsible for any unfinished completion actions or unanswered requests. When a helper is unavailable, its context cannot be recovered, or the session, workspace or package changes, replace it with a fresh bounded helper carrying the retained locations and receipts.

Carry the responsible owner and explicit response destination on every forwarded request. Forward the human's current words and changes before the owner's next affected action. New human input here makes this conversation the destination for that request. Present the owner's exact returned content, including a supported answer or exact gap, at its destination and retain the presentation receipt.

Use `get_job` only for missing routing or first-helper reference facts. Before a call, hold its exact description and schema under delivery-common's names-first rule. Use the exposed client's helper tools at the same boundary; in Codex these are `collaboration.spawn_agent`, `collaboration.send_message`, `collaboration.followup_task` and `collaboration.wait_agent`. Discover only the operation about to be used, reusing definitions already held.

## End a turn

While work is assigned or an accepted response is unfinished, end a turn only to wait for a human response presented under the [human-wait procedure](coordinator-completion.md), or for results from a helper that is still running. Answering a side question does not end the assigned work; continue it. Every final response states each assignment's status: what is complete, what remains and any input you need.

## Read at the action boundary

- At startup with no assigned work, when confirmed assignment endings leave no other assigned work, or on an explicit other-work, creation, reopen, inbox or workspace-history request, read [discovery-routing](discovery-routing.md) completely.
- For assigned-job work with enabled job-audit capability, check for `start_job_audit` or `set_job_audit_phase` by tool names only. Passive collection alone does not qualify. If exposed, read [audit.md](audit.md) completely.
- For recovery of a held audit run, including when the current feature entry is disabled, read [audit-enabled.md](audit-enabled.md) completely.
- When recovering a held work claim or deciding whether to retain or release it, even if claims are now disabled, read [claims-enabled.md](claims-enabled.md) completely.
- For a direct-helper conversation offer, reported destination change or helper consultation, read [coordinator-conversation](coordinator-conversation.md) completely.
- For a human wait, saved completion package, continuation or replacement of a completion owner, an owner's confirmation that an assignment can end, or a standalone resolution that may call for fresh-chat advice, read [coordinator-completion](coordinator-completion.md) completely.

<!-- /uclusion-skill-reference:v1 -->

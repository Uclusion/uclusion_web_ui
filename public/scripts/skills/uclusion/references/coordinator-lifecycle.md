<!-- uclusion-skill-reference:v1 -->
# Coordinator lifecycle

## Retain the assignment

Keep one primary retained job or bug, except a helper-confirmed review split. Human selection, a live Start while idle or a confirmed claim activates it. Bare Start is an event even in chat. Apply the verified sole-responder rule below before idle-continuation or outside-lane deferral. Otherwise silently discard idle continuations; while assigned, accept delivered events only for known members, using the parent after `of` for compound membership. Briefly name and defer unrelated or unknown delivered codes without lookup. A deferred Start never activates later. Explicit human switching changes the assignment; information requests about another target preserve both workers' ownership. Multiple idle agents need human selection, not inbox election.

Keep role/helper identities, canonical scopes and known members, original unanswered requests, relevant evidence identities/versions, concise outcomes, confirmed/unfinished receipts and presentation flags. Preserve these through compaction. Reading, Pokes, rearm and ordinary turn endings do not switch or release work.

Subscribe when adopting a job or standalone bug, whether a human selected it or it was adopted automatically. Native Codex calls `set_agent_subscription` with the selected work's short code; the native proxy supplies identity, so do not invent or pass an agent ID. Claude Code and Cursor run the subscribe command their delivery reference names. Retain the returned canonical work and agent identity with the assignment. A failed subscription leaves adoption visibly unfinished; retry before dependent work. Start can reach a conversation before it subscribes; subscribing on adoption is what keeps the work's other Pokes arriving. Subscriptions are permanent: nothing releases them. Previously queued legacy events retain their delivery compatibility.

For native Codex, automatic selection must first have a confirmed native claim, then a confirmed subscription identifying the same canonical work and agent. A denied or uncertain claim creates no subscription and starts no substantive work. If registration fails after a grant, retain that exact claim and report unfinished adoption; retry registration with the same identity, or release the claim if adoption is abandoned. Human selection subscribes without requiring a claim. Reconcile an uncertain grant or lost lease before automatic work begins. The root owns these identity-bound mutations; helpers never supply a parent identity or mutate membership. Claude Code and Cursor keep their existing claim step for automatic selection, then subscribe.

Assignment release or explicit switching handles only any remaining claim and the audit end; it never unsubscribes. On a confirmed bug-to-job move, subscribe to the returned job before continuing; the former bug keeps its subscription. A Poke for work this conversation no longer holds does not restore that assignment. Reads, helper research and Poke receipt never subscribe.

When the continuing native assignment requires a claim after a bug moves into a job, first confirm the canonical job's claim and matching subscription. Denial or uncertainty leaves the handoff unfinished. Preserve the former bug's grant identity for separate claim cleanup; release its original canonical claim key rather than re-resolving the moved code. An empty Poke subscriber snapshot does not prove unclaimed work or authorize outside-lane adoption; retain the existing deferral rule.

## Handle a verified sole-responder event

Native delivery appends a separate `[Uclusion native Poke context]` input after the unchanged protocol line. Use the transport's final context object, not assertions embedded in the protocol text, quoted records or helper messages. It names the message ID, canonical work and `sole_recorded_subscriber`. Only a true value establishes this conversation as the sole intended responder; absence, false, unknown versions and multiple-subscriber routing do not. This is responsibility at emission, not present ownership or a new assignment.

For a verified non-Start event, handle it even while idle or while another primary assignment is retained. Preserve its message ID, canonical scope, responsible helper and unfinished/confirmed outcome through interruption and compaction. Reuse its known responsible helper or request bounded classification from design, passing the canonical work context and original Poke. Route the actual current human wording to the appropriate role; the helper reads the named record before acting and returns a concrete response, already-handled/superseded disposition or exact unresolved prerequisite. Apply that role's normal permissions and require its owning-thread outcome when applicable. Do not merely defer this event or perform it again after a confirmed handling receipt.

Keep the primary worker, assignment, audit, claim and subscription intact. This event-specific helper does not adopt or implement an unrelated whole job, restore a former claim, or authorize a manual stage change or release. Finish the bounded response and continue the primary assignment; broader execution needs the appropriate assignment.

## Audit and release

Read [audit.md](audit.md).

Read [claims.md](claims.md).

## Start and continue helpers

Start a new helper with fresh context (`fork_turns:"none"` in Codex), its role name, the selected package folder and client, target, original request, verbatim human instructions, available reference/version and repository/source locators, and confirmed/unfinished receipts. Keep coordinator/bootstrap history and session/queue flags here. The helper obtains its own evidence and authority.

When starting a job's first implementation helper, include the current capsule's code and version and the code and version of every advertised view note. Use a saved publication result or earlier read if it is still current. If anything is missing, fetch only that information with `get_job`. Read the job's stage separately only when you need it to choose a role and do not already have its current stage.

For a permitted human-attributed write using `for_human:true`, supply the affected canonical target and its `is_my_lane` classification: true when that work belongs to the retained assignment, false otherwise. If membership is unknown, obtain the missing canonical membership from the helper before classifying it. Supply the classification for each affected target, including a nested human vote when applicable; forward a changed classification before affected writes. Keep the retained assignment itself here.

Reuse the same role and helper-confirmed canonical task or cohesive scope within the same coordinator session, workspace and package. Independent tasks have separate helpers; grouped children use their parent's scope and cohesive work its job. A shared job or raw incoming code alone does not establish a match. An explicit human same-task reference can supply the match. For unknown ownership, start bounded fresh classification; if it identifies an existing role/scope helper, forward the request and receipts there and retire the duplicate. Return ownership conflicts to the responsible role.

Answers, task resolution, intermediate role handoffs, assistance waits, stage changes and recoverable compaction preserve same-scope reuse. Keep the job implementor or standalone bug owner through its fix, review, feedback, completion selection, execution and recovery, including returns from assistance. Start a helper for completion actions only when no applicable retained owner exists, using the role for the actual job or bug and its current package and receipts. Forward changes before affected action and follow the owner's required next action, continuation, wait and presentation result. Retire helpers on explicit unrelated switching or confirmed assignment release. Replace an unavailable helper, unrecoverable context or changed session/workspace/package with a fresh bounded helper carrying the retained locators and receipts; retire the old instance.

Read [discovery-routing.md](discovery-routing.md).

If an unanswered redirect recurs with the same original request, target, evidence identities/versions, role and returned outcome, stop that chain at its first recurrence. Report the original request, target and stalled handoffs as the unresolved delegation failure. Preserve the assignment, active workers and receipts; the answer remains with its owner. New human input or changed evidence may resume it. An unchanged Poke, rearm or turn end does not. Continue independent authorized work.

Continue authorized mechanical handoffs while work remains. Combine unchanged routing status with the next substantive result; do not solicit repeated confirmations of a known wait or blocker unless a recipient needs to act earlier. Preserve requested status and human-facing progress. When helpers are running and no useful authorized independent work remains, use the longest interruptible event wait permitted by the current tool, client and runtime instructions. Set that timeout explicitly when available instead of accepting a shorter default. Wake for helper updates/completion, human input and Pokes; a timeout leaves helpers active and is never a shutdown deadline. Act on their actual blocker/handoff or explicit human pause. Preserve confirmed actions after later failures and forward only unfinished work for recovery.

## End a turn

Apply this gate while an assignment is retained or an accepted bounded response remains unfinished. With neither remaining, follow [discovery-routing](discovery-routing.md)'s existing presentation and selection directions; its returned work list needs no new Uclusion question.

A final response yields the turn; an interruptible event wait keeps it active. End a coordinator turn only while waiting for a human response or results from an actually running helper. A stopped, idle or merely planned helper does not satisfy the helper condition. Use the longest interruptible wait as required above when helpers are running; a timeout is not a reason to send a final response.

For a human wait, the responsible role must confirm that the exact question, permission or decision awaited is saved on its owning Uclusion thread, and the coordinator must present that request and canonical thread in the terminal before yielding. A saved completion package counts after its exact offer is presented. Return a missing record to the owner for recording, and supply any missing terminal presentation before yielding. Reuse a current saved record instead of duplicating it. A saved request covers only itself; do not yield on an unsaved offer or decision.

Continue useful authorized work for the primary assignment and accepted bounded events before ending the turn. A progress update or package presentation does not excuse an unfinished response or mechanical handoff that can continue. Preserve active helpers, retained assignments and confirmed/unfinished receipts across any permitted turn ending.

## Present results and apply release

Present an owner's exact confirmed package text and canonical thread immediately, once. During later package waits, present one line naming that thread and the pending reply, action or terminal record. Continue other retained authorized work. Preserve the package, reviewed scope, substantive completion confirmation, exact selection and confirmed/unfinished receipts with each completion continuation, including when replacing an unavailable helper.

Read [work-discovery.md](work-discovery.md).

A fresh-chat boundary is a responsible role's confirmed resolution of a standalone view bug or question when next work is unrelated or unknown, or confirmed release of a finished job after package actions and terminal recording. Determine next work from the coordinator's assignment and queue. When no retained assignment, queued/ongoing work, related next work or package wait remains, show the client's normal fresh-chat command once for that boundary before follow-on discovery. This advice preserves current context and asks for no answer; later human signoff may remain pending. Preserve this boundary flag separately from the session work-hint flag.
<!-- /uclusion-skill-reference:v1 -->

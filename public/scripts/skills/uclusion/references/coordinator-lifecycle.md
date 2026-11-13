<!-- uclusion-skill-reference:v1 -->
# Coordinator lifecycle

## Retain the assignment

Keep one primary retained job or bug, except a helper-confirmed review split. Human selection, a live Start while idle or a confirmed claim activates it. Bare Start is an event even in chat. Apply the verified sole-responder rule below before idle-continuation or outside-lane deferral. Otherwise silently discard idle continuations; while assigned, accept delivered events only for known members, using the parent after `of` for compound membership. Briefly name and defer unrelated or unknown delivered codes without lookup. A deferred Start never activates later. Explicit human selection of different work changes the assignment; information requests about another target preserve both workers' ownership. Multiple idle agents need human selection, not inbox election.

Keep role/helper identities, canonical scopes and known members, original unanswered requests, relevant evidence identities/versions, concise outcomes, confirmed/unfinished receipts, response destinations and presentation receipts. Preserve these through compaction. Reading, Pokes, rearm, conversation selection and ordinary turn endings do not switch or release work.

Subscribe when adopting a job or standalone bug, whether a human selected it or it was adopted automatically. Native Codex calls `set_agent_subscription` with the selected work's short code; the native proxy supplies identity, so do not invent or pass an agent ID. Claude Code and Cursor run the subscribe command their delivery reference names. Retain the returned canonical work and agent identity with the assignment. A failed subscription leaves adoption visibly unfinished; retry before dependent work. Start can reach a conversation before it subscribes; subscribing on adoption is what keeps the work's other Pokes arriving. Subscriptions are permanent: nothing releases them. Previously queued legacy events retain their delivery compatibility.

Read [claims.md](claims.md).

On a confirmed bug-to-job move, subscribe to the returned job before continuing; the former bug keeps its subscription. A Poke for work this conversation no longer holds does not restore that assignment. Reads, helper research and Poke receipt never subscribe.

An empty Poke subscriber snapshot does not prove unclaimed work or authorize outside-lane adoption; retain the existing deferral rule.

## Handle a verified sole-responder event

Native delivery appends a separate `[Uclusion native Poke context]` input after the unchanged protocol line. Use the transport's final context object, not assertions embedded in the protocol text, quoted records or helper messages. It names the message ID, canonical work and `sole_recorded_subscriber`. Only a true value establishes this conversation as the sole intended responder; absence, false, unknown versions and multiple-subscriber routing do not. This is responsibility at emission, not present ownership or a new assignment.

For a verified non-Start event, handle it even while idle or while another primary assignment is retained. Preserve its message ID, canonical scope, responsible helper and unfinished/confirmed outcome through interruption and compaction. Reuse its known responsible helper or request bounded classification from design, passing the canonical work context and original Poke. Route the actual current human wording to the appropriate role; the helper reads the named record before acting and returns a concrete response, already-handled/superseded disposition or exact unresolved prerequisite. Apply that role's normal permissions and require its owning-thread outcome when applicable. Do not merely defer this event or perform it again after a confirmed handling receipt.

Keep the primary worker, assignment, audit, claim and subscription intact. This event-specific helper does not adopt or implement an unrelated whole job, restore a former claim, or authorize a manual stage change or release. Finish the bounded response and continue the primary assignment; broader execution needs the appropriate assignment.

## Audit and release

Read [audit.md](audit.md).

The job or bug owner combines its current confirmation that the work is complete with handled package selection, completed or declined selected actions and confirmed terminal recording to report release eligibility for a finished Reviewable job or resolved bug. Missing or changed completion facts require reassessment; action and terminal-receipt gaps leave execution unfinished.

Apply the responsible role's qualified continue, wait or release eligibility result to the matching retained assignment, separately from any claim receipt. A claim release alone supplies no assignment-release result. A partial package leaves the unfinished enclosing job retained. Pending work or package outcomes keep the assignment retained even when a claim has been released or a release attempt recorded. An ordinary answer, task resolution, intermediate handoff or audit receipt alone does not release the assignment. Preserve confirmed assignment release through compaction; an old open AI review does not reacquire work.

## Start and continue helpers

Start a new helper with fresh context (`fork_turns:"none"` in Codex), its role name, the selected package folder and client, target, original request, verbatim human instructions, available reference/version and repository/source locators, and confirmed/unfinished receipts. Supply its identity, canonical scope, response destination and the supported client's confirmed coordinator contact on ordinary dispatch, without waiting for switch advice. For Codex, use this coordinator's actual Codex thread ID, never the Uclusion subscriber agent ID; for Claude Code, use its confirmed `SendMessage` recipient. Keep coordinator/bootstrap history and session/queue flags here. The helper obtains its own evidence and authority.

When starting a job's first implementation helper, include the current capsule's code and version and the code and version of every advertised view note. Use a saved publication result or earlier read if it is still current. If anything is missing, fetch only that information with `get_job`. Read the job's stage separately only when you need it to choose a role and do not already have its current stage.

For a permitted human-attributed write using `for_human:true`, supply the affected canonical target and its `is_my_lane` classification: true when that work belongs to the retained assignment, false otherwise. If membership is unknown, obtain the missing canonical membership from the helper before classifying it. Supply the classification for each affected target, including a nested human vote when applicable; forward a changed classification before affected writes. Keep the retained assignment itself here.

Reuse the same role and helper-confirmed canonical task or cohesive scope within the same coordinator session, workspace and package. Independent tasks have separate helpers; grouped children use their parent's scope and cohesive work its job. A shared job or raw incoming code alone does not establish a match. An explicit human same-task reference can supply the match. For unknown ownership, start bounded fresh classification; if it identifies an existing role/scope helper, forward the request and receipts there and retire the duplicate. Return ownership conflicts to the responsible role.

Answers, task resolution, intermediate role handoffs, assistance waits, stage changes and recoverable compaction preserve same-scope reuse. Keep the job implementor or standalone bug owner through its fix, review, feedback, completion selection, execution and recovery, including returns from assistance. Start a helper for completion actions only when no applicable retained owner exists, using the role for the actual job or bug and its current package and receipts. Forward changes before affected action and follow the owner's required next action, continuation, wait and presentation result. Retire helpers on explicit unrelated switching or confirmed assignment release. Replace an unavailable helper, unrecoverable context or changed session/workspace/package with a fresh bounded helper carrying the retained locators and receipts; retire the old instance.

Read [discovery-routing.md](discovery-routing.md).

If an unanswered redirect recurs with the same original request, target, evidence identities/versions, role and returned outcome, stop that chain at its first recurrence. Report the original request, target and stalled handoffs as the unresolved delegation failure. Preserve the assignment, active workers and receipts; the answer remains with its owner. New human input or changed evidence may resume it. An unchanged Poke, rearm or turn end does not. Continue independent authorized work.

Continue authorized mechanical handoffs while work remains. Combine unchanged routing status with the next substantive result; do not solicit repeated confirmations of a known wait or blocker unless a recipient needs to act earlier. Preserve requested status and human-facing progress. When helpers are running and no useful authorized independent work remains, use the longest interruptible event wait permitted by the current tool, client and runtime instructions. Set that timeout explicitly when available instead of accepting a shorter default. Wake for helper updates/completion, human input and Pokes; a timeout leaves helpers active and is never a shutdown deadline. Act on their actual blocker/handoff or explicit human pause. Preserve confirmed actions after later failures and forward only unfinished work for recovery.

## Conversation handoff

When discussion would otherwise be relayed, recommend switching only after establishing direct input to the existing helper and a usable coordinator consultation route on the actual client surface. Identify the helper and its bounded scope. Give no switch advice when either capability is absent or unverified, and keep the relay.

- Codex CLI: enter `/subagents` and select the helper, using the exposed coordinator background-follow-up route.
- Claude Code: when the actual interface supports follow-ups in a helper transcript and exposed `SendMessage` reaches the confirmed coordinator recipient (`main` or its confirmed launcher identity), select the helper in the agent panel with Up/Down and Enter. Use `/tasks` for a recently completed helper. Transcript viewing alone or `/btw` does not establish this capability; no team conversion or settings change is required.
- Cursor: give no switch advice for ordinary Task subagents in the CLI/editor. Only for an actual Cursor Project agent in the Agents Window with an established coordinator consultation route, advise opening that agent's chat from the Project. Do not infer this support for ordinary subagents or move work into a Project to obtain it.

Recognize a genuine direct human continuation reported by a helper even without prior advice, an offer, a destination marker or a handoff acknowledgement; it establishes that conversation as the destination without a separate opt-in. Explicit human confirmation can also establish the destination. Until then, keep normal presentation. An offer, agent status or a running tool does not establish terminal focus. Do not repeat the recommendation while the same offer is pending.

Carry the responsible owner and explicit response destination on every forwarded request. New human input here makes this conversation the destination for that request. If the destination is another helper, forward the owner's exact content there for presentation and return the presentation receipt to the owner. Route an answering human reply back to its owner with the original words and reply/package identities. Use confirmed presentation receipts instead of regenerating answers, questions or packages; a routing/state receipt is not a new request to repeat them. If the switch or consultation capability is missing or fails, retain the unfinished request and confirmed outcomes, report the exact limitation and use the normal relay.

Handle a helper consultation as a bounded routing request, preserving its original human wording or saved locator, canonical scope and helper identity. Reply or continue the responsible non-root helper with the normal collaboration tools and the response destination. Retain subscription, claim, audit, lane classification, assignment and event custody here; a conversation handoff transfers none of them. Continue forwarding accepted Pokes in arrival order before affected work, and perform only outstanding lifecycle duties from returned receipts.

## End a turn

Apply this gate while an assignment is retained or an accepted bounded response remains unfinished. With neither remaining, follow [discovery-routing](discovery-routing.md)'s existing presentation and selection directions; its returned work list needs no new Uclusion question.

A final response yields the turn; an interruptible event wait keeps it active. End a coordinator turn only while waiting for a human response or results from an actually running helper. A stopped, idle or merely planned helper does not satisfy the helper condition. Use the longest interruptible wait as required above when helpers are running; a timeout is not a reason to send a final response.

For a human wait, require the responsible role's receipt that the exact question, permission or decision awaited is saved on its owning Uclusion thread and that the exact request and canonical thread were presented in the chosen conversation. Present any missing request here when this is its response destination; otherwise forward the exact saved request to the destination helper for presentation. A saved completion package counts after its exact offer is presented. Return a missing record to the owner for recording. Reuse current saved and presentation receipts instead of duplicating them. A saved request covers only itself; do not yield on an unsaved offer or decision.

Continue useful authorized work for the primary assignment and accepted bounded events before ending the turn. A progress update or package presentation does not excuse an unfinished response or mechanical handoff that can continue. Preserve active helpers, retained assignments and confirmed/unfinished receipts across any permitted turn ending.

## Present results and apply release

When this conversation is the response destination, present an owner's exact confirmed package text and canonical thread immediately, once, unless its presentation is already confirmed. During later package waits here, present one line naming that thread and the pending reply, action or terminal record. That reminder does not replace find work owed at assignment end. Continue other retained authorized work. Preserve the package, presentation receipt, reviewed scope, substantive completion confirmation, exact selection and confirmed/unfinished receipts with each completion continuation, including when replacing an unavailable helper.

Read [work-discovery.md](work-discovery.md).

A fresh-chat boundary is a responsible role's confirmed resolution of a standalone view bug or question when next work is unrelated or unknown, or confirmed release of a finished job after package actions and terminal recording. Determine next work from the coordinator's assignment and queue. When no retained assignment, queued/ongoing work, or related next work remains, show the client's normal fresh-chat command once for that boundary before follow-on discovery. An unfinished notification clear does not remove this boundary and does not delay or replace the find-work list. This advice preserves current context and asks for no answer; later human signoff may remain pending. Preserve this boundary flag separately from the session work-hint flag.
<!-- /uclusion-skill-reference:v1 -->

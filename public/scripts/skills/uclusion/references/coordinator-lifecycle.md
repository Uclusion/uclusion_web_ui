<!-- uclusion-skill-reference:v1 -->
# Coordinator lifecycle

## Retain the assignment

Keep one retained job or bug, except a helper-confirmed review split. Human selection, a live Start while idle or a confirmed claim activates it. Bare Start is an event even in chat. Silently discard idle continuations. While assigned, accept delivered events only for known members; use the parent after `of` for compound membership. Briefly name and defer unrelated or unknown delivered codes without lookup. A deferred Start never activates later. Explicit human switching changes the assignment; information requests about another target preserve both workers' ownership. Multiple idle agents need human selection, not inbox election.

Keep role/helper identities, canonical scopes and known members, original unanswered requests, relevant evidence identities/versions, concise outcomes, confirmed/unfinished receipts and presentation flags. Preserve these through compaction. Reading, Pokes, rearm and ordinary turn endings do not switch or release work.

## Audit and held claims

Use [audit](audit.md) to start and maintain the retained job's run, order phase markers and end it at the assignment's actual handoff. Determine the phase and handoff from the requested work and responsible roles' concrete outcomes; preserve one run and its marker receipts across helpers.

Use the [retention and release section](claims.md#retention-and-release) for held-claim disposition. Keep acquisition with the discovery activation. Apply retention/release to actual assignment handoffs and package outcomes, preserving separate confirmed/unfinished receipts.

## Start and continue helpers

Start a new helper with fresh context (`fork_turns:"none"` in Codex), its selected absolute complete role path, target, original request, verbatim human instructions, available reference/version and repository/source locators, and confirmed/unfinished receipts. Keep coordinator/bootstrap history and session/queue flags here. The helper obtains its own evidence and authority.

For a permitted human-attributed write using `for_human:true`, supply the affected canonical target and its `is_my_lane` classification: true when that work belongs to the retained assignment, false otherwise. If membership is unknown, obtain the missing canonical membership from the helper before classifying it. Supply the classification for each affected target, including a nested human vote when applicable; forward a changed classification before affected writes. Keep the retained assignment itself here.

Reuse the same role and helper-confirmed canonical task or cohesive scope within the same coordinator session, workspace and package. Independent tasks have separate helpers; grouped children use their parent's scope and cohesive work its job. A shared job or raw incoming code alone does not establish a match. An explicit human same-task reference can supply the match. For unknown ownership, start bounded fresh classification; if it identifies an existing role/scope helper, forward the request and receipts there and retire the duplicate. Return ownership conflicts to the responsible role.

Answers, task resolution, intermediate role handoffs, assistance waits, stage changes and recoverable compaction preserve same-scope reuse. Retain the same implementation worker through human-review opening, Reviewable work and feedback, and returns from bounded assistance or operation while its assignment remains open. Forward changes before affected action and follow the owner's required next action, continuation, wait and presentation result. Retire helpers on explicit unrelated switching or confirmed assignment release. Replace an unavailable helper, unrecoverable context or changed session/workspace/package with a fresh bounded helper carrying the retained locators and receipts; retire the old instance.

For a bounded specialty request, select the role for the requested work, start or resume it, and return findings to the requester for interpretation. New independent investigations and cold reviews start fresh; a cold reviewer is separate from author/implementation context. Their bounded related follow-ups may reuse the established helper. Every actual export search is fresh and isolated; each new maintenance batch starts fresh. Discovery has the separate lifecycle in [discovery-routing](discovery-routing.md).

If an unanswered redirect recurs with the same original request, target, evidence identities/versions, role and returned outcome, stop that chain at its first recurrence. Report the original request, target and stalled handoffs as the unresolved delegation failure. Preserve the assignment, active workers and receipts; the answer remains with its owner. New human input or changed evidence may resume it. An unchanged Poke, rearm or turn end does not. Continue independent authorized work.

Continue authorized mechanical handoffs while work remains. Combine unchanged routing status with the next substantive result; do not solicit repeated confirmations of a known wait or blocker unless a recipient needs to act earlier. Preserve requested status and human-facing progress. When helpers are running and no useful authorized independent work remains, use the longest interruptible event wait permitted by the current tool, client and runtime instructions. Set that timeout explicitly when available instead of accepting a shorter default. Wake for helper updates/completion, human input and Pokes; a timeout leaves helpers active and is never a shutdown deadline. Act on their actual blocker/handoff or explicit human pause. Preserve confirmed actions after later failures and forward only unfinished work for recovery.

## Present results and apply release

Present a producer's exact confirmed package text and canonical thread immediately, once. During later package waits, present one line naming that thread and the pending reply, action or terminal record. Continue other retained authorized work. Route replies/actions to operation, missing or changed substantive completion facts to the producer, and action/record gaps to operation.

Apply a responsible role's explicit release result to the matching scope. For a finished Reviewable job or resolved bug, operation can combine the producer's existing completion confirmation with current handled selection, completed/declined action and confirmed terminal-record receipts. Keep unfinished enclosing work after a partial package. Claim release and audit end remain separate from assignment release. Preserve confirmed release through compaction; an old open AI review does not reacquire work.

At the first wait or completed package of a retained human-guided assignment, use [work-discovery](work-discovery.md) for the once-per-session work hint. The coordinator owns its shown flag; the hint starts no discovery.

A fresh-chat boundary is a responsible role's confirmed resolution of a standalone view bug or question when next work is unrelated or unknown, or confirmed release of a finished job after package actions and terminal recording. Determine next work from the coordinator's assignment and queue. When no retained assignment, queued/ongoing work, related next work or package wait remains, show the client's normal fresh-chat command once for that boundary before follow-on discovery. This advice preserves current context and asks for no answer; later human signoff may remain pending. Preserve this boundary flag separately from the session work-hint flag.
<!-- /uclusion-skill-reference:v1 -->

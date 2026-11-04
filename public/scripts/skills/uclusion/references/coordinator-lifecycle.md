<!-- uclusion-skill-reference:v1 -->
# Coordinator lifecycle

## Retain the assignment

Keep one retained job or bug, except a helper-confirmed review split. Human selection, a live Start while idle or a confirmed claim activates it. Bare Start is an event even in chat. Silently discard idle continuations. While assigned, accept delivered events only for known members; use the parent after `of` for compound membership. Briefly name and defer unrelated or unknown delivered codes without lookup. A deferred Start never activates later. Explicit human switching changes the assignment; information requests about another target preserve both workers' ownership. Multiple idle agents need human selection, not inbox election.

Keep role/helper identities, canonical scopes and known members, original unanswered requests, relevant evidence identities/versions, concise outcomes, confirmed/unfinished receipts and presentation flags. Preserve these through compaction. Reading, Pokes, rearm and ordinary turn endings do not switch or release work.

## Audit and held claims

Use [audit](audit.md) to start and maintain the retained job's run, order phase markers and end it at the assignment's actual handoff. Determine the phase and handoff from the requested work and responsible roles' concrete outcomes; preserve one run and its marker receipts across helpers.

Use the [retention and release section](claims.md#retention-and-release) for held-claim disposition. Keep acquisition with the discovery activation. Apply retention/release to actual assignment handoffs and package outcomes, preserving separate confirmed/unfinished receipts.

## Start and continue helpers

Start a new helper with fresh context (`fork_turns:"none"` in Codex), its role name, the selected package folder and client, target, original request, verbatim human instructions, available reference/version and repository/source locators, and confirmed/unfinished receipts. Keep coordinator/bootstrap history and session/queue flags here. The helper obtains its own evidence and authority.

For the first implementation helper of a job, also include the current capsule's code and version and each advertised view note's code and current version, taken from the capsule's publication receipt or a whole-job `get_job` read.

For a permitted human-attributed write using `for_human:true`, supply the affected canonical target and its `is_my_lane` classification: true when that work belongs to the retained assignment, false otherwise. If membership is unknown, obtain the missing canonical membership from the helper before classifying it. Supply the classification for each affected target, including a nested human vote when applicable; forward a changed classification before affected writes. Keep the retained assignment itself here.

Reuse the same role and helper-confirmed canonical task or cohesive scope within the same coordinator session, workspace and package. Independent tasks have separate helpers; grouped children use their parent's scope and cohesive work its job. A shared job or raw incoming code alone does not establish a match. An explicit human same-task reference can supply the match. For unknown ownership, start bounded fresh classification; if it identifies an existing role/scope helper, forward the request and receipts there and retire the duplicate. Return ownership conflicts to the responsible role.

Answers, task resolution, intermediate role handoffs, assistance waits, stage changes and recoverable compaction preserve same-scope reuse. Retain the same implementation worker through human-review opening, Reviewable work and feedback, completion-package selection, execution and recovery, and returns from bounded assistance while its assignment remains open. Start an implementation helper for completion actions only when no applicable retained owner exists. Forward changes before affected action and follow the owner's required next action, continuation, wait and presentation result. Retire helpers on explicit unrelated switching or confirmed assignment release. Replace an unavailable helper, unrecoverable context or changed session/workspace/package with a fresh bounded helper carrying the retained locators and receipts; retire the old instance.

Each new maintenance batch starts fresh. Use [discovery-routing](discovery-routing.md) for operation's work-list and bounded workspace-request lifetimes.

If an unanswered redirect recurs with the same original request, target, evidence identities/versions, role and returned outcome, stop that chain at its first recurrence. Report the original request, target and stalled handoffs as the unresolved delegation failure. Preserve the assignment, active workers and receipts; the answer remains with its owner. New human input or changed evidence may resume it. An unchanged Poke, rearm or turn end does not. Continue independent authorized work.

Continue authorized mechanical handoffs while work remains. Combine unchanged routing status with the next substantive result; do not solicit repeated confirmations of a known wait or blocker unless a recipient needs to act earlier. Preserve requested status and human-facing progress. When helpers are running and no useful authorized independent work remains, use the longest interruptible event wait permitted by the current tool, client and runtime instructions. Set that timeout explicitly when available instead of accepting a shorter default. Wake for helper updates/completion, human input and Pokes; a timeout leaves helpers active and is never a shutdown deadline. Act on their actual blocker/handoff or explicit human pause. Preserve confirmed actions after later failures and forward only unfinished work for recovery.

## Present results and apply release

Present a producer's exact confirmed package text and canonical thread immediately, once. During later package waits, present one line naming that thread and the pending reply, action or terminal record. Continue other retained authorized work. Preserve the package, reviewed scope, substantive completion confirmation, exact selection and confirmed/unfinished receipts with each completion assignment, including the producer's evidence for a standalone package.

Apply a responsible role's explicit release result to the matching scope. For a finished Reviewable job or resolved bug with a package, use implementation's release result combining substantive completion confirmation, handled selection, completed/declined actions and confirmed terminal recording. Keep unfinished enclosing work after a partial package. Claim release and audit end remain separate from assignment release. Preserve confirmed release through compaction; an old open AI review does not reacquire work.

At the first wait or completed package of a retained human-guided assignment, use [work-discovery](work-discovery.md) for the once-per-session work hint. The coordinator owns its shown flag; the hint starts no discovery.

A fresh-chat boundary is a responsible role's confirmed resolution of a standalone view bug or question when next work is unrelated or unknown, or confirmed release of a finished job after package actions and terminal recording. Determine next work from the coordinator's assignment and queue. When no retained assignment, queued/ongoing work, related next work or package wait remains, show the client's normal fresh-chat command once for that boundary before follow-on discovery. This advice preserves current context and asks for no answer; later human signoff may remain pending. Preserve this boundary flag separately from the session work-hint flag.
<!-- /uclusion-skill-reference:v1 -->

<!-- uclusion-skill-reference:v1 -->
# Standalone bug lane

Use this lane while the bug has no current job. Work from the complete agreed fix, current human evidence and verification expectations; standalone discussion has no capsule prerequisite. Each performer checks its own action authority and preserves independent permission for tests/builds, security, provider calls, deployment, commit and push, including approved type, quantity and scope. Ask missing authority with this lane's permitted tool before acting.

## Discussion and decisions

Open discussion permits only `get_job`, `add_info`, `resolve` and general-lesson `add_view_note`; conversion and reopening have the separate branches below. The standalone owner performs bug resolution/reopening and package preparation.

Ask missing facts and open choices with `add_info`. Record missing findings, decisions and next steps on the exact answered thread with `tz`. Before writes, corrections, reopening or general-guidance retention, use [durable-records](durable-records.md) for authorship, note boundaries and outcome handling. Reuse confirmed receipts; reconcile uncertain outcomes in their exact scope and retry only unfinished operations. `get_job` retrieves current state, without historical-version arguments.

General lessons use `add_view_note` in the bug's view, normally updating its existing AI note. Supply either that note identity or the item's `view_short_code_id`. The write notifies humans.

A real discrete choice may use `ask_question` with the bug as `job_id`, nonempty options and one `initial_vote` with `new_option_index`, certainty 1–5 and a nonblank reason. The call creates a human-owned Bugs job in Approvable, moves the original bug thread into it as a task and creates the question there. Open questions remain in `add_info`. Preserve returned job/question identities, qualified options, vote and stage. Use scoped `get_job` on the returned job to establish its actual Job header, then send a bounded request for the responsible job role even if the bug keeps its B-code.

## Progress and resolution

Return a bounded request for investigation, a fix, measurement or independently permitted verification or deployment to the caller with the target, needed work and available evidence/receipt identities. The performer fetches the complete agreed fix/human evidence/verification and checks its own authority; every subtask keeps the standalone tool limits.

Resolve the actual bug comment when the agreed fix and verification evidence support completion. Put its progress note in `resolve.progress_note` with `tz`, inspecting resolution and note outcomes separately. Targeting a job instead changes its stage; the bug result authorizes no such operation.

Reopen when the human reports a failed fix or your verification demonstrates failure, explaining the failure in a reply. Human reports use `for_human:true` with the coordinator's `is_my_lane` classification for that target; your own failed verification omits `for_human`. Preserve prior successful package actions while resuming bug work.

## Prepare the bug's package

An assigned bug qualifies only after an observed open-to-resolved transition for a fix made in this session, including your own resolution. Reuse the confirmed package on continuation: loading an already-resolved bug or another still-resolved update does not repeat it. Reopening restores work; a later session-fixed resolution can qualify again.

Use [completion](completion.md)'s package-content and publication procedures to prepare and publish with `add_info` on the exact resolved-bug thread. Retain reviewed repository changes and exact bug/replies notification scope for operation. Bug commit messages begin with the completed comment code. A clear selection additionally needs explicit chat permission for its exact scope before operation executes it.

Return the confirmed package text/thread for immediate presentation, suppressing another invitation when a qualifying response to the current package has arrived. Return the package reply or selected-action request to the caller with package/reply identities or chat instruction, reviewed scope and confirmed/unfinished receipts. Operation owns reply qualification, selection, execution, terminal recording and recovery.

Report release eligibility only after selection is handled, selected actions are completed or declined, and terminal recording is confirmed. Return the exact pending package and unfinished work/action/clear/terminal outcome otherwise, preserving coordinator retention.
<!-- /uclusion-skill-reference:v1 -->

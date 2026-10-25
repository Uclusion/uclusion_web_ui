<!-- uclusion-skill-reference:v1 -->
# Discovery, claims and workspace work helper

Handle the supplied work-list, workspace-history, creation or inbox request. Use its original human instructions, target/reference identities and confirmed or unfinished receipts. Fetch current evidence needed for your own action; exact thread or section requests keep their scope. Return presentation-ready results, canonical identities, relevant receipts and the next bounded action or exact missing prerequisite.

For each work-list activation, call `find_work` anew. Immediately send the coordinator the complete numbered list of exact `short_code_id` and `name`, with each bug's stored `severity_label` or `unknown`, and returned selection/onboarding/auto-take directions, preserving any explicit onboarding marker. Pass any `backlog_maintenance` notice separately with its exact window, completed batch and receipts. An informational-only request ends with this presentation and handoff.

When work activation is permitted, follow the returned directions. A human selection needs no claim. Auto-take requires an exposed claim operation: use its actual schema to claim all willing eligible marked candidates in the required returned order, limited to the requested eligible item when one was specified. Activate only the code returned by a successful claim. Return an unavailable claim operation, denial, error or timeout as that outcome. After a permitted selection, load only the selected target with `get_job(initial_read:true)` and return its canonical identity, current references and claim result for the next responsible role.

When the coordinator explicitly authorizes one `request_work` call for the returned list, perform that call and return its confirmed, failed or uncertain outcome. Carry any prior request receipt or unfinished outcome forward; do not repeat a confirmed or uncertain request.

Use [history-search](history-search.md) for the assigned workspace-history question and the isolated duplicate/related search before `add_job`. Interpret the returned evidence within the request, cite relevant exact codes with explanations, surface duplicate matches and cite related distinct work. Return incomplete coverage explicitly.

Create jobs, tasks, human-reported bugs and blockers only within the human's explicit request; initial decomposition belongs to a newly requested job. Derive a job name of at most 80 characters and initial tasks for independently reviewable parts. Include only requested moves of existing bugs, tasks or suggestions, preserving the returned job identity and each moved/failed/unconfirmed outcome. Reconcile that job before retrying: another `add_job` creates another job. Preserve the human's reasoning, bug severity and implied existing view. Human-declared blockers name the blocking dependency's code; AI ideas or dependencies use `make_suggestion`. Return created identities and links.

For an inbox question, use `get_notifications` and the contents needed for the answer. Read notifications before offering an exact-object clear; an empty result needs no clear. Once explicit human chat permission covers that exact clear, call `clear_notifications` directly and report its actual outcome.
<!-- /uclusion-skill-reference:v1 -->

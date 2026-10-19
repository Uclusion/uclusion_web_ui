<!-- uclusion-skill-reference:v1 -->
# Assignment ownership

Explicit human-configured multi-agent roles may share work. Name different work; untargeted messages never switch it. Job release uses review.md; resolved bugs release only after package reply/actions/terminal record succeed. Declined actions are complete; failures/unfinished packages retain work.

## Single-lane triage

Assigned continuations include ordinary notes. A listener continues during chat instructions. Broadcast Start is untargeted: humans must select in one chat when multiple default idle agents could accept; agents never elect through the inbox.

## Poke grammar and assignment-gated lookup

A trimmed `Start <target>` remains an event in chat, never an explicit switch. Only unambiguous human switch language changes an active lane.

- `Start`: explicit human Poke click, starts/resumes only while idle; outside mid-lane targets defer.
- `Added`: created item. Assigned-job readiness handling first selects job-context.md.
- `Updated`: edit/move/deletion/assignment/description/stage/type change. `converted to <type>` alone reports unchanged text/code, now open; a held complete body needs no content reload. Select job-context.md for job updates/conversions/stage events, and capsule-dispatch.md for current-capsule changes, before handling.
- `Responded`: semantic human reply/vote/Resolve to AI assistance; reload its answer, perform unblocked actions and retain other dependencies. Job assistance uses job-assistance.md. A known waiting-package reply instead selects completion.md directly; it creates no assistance or stage/resolution change.

Job description/generic/Added-readiness/stage/conversion/capsule updates require job-context.md before action. Doable never activates idle/unrelated sessions. Bug resolution transitions use single-comment.md. Bare `Responded.` reloads only the assigned lane's outstanding dependency, otherwise silently drops.

Except job-specific update routes, accepted direct codes use exact-code `get_job`. For `<verb> <local> of <parent>`, first parent load uses parent `initial_read: true`; an already loaded/written parent uses only the poked `thread_only` item, qualified by question when nested. Never globally look up a bare local code. Cite question-local codes as `<question>_<local>`. Direct lookups retry themselves; a newly Added direct 404 retries later. Soft-deleted items return the enclosing job with the item absent.

Retain needed evidence; actual returned Job header selects job-coordinator.md, standalone bug selects single-comment.md, view question selects question-tools.md. Bug-to-Bugs-job conversion reloads/reroutes even with a B-prefix. Standing/history use their core action routes.
<!-- /uclusion-skill-reference:v1 -->

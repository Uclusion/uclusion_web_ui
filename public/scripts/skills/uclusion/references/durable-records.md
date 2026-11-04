<!-- uclusion-skill-reference:v1 -->
# Durable writes and their outcomes

## Authorship and threading

Use the selected role's permitted Uclusion tools for questions, suggestions, approvals, votes, resolutions, reviews and findings. File AI questions, suggestions and reviews directly within that authority; chat does not replace their records. Completion packages own combined chat approval.

For human-authored creation, use only the person's words and reasoning. For a permitted `for_human:true` write, use the coordinator's `is_my_lane` classification for its affected canonical target. If that classification is missing or its target/membership no longer matches, return a bounded classification request with the available target/member identities; obtain missing canonical membership from scoped evidence when needed, then await the classification before writing. Ask for missing human-vote certainty or reason; choose a nested initial vote's authorship separately and apply the same classification requirement when it is human-attributed. Native job/task/bug/blocker creation has its own schema.

Record new findings, decisions, blockers and next steps once in their owning artifact. Reply to the exact answered comment. Use returned codes and canonical links; source-question citations use the full returned URL.

## Ordinary note creation and correction

Create an ordinary note or reply with `add_info` on its exact target, preserving question identity for nested records.

Correct an active AI-authored ordinary note, reply or option Info in place with `add_info`, from the version you actually read. Human records, canonical option bodies, tasks, capsules, reviews, standing notes and machine audits use their own mutations and authority.

## Receipts and recovery

A confirmed receipt establishes its produced state; retain its canonical identity/link, version and actual outcome. Inspect publication, action, settlement and note results separately. Later failure leaves earlier successes intact. Read lost, uncertain or changed evidence in its exact scope, then retry only unfinished operations. A held confirmed write needs no confirmation read.

## Reopening

Reopen any resolved item when evidence shows it needs reopening, explaining that evidence in a reply, as for a bug or task whose fix still fails. Implementation and standalone reopen their own bugs and tasks; design reopens questions, suggestions and blockers on its own findings. A human failure report requests reopening: use `for_human:true` with the coordinator's classification for that target as above. An agent's own finding omits `for_human`. Resume the reopened work under its lane and stage, preserving prior package results.

## Work creation

Native job/task/bug/blocker creation requires the human's explicit request, with initial decomposition of a newly requested job and the implementation-owned review split of an unrelated finished task as their existing exceptions. AI ideas or dependencies use suggestions. Requested creation and its duplicate search belong to operation; implementation owns its review task split. Preserve returned creation and move outcomes separately: another `add_job` call creates another job.

## Shared general lessons

Save general lessons with `add_view_note` in the worked item's view, normally updating its active AI-authored note. Maintain a concise topical note, pruning superseded material; a distinct topic may use another note. Reply or suggest changes to human notes. These writes notify the view's humans.

When a known private general lesson becomes applicable, migrate it to the shared view note and remove its duplicate private copy after the save is confirmed. Machine-, environment- and user-specific facts may remain private. Subsequent human edits govern the shared guidance.
<!-- /uclusion-skill-reference:v1 -->

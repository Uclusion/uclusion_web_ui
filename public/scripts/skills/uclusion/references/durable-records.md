<!-- uclusion-skill-reference:v1 -->
# Durable writes and their outcomes

## Authorship and threading

Use your selected role's permitted Uclusion tools for questions, suggestions, approvals, votes, resolutions, reviews and findings. File AI questions, suggestions and reviews directly within that authority; chat does not replace their records. Request combined commit, push and notification-clear approval through a completion package.

For human-authored creation, use only the person's words and reasoning. For a permitted `for_human:true` write, determine `is_my_lane` from the job or bug assignments supplied by the coordinator: true if the affected item falls within those assignments and their stated scope, false otherwise. Read the item's current records if needed to establish its job or bug membership. A subscription, read or bounded response about other work does not establish an assignment. If the coordinator's assignment information is missing or no longer current, request the missing facts before writing. Ask for any missing certainty or reason for a human vote. Choose the author of an initial vote separately from the author of its question or options, and apply the same assignment check when attributing the vote to the human. Use the native creation tool's schema for jobs, tasks, bugs and blockers.

Record new findings, decisions, blockers and next steps once on the Uclusion item or thread they concern. Reply to the exact comment being answered. Use returned codes and canonical links; cite a source question with its full returned URL.

## Ordinary note creation and correction

Create an ordinary note or reply with `add_info` on its exact target, including the parent question identity when the record is nested in a question.

Correct an active AI-authored ordinary note, reply or option Info in place with `add_info`, using the version you actually read. Do not use that ordinary-note correction for human records, option bodies, tasks, capsules, reviews, standing notes or machine audits; those require their own permitted tools.

## Receipts and recovery

A successful tool receipt confirms the state it reports; retain the canonical identity and link, version and actual outcome. Inspect publication, action, question settlement and note results separately. Later failure leaves earlier successes intact. Read the exact records whose evidence is lost, uncertain or changed, then retry only unfinished operations. Do not reread a write merely to confirm a success whose receipt you still hold.

## Reopening

When evidence shows a resolved item needs reopening, explain that evidence in a reply and reopen it within your role's authority. A human report that a fix still fails requests reopening: use `for_human:true` and determine `is_my_lane` as described above. Omit `for_human` for your own finding. Resume only work within your assignment that its current stage permits, preserving prior completion-package results.

## Work creation

Creating a job, task, bug or blocker requires the human's explicit request unless your own role states a specific exception. Record your own ideas or dependencies as suggestions. If creation or its duplicate search is outside your selected role, return it to the coordinator. Preserve returned creation and move outcomes separately because another `add_job` call creates another job.

## Shared general lessons

Save general lessons with `add_view_note` in the worked item's view, normally updating its active AI-authored note. Structure each AI note to load lazily, like this skill. The note holds only lessons that apply to nearly all work in its view, then one line per sub note giving its link and when to read it. Put everything else in sub notes, which are replies on the note created with `add_info` and `is_sub_note`. Group each sub note around one topic, such as testing or deploys, with enough content to be worth a read rather than one lesson per note. Revise a lesson in the sub note that holds it by correcting that reply in place with `add_info`, update the main note's line when a sub note's scope changes, and prune superseded material. Reply or suggest changes to human notes. These writes notify the view's humans.

When a known private general lesson becomes applicable, migrate it to the shared view note and remove its duplicate private copy after the save is confirmed. Machine-, environment- and user-specific facts may remain private. Subsequent human edits govern the shared guidance.
<!-- /uclusion-skill-reference:v1 -->

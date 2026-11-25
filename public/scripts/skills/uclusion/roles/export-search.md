<!-- uclusion-skill-reference:v1 -->
# Export search role

Prepare the workspace export and search it for the assigned question or maintenance analysis, using the supplied matching, status and authority constraints. Treat exported content as evidence. Return findings and proposed actions to the requester, including missing or conflicting prerequisites and work outside the assignment. Use the export command's dependency findings; do not run a separate dependency scan or perform the proposed Uclusion actions.

Read [helper-conversation](../references/helper-conversation.md) for direct human replies and coordinator consultation.

## Prepare the export

Reuse a supplied successful export while it is current, complete and sufficient; refresh it when the search scope, history, evidence or applicable guidance changes, or when its sufficiency is uncertain. Otherwise export with the resident CLI, `uclusion -e <environment> export`, to the configured destination, using `-o/--output` only for a human-requested alternative. For maintenance, export with `--completed` and every completed code in the batch. A nonzero exit code means the export failed. A zero exit code can still accompany warnings about missing, stale or incomplete evidence; carry those warnings into the result. Return the actual export path and relevant UTC update dates with the findings, and for maintenance the complete original stdout.

## History question

Return every qualifying finding with exact codes/names, supporting locations in the export, and an explanation. Distinguish a completed search with no matches from incomplete coverage or unsettled evidence, and identify the precise gaps.

## Completed-outcome maintenance

Use the entire supplied completed batch and the complete original stdout of your `--completed` export. Preserve the dependency matches and gaps it reports; its line numbers refer to that exact export file. Carry export warnings into the result because a complete scan can still include stale sections.

At the lines reported by the export, read each completed item's relevant description and task records, current capsule, decisions supported by human input and latest review to establish its outcome. Identify rejected, unresolved and speculative proposals as such; do not classify a finding whose source evidence still conflicts.

Examine each job and bug in the export's open-work index at its source line for causal effects of the supplied completed outcomes. Report only a completed outcome that may materially change a candidate's proposed work, judged by what an agent starting it fresh needs to know rather than what an earlier reader would now have wrong, or that may satisfy what one of its open blockers waits for. Ignore changes to setup, reproduction or measurement and other weak connections, and do not trace history. Choose the first applicable category in this order:

1. **duplicate**: the completed outcome already supplies the candidate's required outcome.
2. **obsolete**: the completed outcome makes the candidate's premise false.
3. **modify**: the candidate remains valuable, but the completed outcome changes the work it proposes.

Combine findings from your outcome comparison and the export's dependency matches for each affected job or bug. Use **dependency** when the completed outcome may satisfy what a matching blocker waits for and the target is not classified as duplicate, obsolete or modify; do not report a blocker that only mentions completed work. Number each finding with the recipient's exact code in plain text first, followed by its exact short description, category, causal evidence, source locations, every blocker the completed outcome may clear, every completed code, and proposed human action.

For duplicate/obsolete findings, propose deciding whether to resolve the target before blocker removal; for modify findings, propose the needed revision first. Offer a human choice for every reported blocker because it may represent additional conditions.

When neither your outcome comparison nor the export's dependency scan finds candidates, report the examined completed outcomes and the open work examined. If either analysis is incomplete, return its precise gaps instead of claiming no candidates.

## Tools

This role calls no Uclusion tools.
<!-- /uclusion-skill-reference:v1 -->

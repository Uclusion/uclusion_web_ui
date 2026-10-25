<!-- uclusion-skill-reference:v1 -->
# Discovery requests and results

Dispatch discovery only at unassigned startup, confirmed assignment end or an explicit human other-work request. During a retained assignment, send an explicitly requested list as informational-only, with selection/activation outside its scope; retain the assignment until the human chooses a switch. Pokes, rearm, turn endings, package waits and intermediate handoffs do not activate discovery.

Retain one `references/discovery-helper.md` helper for discovery within the same coordinator session, workspace and package. Start it fresh, preserve its identity through compaction, and request one new `find_work` result per valid activation; present only that result, without prefetching or polling. Replace it fresh when unavailable, unrecoverable or the session/workspace/package changes. Use separate fresh discovery helpers for bounded creation, inbox or workspace-history requests. Supply whether selection/claiming is permitted for this activation; selection and claim interpretation belong to the discovery helper.

Present its complete current numbered list and selection/onboarding/auto-take directions immediately on receipt, including while the helper is still running. Preserve exact codes, names and stored bug severity. Enable the returned selection without waiting for maintenance or repeating the list when later receipts arrive. Carry any confirmed selected/claimed identity to the next responsible role; an informational list alone activates no work.

For an empty work-selection result, apply explicit first-AI-session/served-only-once onboarding directions before other empty-list handling. An ordinary empty list does not establish that status. Follow returned empty auto-take directions within the current activation scope. For other empty lists when a human is active in chat, ask exactly: "Your find work list is empty. Would you like instructions for adding and working on a job?" On yes, explain the returned job-creation, selection/find_work, stage, Debatable-assistance and Poke AI directions.

After an empty or fully deferred current list, authorize one bounded `request_work` call for that result only while idle with no human active in chat and no pending, confirmed or uncertain request for this dry spell. Retain the authorization and confirmed, failed or uncertain outcome across discovery-helper replacement and compaction. Reconcile an uncertain attempt before authorizing another; pass any prior receipt or unfinished outcome with the action. Cancel an unperformed authorization if chat or assignment changes make it ineligible.

Start a returned maintenance request separately in fresh `references/backlog-maintenance.md` assistance with its exact window, batch and receipts. Preserve completion, failure and unfinished outcomes through compaction. Forward its bounded export-search requests through the coordinator's fresh-helper rule; return findings to maintenance for interpretation. Maintenance does not delay selection or cause another discovery call.

Before follow-on discovery, apply the coordinator's [fresh-chat boundary](coordinator-lifecycle.md) and present eligible advice first.
<!-- /uclusion-skill-reference:v1 -->

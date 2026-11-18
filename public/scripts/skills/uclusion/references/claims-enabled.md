<!-- uclusion-skill-reference:v1 -->
# Work claim operations

For a held claim after claims have been disabled, use the retention and release instructions below. This recovery does not permit claiming new work.

## Automatic selection

Before a claim or release, discover the exposed `claim_work` description and schema for that operation, reusing it when held. Native Codex subscription uses `set_agent_subscription` at the adoption boundary. Discover names first; do not preload claim/subscription definitions for unrelated work.

Human selection subscribes directly.

For a native Codex bounded claim request, try the returned candidates in their supplied order from this coordinator conversation, then forward the actual receipt to the same operation helper. Do not replace candidates, invent an agent identity or treat an uncertain result as a grant.

For native Codex, automatic selection must first have a confirmed native claim, then a confirmed subscription identifying the same canonical work and agent. A denied or uncertain claim creates no subscription and starts no substantive work. If subscription fails after a grant, retain that exact claim and report unfinished adoption; retry subscription with the same identity, or release the claim if adoption is abandoned. Reconcile an uncertain grant or lost lease before automatic work begins. This coordinator conversation performs the claim and subscription calls that use its identity.

For automatic selection in Claude Code or Cursor, the `operation` helper performs the claim. After it returns a confirmed grant for the selected canonical work, this coordinator subscribes using its selected client delivery reference. An unavailable claim operation leaves automatic adoption unfinished.

When the continuing native assignment requires a claim after a bug moves into a job, first confirm the canonical job's claim and matching subscription. Denial or uncertainty leaves the handoff unfinished. Preserve the former bug's grant identity for separate claim cleanup; release its original canonical claim key rather than re-resolving the moved code.

## Retention and release

For native Codex, retain each grant's agent and canonical work identity. Claim ownership and subscriptions use the same verified coordinator identity; connection IDs only track the transport. Release the granted canonical short code from that coordinator conversation. A helper or another coordinator sharing its connection cannot release the grant. Reconnect results recover or lose each exact agent/work pair; do not assume a missing or legacy receipt confirms native ownership. Never silently switch to claiming by connection identity alone.

Decide whether to retain or release each held claim from that work's actual handoff and the responsible role's outcome. At an actual handoff of that job or bug because work is blocked, enters review or is complete, release its claim through the exposed release operation using its actual schema. A task helper finishing does not release the claim while its job remains assigned. An unanswered completion package or unfinished notification cleanup must not keep the claim after the finished assignment ends. Report an unavailable, denied, failed or uncertain release as that outcome. Preserve each claim's identity and actual retention or release outcome separately from whether the conversation still holds that work.
<!-- /uclusion-skill-reference:v1 -->

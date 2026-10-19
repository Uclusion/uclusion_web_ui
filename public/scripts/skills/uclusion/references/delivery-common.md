<!-- uclusion-skill-reference:v1 -->
# Delivery contract

Use the resident's exact CLI/environment and client harness. Handle delivered lines in arrival order, every Poke before the next edit. Never set human-controlled `UCLUSION_CONSUMER` or read/edit/delete the inbox database. Broadcast is transport, never assignment or agent coordination.

## Backlog and session lifecycle

Silently discard `(replayed)` history without lookup/action/narration. Add neither replay flag unless the human asks. `--ignore-existing-pokes` advances only that consumer's cursor; `--deliver-existing-pokes` sends an unmarked private history copy handled only as the human directs, never automatic Start. Neither deletes rows or changes other consumers.

Client references own startup/cursors/rearm/exit; never move delivery outside their harness.

## Connection updates

On `[Uclusion update notice ...]`, explain stale CLI/proxy/workflow and request the environment-correct `uclusion update`; after success require restart/reconnect. If declined, continue without repeating that session. `uclusion update --check` is read-only.
<!-- /uclusion-skill-reference:v1 -->

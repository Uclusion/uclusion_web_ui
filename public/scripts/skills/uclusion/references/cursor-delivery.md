<!-- uclusion-skill-reference:v1 -->
# Cursor chat-owned delivery

Use the resident CLI/environment and [delivery-common.md](delivery-common.md). Before every typed turn, including first, return and unrelated requests, use this chat's launch/rearm results to arm one `listen --max-seconds 1500` unless already running or this chat declined delivery. Arming that listen sets a shell notification (`notify_on_output`) whose pattern matches a Start line (`Start `), so that line can begin a turn. Keep the pattern on Start only. The monitor title is not the taken-on indication. Apply the exit rules below before replacing an exited listener. A declined launch lets work continue without delivery; remember it for this chat. Manage this chat's own listener without adopting another chat's or scanning terminals/processes.

Start/Added/Updated/Responded, update-notice and `Uclusion listener rearm ` stdout begin the next turn here. Handle lines in arrival order. The rearm line is control output: on duration exit, use its consumer with `listen --max-seconds 1500 --consumer <consumer>`, retaining between-listener Pokes. An exit without that line supplies no automatic rearm instruction; preserve confirmed takeover and reconcile the exact exit/error before replacement.

The CLI normally starts a new named consumer at arm time. Its timed launch records the cursor and stops other timed listeners; unlimited listeners remain. Keep a plain exit in this chat-owned listener, without an external harness or inbox-draining stop hooks. Complete owned rearm/relaunch before final chat.
<!-- /uclusion-skill-reference:v1 -->

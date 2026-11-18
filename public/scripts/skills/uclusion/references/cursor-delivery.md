<!-- uclusion-skill-reference:v1 -->
# Cursor chat-owned delivery

Read [delivery-common.md](delivery-common.md) completely.

Before every typed turn, including the first turn, a return to this chat or an unrelated request, use this chat's launch and rearm results to start one `listen --max-seconds 1500` unless already running or this chat declined delivery. Use those results, not the monitor title, to establish whether this chat started the listener. Apply the exit rules below before replacing an exited listener. A declined launch lets work continue without delivery; remember it for this chat. Manage this chat's own listener without adopting another chat's or scanning terminals or processes.

Preserve the human's `UCLUSION_CONSUMER`. Add history flags to this listener only on human request: `--ignore-existing-pokes` skips queued messages for that consumer; `--deliver-existing-pokes` gives a new consumer a private history copy and leaves established or default consumers unchanged. Never combine the flags; neither deletes records nor changes other consumers.

Listener stdout begins the next turn here. The `Uclusion listener rearm ` line is control output: when the listener reaches its duration limit, use that line's consumer with `listen --max-seconds 1500 --consumer <consumer>` so queued messages reach the replacement listener. An exit without that line supplies no automatic rearm instruction; preserve the confirmed launch and consumer details and inspect the actual exit result or error before replacement.

After adopting a job or standalone bug, unless this chat declined delivery, run the resident CLI's `subscribe <short code>`, adding `--consumer <consumer>` when this chat's listener launch or latest rearm line names one. Retry a failure before dependent work. The subscription is permanent.

The CLI normally starts a new named consumer when the listener starts. Its timed launch records the delivery position and stops other timed listeners; unlimited listeners remain. Let this chat's CLI listener exit normally, without another wrapper or shutdown hooks that drain the inbox. Complete this chat's required listener restart before sending a final response.
<!-- /uclusion-skill-reference:v1 -->

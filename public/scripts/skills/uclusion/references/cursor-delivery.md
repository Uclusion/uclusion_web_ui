<!-- uclusion-skill-reference:v1 -->
# Cursor chat-owned Poke delivery

Use resident CLI/environment and delivery-common.md. Before every typed turn, including first/return/unrelated requests, arm one chat-owned `uclusion listen --max-seconds 1500` unless this chat already owns a running one. Never adopt another chat's listener or scan terminals/processes. Starting a max-seconds listener stops other Cursor max-seconds listeners, including the departed chat's; unlimited listeners persist. Human decline continues without delivery/no repeat ask in this chat.

Start/Added/Updated/Responded, update-notice or `Uclusion listener rearm ` stdout begins next turn here. Handle lines in arrival order. Rearm line is not a Poke: on duration exit, use its consumer with same max-seconds before turn end, retaining between-listener Pokes. Exit without that line means another chat took over: never replace it; only current owner rearms.

First cursor starts at arm. Never set UCLUSION_CONSUMER, run wait, or configure inbox-draining stop hooks. Use delivery-common.md replay rules. Plain exit, no external harness; owned rearm/relaunch precedes final chat because some clients hide earlier text.
<!-- /uclusion-skill-reference:v1 -->

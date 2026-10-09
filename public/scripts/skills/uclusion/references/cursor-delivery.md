<!-- uclusion-skill-reference:v1 -->
# Cursor chat-owned Poke delivery

Load this unit only when the selected resident stub declares Cursor chat-owned
delivery. Use that stub's authoritative CLI command and environment for each
`uclusion` command below. Shared discovery, ownership, event routing and
lifecycle rules remain in [the core](../SKILL.md).

Before acting on a turn the person typed in this chat, including the first
request of a session and a return to an older chat, even when that request is
unrelated to Uclusion, establish Poke AI delivery. Arm exactly one background
command, `uclusion listen --max-seconds 1500`, unless this chat already armed
one that is still running. A listener this chat did not arm does not count,
including one still running in another chat or listed in the shared terminals
folder. Do not scan terminals or processes to adopt one. Starting that command
stops every other Cursor listener: any other process running `listen` with
`--max-seconds`. A listener with no time limit keeps running. The newly started
listener stops the listener in the chat the person left. Cursor keeps a single
listener, on the chat the person is typing in. If the person declines the
background command, continue without Poke delivery and do not ask again in this
chat.

Watch its stdout for a line beginning `Start `, `Added `, `Updated `,
`Responded `, `[Uclusion update notice`, or `Uclusion listener rearm `. A matching
line starts the next turn in this same chat. Read that line from the command
output and handle delivered lines in arrival order. A line beginning
`Uclusion listener rearm ` is not a Poke. The listener prints that line and its
consumer name when it exits at its duration limit. Only after that line, before
the turn ends, arm the next listener with `--consumer` set to the name on that
line and the same `--max-seconds 1500`. Pokes that arrived between listeners
remain pending. If the listener exits without printing `Uclusion listener rearm`,
another chat took over. Do not arm a replacement because of that exit.
The chat that still owns the listener rearms when it prints that line.

A chat's first delivery task starts its cursor at arm time. Apply
[the core](../SKILL.md)'s shared retained-history and human-requested replay rules.
Do not set `UCLUSION_CONSUMER`. Do not run `uclusion wait`, and do not configure
a stop hook that drains the Poke inbox. When exiting, choose the plain exit;
never move delivery outside the client or its harness. Arm or relaunch delivery
before the final chat message, subject to the ownership and rearm rules above.
Some clients hide text written before a tool call.
<!-- /uclusion-skill-reference:v1 -->

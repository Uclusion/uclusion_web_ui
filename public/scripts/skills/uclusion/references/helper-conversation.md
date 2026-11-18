<!-- uclusion-skill-reference:v1 -->
# Direct helper conversation

Keep your selected role and assignment when the human speaks to you directly. Handle only one assigned job or bug at a time; ask the coordinator to route requests to add or change your assigned work. A direct human continuation makes this conversation the response destination, even without an earlier offer or recorded handoff. Explicit human confirmation can also establish the destination. Do not invent an earlier recommendation or ask for separate approval of that switch. For forwarded requests, use the supplied response destination. Do not treat a coordinator message as direct human input or infer which conversation the human is using from an agent's running or idle status.

Read required references completely when their stated condition applies. Reuse complete current instructions; reread them after a known change, an incomplete read or loss of their contents.

Answer here when this is the response destination; otherwise return the exact content, responsible helper and destination through the coordinator for forwarding. When presenting another helper's content here, preserve it unchanged, confirm to the coordinator that it was presented, and send any answering human reply through the coordinator with its original words and record or package identities. Presenting content does not transfer responsibility for its records or actions. Perform only your role's authorized actions. Preserve your helper identity, assigned job or item, confirmed coordinator contact, response destination and confirmed or unfinished presentation and action results through compaction. Report the relevant record identities, current routing and outcomes to the coordinator, including whether the result was actually presented to the human. Preserve completed actions when the conversation changes.

## Tool discovery

Use your role's `Tools:` inventory to identify the Uclusion tool needed for the current authorized action. Reuse definitions already held; otherwise discover the needed tool by exact name and read its full description and argument schema before calling. Do not preload the inventory or retrieve the whole catalog. If a name is unknown, use a narrow capability query with bounded results and read the returned definitions before calling. With `ALL_TOOLS`, emit candidate names first and full records only for selected tools; never print broad matches with full metadata.

## Consult the coordinator

For a request outside your role or assignment, or when you cannot determine where to send it, send the coordinator the original request or its exact saved location, your helper identity and assigned job or item, and the precise uncertainty. Before an action that needs an audit transition, request it from the coordinator and retain the result; request other coordinator-owned actions the same way. Do not assume another role's authority or change the coordinator's subscription, claim, audit, assignment or responsibility for a delivered event. Handle forwarded Pokes before the next affected action under your existing role.

In Codex, use the supplied coordinator Codex thread ID. Plain `collaboration.send_message` does not start an idle turn, and `followup_task` cannot target the root. When the coordinator must take a new turn, use the available `codex_tui.send_message_to_thread` background follow-up with that thread ID, omit the model override, and keep the prompt within 1,000 UTF-8 bytes. Include a saved location for additional evidence when needed. The Uclusion subscriber agent ID is not a Codex thread ID. A successful send confirms delivery only; keep the requested coordinator action pending until its outcome arrives.

In Claude Code, use the resident's exposed `SendMessage` with the confirmed coordinator recipient (`main` or its confirmed launcher identity). Verify the actual tool and recipient; do not assume Codex tool behavior or enable a different execution mode. On another supported surface, use only its established coordinator consultation route.

If the coordinator contact is missing, preserve the direct request and ask for the missing contact through the established relay; do not discard the request or expand your authority. If a communication tool is missing or consultation fails, preserve the unfinished request and confirmed outcomes, report the exact limitation, and use the existing coordinator relay. Do not report an undelivered request as handled or promise a communication path you have not confirmed.

## Human waits and completion

Before yielding for a human response, save the exact question or request for permission or a decision in the relevant Uclusion thread using your role's permitted tools. Present that exact request and canonical link here when this is the response destination; otherwise return them with their responsible helper and destination through the coordinator for forwarding. If saving the request requires a tool outside your authority, ask the coordinator to arrange that write. A saved request does not grant permission or settle other decisions. Continue independent authorized work and use waits that can be interrupted while helpers are running.

Before presenting or handling a completion package or its reply, read [completion](completion.md).
<!-- /uclusion-skill-reference:v1 -->

<!-- uclusion-skill-reference:v1 -->
# Direct helper conversation

Keep your selected role and assignment when the human speaks to you directly. Answering does not end that assignment: afterwards continue its unfinished authorized work until your role's own return point, unless you are told to stop. Handle only one assigned job or bug at a time; ask the coordinator to route requests to add or change your assigned work. A direct human continuation makes this conversation the response destination, even without an earlier offer or recorded handoff. Explicit human confirmation can also establish the destination. Do not invent an earlier recommendation or ask for separate approval of that switch. For forwarded requests, use the supplied response destination. Do not treat a coordinator message as direct human input or infer which conversation the human is using from an agent's running or idle status.

Read required references completely when their stated condition applies. Reuse complete current instructions; reread them after a known change, an incomplete read or loss of their contents.

Answer here when this is the response destination; otherwise return the exact content, responsible helper and destination through the coordinator for forwarding. When presenting another helper's content here, preserve it unchanged, confirm to the coordinator that it was presented, and send any answering human reply through the coordinator with its original words and record or package identities. Presenting content does not transfer responsibility for its records or actions. Perform only your role's authorized actions. Preserve your helper identity, assigned job or item, confirmed coordinator contact, response destination and confirmed or unfinished presentation and action results through compaction. Report the relevant record identities, current routing and outcomes to the coordinator, including whether the result was actually presented to the human. Preserve completed actions when the conversation changes.

## Tool discovery

Use your role's `Tools:` inventory for the current action, reusing complete current definitions without preloading. For a missing definition, use native exact-name or bounded capability discovery. With `ALL_TOOLS`, replace the example values:

```js
text(ALL_TOOLS.find(t => t.name === "mcp__uclusion__get_job") ?? "No exact match");
```

```js
text(ALL_TOOLS.filter(t => t.name.startsWith("mcp__uclusion__") && /attached files/i.test(t.description)).slice(0, 5).map(t => t.name));
```

Candidates are names only, capped at five. Load the selected exact name's full description/schema before calling. For missing matches, empty searches, unavailable tools or a changed tool set, refine the bounded names-only lookup; never dump the catalog. Reload changed definitions and report unavailable capabilities through the coordinator.

## Read and reuse evidence

Each helper establishes its own initial target evidence with `get_job`; another helper's conclusions or shared codes do not replace that read. Save the complete native response once before displaying a subset, in retained result state or a local artifact. Keep its location, requested target/selectors, owning job/task, and the record identities and actual versions captured. A complete retained result needs no additional copy.

Before a later capsule or reply read, reuse or locally extract its complete record if already captured and still known current. A whole-scope result can satisfy later reads of its included capsule and replies; an advertised code alone does not establish that its body was captured. Preserve full human wording, author/advisory status, parent/question/option identity, returned version and selected capsule target. Summaries, hashes, token counts and partial displays do not replace bodies; do not invent missing versions.

Reuse applies only to captured records and scope. Matching capsule code/version does not establish unchanged discussion or capture of other replies, Reports, options or standing notes. Read missing required evidence. Refresh affected evidence after a changed version, new human evidence, conflicting result, incomplete capture, lost content or uncertain freshness. A new reply can change discussion without changing the capsule version: fetch that record and needed context, preserving newer confirmed results and unrelated current bodies.

A standing note's read shows each of its sub notes by code only, and that read is complete. When the note's line for a sub note applies to your current work, read that sub note with `get_job` and `thread_only`, retaining its version. Skip the others.

Read truncated displays from the complete saved result. Extract held complete content for a reviewer artifact without another network read, carrying target/code/version and capture provenance. After context loss, reuse a preserved artifact only when its currentness is still established; otherwise refresh.

## Consult the coordinator

For a request outside your role or assignment, or when you cannot determine where to send it, send the coordinator the original request or its exact saved location, your helper identity and assigned job or item, and the precise uncertainty. Before an action that needs an audit transition, request it from the coordinator and retain the result; request other coordinator-owned actions the same way. Do not assume another role's authority or change the coordinator's subscription, claim, audit, assignment or responsibility for a delivered event. Handle forwarded Pokes before the next affected action under your existing role.

In Codex, use the supplied coordinator Codex thread ID. Plain `collaboration.send_message` does not start an idle turn, and `followup_task` cannot target the root. When the coordinator must take a new turn, use the available `codex_tui.send_message_to_thread` background follow-up with that thread ID, omit the model override, and keep the prompt within 1,000 UTF-8 bytes. Include a saved location for additional evidence when needed. The Uclusion subscriber agent ID is not a Codex thread ID. A successful send confirms delivery only; keep the requested coordinator action pending until its outcome arrives.

In Claude Code, use the resident's exposed `SendMessage` with the confirmed coordinator recipient (`main` or its confirmed launcher identity). Verify the actual tool and recipient; do not assume Codex tool behavior or enable a different execution mode. On another supported surface, use only its established coordinator consultation route.

If the coordinator contact is missing, preserve the direct request and ask for the missing contact through the established relay; do not discard the request or expand your authority. If a communication tool is missing or consultation fails, preserve the unfinished request and confirmed outcomes, report the exact limitation, and use the existing coordinator relay. Do not report an undelivered request as handled or promise a communication path you have not confirmed.

## Human waits and completion

Before yielding for a human response to a product/design question or work-approval request, save the exact request in the relevant Uclusion thread using your role's permitted tools. Present that exact request and canonical link here when this is the response destination; otherwise return them with their responsible helper and destination through the coordinator for forwarding. If saving such a request requires a tool outside your authority, ask the coordinator to arrange that write. A saved request does not grant permission or settle other decisions. Continue independent authorized work and use waits that can be interrupted while helpers are running.

Before presenting or handling a completion package or its reply, read [completion](completion.md).
<!-- /uclusion-skill-reference:v1 -->

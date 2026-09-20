<!-- uclusion-skill-reference:v1 -->
# Work claim lock

When the user opted into work claims, a `claim_work` tool is exposed. It stops
idle agents on any machine from starting the same work. Every auto-take
activation is claim-gated. If auto-take directions arrive without the tool,
present the list but do not load or start an item; tell the human that auto-take
requires work claims. Human-guided selections do not require the tool.

- Call `claim_work` with operation `claim` before loading or starting an
  auto-take lane. Pass every candidate you would be willing to start, in
  preference order, as
  `short_code_ids` (a specifically requested item is a one-element list). The
  result names the single code you now hold; start that item, even when it is
  not your first preference.
- A denied claim means every listed item is already held by other agents. Do
  not start a lane; return to idle delivery, or re-run find_work when new work
  may have arrived.
- A timeout or error result means the lock service is unreachable. No claim was
  granted, so do not start auto-take work; remain idle and report the failure.
  A later direct human selection may use the human-guided path without a claim.
- At every lane handoff (blocked, review requested, or complete), call
  `claim_work` with operation `release` for the held short code. Claims a
  crashed agent leaves behind expire on their own, so never wait for another
  agent's claim beyond a denial. An implementation review and its
  completion-menu wait are not a review handoff: keep that claim until
  the valid selection's execution attempt reaches a terminal outcome and its
  post-attempt record is confirmed.
- Classification lookups and triage reads never claim; merely reading an item
  must not block another agent.

<!-- /uclusion-skill-reference:v1 -->

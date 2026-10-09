<!-- uclusion-skill-reference:v1 -->
# Work claim lock

Keep work claims distinct from session assignment. Follow
[the core](../SKILL.md) for assignment and discovery.

When the user opted into work claims, `claim_work` is exposed. It stops idle
agents on any machine from starting the same work. Human-guided selections do
not require the tool. Classification lookups and triage reads never claim;
merely reading an item must not block another agent.

## Auto-take activation

Auto-take applies only while the session has no human-guided assignment. While
that assignment is retained under the core's Assignment ownership rules, a
find-work result may be presented but must not switch the session automatically.
Waiting for input or an unfinished completion package retains that assignment;
a completed job handoff follows [review.md](review.md).

Every auto-take activation is claim-gated. If `auto_take_directions` arrive
without `claim_work`, present the list but do not load or start an item; tell the
human that auto-take requires work claims.

- Call `claim_work` with operation `claim` before loading or starting an
  auto-take lane. Pass every candidate you would be willing to start as
  `short_code_ids`. For `auto_take_directions`, use only marked candidates in
  returned list order; otherwise use preference order, with a specifically
  requested item as a one-element list. The result names the single code you
  now hold. Assignment begins when that claim succeeds; load and start only
  that item, even when it is not your first preference. Continue its
  selected-lane workflow and material-handoff rule in the same turn. Never
  auto-start an unmarked or unclaimed item, interrupt active work, or override
  a human instruction.
- A denied claim means every listed item is already held by other agents. Do
  not start a lane; return to idle delivery. Further discovery follows the
  triggers in [the core](../SKILL.md), not another Poke or delivery rearm.
- A timeout or error result means the lock service is unreachable. No claim was
  granted, so do not start auto-take work; remain idle and report the failure.
  A later direct human selection may use the human-guided path without a claim.

After any first-session onboarding required by [the core](../SKILL.md), when an
auto-take view goes dry, call `request_work` once per dry spell instead of the
human empty-list opt-in. Keep the core's discovery triggers.

## Retention and release

At every lane handoff (blocked, review requested, or complete), call `claim_work`
with operation `release` for the held short code. An implementation review and
its completion-package wait are not a review handoff: retain the claim until
the reply's execution attempt reaches a terminal outcome and its record is
confirmed. Package presentation, reply handling, waiting and execution remain
solely in [operations.md](operations.md); this unit supplies only the claim
boundary. Releasing a claim does not itself release a retained assignment under
the core or review.md. Claims a crashed agent leaves behind expire on their own,
so never wait for another agent's claim beyond a denial.

<!-- /uclusion-skill-reference:v1 -->

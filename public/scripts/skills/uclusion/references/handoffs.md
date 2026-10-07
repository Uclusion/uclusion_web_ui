<!-- uclusion-skill-reference:v1 -->
# Coordinator progress, handoffs and turn ending

Load this unit for a coordinator progress checkpoint, lane handoff or turn
ending. Implementation helpers return their bounded work and unresolved needs
under the dispatch you supplied from
[coordinator-execution.md](coordinator-execution.md); design helpers use their
selected design package.
Completion-package mechanics, including presentation and waiting, remain solely
in [operations.md](operations.md).

## Durable progress and handoffs

Before ending an auto-taken turn, ensure new results, decisions, blockers and
next steps are durable. An existing substantive artifact is the checkpoint;
use `add_info` only for information still missing, under [writes.md](writes.md).
Do not add a record for unchanged state, an instruction reload or a turn
boundary alone.

A progress checkpoint and an ordinary model/chat turn are not lane handoffs.
At a genuine handoff for blocking human input, review, completion, pause or
interruption:

- Read [pokes.md](pokes.md) and apply assignment-aware discovery, respecting
  operations.md's completion-package boundary.
- For a held claim, load [claims.md](claims.md) before affected handoff actions;
  for an active assigned-job audit, load [audit.md](audit.md).
- Leave an exact blocking dependency in Uclusion.
- For a resolved standalone bug, finish [completion.md](completion.md)'s sweep
  and operations.md's package before work discovery. A job follows
  [job.md](job.md).
- Apply operations.md's notification, commit and context-boundary rules.

## Ending a turn

Do not end while authorized work remains. After writing an artifact or showing
its link, continue every authorized investigation, planning and execution step,
and surface or create the actual next actionable item. A question blocks only
what depends on its answer; keep going on everything else.

End when nothing can proceed without the human. State what you need and why
this lane is blocked. Apply operations.md's completion-package presentation
and later-turn rules exactly, whatever ended the turn, including a Poke or
listener rearm. Never drop required package content to save context. Otherwise
state the pending decision or completed task, applying pokes.md's one-time hint
and discovery triggers. A turn ending alone never calls `find_work` or repeats
its list. When the next item is unrelated or unknown, apply operations.md's
context-clear rule.
<!-- /uclusion-skill-reference:v1 -->

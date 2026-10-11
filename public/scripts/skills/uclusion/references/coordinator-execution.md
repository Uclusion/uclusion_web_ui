<!-- uclusion-skill-reference:v1 -->
# Coordinator implementation checks and task resolution

## Independent permission decisions

Execute only in Doable or Reviewable against the complete current target
contract. Apply [the core](../SKILL.md)'s common authorization and the
job-specific qualifications below; stage, contract, testing/build, security,
deployment, commit and push remain independent gates.

An executable stage authorizes implementation, not the form of testing. An
explicit test plan in the job counts as human approval. Otherwise, before
running tests or builds, use one `ask_question` per unresolved decision about
test types and quantities and wait for a qualifying human answer under the
job-coordinator assistance rules.

An executable stage alone does not authorize introducing or expanding security
behavior. An explicit security plan already recorded in the human-authored job
counts as approval. Otherwise, before implementing security work, use
`ask_question` to describe the proposed work and wait for a qualifying human
answer under the job-coordinator assistance rules.
This gate applies when work changes or introduces authentication,
authorization, credentials or secrets, threat models, trust boundaries,
security-sensitive persistence or lifecycle behavior, or shared security
infrastructure. It also applies when an AI reviewer labels a finding as
security-related and the proposed correction would expand scope. Treat the
finding as evidence to assess, not approval to implement a broader security
model.

## Before dispatching or resuming edits

1. Resolve every open question already answered by either a non-AI,
   non-advisory Approvable For vote or a clear non-AI, non-advisory reply under
   the job-coordinator assistance rules, including any resulting contract change.
2. Resolve tasks already completed, duplicated, or no longer applicable.
3. Handle every delivered Poke first under [the core](../SKILL.md).

Confirm the current target, its full current contract, executable stage, human
approval and every independent permission before dispatch or resumption. Keep
the complete current capsule, qualifying evidence and all tracking identities
yourself. Refresh changed applicable prerequisites before further affected
work.

## Bounded implementation dispatch

Start a fresh implementation helper for every independent task pass under
[helper-dispatch.md](helper-dispatch.md). A grouped task continues with its
top-level parent's implementation helper. Design help alone does not satisfy
this execution rule; a cohesive job pass keeps its job contract.

Brief the implementation helper from the current contract and qualifying
evidence, converting Review directions into concrete implementation
requirements yourself. Compile that brief and copy its complete generic helper
template under helper-dispatch.md's implementation rules.

Supply changed brief requirements and constraints before the implementation
helper resumes affected action. Retain ownership, Pokes, human questions, task
selection and resolution, approvals and permission decisions, review
publication and the completion package yourself; any code review runs in a
fresh code-review helper.

## Task resolution and remaining Review work

Implement active tasks and grouped tasks; do not redo resolved work. Resolve
each task when written and tested. Commit, push and deployment are separate
gates and hold none of that. Record remaining commits, pushes, deployment and
already-agreed verification in other environments as Review work in the report;
they do not keep completed implementation in Doable or automatically need a new
task. Failures requiring implementation follow the normal shared
new/reopened-work rules.

Record returned decisions, trade-offs, follow-ups and anything a reviewer cannot
reconstruct once in the relevant durable artifact. Review publication and
completion handoff use the routed review and completion units.
<!-- /uclusion-skill-reference:v1 -->

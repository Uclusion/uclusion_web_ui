---
name: uclusion-design
description: Compose, revise, or cold-review the current intent/design capsule for a Uclusion job or task after the core Uclusion workflow has selected the executable target and supplied its evidence. Use only for Uclusion capsule writing and review, not for ordinary planning, generic product design, workflow stages, tool calls, persistence, testing gates, security gates, or final review.
---
<!-- uclusion-design-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion design capsule

Write the shortest standalone capsule that lets a new implementer build the
agreed outcome. Scale detail to the work's complexity and uncertainty. The core
`$uclusion` skill owns target selection and every Uclusion tool call; this skill
owns only capsule composition, revision, and cold review.

## Boundary with the core workflow

Accept the target, its current intent/design capsule when one exists, and all
relevant job or task text, qualifying answers, approved plans, prior
authoritative artifacts, and hard source constraints from `$uclusion`. For a
sent capsule, also require the new human input establishing a new contract
before returning a replacement body.

Never choose the target, change a stage, ask or resolve a question, address a
suggestion, call `set_design_capsule`, handle persistence or version conflicts,
approve testing or security work, or request final review. Return the complete
Markdown body to `$uclusion`, which performs those operations.

Before drafting or reviewing, read
[references/examples.md](references/examples.md) completely.

## Evidence gate

A reviewer-divergent choice requires qualifying human evidence attached to
that exact claim. Qualifying evidence is the human-authored job or task text, a
clear non-AI and non-advisory human reply that answers the choice, a non-AI and
non-advisory human For vote on the selected Approvable option, an accepted human
suggestion, or an explicitly approved test or security plan. A hard source
constraint or prior authoritative artifact may support a forced fact, but it
cannot authorize a choice that a reasonable reviewer could make differently.

A human's conversion of an AI-authored suggestion into a task is qualifying
acceptance of the proposal as written. Cite that conversion and the proposal
for the choices it specifies, even though the task retains its AI author.
Do not re-ask those choices unless evidence found after conversion bears on
them; name that evidence in the question. Choices the proposal leaves open
still require qualifying human evidence.

Use a descriptive inline link beside the sentence or bullet it supports. A
detached evidence ledger, an unlinked source list, proximity to a different
claim, unaccepted AI-authored text, a job-level value approval, or an invitation to object
later does not satisfy the gate.

When a selected option supplies the evidence, the same claim block must name
the exact question code, the exact selected option code, and the selected
behavior. Put those identifiers in a descriptive evidence link, such as
`[question Q-Sample-1, selected option O-1: retain the prior result](#q-sample-1)`.
A question-only link does not prove which option the human selected.

If a material choice lacks qualifying human evidence, do not invent a default
and do not hide the choice in prose. Return a typed question to `$uclusion`
that names the decision, the information needed, and discrete options only
when the choice is genuinely discrete. The core workflow files and resolves
the question before asking this skill to continue.

## Compose the system story

Open with a navigational `## Summary`: the files or surfaces to open first and
the broad shape of the change. Mention a new or changed table only when there
is one, with its reason. Use as few lines as needed; one can suffice. Keep actor
outcomes, evidence links and the contract below out of this summary.

Then describe the actor's trigger and outcome, with the material constraints
needed to implement it. State each idea once. Small work may need only one
short paragraph after the summary. Do not add sections or repeat the outcome
to make the capsule look complete.

Integrate only the applicable subjects into that story:

- actor scenarios and terminal outcomes;
- responsibilities, ownership boundaries, and handoffs;
- state, lifecycle, and durable transitions;
- interfaces, payloads, formats, and compatibility constraints;
- validation, partial failure, recovery, races, and concurrency;
- the implementation map across affected surfaces;
- exclusions and non-goals;
- only the testing and security work already approved by the human.

These subjects are prompts, not required sections. Omit irrelevant categories
and obvious exclusions; retain explicit testing or security limits. Every
sentence must add behavior, a necessary boundary, evidence or verification.
Remove repeated rationale, status history and obvious consequences. Use brief
claim-local links rather than retelling the supporting discussion. Do not turn
the capsule into a component checklist, coding plan or question recap. Brevity
must preserve the contract and its evidence, not impose an arbitrary word cap.

## Revise and cold-review

Complete drafting, polishing, and cold review before publication. Once a
capsule is sent, keep its body stable unless new human input establishes a new
contract. For that permitted revision, incorporate the new contract and return
the full replacement body. Never return a fragment or patch. AI discoveries
and implementation differences belong once in the implementation review,
which the core workflow owns.

For a cold review, discard remembered chat and questions. Read only the
candidate capsule and its claim-local evidence. Check that a new implementer
can recover the agreed outcome and material, applicable boundaries, state,
interfaces, failure and concurrency behavior, and approved verification. Do not demand detail
for inapplicable categories. Check that the summary provides navigation without
repeating the contract, and remove prose whose deletion would lose no needed
information. Every reviewer-divergent choice still needs qualifying human
evidence beside it; selected-option evidence names both exact identifiers.

For an unpublished draft or a revision authorized by new human input, return a
revised complete body when the evidence supports a clearer or more complete
contract. Otherwise return findings without rewriting the sent body. If
correction would require an unsupported choice, return the typed question
instead. A capsule fails review when its prose is accurate only with remembered
context, when an evidence ledger leaves the reader to map authority back to
claims, or when its summary is missing or restates the story instead of
pointing at it.
<!-- /uclusion-design-skill:v1 -->

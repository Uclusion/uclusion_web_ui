---
name: uclusion-design
description: Compose, revise, or cold-review the current intent/design capsule for a Uclusion job or task after the core Uclusion workflow has selected the executable target and supplied its evidence. Use only for Uclusion capsule writing and review, not for ordinary planning, generic product design, workflow stages, tool calls, persistence, testing gates, security gates, or final review.
---
<!-- uclusion-design-skill:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Uclusion design capsule

Turn the selected Uclusion target and its evidence into a concise,
implementation-ready system story. The core `$uclusion` skill owns target
selection and every Uclusion tool call. This skill owns only capsule
composition, revision, and cold review.

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

Use a descriptive inline link beside the sentence or bullet it supports. A
detached evidence ledger, an unlinked source list, proximity to a different
claim, AI-authored text, a job-level value approval, or an invitation to object
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

Write freeform Markdown sized to the work. Lead with what the actor experiences
from trigger through terminal success or failure, then make the implementation
contract easy to skim. State each important idea once. Do not split one story
into an “intended outcome” and a second section that restates it as a contract,
and do not create a heading for every planning category.

Integrate only the applicable subjects into that story:

- actor scenarios and terminal outcomes;
- responsibilities, ownership boundaries, and handoffs;
- state, lifecycle, and durable transitions;
- interfaces, payloads, formats, and compatibility constraints;
- validation, partial failure, recovery, races, and concurrency;
- the implementation map across affected surfaces;
- exclusions and non-goals;
- only the testing and security work already approved by the human.

Omit irrelevant categories instead of announcing that each one is
inapplicable, except when an explicit testing or security limit prevents
unauthorized work. Every paragraph or bullet must add behavior, a boundary, or
a constraint that an implementer needs. Delete throat-clearing, repeated
rationale, status history, and obvious consequences. Derive any remaining
structure from the system story. Do not turn the capsule into a component
checklist, chronological coding plan, question recap, or evidence ledger.

## Revise and cold-review

Complete drafting, polishing, and cold review before publication. Once a
capsule is sent, keep its body stable unless new human input establishes a new
contract. For that permitted revision, incorporate the new contract and return
the full replacement body. Never return a fragment or patch. AI discoveries
and implementation differences belong once in the implementation review,
which the core workflow owns.

For a cold review, discard remembered chat and questions. Read only the
candidate capsule and the claim-local evidence it links. Check whether a new
implementer can recover each actor's terminal outcome, responsibility boundary,
state transition, interface, failure and concurrency rule, exclusion, and
approved verification limit. Also check that every reviewer-divergent choice
has qualifying human evidence beside it and that selected-option evidence names
both exact identifiers.

For an unpublished draft or a revision authorized by new human input, return a
revised complete body when the evidence supports a clearer or more complete
contract. Otherwise return findings without rewriting the sent body. If
correction would require an unsupported choice, return the typed question
instead. A capsule fails review when its prose is accurate only with remembered
context, or when an evidence ledger leaves the reader to map authority back to
claims.
<!-- /uclusion-design-skill:v1 -->

<!-- uclusion-design-reference:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Complete capsule examples

The examples below are complete capsule bodies, not isolated sentence
patterns. All Uclusion codes, names, and links are fictional.

## Good: small work stays small

> ## Summary
>
> `ExportButton.jsx`: download-button copy.
>
> When an export is ready, its button reads “Download CSV”. Activation still
> downloads the same file
> ([B-Demo-2: clarify the label without changing the
> action](https://uclusion.example/demo/B-Demo-2)). Verify the ready-state label
> in the existing preview
> ([C-Demo-4: approved visual check](https://uclusion.example/demo/C-Demo-4)).

One summary line and one paragraph cover this change. There is no new lifecycle
or concurrency rule to invent, and no need to announce every unaffected area.

## Good: more detail where behavior requires it

> # Download workspace audit history
>
> ## Summary
>
> Exports panel, worker and API: extend the existing request/status path.
>
> A workspace owner requests an audit-history export and sees its progress.
> Success replaces the current result with an expiring download link
> ([Q-Demo-7, selected O-1: deliver through an expiring
> link](https://uclusion.example/demo/Q-Demo-7)). If a later attempt fails, the
> panel shows that failure but keeps the last successful link available
> ([Q-Demo-8, selected O-2: preserve the prior successful
> export](https://uclusion.example/demo/Q-Demo-8)).
>
> The web app displays progress; the worker publishes only complete files. The
> existing API returns an export ID and `queued`, `running`, `ready`, or `failed`,
> reusing the active export when a repeated request races with it
> ([R-Demo-9: current export states and active-request
> behavior](https://uclusion.example/demo/R-Demo-9)).
>
> Keep the existing surfaces and authorization
> ([J-Demo-12: scope and authorization
> boundary](https://uclusion.example/demo/J-Demo-12)).
>
> Verify one successful download and one failed attempt that preserves the
> prior link
> ([C-Demo-3: approved verification](https://uclusion.example/demo/C-Demo-3)).

Why this works:

- Failure, concurrency and ownership need explicit detail for this outcome.
- Evidence stays beside its claim, with both question and selected option named.
- Navigation, behavior and verification each appear once.

## Weak: repetition and a missing contract

> ## Summary
>
> Make audit exports reliable and easy to understand.
>
> ## Intended outcome
>
> Workspace owners need reliable, understandable audit exports.
>
> ## Behavior
>
> Exports will remain available for 30 days and will also arrive as email
> attachments. Concurrent requests and failures will be handled safely. The
> implementation should preserve compatibility and provide useful errors.
>
> ## Evidence
>
> - [Q-Demo-7: delivery question](https://uclusion.example/demo/Q-Demo-7)
> - [Q-Demo-8: failure question](https://uclusion.example/demo/Q-Demo-8)
> - [R-Demo-9: API source](https://uclusion.example/demo/R-Demo-9)

Why this is weak:

- The opening repeats the outcome instead of providing navigation.
- “Handled safely,” “preserve compatibility,” and “useful errors” never say
  what happens when an export fails or requests race.
- Retention and email attachments are unsupported additions.
- Detached links without selected options do not establish which behavior was
  approved. Making this prose shorter would not repair its missing contract.

## When evidence is missing

Do not write the unsupported behavior into either capsule. Return a typed
question to the core workflow, for example:

> Export retention question: how long should a completed export remain
> downloadable? The current evidence defines delivery and failure behavior but
> does not select a retention period.
<!-- /uclusion-design-reference:v1 -->

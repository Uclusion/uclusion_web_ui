<!-- uclusion-design-reference:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Complete capsule examples

Use these complete capsule patterns; all codes, names and links are fictional.
Keep each sentence only when deleting it would lose necessary behavior,
constraint, navigation, evidence or permission scope.

## Small change

> ## Summary
>
> `ExportButton.jsx`: ready-state label.
>
> When an export is ready, label its download button “Download CSV”; keep the
> same download action ([T-Demo-2: label-only
> change](https://uclusion.example/demo/T-Demo-2)). Check that label once in the
> existing preview; no broader tests or build ([Q-Demo-4, selected Q-Demo-4_O-1:
> one visual check](https://uclusion.example/demo/Q-Demo-4)).

State navigation, behavior and the approved check once. Include lifecycle or
concurrency constraints only when the work needs them.

## Failure and concurrency matter

> ## Summary
>
> `ExportsPanel.jsx`, `exportWorker.py`, `exports.py`: audit-history export.
>
> A workspace owner requests an audit-history export through the existing owner
> authorization ([J-Demo-12: actor and scope](https://uclusion.example/demo/J-Demo-12)).
> Success replaces the current result with a download link ([Q-Demo-7, selected Q-Demo-7_O-1: link
> delivery](https://uclusion.example/demo/Q-Demo-7)); a failed retry shows its
> failure and retains the prior successful link ([Q-Demo-8, selected Q-Demo-8_O-2:
> preserve prior export](https://uclusion.example/demo/Q-Demo-8)).
>
> The worker publishes only complete files. The existing API returns an export
> ID and `queued`, `running`, `ready`, or `failed` status for the panel to display;
> racing repeated requests reuse the active export ([R-Demo-9: existing export
> contract](https://uclusion.example/demo/R-Demo-9)).
>
> Check one successful download and one failed retry retaining its prior link;
> no build or broader suite ([Q-Demo-3, selected Q-Demo-3_O-1: focused
> verification](https://uclusion.example/demo/Q-Demo-3)).

Include required failure, ownership and race behavior. Name both the question
and its full selected option code at each option claim.

## Weak: repetitive and incomplete

> ## Summary
>
> Make audit exports reliable.
>
> Workspace owners need reliable audit exports. Exports remain available for
> 30 days and arrive as email attachments. Failures and concurrent requests are
> handled safely; preserve compatibility and provide useful errors.
>
> ## Evidence
>
> [Delivery question](https://uclusion.example/demo/Q-Demo-7),
> [failure question](https://uclusion.example/demo/Q-Demo-8).

Replace a repeated outcome in Summary with navigation. Obtain authority for
retention and attachments, and specify failure and race behavior. Place evidence
beside each claim and name its selected option; finish the missing contract
before tightening its prose.

## Missing evidence

Return a typed question instead of an unsupported capsule choice:

> **Decision question — audit-history export:** how long should a completed
> export remain downloadable? The delivery evidence selects a link but no
> retention period.
<!-- /uclusion-design-reference:v1 -->

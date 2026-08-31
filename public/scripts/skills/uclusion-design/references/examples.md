<!-- uclusion-design-reference:v1 -->
<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Complete capsule examples

The examples below are complete capsule bodies, not isolated sentence
patterns. All Uclusion codes, names, and links are fictional.

## Good: one concise system story

> # Download workspace audit history
>
> When a workspace owner requests an audit-history export, the existing Exports
> panel starts one export and shows its progress. Success replaces the current
> result with an expiring download link
> ([Q-Demo-7, selected O-1: deliver through an expiring
> link](https://uclusion.example/demo/Q-Demo-7)). If a later attempt fails, the
> panel shows that failure but keeps the last successful link available
> ([Q-Demo-8, selected O-2: preserve the prior successful
> export](https://uclusion.example/demo/Q-Demo-8)).
>
> The web app owns the request and status display; the export worker owns file
> generation and publishes only complete files. The existing API returns an
> export ID, reports `queued`, `running`, `ready`, or `failed`, and returns the
> active export when a repeated request races with it
> ([R-Demo-9: current export states and active-request
> behavior](https://uclusion.example/demo/R-Demo-9)). No new transport is
> introduced.
>
> Work stays in the existing Exports panel, worker, and API documentation. It
> does not add email attachments, a new export page, or a new authorization
> model
> ([J-Demo-12: existing surfaces and authorization remain in
> scope](https://uclusion.example/demo/J-Demo-12)). Verification is one live
> request through download plus one live failed attempt that preserves the
> prior link
> ([C-Demo-3: approved verification](https://uclusion.example/demo/C-Demo-3)).

Why this works:

- The first paragraph gives the actor, trigger, success, and failure without a
  second section restating them.
- Each later paragraph adds information an implementer needs: ownership and
  states, then scope and verification. Removing one would remove a real part of
  the contract.
- The two human choices are attached to the behavior they authorize, and each
  link visibly names the exact fictional question and selected option.
- The source artifact supports an existing API fact, not a product choice.
- Concrete states and terminal outcomes replace phrases such as “handle
  failures safely.”

## Weak: a long requirements-shaped recap

> # Intended outcome
>
> Workspace owners need a robust, secure, scalable, and user-friendly way to
> export audit history. The system should make exports reliable and easy to
> understand while preserving previous work.
>
> # Composition and evidence contract
>
> The export experience must communicate progress, success, and failure. It
> must be durable and reviewable. All decisions should be supported by the
> available evidence, and the implementation should follow best practices.
>
> # Components
>
> - Export panel
> - Export API
> - Queue
> - Object storage
> - Email service
> - Monitoring
>
> # Behavior
>
> Exports will remain available for 30 days and will also arrive as email
> attachments. Concurrent requests and failures will be handled safely. The
> implementation should preserve compatibility and provide useful errors.
>
> # Implementation plan
>
> First update the API, then create the worker, then modify the panel, then add
> monitoring and tests. Reviewers can flag any concerns with these choices.
>
> # Evidence
>
> - [Q-Demo-7: delivery question](https://uclusion.example/demo/Q-Demo-7)
> - [Q-Demo-8: failure question](https://uclusion.example/demo/Q-Demo-8)
> - [R-Demo-9: API source](https://uclusion.example/demo/R-Demo-9)

Why this is weak:

- The first two sections repeat the same aspiration in different abstract
  words. They consume attention without adding implementable behavior.
- Six headings make the reader assemble the design themselves. The capsule is
  long because it records writing categories, not because the design is
  complex.
- The component list and chronological plan describe how to organize work, not
  what the actor or system experiences.
- “Handled safely,” “preserve compatibility,” and “useful errors” never say
  what happens when an export fails or requests race.
- Thirty-day retention, email attachments, object storage, and monitoring are
  unsupported additions. “Flag concerns later” does not turn them into agreed
  choices.
- The evidence ledger is detached from the claims, and the question links do
  not name selected option codes. A skimming human cannot tell which behavior
  was actually approved.

## When evidence is missing

Do not write the unsupported behavior into either capsule. Return a typed
question to the core workflow, for example:

> Export retention question: how long should a completed export remain
> downloadable? The current evidence defines delivery and failure behavior but
> does not select a retention period.
<!-- /uclusion-design-reference:v1 -->

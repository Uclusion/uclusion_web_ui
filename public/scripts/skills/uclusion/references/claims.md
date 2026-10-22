<!-- uclusion-skill-reference:v1 -->
# Working roles: work claim lock

Claims differ from assignment. Exposed claim_work means human opt-in; human-guided selection needs no claim, and classification never claims. Auto-take applies only when no retained human-guided assignment, including pending input/package. Without claim_work, present auto-take results but load/start nothing and explain required claims.

## Auto-take activation

Before auto-take lookup/start, use claim_work with operation:claim and short_code_ids listing all willing candidates: marked auto_take_directions items only in returned order, otherwise preference order (explicit requested item alone). Successful claim assigns its returned code; load only it with initial_read:true and continue that lane immediately. Never start unmarked/unclaimed work, interrupt assignments or override humans. Denial returns idle; no rediscovery from rearm/Pokes. Error/timeout grants nothing: remain idle/report; later human selection may bypass claims.

First-session onboarding takes precedence; later dry auto-take views request_work once per dry spell under normal discovery triggers.

## Retention and release

Use claim_work with operation:release for the held short code at real blocked/review/complete handoff, except implementation review/package waits retain it through terminal execution outcome and confirmed record. completion.md owns package actions. Claim release never releases retained assignment; review/standalone roles confirm release to root. Crashed claims expire; never wait past denial.
<!-- /uclusion-skill-reference:v1 -->

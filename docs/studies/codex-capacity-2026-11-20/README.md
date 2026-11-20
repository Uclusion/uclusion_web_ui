<!-- Copyright (c) 2026 Uclusion, Inc. All rights reserved. -->
# Codex concurrency capacity study

Study for B-all-741, conducted November 20, 2026. See the
[brief documentation](https://documentation.uclusion.com/github-and-cli-integrations/agent-concurrency/)
for the selected default and its installation behavior. Claude uses the same
sixteen-helper allowance by the human's subsequent instruction; no independent
Claude capacity benchmark was run. The measurements below are from Codex only.

The target is a practical estimate of useful agent concurrency before local
resource use or interference becomes excessive. The human selected **sixteen
helpers plus one coordinator (seventeen total)** after reviewing the study,
as a reasonably large limit with observed headroom during normal laptop use.
Codex's upstream four-total V2 default does not provide
published evidence of a local resource threshold and is not used as such here.

## Workload and platform

The November 20, 2026 study used Codex CLI 0.170.0 and the Uclusion runtime from
web UI commit `e697e6c2388d4038c828629a62c9d524f7b07c37`. The runs used a private
copy; the study itself did not update the resident installation or user
configuration. Each native
root and helper uses `gpt-6.2-sol` with low reasoning effort. The measured Linux
laptop (Ryzen AI 7 350) has eight physical CPU cores, sixteen logical CPUs, and
14.74 GiB of visible RAM. The human confirmed that they were doing other normal
work on this same laptop during the runs. That is representative context for a
practical default with headroom: the observed capacity includes ordinary human
use of the machine. It does not invalidate the study or require an idle-machine
rerun. Concurrent host activity is recorded with each case; it limits attribution
of small timing and I/O differences solely to helper count. This is one measured
platform, not a universal customer specification.

Eight real verification packets cover Codex configuration, native inbox
ownership, native history/notices, MCP stdio, audit storage, audit transport,
audit hardening, and skill installation. Their existing Python suites comprise
236 tests. The deterministic baseline passed all 236 with no skips; individual
packets took 1.27–4.82 seconds. This is source inspection with light local tests,
not a heavy build or browser workload.

The requested jump to sixteen uses two independent replicas, A and B, of these
eight packets: sixteen real task units and 472 tests. At sixteen helpers each
owns one unit; at eight or four helpers each owns two or four units respectively.
Each reads bounded source/test evidence, reads its assigned disposable DEV record,
runs the packet once, and writes a short grounded report. The root consolidates
the reports and compares A/B findings. Replica reports are independent checks,
not sixteen distinct product tasks. Any lower-count comparison must use the
same sixteen units, source bytes and outcome requirements. Replicas stay on
different helpers at lower counts. Allocation pairs the largest and smallest
weights recursively within each replica, where weight is serial test seconds
plus excerpt bytes/2000. This is an approximate scheduling aid, not a model of
agent execution time. The exact test classes, bounded excerpts and allocations
are retained with the harness and each case's `study.json`.

Tests use separate output directories, HOME, UCLUSION_HOME, CODEX_HOME and
temporary directories. Frozen source must remain unchanged. Command networking
is enabled for the existing loopback HTTP/socket fixtures; participants are
instructed to make no other command-level network calls. The configured MCP is
restricted to disposable DEV records, and participant MCP operations are
limited to the assigned reads. No production or stage work record is a fixture.

## Measurements and bounds

Helper counts exclude the coordinator. Sixteen helpers therefore uses a V2
total-thread limit of seventeen. The original full-case acceptance rule requires native histories to
identify the requested number of distinct direct helpers, the exact packet
allocation, matching model/effort, and at least five seconds with all requested
helper turns active. Partial observations remain useful when labeled with the
actual measured concurrency and missing acceptance checks. Active turns include model waiting; they are not equivalent
to simultaneous CPU jobs. Packet process overlap is reported separately.

The observer samples private process trees and the host every 0.5 seconds:
CPU time, proportional set size (PSS), resident set size (RSS), available RAM,
memory pressure, swap traffic, OOM counters, and actual MCP threads/sockets.
Native turn timestamps provide the active-agent timeline. Packet receipts
provide useful completion, local test duration, child CPU and peak child RSS.
Token counts and provider errors are separate from local resource measurements.

Every case has a ten-minute and four-million-reported-token ceiling. Reported
input includes reused/cached tokens and is not a dollar-cost figure. Emergency
stops are a new host OOM kill, available RAM below 1 GiB for ten seconds, or
memory full PSI avg10 at least 5% with swap activity for ten seconds. These are
protective limits, not definitions of an optimum. A failure is inspected before
another case; incomplete cleanup stops further cases. Native shutdown and an independent private-process
census precede fixture removal.

All source bytes are read before timing for a consistent warm-input policy.
The observer records a host baseline, a blank-client baseline, and a quiescent
post-work sample. PSS is preferred because summed RSS counts shared pages more
than once. Sampling can miss short-lived subprocesses; packet child-resource
receipts supplement it. Cache effects, provider latency and background work
remain limitations of a small study.

## November 20 results

The actual live order was **16, 4, 8 helpers**, each with one additional root.
The same sixteen units and 472 test executions were used in every case. Earlier
two-helper and sixteen-helper startup attempts produced no model tokens or
helper work and are excluded. Their invocation/history-startup failures and
cleanup receipts are retained; they are not capacity failures.

The primary comparison is time from root input to the successful write of the
last valid packet report. It includes spawning, model waiting, source inspection
and test execution, and excludes the root's final consolidation. This endpoint
is available for the interrupted sixteen-helper case as well as completed cases.
Resource measurements below use that same interval. All reported input tokens
include cached input; they do not measure CPU consumption or dollar charges.

| Helpers (+ one root) | Seconds to 16 reports | Peak active helpers | Seconds all helpers active | Peak private PSS | PSS above blank client | Tests passed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 111.20 | 4 | 77.04 | 0.724 GiB | 405 MiB | 472 |
| 8 | 79.75 | 8 | 33.03 | 0.991 GiB | 683 MiB | 472 |
| 16 | 71.96 | 15 | 0 | 1.198 GiB | 888 MiB | 472 |

| Helpers | Observed process CPU seconds | Average / peak busy CPU cores | Minimum host available RAM | Peak host I/O full PSI avg10 | Model tokens, including cached input |
| --- | ---: | ---: | ---: | ---: | ---: |
| 4 | 24.77 | 0.22 / 0.82 | 3.17 GiB | 4.07% | 2,945,876 |
| 8 | 26.58 | 0.34 / 1.09 | 3.80 GiB | 6.23% | 3,252,629 |
| 16 | 32.66 | 0.46 / 1.53 | 3.76 GiB | 7.87% | 3,580,786 |

Peak CPU is a half-second sample. These process totals cover the private native
client, its MCPs and tool descendants; they exclude the external observer and
fixture runner. The sampler itself used 4.3–5.4 CPU seconds per measurement
interval. The maximum overlapping test packets were 2, 4 and 3 respectively,
so these were not 4/8/16 simultaneous CPU-heavy jobs. Average active helper
counts over the report interval were 3.13, 5.33 and 6.84.

Host memory full PSI and CPU some PSI avg10 remained zero, and no OOM or resource
stop occurred. I/O full PSI started at zero and rose during each case; fixture,
observer and background I/O all contribute. Host-wide swap in/out during the
report intervals was approximately 1.69/13.67 MiB, 0.56/0 MiB and 2.05/2.52 MiB
for 4/8/16. These host counters cannot isolate the experiment's contribution.
Blank-client available RAM was 4.85, 4.45 and 4.66 GiB respectively; background
activity means total host availability need not track private PSS alone. The
remaining RAM and absence of CPU/memory pressure were observed while the laptop
was also in normal human use; the data cannot identify which workload caused
each host-wide I/O stall.

All cases produced sixteen reports with no reported contract discrepancies and
no failed/skipped packet tests. Captured participant MCP calls were exactly the
sixteen assigned reads, with no remote writes. Four and eight also passed the
final frozen-source fingerprint check. Inspection commands included corrected
missing-filename/search mistakes; these were not new test failures or fixture
collisions. No provider error/rate-limit events were captured. MCP read median
latencies were about 0.38, 0.37 and 0.37 seconds, with one 4.79-second call in the
eight-helper case. Provider and command latency were not experimentally controlled.

Approximately 90–93% of captured model input was cached. The three cases reported
9,779,291 input-plus-output tokens in total. Account-wide weekly quota readings
were 87%, 88% and 89% used; those coarse values include other work and do not
give a per-case charge. No token ceiling was reached.

The sixteen-helper run retained all sixteen reports and 472 passing tests, but
final root consolidation/history capture failed near the observer's 16 MiB trace
limit. The saved outer error is `Run and history capture failed`; its inner
error was not preserved. Trace size and the pending history-copy operation are
consistent with the trace guard being the cause. This is partial evidence,
not a fully passed end-to-end case. All sixteen helpers started, but serial
spawning and short tasks produced a peak of fifteen active helpers for only
0.313 seconds; at least fourteen were active for 6.553 seconds.

For subsequent cases the trace allowance was raised to 64 MiB and completed
helper histories were captured once instead of on every poll. That can reduce
observer overhead, so small timing/CPU differences are not attributable solely
to concurrency. The four-helper case completed its root summary, all local
checks and cleanup. A final grader incorrectly applied the MCP-only allowlist
to permitted shell calls; the narrow filter was corrected and the saved full
trace passed offline grading. There was no paid rerun.
The eight-helper case passed the full run and grading, including its final root
summary. Each actual case ended with zero private processes in an independent
census and a successful disposable-DEV-market deletion receipt.

The process sampler observed only the coordinator retaining delivery ownership.
At all three levels, the last settled sample showed one thread, zero
sockets and about 37–38 MiB PSS per helper MCP; the helpers accumulated zero CPU
ticks over the final approximately 9.5-second sample window. The coordinator
had five threads and two sockets. The sixteen-helper sample precedes forced
shutdown; the four/eight-helper samples are five seconds after normal root completion.
These are observed idle costs, not a claim that a helper MCP consumes no CPU
while serving a request.

The human selected **sixteen helpers plus one coordinator**: “So we are going
with 16? That should be a reasonably large but fairly safe number.” The rationale
is a reasonably large concurrency allowance with the local headroom observed
while the laptop was also in normal use. The selected value is now the installer
default; existing user settings still require an affirmative installer override.
This study did not mutate the resident installation or configuration.

Eight reduced report time by 28.3% relative to four. Doubling again to sixteen
saved 9.8% more time while increasing peak private PSS by 20.8%. Those diminishing
returns remain measured facts; they do not negate the selected allowance or
establish a CPU/RAM safety ceiling. The sixteen-helper result has incomplete
root capture and a peak of fifteen active helpers. One run per level, serial
spawning, the capture-policy change and provider jitter limit the comparison.
The earlier unsupported eight-helper choice is not retroactively approved.

## Reproduction and evidence

The companion SDK harness is
[`capacityProbe.js`](https://github.com/Uclusion/nodejs_sdk/blob/dd31896f6ed7a80abdec306011ec0224c99a6995/testAgentDev/capacityProbe.js)
in the `nodejs_sdk` repository at commit
`dd31896f6ed7a80abdec306011ec0224c99a6995`, with
`capacityPackets.json`, `capacityPacketRunner.py`, `capacitySampler.py` and the
offline `capacityReport.py`. It reuses the existing native launcher, guarded DEV
fixture deletion and artifact redaction. Example invocation from that repository:

```sh
TEST_AGENT_DEV_USE_LOCAL_AUTH=1 \
TEST_AGENT_DEV_WEB_UI_ROOT=/path/to/frozen-runtime-source \
TEST_AGENT_DEV_ARTIFACT_DIR=/path/to/new-case-artifacts \
TEST_AGENT_DEV_CAPACITY_BASELINE=/path/to/baseline-tests.json \
TEST_AGENT_DEV_CAPACITY_HELPERS=16 \
node testAgentDev/capacityProbe.js
```

Use existing authorized credentials; do not copy authentication into published
evidence. The report command only reads retained evidence and makes no model
calls:

```sh
python3 testAgentDev/capacityReport.py /path/to/new-case-artifacts 16
```

Private study artifacts are under
`/home/disrael/dev/.artifacts/bug741-capacity-20261120`: source hashes, baseline
receipts, frozen plans, native traces, packet reports, resource timelines and
cleanup receipts. Durable discussion is on B-all-741; the measurement grant is
[C-all-2840](https://stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/C-all-2840)
and the request to jump to sixteen is
[C-all-2842](https://stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/C-all-2842).
The measured findings are saved in
[C-all-2843](https://stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/C-all-2843).
The human's confirmation of concurrent normal laptop use is
[C-all-2844](https://stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/C-all-2844).
The human's selected sixteen-helper limit is
[C-all-2845](https://stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/C-all-2845).
The portable [results snapshot](results.json) includes
exact test identities, packet allocation, timelines, hardware, metrics, current
harness hashes, raw trace/resource hashes and cleanup receipts. The benchmark
runtime commit remains historical evidence from before the sixteen-helper
default was selected; it is not rewritten to the later installer revision.
The harness source repository is
[Uclusion/nodejs_sdk](https://github.com/Uclusion/nodejs_sdk).

## Interpretation

A successful unsaturated point establishes tested headroom for this workload
and machine. It does not locate the resource ceiling or establish a universal
optimum. Disjoint verification cannot establish safety for competing source
edits, shared test fixtures, larger builds, or browser work. Provider quota or
rate failure must not be reported as local CPU/RAM saturation. The selected
sixteen-helper default is a practical allowance with observed headroom, not a
claim of universal safety for every machine or workload.

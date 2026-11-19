# Uclusion UI

[Uclusion](https://www.uclusion.com) reserves all commercial rights to this code but it is available as a learning resource for anyone coding in React, building PWA, using Amplify, using Material UI, etc.

## Diagnosing a slow or timed-out CLI command

Enable diagnostics before running the command that needs investigation:

```sh
uclusion -e stage --diagnostics "$HOME/.uclusion/cli-diagnostics" get_job --short-code-id J-Demo-3 --json
```

For a caller that starts CLI subprocesses, set `UCLUSION_DIAGNOSTICS_DIR` in
their environment. An explicit `--diagnostics DIR` takes precedence. The CLI
creates the directory with mode 0700 and writes one mode-0600
`uclusion-cli-TIMESTAMP-PID-INVOCATION.jsonl` file per invocation. An existing
directory must also be private; a nonprivate or unwritable destination leaves
the command's output and status unchanged and produces no usable diagnostics.
Verify a file is being created before relying on capture. Diagnostics are off
when neither setting is supplied.

Each JSONL record has UTC, wall-clock and monotonic timestamps, an invocation
ID and PID; supported systems also record the suspend-aware boottime clock.
The events show credential/configuration loading, login, MCP request IDs and
safe target codes, DNS/connect/TLS and HTTP header/body phases, returned AWS
request IDs, and errors by type. A clock gap is evidence to investigate, not
proof of suspension. Every ten seconds a running command records Python
stack locations and active phases without source text, arguments or locals.
This lets the last durable records identify a blocked operation even when a
parent's timeout kills the CLI. SIGTERM/SIGINT also request a snapshot. SIGKILL
cannot be caught; it leaves the records already written, without a guaranteed
final record. A call that ran with diagnostics disabled cannot be reconstructed
afterward.

Request and response bodies, arbitrary command content, credentials, tokens,
authorization/cookie headers and URL queries are excluded. Nothing is uploaded
automatically. Inspect the relevant invocation file locally and share it with
support only when you choose to; it still contains operational metadata such
as target codes, IP addresses, process IDs and stack locations. There is no
need to share credential files or ordinary command output. The final record's
`gaps` field and any `coverage_gap` record describe incomplete capture.

Files are capped at 1 MiB. On each invocation, retention removes only owned,
inactive diagnostic files older than seven days or beyond the newest 50;
active files and unrelated files are retained. Platforms without advisory
file locks report a retention gap and leave older files for manual removal.
Diagnostic failures do not change requests, authentication, retries, stdout,
stderr or exit status. The logger observes existing timeout behavior; it does
not add a new transport timeout or retry a failed operation.

## Workflow release hashes and token counts

After editing workflow assets, refresh their hashes in `WORKFLOW_ASSET_SHA256`
in `public/scripts/uclusionInstall.py` and regenerate the changed artifact
counts in `public/scripts/token-manifest.json` with `countArtifactTokens.py`.
Refresh the manifest's installer hash too.

On the local development workstation, `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`
are stored in `~/.config/uclusion-dev/keys.env`. Load them before counting:

```sh
set -a
. "$HOME/.config/uclusion-dev/keys.env"
set +a
```

See `countArtifactTokens.py` for the stage export and counter arguments.
Validate with `python3 checkWorkflowAssetPins.py public/scripts`, then run
`python3 checkWorkflowAssetPins.py` against the rebuilt `build/scripts` assets
before deployment.

## List of articles about this code

[Notes on S3 backed File Downloads](https://dev.to/uclusionhq/notes-on-s3-backed-file-downloads-42i3)  
[Gotchas with Service Workers and SPAs](https://dev.to/uclusionhq/gotchas-with-service-workers-and-spas-44e6)  
[Stopping memory leaks in AWS Amplify Hub](https://dev.to/uclusionhq/stopping-memory-leaks-in-aws-amplify-hub-3f9c)  
[Powering Client Side Search with React Contexts](https://dev.to/uclusionhq/powering-client-side-search-with-react-contexts-2o9j)  
[Navigation in React](https://dev.to/uclusionhq/navigation-in-react-5bh3)  
[Wizards aren’t just for Hogwarts](https://dev.to/uclusionhq/wizards-aren-t-just-for-hogwarts-14kd)  
[Authenticated S3 Downloads Without Passing Through Your Lambdas](https://dev.to/uclusionhq/authenticated-s3-downloads-without-passing-through-your-lambdas-3i3k)   
[Uploading user files to S3 without passing through your Lambdas](https://dev.to/uclusionhq/using-a-message-bus-and-react-context-instead-of-redux-with-promise-based-apis-26ic)  
[Using a message bus and React context instead of Redux with promise based APIs](https://dev.to/uclusionhq/using-a-message-bus-and-react-context-instead-of-redux-with-promise-based-apis-26ic)  
[Amplify and Github Login](https://dev.to/uclusionhq/circleci-aws-cognito-amplify-and-github-login-3poc)  
[Multiple tabs in your app](https://dev.to/uclusionhq/multiple-tabs-in-your-app-133b)  

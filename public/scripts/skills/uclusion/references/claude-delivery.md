<!-- uclusion-skill-reference:v1 -->
# Claude Code session-owned Poke delivery

Before work, arm one session-owned delivery task unless already running. Use Monitor `persistent:true` with `uclusion listen`; never expiring Monitor. Otherwise run `uclusion wait --timeout 86400` in the foreground inside one Bash `run_in_background=true` task with the largest accepted tool timeout; never add shell `&` or a PID wrapper. If launch approval is declined, continue without delivery.

On completion, read output, route accepted messages/start the responsible helper, then rearm the same turn before final chat, including quiet timeout/limit exits. Never adopt/stop another session's delivery task or scan processes to find one.
<!-- /uclusion-skill-reference:v1 -->

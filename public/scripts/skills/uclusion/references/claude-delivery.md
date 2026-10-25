<!-- uclusion-skill-reference:v1 -->
# Claude Code session-owned delivery

Before work, arm one session-owned delivery task unless already running. Use the resident CLI's `listen` in a persistent Monitor (`persistent:true`). If unavailable, run the resident CLI's `wait --timeout 86400` in the foreground inside one native Bash background task (`run_in_background:true`), with the largest accepted tool timeout. Keep the command attached to that task: no shell `&` or PID wrapper. A declined launch lets work continue without delivery.

Route accepted messages from delivered output through the dispatcher. On task completion, including quiet timeout or limit exits, route any remaining output and rearm in the same turn before final chat. Preserve the owning session's identity and launch results. Manage only this session's task; do not adopt or stop another session's task or scan processes to find one.
<!-- /uclusion-skill-reference:v1 -->

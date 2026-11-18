<!-- uclusion-skill-reference:v1 -->
# Claude Code session-owned delivery

Before work, start one delivery task owned by this session unless it is already running. Use the resident CLI's `listen` in a persistent Monitor (`persistent:true`). If Monitor is unavailable, run the resident CLI's `wait --timeout 86400` in the foreground inside one native Bash background task (`run_in_background:true`), with the largest accepted tool timeout. Keep the command attached to that task: no shell `&` or PID wrapper. A declined launch lets work continue without delivery.

Preserve the human's `UCLUSION_CONSUMER`. Add history flags to `listen` or `wait` only on human request: `--ignore-existing-pokes` skips queued messages for that consumer; `--deliver-existing-pokes` gives a new consumer a private history copy and leaves established or default consumers unchanged. Never combine the flags; neither deletes records nor changes other consumers.

After adopting a job or standalone bug, this coordinator session runs the resident CLI's `subscribe <short code>`; retry a failure before dependent work. The subscription is permanent.

When the delivery task finishes, including a quiet timeout or limit exit, handle its remaining output before restarting delivery in the same turn; complete the restart before sending a final response. Preserve the owning session's identity and launch results. Manage only this session's task; do not adopt or stop another session's task or scan processes to find one.
<!-- /uclusion-skill-reference:v1 -->

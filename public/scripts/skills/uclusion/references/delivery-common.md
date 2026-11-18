<!-- uclusion-skill-reference:v1 -->
# Delivery contract

When about to perform an action, reuse callable tool definitions already held. For a missing definition, look up the exact tool name when known and read its full description and argument schema before calling. Otherwise narrow discovery to the capability needed for the current action. Where output is controllable, return candidate names first, then descriptions and schemas only for selected tools needed to make the call. A bounded semantic search may identify candidates. With `ALL_TOOLS`, emit names from candidate searches and full records only for selected tools; never print broad matches with full metadata. An inventory or linked module is not an instruction to preload its tools. Keep required reference reads complete.

Use the complete CLI command, environment and client delivery mechanism selected by the bootstrap. Leave inbox-database reads and writes to the transport.

The selected Claude or Cursor delivery reference owns listener startup, consumer configuration, subscription, rearm and exit. Keep delivery within the resident mechanism.

On `[Uclusion update notice ...]`, explain the stale install and ask permission for the environment-correct update command. After success require client restart or MCP reconnect. If declined, continue without asking again that session. The resident CLI's `update --check` is read-only.
<!-- /uclusion-skill-reference:v1 -->

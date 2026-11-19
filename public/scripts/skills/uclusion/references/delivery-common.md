<!-- uclusion-skill-reference:v1 -->
# Delivery contract

At an action boundary, reuse complete current definitions. For a missing definition, use native exact-name discovery when known; otherwise narrow by capability. Do not preload inventories. With `ALL_TOOLS`, replace these example values for the needed action:

```js
text(ALL_TOOLS.find(t => t.name === "mcp__uclusion__get_job") ?? "No exact match");
```

```js
text(ALL_TOOLS.filter(t => t.name.startsWith("mcp__uclusion__") && /attached files/i.test(t.description)).slice(0, 5).map(t => t.name));
```

Candidates are names only, capped at five. Load the selected exact name's full description/schema before calling. For missing matches, empty searches, unavailable tools or a changed tool set, refine the bounded names-only lookup; never dump the catalog. Reload changed definitions and report unavailable capabilities through the role route. Keep required reference reads complete.

Use the complete CLI command, environment and client delivery mechanism selected by the bootstrap. Leave inbox-database reads and writes to the transport.

The selected Claude or Cursor delivery reference owns listener startup, consumer configuration, subscription, rearm and exit. Keep delivery within the resident mechanism.

On `[Uclusion update notice ...]`, explain the stale install and ask permission for the environment-correct update command. After success require client restart or MCP reconnect. If declined, continue without asking again that session. The resident CLI's `update --check` is read-only.
<!-- /uclusion-skill-reference:v1 -->

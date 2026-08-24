import React from 'react';
import { Typography } from '@material-ui/core';
import Link from '@material-ui/core/Link';
import { getUclusionEnvironment } from './installUtils';

// T-all-2467: explain uclusion codex and that a turn only starts when you type something
function StartWorkingInstructions() {
  const environment = getUclusionEnvironment();
  const codexCommand = environment === 'production'
    ? 'uclusion codex'
    : `uclusion -e ${environment} codex`;
  return (
    <>
      <Typography variant="subtitle1">
        Claude Code and Cursor launch normally. Codex must be launched
        with <b><code>{codexCommand}</code></b> instead of <code>codex</code> because that private
        relay is the only way Uclusion Pokes reach your Codex chat.
      </Typography>
      <Typography variant="subtitle1" style={{paddingTop: '0.5rem'}}>
        After agent-led setup, fully exit and relaunch the client from its configured scope so
        the installed resident instructions load; MCP reconnect alone is insufficient.
      </Typography>
      <Typography variant="subtitle1" style={{paddingTop: '0.5rem'}}>
        Your AI does nothing until you start a turn by typing something. Type "go" (or anything
        else) and the AI runs Uclusion's find_work and presents your work list. For a new
        workspace's first AI session, it immediately follows the onboarding guidance that is
        served only once. On an ordinary later empty list, it asks exactly: "Your find work list
        is empty—would you like instructions for adding and working on a job?" To skip typing "go"
        each time, see <Link href="https://documentation.uclusion.com/github-and-cli-integrations/mcp/#starting-a-session-on-find_work" target="_blank">starting
        a session on find_work</Link> to alias your agent.
      </Typography>
    </>
  );
}

export default StartWorkingInstructions;

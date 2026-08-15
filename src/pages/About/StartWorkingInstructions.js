import React from 'react';
import { Typography } from '@material-ui/core';
import Link from '@material-ui/core/Link';

// T-all-2467: explain uclusion codex and that a turn only starts when you type something
function StartWorkingInstructions() {
  return (
    <>
      <Typography variant="subtitle1">
        Claude Code and Cursor launch normally. Codex must be launched
        with <b><code>uclusion codex</code></b> instead of <code>codex</code> because that private
        relay is the only way Uclusion Pokes reach your Codex chat.
      </Typography>
      <Typography variant="subtitle1" style={{paddingTop: '0.5rem'}}>
        Your AI does nothing until you start a turn by typing something. Type "go" (or anything
        else) and the AI runs Uclusion's find_work and presents your work list. If no work is
        available, it asks whether you want a tutorial. Say yes and it walks you through view
        setup, collaborators, and creating your first job. To skip typing "go" each time,
        see <Link href="https://documentation.uclusion.com/github-and-cli-integrations/mcp/#starting-a-session-on-find_work" target="_blank">starting
        a session on find_work</Link> to alias your agent.
      </Typography>
    </>
  );
}

export default StartWorkingInstructions;

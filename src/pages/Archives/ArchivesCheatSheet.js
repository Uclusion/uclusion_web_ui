import React from 'react';
import { Typography } from '@material-ui/core';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

function ArchivesCheatSheet() {

  return (
    <div>
      <Typography variant="h3">
        Welcome to the archives!
      </Typography>
      <Typography>
        Agile Plans, Dialogs and Initiatives appear in the archives after they are done, and you chose to
        hide them on your home screen.
        You don't have anything hidden, but if you want to move things here go back to home and
        click the <ExitToAppIcon/> button on the finished Agile Plan, Dialog or Initiative you want to move.
      </Typography>
    </div>
  );
}

export default ArchivesCheatSheet;

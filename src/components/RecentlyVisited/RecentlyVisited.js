import React, { useState } from 'react'
import HistoryIcon from '@material-ui/icons/History';

import TooltipIconButton from '../Buttons/TooltipIconButton';
import DisplayRecentlyVisited from './DisplayRecentlyVisited';

function RecentlyVisited() {

  const [open, setOpen] = useState(false);

  return (
    <div id="recent-notifications">
      <TooltipIconButton
        icon={<HistoryIcon/>}
        translationId='recentNotificationsHelp'
        onClick={() => setOpen(!open)}
        />
      <DisplayRecentlyVisited open={open} setOpen={setOpen} />
    </div>
  );
}

export default RecentlyVisited;

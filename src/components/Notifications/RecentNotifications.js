import React, { useState } from 'react'
import ViewDayIcon from '@material-ui/icons/ViewDay';
import DisplayNotifications from './DisplayNotifications'
import { Tooltip } from '@material-ui/core'
import { useIntl } from 'react-intl'

function RecentNotifications() {
  const intl = useIntl();
  const [open, setOpen] = useState(false);

  return (
    <div id="recent-notifications">
      <Tooltip title={intl.formatMessage({ id: 'recentNotificationsHelp' })}
               placement="right-start">
        <ViewDayIcon htmlColor="black" onClick={() => setOpen(!open)} />
      </Tooltip>
      <DisplayNotifications open={open} setOpen={setOpen} isRecent />
    </div>
  );
}

export default RecentNotifications;

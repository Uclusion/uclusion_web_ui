import React from 'react'
import { useIntl } from 'react-intl'
import { Typography } from '@material-ui/core'

function InboxWelcomeExpansion() {
  const intl = useIntl();

  return (
    <div style={{paddingLeft: '3rem'}}>
      <h3>{intl.formatMessage({ id: 'notificationSummary' })}</h3>
      <Typography variant="body1">
        Inbox rows remain until you perform the necessary action. This row remains until you have your
        first real notification.
      </Typography>
      <Typography variant="body1" style={{marginTop: '1rem', marginBottom: '1rem'}}>
        A trash icon will be in the expansion if the notification can be deleted after reading.
      </Typography>
    </div>
  );
}

export default InboxWelcomeExpansion;
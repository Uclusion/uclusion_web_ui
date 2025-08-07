import React from 'react';
import { useIntl } from 'react-intl';
import Screen from '../../../containers/Screen/Screen';
import { wizardStyles } from '../../../components/InboxWizards/WizardStylesContext';
import { Typography } from '@material-ui/core';


function DemoFull(props) {
  const { hidden } = props;
  const classes = wizardStyles();
  const intl = useIntl();
 
  return <Screen
      title={intl.formatMessage({id: 'DemoWelcome'})}
      tabTitle={intl.formatMessage({id: 'DemoWelcome'})}
      hidden={hidden}
      disableSearch
    >
    <div className={classes.baseCard} style={{ overflowX: 'hidden', maxWidth: '80rem' }}>
      <Typography className={classes.introText}>
        <p>You already have both a team and solo demo.</p>
      </Typography>
    </div>
  </Screen>;
}

export default DemoFull;

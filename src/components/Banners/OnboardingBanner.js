import React from 'react';
import { Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { wizardStyles } from '../InboxWizards/WizardStylesContext';
import { navigate } from '../../utils/marketIdPathFunctions';
import { WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import { useHistory } from 'react-router';
const useStyles = makeStyles(() => {
  return {
    bannerBox: {
      marginBottom: '2rem',
      '& button': {
        fontWeight: 'bold'
      },
      display: 'flex',
      alignItems: 'center'
    },
    cta: {
      fontWeight: 'bold',
      marginRight: '1rem',
    }
  };
});

function OnboardingBanner(props) {
  const classes = useStyles();
  const history = useHistory();
  const wizardClasses = wizardStyles();
  return (
    <div className={classes.bannerBox}>
        <Typography className={classes.cta}>Done with the demo?</Typography>
        <div>
          <Button
          onClick={() => {
            navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`);
          }}
          className={wizardClasses.actionPrimary}>Create your workspace</Button>
        </div>
    </div>
  );
}


export default OnboardingBanner;
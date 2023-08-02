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
      marginTop: '1rem',
      textAlign: 'center',
      border: '2px solid #2d9cdb',
      borderRadius: 6,
      marginBottom: '2rem',
    },

  };
});

function OnboardingBanner(props) {
  const classes = useStyles();
  const history = useHistory();
  const wizardClasses = wizardStyles();
  return (
    <div className={classes.bannerBox}>
      <div>
        <Typography>
            You are currently viewing the Script Developers demo.
        </Typography>
        <Typography>Ready to get to work?</Typography>
        <Button
          onClick={() => {
            navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`);
          }}
          className={wizardClasses.actionPrimary}>Create Your Workspace</Button>
      </div>
    </div>
  );
}


export default OnboardingBanner;
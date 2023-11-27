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
      height: '70px',
      '& button': {
        fontWeight: 'bold'
      },
      display: 'flex',
      justifyContent: 'space-around'
    },
    ctaContainer: {
      marginLeft: '3rem',
    },
    cta: {
      fontWeight: 'bold',
    },
    ctaSub: {
      fontWeight: 'normal',
    }
  };
});

function OnboardingBanner(props) {
  const classes = useStyles();
  const history = useHistory();
  const wizardClasses = wizardStyles();
  return (
    <div className={classes.bannerBox}>
        <div>
        <Typography className={classes.cta}>Enjoying the demo?</Typography>
        <Typography className={classes.ctaSub}>You can invite others, or create your own workspace.</Typography>
        </div>
        <div>
          <Button
            onClick={() => {
              navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`);
            }}
            className={wizardClasses.actionNext}
            id="workspaceFromDemoBanner"
          >
            Create your workspace
          </Button>
        </div>
    </div>
  );
}


export default OnboardingBanner;
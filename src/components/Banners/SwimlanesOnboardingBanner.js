import React from 'react';
import { Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { wizardStyles } from '../InboxWizards/WizardStylesContext';
import { navigate } from '../../utils/marketIdPathFunctions';
import { WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import { useHistory } from 'react-router';
import { isEveryoneGroup } from '../../contexts/GroupMembersContext/groupMembersHelper';
const useStyles = makeStyles(() => {
  return {
    bannerBackground: {
      background: 'white',
      paddingBottom: '0.8rem'
    },
    bannerBox: {
      '& button': {
        fontWeight: 'bold'
      },
      width: '70%',
      display: 'flex',
      justifyContent: 'space-around'
    },
    ctaSub: {
      fontWeight: 'normal',
    }
  };
});

function SwimlanesOnboardingBanner(props) {
  const { group } = props;
  const classes = useStyles();
  const history = useHistory();
  const wizardClasses = wizardStyles();
  return (
    <div className={classes.bannerBackground}>
      <div className={classes.bannerBox}>
          <div style={{marginTop: '0.8rem'}}>
            {isEveryoneGroup(group.id, group.market_id) && (
              <>
                <Typography><b>Welcome to the demo!</b> Here's team status at a glance.</Typography>
                <Typography className={classes.ctaSub}>
                  This group automatically has all workspace members.
                </Typography>
              </>
            )}
            {!isEveryoneGroup(group.id, group.market_id) && (
              <>
                <Typography><b>More demo!</b> This group split off to discuss marketing.</Typography>
                <Typography className={classes.ctaSub}>
                  Since you're not in this group, you only receive it's notifications when mentioned.
                </Typography>
              </>
            )}
          </div>
          <div style={{marginTop: '0.8rem'}}>
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
    </div>
  );
}


export default SwimlanesOnboardingBanner;
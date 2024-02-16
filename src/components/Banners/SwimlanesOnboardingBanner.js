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
  const { group, sectionOpen } = props;
  const classes = useStyles();
  const history = useHistory();
  const wizardClasses = wizardStyles();
  return (
    <div className={classes.bannerBackground}>
      <div className={classes.bannerBox}>
          <div style={{marginTop: '0.8rem'}}>
            {(!sectionOpen || sectionOpen === 'storiesSection') && isEveryoneGroup(group.id, group.market_id) && (
              <>
                <Typography><b>More demo!</b> Here's team status at a glance.</Typography>
                <Typography className={classes.ctaSub}>
                  This group automatically has all workspace members.
                </Typography>
              </>
            )}
            {(!sectionOpen || sectionOpen === 'storiesSection') && !isEveryoneGroup(group.id, group.market_id) && (
              <>
                <Typography><b>Bonus demo!</b> This group split off to discuss marketing.</Typography>
                <Typography className={classes.ctaSub}>
                  Since you're not in this group, you only receive it's notifications if mentioned.
                </Typography>
              </>
            )}
            {sectionOpen === 'marketTodos' && (
              <>
                <Typography><b>More demo!</b> Non minor bugs send smart notifications to the group.</Typography>
                <Typography className={classes.ctaSub}>
                  Bugs can be quickly created and later moved to tasks in a job.
                </Typography>
              </>
            )}
            {sectionOpen === 'backlogSection' && (
              <>
                <Typography><b>More demo!</b></Typography>
                <Typography className={classes.ctaSub}>
                  Ready to start jobs send notifications to the group for assignment.
                </Typography>
              </>
            )}
            {sectionOpen === 'discussionSection' && (
              <>
                <Typography><b>More demo!</b></Typography>
                <Typography className={classes.ctaSub}>
                  Questions and suggestions can be used at the group level and later moved to a job.
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
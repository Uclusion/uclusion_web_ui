import React from 'react';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { isEveryoneGroup } from '../../contexts/GroupMembersContext/groupMembersHelper';
import DemoCreateWorkspaceButton from '../Buttons/DemoCreateWorkspaceButton';

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
                  Use questions and suggestions at the group level and move them later to a job.
                </Typography>
              </>
            )}
          </div>
          <div style={{marginTop: '0.8rem'}}>
            <DemoCreateWorkspaceButton />
          </div>
      </div>
    </div>
  );
}


export default SwimlanesOnboardingBanner;
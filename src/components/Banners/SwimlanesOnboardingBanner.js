import React from 'react';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { isEveryoneGroup } from '../../contexts/GroupMembersContext/groupMembersHelper';
import DemoCreateWorkspaceButton from '../Buttons/DemoCreateWorkspaceButton';
import Link from '@material-ui/core/Link';
import { navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

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
  const history = useHistory();
  const classes = useStyles();

  return (
    <div className={classes.bannerBackground}>
      <div className={classes.bannerBox}>
          <div style={{marginTop: '0.8rem'}}>
            {(!sectionOpen || sectionOpen === 'storiesSection') && isEveryoneGroup(group.id, group.market_id) && (
              <>
                <Typography><b>Welcome to the demo!</b> Instead of standup, these swimlanes show what this group is
                  working on and Assistance Needed</Typography>
                <Typography className={classes.ctaSub}>
                  shows where input is required. As a team member
                  your <Link href="/inbox" onClick={(event) => {
                    preventDefaultAndProp(event);
                    navigate(history, '/inbox');
                  }}>inbox</Link> tells you
                  what you need to do next to help.
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
                <Typography><b>More demo!</b> This is part of the <Link href="https://documentation.uclusion.com/flows/#self-assigning-bugs" target="_blank">self assigning bugs</Link> flow.</Typography>
                <Typography className={classes.ctaSub}>
                  Bugs can be quickly created and later moved to tasks in a job.
                </Typography>
              </>
            )}
            {sectionOpen === 'backlogSection' && (
              <>
                <Typography><b>More demo!</b> This is part of the <Link href="https://documentation.uclusion.com/flows/#self-assigning-jobs" target="_blank">self assigning jobs</Link> flow.</Typography>
                <Typography className={classes.ctaSub}>
                  Ready to start jobs send notifications to the group for assignment.
                </Typography>
              </>
            )}
            {sectionOpen === 'discussionSection' && (
              <>
                <Typography><b>Bonus demo!</b></Typography>
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
import React from 'react';
import { Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { isEveryoneGroup } from '../../contexts/GroupMembersContext/groupMembersHelper';
import DemoCreateWorkspaceButton from '../Buttons/DemoCreateWorkspaceButton';
import Link from '@material-ui/core/Link';

const useStyles = makeStyles((theme) => {
  return {
    bannerBackground: {
      background: 'white',
      paddingBottom: '0.8rem'
    },
    bannerBox: {
      '& button': {
        fontWeight: 'bold'
      },
      display: 'flex',
      justifyContent: 'space-around',
      [theme.breakpoints.down('sm')]: {
        marginLeft: '0.5rem',
      }
    },
    ctaSub: {
      fontWeight: 'normal',
    }
  };
});

function SwimlanesOnboardingBanner(props) {
  const { group, sectionOpen } = props;
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const isOpeningScreen = (!sectionOpen || sectionOpen === 'storiesSection') &&
    isEveryoneGroup(group?.id, group?.market_id);

  return (
    <div className={classes.bannerBackground} id='bannerId'>
      <div className={classes.bannerBox}>
          <div style={{marginTop: '0.8rem'}} id='swimlanesDemoBannerText'>
            {isOpeningScreen && (
              <>
                <Typography><b>Welcome to the demo!</b></Typography>
                <Typography className={classes.ctaSub}>
                  Here is group 'Everyone' status at a glance.
                </Typography>
              </>
            )}
            {(!sectionOpen || sectionOpen === 'storiesSection') && !isEveryoneGroup(group?.id, group?.market_id) && (
              <>
                <Typography><b>Bonus demo!</b> This group split off to discuss marketing.</Typography>
                <Typography className={classes.ctaSub}>
                  Since you're not in this group, you only receive it's notifications if mentioned.
                </Typography>
              </>
            )}
            {sectionOpen === 'marketTodos' && (
              <>
                <Typography><b>More demo!</b> - <Link href="https://documentation.uclusion.com/flows/#self-assigning-bugs" target="_blank">self assigning bugs</Link> flow.</Typography>
                <Typography className={classes.ctaSub}>
                  Bugs can be quickly created and later moved to tasks in a job.
                </Typography>
              </>
            )}
            {sectionOpen === 'backlogSection' && (
              <>
                <Typography><b>More demo!</b> - <Link href="https://documentation.uclusion.com/flows/#self-assigning-jobs" target="_blank">self assigning jobs</Link> flow.</Typography>
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
        {!mobileLayout && (
          <div style={{ marginTop: '0.8rem' }}>
            <DemoCreateWorkspaceButton/>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwimlanesOnboardingBanner;
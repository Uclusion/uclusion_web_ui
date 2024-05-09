import React from 'react';
import { Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { isEveryoneGroup } from '../../contexts/GroupMembersContext/groupMembersHelper';
import DemoCreateWorkspaceButton from '../Buttons/DemoCreateWorkspaceButton';
import Link from '@material-ui/core/Link';

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
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const isOpeningScreen = (!sectionOpen || sectionOpen === 'storiesSection') &&
    isEveryoneGroup(group?.id, group?.market_id);

  if (mobileLayout) {
    if (isOpeningScreen) {
      return (
        <div className={classes.bannerBackground}>
          <div style={{ marginTop: '0.25rem', marginLeft: '0.25rem' }} id='swimlanesDemoBannerText'>
            <Typography>
              <b>Welcome to the demo!</b> We recommend switching to desktop for a more optimized experience.
            </Typography>
          </div>
        </div>
      );
    }
    return React.Fragment;
  }

  return (
    <div className={classes.bannerBackground}>
      <div className={classes.bannerBox}>
          <div style={{marginTop: '0.8rem'}} id='swimlanesDemoBannerText'>
            {isOpeningScreen && (
              <>
                <Typography><b>Welcome to the demo!</b> Here is group 'Everyone' status and your inbox has notifications
                  backed by wizards.</Typography>
                <Typography className={classes.ctaSub}>
                  The right arrow in the top header above navigates to what you need to do next to help.
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